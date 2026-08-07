import { verifyAccessToken } from "../utils/jwt.js";
import User from "../models/User.js";

// Protects routes — requires a valid access token (from httpOnly cookie or Authorization header)
export async function requireAuth(req, res, next) {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        error: "Your account has been suspended. Contact support if you believe this is a mistake.",
        code: "ACCOUNT_SUSPENDED",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Restricts routes to admin-only
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
