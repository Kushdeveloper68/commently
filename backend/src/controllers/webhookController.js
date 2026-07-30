import InstagramAccount from "../models/InstagramAccount.js";
import Automation from "../models/Automation.js";
import InteractionLog from "../models/InteractionLog.js";
import User from "../models/User.js";
import { decrypt } from "../utils/crypto.js";
import {
  sendPrivateReply,
  sendPublicReply,
  sendPrivateReplyWithButton,
  sendDirectMessage,
} from "../services/instagramService.js";
import { hasReachedDmQuota } from "../middleware/planLimit.js";

// GET /api/webhook/instagram — Meta's one-time verification handshake
export function verifyWebhook(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
}

// POST /api/webhook/instagram — real comment events land here
export async function handleWebhook(req, res) {
  // Always ack fast; Meta retries aggressively on non-200 or slow responses
  res.sendStatus(200);

  try {
    const entries = req.body.entry || [];

    for (const entry of entries) {
      const igBusinessId = entry.id; // the account that received the event

      for (const change of entry.changes || []) {
        if (change.field !== "comments") continue;
        await processComment(igBusinessId, change.value);
      }

      for (const messagingEvent of entry.messaging || []) {
        await processMessagingEvent(igBusinessId, messagingEvent);
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err.message);
  }
}

async function processComment(igBusinessId, value) {
  const commentId = value.id;
  const commentText = (value.text || "").toLowerCase();
  const fromUsername = value.from?.username;
  const mediaId = value.media?.id;

  if (!commentId) return;

  // Idempotency: never reply to the same comment twice, even on webhook retries
  const alreadyProcessed = await InteractionLog.exists({ commentId });
  if (alreadyProcessed) return;

  const account = await InstagramAccount.findOne({ igBusinessId, isActive: true }).select(
    "+accessTokenEncrypted"
  );
  if (!account) {
  console.log("❌ Instagram account not found:", igBusinessId);
  return;
}

  const user = await User.findById(account.user);
  if (!user) return;

  // Find live automations for this account, matching this specific post or "any post"
  const automations = await Automation.find({
    instagramAccount: account._id,
    status: "live",
  });

  const matched = automations.find((a) => {
    const postMatches =
      a.trigger.type === "any_post" || a.trigger.mediaId === mediaId;
    if (!postMatches) return false;

    if (a.keywordMatch.mode === "any_word") return true;
    return a.keywordMatch.keywords.some((kw) => commentText.includes(kw));
  });

  if (!matched) return;

  if (hasReachedDmQuota(user)) {
    console.log(`⚠️ User ${user._id} hit monthly DM quota — skipping automation ${matched._id}`);
    return;
  }

  const token = decrypt(account.accessTokenEncrypted);
  let dmSent = false;
  let dmError = null;
  let recipientPsid = null;
  let gateStatus = "none";

  try {
    if (matched.followGate?.enabled) {
      // Send the "please follow" prompt first — the real dmReply.message is
      // released later, when handlePostback sees the "I followed" tap.
      const payload = `FOLLOW_CONFIRM:${commentId}`;
      const result = await sendPrivateReplyWithButton(
        token,
        commentId,
        matched.followGate.promptMessage,
        matched.followGate.confirmButtonText,
        payload,
      );
      recipientPsid = result.recipient_id;
      gateStatus = "pending_follow";
      dmSent = true; // the gate prompt itself counts as "sent"
    } else {
      const result = await sendPrivateReply(token, commentId, matched.dmReply.message);
      recipientPsid = result.recipient_id;
      dmSent = true;
    }
  } catch (err) {
    dmError = err.response?.data?.error?.message || err.message;
    console.error("❌ Private reply failed:", dmError);
  }

  if (dmSent && !matched.followGate?.enabled && matched.publicReply?.enabled && matched.publicReply.message) {
    try {
      await sendPublicReply(token, commentId, matched.publicReply.message);
    } catch (err) {
      console.error("⚠️ Public reply failed (non-fatal):", err.response?.data || err.message);
    }
  }

  await InteractionLog.create({
    automation: matched._id,
    instagramAccount: account._id,
    commentId,
    commenterUsername: fromUsername,
    commentText: value.text,
    dmSent,
    dmError,
    recipientPsid,
    gateStatus,
  });

  if (dmSent) {
    matched.stats.triggeredCount += 1;
    // Only count a completed DM toward the plan quota and dmsSentCount when
    // the real message actually went out (i.e. not stuck waiting on a gate).
    if (gateStatus !== "pending_follow") {
      matched.stats.dmsSentCount += 1;
      user.dmsSentThisMonth += 1;
      await user.save();
    }
    matched.stats.lastTriggeredAt = new Date();
    await matched.save();
  }
}

// Handles Instagram messaging events — specifically, the postback fired when
// a user taps the "I followed" button on a follow-gate prompt. Looks up the
// pending InteractionLog by commentId (encoded in the postback payload),
// then releases the automation's real dmReply.message.
async function processMessagingEvent(igBusinessId, messagingEvent) {
  const payload = messagingEvent.postback?.payload;
  if (!payload || !payload.startsWith("FOLLOW_CONFIRM:")) return;

  const commentId = payload.split(":")[1];
  const senderId = messagingEvent.sender?.id;

  const log = await InteractionLog.findOne({ commentId, gateStatus: "pending_follow" }).populate(
    "automation instagramAccount",
  );
  if (!log) return; // already confirmed, or unknown — ignore silently

  const account = await InstagramAccount.findById(log.instagramAccount._id).select(
    "+accessTokenEncrypted",
  );
  if (!account) return;

  const automation = log.automation;
  const user = await User.findById(account.user);
  if (!user) return;

  if (hasReachedDmQuota(user)) {
    console.log(`⚠️ User ${user._id} hit monthly DM quota — skipping gated release for ${log._id}`);
    return;
  }

  const token = decrypt(account.accessTokenEncrypted);

  try {
    await sendDirectMessage(
      token,
      senderId,
      automation.dmReply.message,
      automation.dmReply.buttonText,
      automation.dmReply.buttonUrl,
    );

    log.gateStatus = "confirmed";
    await log.save();

    automation.stats.dmsSentCount += 1;
    await automation.save();

    user.dmsSentThisMonth += 1;
    await user.save();

    // Public reply (if configured) fires once the gate is actually cleared,
    // not at the initial prompt — keeps the public comment thread from
    // revealing the link before the user has actually followed.
    if (automation.publicReply?.enabled && automation.publicReply.message) {
      try {
        await sendPublicReply(token, commentId, automation.publicReply.message);
      } catch (err) {
        console.error("⚠️ Public reply failed (non-fatal):", err.response?.data || err.message);
      }
    }
  } catch (err) {
    console.error("❌ Gated DM release failed:", err.response?.data || err.message);
  }
}