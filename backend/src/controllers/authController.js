import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { deleteUserCascade } from "../services/userDeletion.js";
import { getEffectivePlanLimits, getCustomOverrideStatus } from "../services/planResolver.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // "lax" only sends cookies on same-site requests — fine for local dev
  // (frontend/backend on the same origin via Vite's proxy), but Render +
  // Vercel are two entirely different domains, so this is a genuine
  // cross-site request from the browser's point of view. "none" is required
  // for the browser to attach the cookie at all — and "none" is only valid
  // when paired with `secure: true` (browsers reject it otherwise), which
  // is already the case in production since Render/Vercel both serve HTTPS.
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// clearCookie only needs the attributes that affect cookie *identity*
// (path/domain/secure/sameSite/httpOnly) to match the cookie it's clearing —
// maxAge is meaningless there and passing it is deprecated as of Express
// 4.x (it'll be ignored outright in v5). Express sets its own
// immediate-expiry maxAge internally when clearing.
const { maxAge: _unusedMaxAge, ...CLEAR_COOKIE_OPTS } = COOKIE_OPTS;

function setAuthCookies(res, userId) {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);
  res.cookie("accessToken", accessToken, COOKIE_OPTS);
  res.cookie("refreshToken", refreshToken, {
    ...COOKIE_OPTS,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return accessToken;
}

// POST /api/auth/google  { idToken: string from Google Sign-In frontend widget }
export async function googleLogin(req, res) {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: "idToken is required" });

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload.email_verified) {
      // Google issues ID tokens for unverified emails in some edge cases
      // (e.g. certain Workspace setups). Without this check, someone could
      // "link" their Google login to an existing Commently account just by
      // matching its email address, without actually proving ownership of
      // that inbox.
      return res.status(401).json({ error: "Your Google account's email isn't verified. Please verify it with Google and try again." });
    }

    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      // Link by email if user previously signed up another way, else create fresh
      user = await User.findOne({ email: payload.email });
      if (user) {
        user.googleId = payload.sub;
        user.avatarUrl = user.avatarUrl || payload.picture;
        await user.save();
      } else {
        user = await User.create({
          name: payload.name,
          email: payload.email,
          googleId: payload.sub,
          avatarUrl: payload.picture,
          // Consent is shown as clickwrap text right above the Google
          // button on the login page ("By continuing, you agree to...") —
          // clicking through to sign in constitutes acceptance.
          termsAcceptedAt: new Date(),
        });
      }
    }

    setAuthCookies(res, user._id);
    const effectiveLimits = await getEffectivePlanLimits(user);
    res.json({ user: sanitizeUser(user, effectiveLimits) });
  } catch (err) {
    console.error("Google login error:", err.message);
    res.status(401).json({ error: "Google authentication failed" });
  }
}

// POST /api/auth/refresh
export async function refreshToken(req, res) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: "No refresh token" });

    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "User not found" });

    setAuthCookies(res, user._id);
    const effectiveLimits = await getEffectivePlanLimits(user);
    res.json({ user: sanitizeUser(user, effectiveLimits) });
  } catch (err) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
}

// POST /api/auth/logout
export async function logout(req, res) {
  // clearCookie must be called with the same `secure`/`sameSite` options the
  // cookie was originally set with — some browsers won't reliably clear a
  // cookie whose attributes don't match on the clearing call. maxAge is
  // intentionally excluded (see CLEAR_COOKIE_OPTS above) since Express
  // deprecated/ignores it here.
  res.clearCookie("accessToken", CLEAR_COOKIE_OPTS);
  res.clearCookie("refreshToken", CLEAR_COOKIE_OPTS);
  res.json({ success: true });
}

// GET /api/auth/me
export async function getMe(req, res) {
  const effectiveLimits = await getEffectivePlanLimits(req.user);
  res.json({ user: sanitizeUser(req.user, effectiveLimits) });
}

// PATCH /api/auth/profile — updates name and timezone (email is tied to the
// Google account and can't be changed here)
export async function updateProfile(req, res) {
  const { name, timezone } = req.body;
  const update = {};
  if (name?.trim()) update.name = name.trim();
  if (timezone) update.timezone = timezone;

  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
  const effectiveLimits = await getEffectivePlanLimits(user);
  res.json({ user: sanitizeUser(user, effectiveLimits) });
}

// PATCH /api/auth/notification-preferences — actually gates whether quota
// alert / billing receipt emails get sent (checked in usageAlerts.js and
// paymentController.js), not just a decorative toggle.
export async function updateNotificationPreferences(req, res) {
  const { quotaAlerts, billingReceipts } = req.body;
  const update = {};
  if (typeof quotaAlerts === "boolean") update["emailPreferences.quotaAlerts"] = quotaAlerts;
  if (typeof billingReceipts === "boolean") update["emailPreferences.billingReceipts"] = billingReceipts;

  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
  const effectiveLimits = await getEffectivePlanLimits(user);
  res.json({ user: sanitizeUser(user, effectiveLimits) });
}

// DELETE /api/auth/account — permanent, cascades everything. Requires the
// frontend to have already confirmed intent (e.g. "type DELETE to confirm").
export async function deleteAccount(req, res) {
  try {
    await deleteUserCascade(req.user._id);

    res.clearCookie("accessToken", CLEAR_COOKIE_OPTS);
    res.clearCookie("refreshToken", CLEAR_COOKIE_OPTS);
    res.json({ success: true });
  } catch (err) {
    console.error("Account deletion failed:", err.message);
    res.status(500).json({ error: "Could not delete account. Please contact support." });
  }
}

function sanitizeUser(user, effectiveLimits) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    plan: user.plan,
    planRenewsAt: user.planRenewsAt,
    planStartedAt: user.planStartedAt,
    role: user.role,
    timezone: user.timezone,
    dmsSentThisMonth: user.dmsSentThisMonth,
    emailPreferences: user.emailPreferences,
    // What's ACTUALLY in effect right now (accounts for negotiated-override
    // scheduling — see planResolver.js) — the frontend should use this for
    // "your current plan" displays instead of re-deriving it from `plan`.
    effectiveLimits,
    // The override's own scheduling state (scheduled/active/expired),
    // independent of what's currently effective — lets the billing page
    // show "custom plan starts on X" or "ended, renew" even while a
    // different plan is the one actually in effect.
    customPlanOverrideStatus: getCustomOverrideStatus(user),
  };
}