// Single source of truth for plan limits — used by usage middleware and frontend
// (exposed via /api/billing/plans) so pricing changes happen in one place.

export const PLAN_LIMITS = {
  free: {
    label: "Free",
    priceInPaise: 0,
    maxInstagramAccounts: 1,
    maxAutomations: 1,
    maxDmsPerMonth: 1000,
    features: {
      publicReply: false,
      followGate: false,
      analytics: false,
    },
  },
  starter: {
    label: "Starter",
    priceInPaise:9900, // ₹99/month
    maxInstagramAccounts: 1,
    maxAutomations: 5,
    maxDmsPerMonth: 10000,
    features: {
      publicReply: true,
      followGate: true,
      analytics: false,
    },
  },
  pro: {
    label: "Pro",
    priceInPaise:19900, // ₹899/month
    maxInstagramAccounts: 5,
    maxAutomations: 20,
    maxDmsPerMonth: 22000,
    features: {
      publicReply: true,
      followGate: true,
      analytics: true,
    },
  },
};

export function getPlanLimits(planName) {
  return PLAN_LIMITS[planName] || PLAN_LIMITS.free;
}
