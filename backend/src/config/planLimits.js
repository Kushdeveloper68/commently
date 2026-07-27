// Single source of truth for plan limits — used by usage middleware and frontend
// (exposed via /api/billing/plans) so pricing changes happen in one place.

export const PLAN_LIMITS = {
  free: {
    label: "Free",
    priceInPaise: 0,
    maxInstagramAccounts: 1,
    maxAutomations: 1,
    maxDmsPerMonth: 50,
    features: {
      publicReply: false,
      followGate: false,
      analytics: false,
    },
  },
  starter: {
    label: "Starter",
    priceInPaise: 39900, // ₹399/month
    maxInstagramAccounts: 1,
    maxAutomations: 5,
    maxDmsPerMonth: 2000,
    features: {
      publicReply: true,
      followGate: true,
      analytics: false,
    },
  },
  pro: {
    label: "Pro",
    priceInPaise: 89900, // ₹899/month
    maxInstagramAccounts: 5,
    maxAutomations: 50,
    maxDmsPerMonth: 20000,
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
