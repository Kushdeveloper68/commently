import cron from "node-cron";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import { sendEmailAsync } from "../services/emailService.js";
import { customPlanExpiredEmail } from "../services/emailTemplates.js";

// getEffectivePlanLimits() (planResolver.js) already computes whether a
// negotiated override is in effect PURELY from effectiveFrom/periodEnd on
// every request — no cron needed for that. This job only handles the two
// SIDE EFFECTS that need to happen once, at the moment a window boundary isX
// crossed, rather than on every read:
//
//   1. Activation: when effectiveFrom arrives, any concurrently-active
//      self-serve Subscription needs to be marked superseded — otherwise it
//      sits around looking "active" in billing history/admin views, and the
//      daily subscriptionExpiry cron could still downgrade the user to Free
//      off ITS periodEnd even though the negotiated plan is now what's
//      actually governing their access.
//   2. Expiry: when periodEnd passes without a renewal payment, send a
//      one-time "your custom plan ended, renew" email.
//
// Runs every 15 minutes — tight enough that "the plan changes as soon as
// the date arrives" feels true in practice, without needing per-minute cron
// overhead for something that isn't itself gating access (the resolver
// already gates access in real time regardless of when this runs).
export async function processScheduledCustomPlans() {
  const now = new Date();

  // --- Activation: effectiveFrom has arrived, side effects not yet applied ---
  const toActivate = await User.find({
    "customPlanOverride.enabled": true,
    "customPlanOverride.effectiveFrom": { $lte: now },
  });

  for (const user of toActivate) {
    const o = user.customPlanOverride;
    const alreadyActivated = o.activatedAt && o.activatedAt >= o.effectiveFrom;
    const alreadyExpired = o.periodEnd && o.periodEnd <= now;
    if (alreadyActivated || alreadyExpired) continue;

    const superseded = await Subscription.updateMany(
      { user: user._id, status: "active" },
      { status: "cancelled", cancelledAt: now, autoRenew: false },
    );

    // Reset the underlying plan, not just the Subscription record — without
    // this, `user.plan` would stay at whatever it was (e.g. "pro") forever.
    // getEffectivePlanLimits() checks the override FIRST while it's active,
    // so this doesn't affect access right now — but once this override
    // itself expires and falls through, the resolver would otherwise still
    // find `PLAN_LIMITS["pro"]` and hand the user their old paid plan back
    // for free, since there's no longer an active Subscription for the
    // (already-cron-driven) expiry job to catch. Overwriting means
    // overwriting: the pre-override plan doesn't resume after this ends,
    // same as the self-serve "switch plans" behavior — the user just falls
    // to Free (or whatever they buy next) once the negotiated plan lapses.
    await User.findByIdAndUpdate(user._id, {
      "customPlanOverride.activatedAt": now,
      plan: "free",
      planStartedAt: null,
      planRenewsAt: null,
    });

    console.log(
      `⭐ Activated negotiated plan "${o.label}" for user ${user._id}` +
        (superseded.modifiedCount > 0 ? ` (superseded ${superseded.modifiedCount} concurrent subscription(s))` : ""),
    );
  }

  // --- Expiry reminder: periodEnd has passed, no renewal yet, not yet reminded ---
  const toRemind = await User.find({
    "customPlanOverride.enabled": true,
    "customPlanOverride.periodEnd": { $lte: now, $ne: null },
    "customPlanOverride.renewalReminderSentAt": null,
  });

  for (const user of toRemind) {
    if (user.emailPreferences?.billingReceipts !== false) {
      sendEmailAsync(customPlanExpiredEmail(user, user.customPlanOverride));
    }
    await User.findByIdAndUpdate(user._id, { "customPlanOverride.renewalReminderSentAt": now });
    console.log(`✉️  Sent custom-plan-expired reminder to user ${user._id}`);
  }

  if (toActivate.length === 0 && toRemind.length === 0) {
    console.log("📅 Custom plan scheduler: nothing due");
  }
}

export function startCustomPlanScheduler() {
  cron.schedule("*/15 * * * *", () => {
    processScheduledCustomPlans().catch((err) => console.error("Custom plan scheduler crashed:", err));
  });
  console.log("🕒 Custom plan scheduler cron scheduled (every 15 min)");
}
