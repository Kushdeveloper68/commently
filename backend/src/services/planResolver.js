import { PLAN_LIMITS } from "../config/planLimits.js";
import Plan from "../models/Plan.js";

// Resolves what limits actually apply to a given user, checking in order:
// 1. A per-user negotiated override (admin-set, highest priority)
// 2. A built-in plan (free/starter/pro — static, no DB round-trip)
// 3. A DB-backed custom plan tier (admin-created, shared across users)
// 4. Free, as a safety-net fallback if `user.plan` points at something that
//    no longer exists (e.g. a custom plan got deleted)
export async function getEffectivePlanLimits(user) {
  if (user.customPlanOverride?.enabled) {
    const o = user.customPlanOverride;
    return {
      label: o.label || "Custom",
      priceInPaise: o.priceInPaise ?? 0,
      maxInstagramAccounts: o.maxInstagramAccounts ?? 1,
      maxAutomations: o.maxAutomations ?? 1,
      maxDmsPerMonth: o.maxDmsPerMonth ?? 50,
      features: o.features || { publicReply: true, followGate: true, analytics: true },
      isCustomOverride: true,
    };
  }

  if (PLAN_LIMITS[user.plan]) {
    return PLAN_LIMITS[user.plan];
  }

  const dbPlan = await Plan.findOne({ key: user.plan, isActive: true }).lean();
  if (dbPlan) return dbPlan;

  return PLAN_LIMITS.free;
}

// Resolves a plan by its key directly (not tied to a user) — used when
// purchasing/assigning a plan, where all we have is the key someone picked.
export async function getPlanLimitsByKey(key) {
  if (PLAN_LIMITS[key]) return PLAN_LIMITS[key];
  const dbPlan = await Plan.findOne({ key, isActive: true }).lean();
  return dbPlan || null;
}

// Every plan a user could see on the public pricing page: the 3 built-ins
// plus any admin-created custom plans marked publicly visible AND currently
// within their valid window (limited-time offers auto-hide once expired —
// existing subscribers already on the plan keep their access regardless).
export async function getAllVisiblePlans() {
  const now = new Date();
  const customPlans = await Plan.find({
    isActive: true,
    isPubliclyVisible: true,
    $and: [
      { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
      { $or: [{ validUntil: null }, { validUntil: { $gte: now } }] },
    ],
  }).lean();
  const result = { ...PLAN_LIMITS };
  for (const p of customPlans) result[p.key] = p;
  return result;
}
