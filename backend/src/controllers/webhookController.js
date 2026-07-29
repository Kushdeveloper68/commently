import InstagramAccount from "../models/InstagramAccount.js";
import Automation from "../models/Automation.js";
import InteractionLog from "../models/InteractionLog.js";
import User from "../models/User.js";
import { decrypt } from "../utils/crypto.js";
import { sendPrivateReply, sendPublicReply } from "../services/instagramService.js";
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
      const igBusinessId = entry.id; // the account that received the comment
      for (const change of entry.changes || []) {
        if (change.field !== "comments") continue;
        await processComment(igBusinessId, change.value);
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

  try {
    await sendPrivateReply(token, commentId, matched.dmReply.message);
    dmSent = true;
  } catch (err) {
    dmError = err.response?.data?.error?.message || err.message;
    console.error("❌ Private reply failed:", dmError);
  }

  if (dmSent && matched.publicReply?.enabled && matched.publicReply.message) {
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
  });

  if (dmSent) {
    matched.stats.triggeredCount += 1;
    matched.stats.dmsSentCount += 1;
    matched.stats.lastTriggeredAt = new Date();
    await matched.save();

    user.dmsSentThisMonth += 1;
    await user.save();
  }
}
