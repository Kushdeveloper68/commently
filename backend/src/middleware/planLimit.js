import Automation from "../models/Automation.js";
import InstagramAccount from "../models/InstagramAccount.js";
import { getEffectivePlanLimits } from "../services/planResolver.js";

// Blocks creating a new automation if the user's plan limit is reached
export async function enforceAutomationLimit(req, res, next) {
  const limits = await getEffectivePlanLimits(req.user);
  const count = await Automation.countDocuments({ user: req.user._id });

  if (count >= limits.maxAutomations) {
    return res.status(403).json({
      error: `Your ${limits.label} plan allows up to ${limits.maxAutomations} automation(s). Upgrade to add more.`,
      code: "PLAN_LIMIT_AUTOMATIONS",
    });
  }
  next();
}

// Blocks connecting a new Instagram account if the user's plan limit is reached
export async function enforceInstagramAccountLimit(req, res, next) {
  const limits = await getEffectivePlanLimits(req.user);
  const count = await InstagramAccount.countDocuments({ user: req.user._id, isActive: true });

  if (count >= limits.maxInstagramAccounts) {
    return res.status(403).json({
      error: `Your ${limits.label} plan allows up to ${limits.maxInstagramAccounts} Instagram account(s). Upgrade to connect more.`,
      code: "PLAN_LIMIT_ACCOUNTS",
    });
  }
  next();
}

// Checks monthly DM quota before sending — called internally by the webhook handler,
// not as route middleware, since it runs per-webhook-event rather than per-HTTP-request.
export async function hasReachedDmQuota(user) {
  const limits = await getEffectivePlanLimits(user);
  return user.dmsSentThisMonth >= limits.maxDmsPerMonth;
}

// Blocks the analytics dashboard for plans that don't include it (free, starter)
export async function requireAnalyticsAccess(req, res, next) {
  const limits = await getEffectivePlanLimits(req.user);
  if (!limits.features.analytics) {
    return res.status(403).json({
      error: `Analytics dashboard is available on the Pro plan. Upgrade to unlock it.`,
      code: "PLAN_LIMIT_ANALYTICS",
    });
  }
  next();
}
