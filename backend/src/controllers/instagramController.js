import crypto from "crypto";
import InstagramAccount from "../models/InstagramAccount.js";
import { encrypt } from "../utils/crypto.js";
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
    console.log("✅ SHORT", shortLived);

    // TEMP TEST: exchange skip, seedha short token se profile fetch try kar
    const profile = await getInstagramProfile(shortLived.access_token);
    console.log("✅ PROFILE", profile);

    await subscribeAccountToWebhooks(shortLived.access_token);

    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    await InstagramAccount.findOneAndUpdate(
      { igBusinessId: profile.user_id }, // profile.id NAHI, profile.user_id
      {
        user: pending.userId,
        igBusinessId: profile.user_id, // yahan bhi
        username: profile.username,
        profilePictureUrl: profile.profile_picture_url,
        accessTokenEncrypted: encrypt(shortLived.access_token),
        tokenExpiresAt: expiresAt,
        isActive: true,
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
