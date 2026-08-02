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
  sendDirectMessageWithButton,
} from "../services/instagramService.js";
import { hasReachedDmQuota } from "../middleware/planLimit.js";
import { maybeSendQuotaAlerts } from "../services/usageAlerts.js";

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

// POST /api/webhook/instagram — real comment + messaging events land here
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
        await routeMessagingEvent(igBusinessId, messagingEvent);
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err.message);
  }
}

// Shared bookkeeping: writes the InteractionLog and updates automation/user
// stats. Used by all three channels (comment, story_reply, dm) so the
// counting logic can't drift between them.
async function logAndUpdateStats({ automation, user, channel, sourceId, mediaId, commenterUsername, text, dmSent, dmError, recipientPsid, gateStatus }) {
  await InteractionLog.create({
    automation: automation._id,
    instagramAccount: automation.instagramAccount,
    channel,
    sourceId,
    mediaId,
    commenterUsername,
    commentText: text,
    dmSent,
    dmError,
    recipientPsid,
    gateStatus,
  });

  if (dmSent) {
    automation.stats.triggeredCount += 1;
    // Only count a completed DM toward the plan quota and dmsSentCount when
    // the real message actually went out (i.e. not stuck waiting on a gate).
    if (gateStatus !== "pending_follow") {
      automation.stats.dmsSentCount += 1;
      user.dmsSentThisMonth += 1;
      await user.save();
      maybeSendQuotaAlerts(user).catch((err) => console.error("Quota alert failed:", err.message)); // fire-and-forget
    }
    automation.stats.lastTriggeredAt = new Date();
    await automation.save();
  }
}

// ── Channel: comment (V1 + V2) ──────────────────────────────────────────

async function processComment(igBusinessId, value) {
  const commentId = value.id;
  const commentText = (value.text || "").toLowerCase();
  const fromUsername = value.from?.username;
  const mediaId = value.media?.id;

  if (!commentId) return;

  // Idempotency: never reply to the same comment twice, even on webhook retries
  const alreadyProcessed = await InteractionLog.exists({ sourceId: commentId });
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

  const automations = await Automation.find({
    instagramAccount: account._id,
    status: "live",
    channel: "comment",
  });

  const matched = automations.find((a) => {
    const postMatches = a.trigger.type === "any_post" || a.trigger.mediaId === mediaId;
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
      // released later, when handleFollowConfirmPostback sees the tap.
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

  await logAndUpdateStats({
    automation: matched,
    user,
    channel: "comment",
    sourceId: commentId,
    mediaId,
    commenterUsername: fromUsername,
    text: value.text,
    dmSent,
    dmError,
    recipientPsid,
    gateStatus,
  });
}

// ── Channels: story_reply + dm (V4) ─────────────────────────────────────

// Instagram delivers both story replies and plain DMs as regular messaging
// events. A story reply carries message.reply_to.story; a plain DM doesn't.
// We also have to ignore "echo" events — Instagram replays our own outgoing
// messages back to us on the same webhook, and without this check every DM
// we send would immediately re-trigger itself in an infinite loop.
async function routeMessagingEvent(igBusinessId, messagingEvent) {
  if (messagingEvent.postback) {
    return handleFollowConfirmPostback(igBusinessId, messagingEvent);
  }

  const message = messagingEvent.message;
  if (!message || message.is_echo) return;

  const channel = message.reply_to?.story ? "story_reply" : "dm";
  return processIncomingMessage(igBusinessId, messagingEvent, channel);
}

async function processIncomingMessage(igBusinessId, messagingEvent, channel) {
  const mid = messagingEvent.message?.mid;
  const rawText = messagingEvent.message?.text || "";
  const text = rawText.toLowerCase();
  const senderId = messagingEvent.sender?.id;
  const storyId = messagingEvent.message?.reply_to?.story?.id;

  if (!mid || !senderId) return;

  const alreadyProcessed = await InteractionLog.exists({ sourceId: mid });
  if (alreadyProcessed) return;

  const account = await InstagramAccount.findOne({ igBusinessId, isActive: true }).select(
    "+accessTokenEncrypted"
  );
  if (!account) return;

  const user = await User.findById(account.user);
  if (!user) return;

  const automations = await Automation.find({
    instagramAccount: account._id,
    status: "live",
    channel,
  });

  const matched = automations.find((a) => {
    // "dm" channel has no post/story concept — it matches on keyword alone.
    // "story_reply" can optionally be scoped to one specific story.
    if (channel === "story_reply") {
      const storyMatches = a.trigger.type === "any_post" || a.trigger.mediaId === storyId;
      if (!storyMatches) return false;
    }

    if (a.keywordMatch.mode === "any_word") return true;
    return a.keywordMatch.keywords.some((kw) => text.includes(kw));
  });

  if (!matched) return;

  if (hasReachedDmQuota(user)) {
    console.log(`⚠️ User ${user._id} hit monthly DM quota — skipping automation ${matched._id}`);
    return;
  }

  const token = decrypt(account.accessTokenEncrypted);
  let dmSent = false;
  let dmError = null;
  let gateStatus = "none";

  try {
    if (matched.followGate?.enabled) {
      const payload = `FOLLOW_CONFIRM_DM:${mid}`;
      await sendDirectMessageWithButton(
        token,
        senderId,
        matched.followGate.promptMessage,
        matched.followGate.confirmButtonText,
        payload,
      );
      gateStatus = "pending_follow";
      dmSent = true;
    } else {
      await sendDirectMessage(token, senderId, matched.dmReply.message, matched.dmReply.buttonText, matched.dmReply.buttonUrl);
      dmSent = true;
    }
  } catch (err) {
    dmError = err.response?.data?.error?.message || err.message;
    console.error(`❌ ${channel} reply failed:`, dmError);
  }

  await logAndUpdateStats({
    automation: matched,
    user,
    channel,
    sourceId: mid,
    commenterUsername: null, // Instagram messaging events don't include a username, only a PSID
    text: rawText,
    dmSent,
    dmError,
    recipientPsid: senderId,
    gateStatus,
  });
}

// ── Follow-gate postback (shared release step) ──────────────────────────

// Fires when a user taps the "I followed" button, for EITHER flow:
// - "FOLLOW_CONFIRM:<commentId>"    — gate started from a comment reply
// - "FOLLOW_CONFIRM_DM:<messageId>" — gate started from a story reply or DM
// Looks up the pending InteractionLog and releases the automation's real
// dmReply.message.
async function handleFollowConfirmPostback(igBusinessId, messagingEvent) {
  const payload = messagingEvent.postback?.payload;
  const senderId = messagingEvent.sender?.id;
  if (!payload || !senderId) return;

  const isCommentFlow = payload.startsWith("FOLLOW_CONFIRM:");
  const isDmFlow = payload.startsWith("FOLLOW_CONFIRM_DM:");
  if (!isCommentFlow && !isDmFlow) return;

  const sourceId = payload.split(":")[1];

  const log = await InteractionLog.findOne({ sourceId, gateStatus: "pending_follow" }).populate(
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
    maybeSendQuotaAlerts(user).catch((err) => console.error("Quota alert failed:", err.message)); // fire-and-forget

    // Public reply only applies to the comment flow — story replies/DMs have
    // no public comment thread to post into.
    if (isCommentFlow && automation.publicReply?.enabled && automation.publicReply.message) {
      try {
        await sendPublicReply(token, sourceId, automation.publicReply.message);
      } catch (err) {
        console.error("⚠️ Public reply failed (non-fatal):", err.response?.data || err.message);
      }
    }
  } catch (err) {
    console.error("❌ Gated DM release failed:", err.response?.data || err.message);
  }
}
