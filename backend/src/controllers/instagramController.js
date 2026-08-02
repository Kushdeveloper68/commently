import crypto from "crypto";
import InstagramAccount from "../models/InstagramAccount.js";
import Automation from "../models/Automation.js";
import InteractionLog from "../models/InteractionLog.js";
import { encrypt, decrypt } from "../utils/crypto.js";
import { parseSignedRequest } from "../services/metaSignedRequest.js";
import {
  getInstagramAuthUrl,
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getInstagramProfile,
  subscribeAccountToWebhooks
} from "../services/instagramService.js";

// In-memory state store for CSRF protection during OAuth (swap for Redis in
// multi-instance production deployments so state survives across server restarts)
const pendingStates = new Map();

// GET /api/instagram/connect — returns the URL the frontend should redirect to
export function initiateConnect(req, res) {
  const state = crypto.randomBytes(16).toString("hex");
  pendingStates.set(state, {
    userId: req.user._id.toString(),
    createdAt: Date.now(),
  });

  // Clean up stale states older than 10 minutes
  for (const [key, val] of pendingStates) {
    if (Date.now() - val.createdAt > 10 * 60 * 1000) pendingStates.delete(key);
  }

  res.json({ authUrl: getInstagramAuthUrl(state) });
}

// GET /api/instagram/callback?code=...&state=...  (Meta redirects here)
export async function handleCallback(req, res) {
  const { code, state } = req.query;
  const frontendUrl = process.env.FRONTEND_URL;

  try {
    const pending = pendingStates.get(state);
    if (!pending) {
      return res.redirect(
        `${frontendUrl}/connect-instagram?error=invalid_state`,
      );
    }
    pendingStates.delete(state);

    const shortLived = await exchangeCodeForToken(code);
    console.log("✅ SHORT", shortLived.access_token.slice(0, 15) + "...");

    const longLived = await exchangeForLongLivedToken(shortLived.access_token);
    console.log("✅ LONG — expires in", longLived.expires_in, "seconds");

    const profile = await getInstagramProfile(longLived.access_token);
    console.log("✅ PROFILE", profile);

    await subscribeAccountToWebhooks(longLived.access_token);

    const expiresAt = new Date(Date.now() + longLived.expires_in * 1000);

    await InstagramAccount.findOneAndUpdate(
      { igBusinessId: profile.user_id },
      {
        user: pending.userId,
        igBusinessId: profile.user_id,
        username: profile.username,
        profilePictureUrl: profile.profile_picture_url,
        accountType: profile.account_type,
        followersCount: profile.followers_count,
        accessTokenEncrypted: encrypt(longLived.access_token), // long-lived token store karo, short-lived nahi
        tokenExpiresAt: expiresAt, // ab REAL expiry (~60 din), koi hardcoded jhooth nahi
        isActive: true,
        needsReconnect: false,
      },
      { upsert: true, new: true },
    );
    res.redirect(`${frontendUrl}/dashboard?connected=success`);
  } catch (err) {
    console.error(
      "Instagram connect error:",
      err.response?.data || err.message,
    );
    res.redirect(`${frontendUrl}/connect-instagram?error=connection_failed`);
  }
}

// GET /api/instagram/accounts — list connected accounts for the logged-in user
export async function listAccounts(req, res) {
  const accounts = await InstagramAccount.find({
    user: req.user._id,
    isActive: true,
  }).select("-accessTokenEncrypted");
  res.json({ accounts });
}

// DELETE /api/instagram/accounts/:id
export async function disconnectAccount(req, res) {
  const account = await InstagramAccount.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isActive: false },
    { new: true },
  );
  if (!account) return res.status(404).json({ error: "Account not found" });
  res.json({ success: true });
}

// POST /api/instagram/accounts/:id/sync — re-fetches live profile data
// (follower count, avatar, username) from Instagram on demand, so the
// "Sync" button actually does something real instead of a fake spinner.
export async function syncAccount(req, res) {
  const account = await InstagramAccount.findOne({ _id: req.params.id, user: req.user._id }).select(
    "+accessTokenEncrypted",
  );
  if (!account) return res.status(404).json({ error: "Account not found" });

  try {
    const token = decrypt(account.accessTokenEncrypted);
    const profile = await getInstagramProfile(token);

    account.username = profile.username;
    account.profilePictureUrl = profile.profile_picture_url;
    account.accountType = profile.account_type;
    account.followersCount = profile.followers_count;
    account.lastRefreshedAt = new Date();
    account.needsReconnect = false;
    await account.save();

    res.json({ account });
  } catch (err) {
    console.error("Account sync failed:", err.response?.data || err.message);
    res.status(502).json({ error: "Couldn't sync — the connection may need to be re-authorized." });
  }
}

// POST /api/instagram/deauthorize — Meta calls this when a user removes
// Commently's access directly from Instagram (not through our UI). Without
// this, we'd only find out once the stored token starts failing — possibly
// days later, via the refresh cron. Register this URL as the "Deauthorize
// Callback URL" in Meta App Dashboard → Instagram API → API setup.
export async function handleDeauthorize(req, res) {
  try {
    const payload = parseSignedRequest(req.body.signed_request, process.env.META_APP_SECRET);

    await InstagramAccount.updateMany(
      { igBusinessId: payload.user_id },
      { isActive: false, needsReconnect: true },
    );

    console.log(`🔌 Deauthorized by Meta: igBusinessId ${payload.user_id}`);
    res.sendStatus(200);
  } catch (err) {
    console.error("Deauthorize callback error:", err.message);
    res.sendStatus(400);
  }
}

// POST /api/instagram/data-deletion — Meta calls this when a user requests
// data deletion via Instagram's own settings (separate from deauthorizing).
// We must respond with a confirmation URL + code per Meta's spec. Register
// this as the "Data Deletion Request Callback URL" in the same dashboard section.
export async function handleDataDeletionRequest(req, res) {
  try {
    const payload = parseSignedRequest(req.body.signed_request, process.env.META_APP_SECRET);
    const account = await InstagramAccount.findOne({ igBusinessId: payload.user_id });

    if (account) {
      await InteractionLog.deleteMany({ instagramAccount: account._id });
      await Automation.deleteMany({ instagramAccount: account._id });
      await account.deleteOne();
      console.log(`🗑️  Data deleted for igBusinessId ${payload.user_id}`);
    }

    const confirmationCode = crypto.randomBytes(8).toString("hex");
    res.json({
      url: `${process.env.BACKEND_URL}/api/instagram/data-deletion-status?id=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  } catch (err) {
    console.error("Data deletion callback error:", err.message);
    res.sendStatus(400);
  }
}

// GET /api/instagram/data-deletion-status?id=... — the confirmation page
// Meta links the user to after a data-deletion request. Doesn't need to do
// anything beyond confirming receipt.
export function dataDeletionStatus(req, res) {
  res.json({ status: "complete", confirmation_code: req.query.id });
}
