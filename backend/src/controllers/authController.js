import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import InstagramAccount from "../models/InstagramAccount.js";
import Automation from "../models/Automation.js";
import InteractionLog from "../models/InteractionLog.js";
import Subscription from "../models/Subscription.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

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
    res.json({ user: sanitizeUser(user) });
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
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
}

// POST /api/auth/logout
export async function logout(req, res) {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ success: true });
}

// GET /api/auth/me
export async function getMe(req, res) {
  res.json({ user: sanitizeUser(req.user) });
}

// DELETE /api/auth/account — permanent, cascades everything. Requires the
// frontend to have already confirmed intent (e.g. "type DELETE to confirm").
export async function deleteAccount(req, res) {
  try {
    const userId = req.user._id;

    const accounts = await InstagramAccount.find({ user: userId }).select("_id");
    const accountIds = accounts.map((a) => a._id);

    await InteractionLog.deleteMany({ instagramAccount: { $in: accountIds } });
    await Automation.deleteMany({ instagramAccount: { $in: accountIds } });
    await InstagramAccount.deleteMany({ user: userId });
    await Subscription.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ success: true });
  } catch (err) {
    console.error("Account deletion failed:", err.message);
    res.status(500).json({ error: "Could not delete account. Please contact support." });
  }
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    plan: user.plan,
    role: user.role,
  };
}
