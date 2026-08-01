import cron from "node-cron";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";

// Downgrades ANY subscription past its periodEnd, not just cancelled ones —
// there's no recurring auto-charge happening today (see cancelSubscription's
// comment), so nothing actually renews access on its own. Without this job,
// a user's plan field would just stay "pro"/"starter" forever after their
// one-time payment period ends, whether they meant to cancel or not.
export async function downgradeExpiredSubscriptions() {
  const expired = await Subscription.find({
    status: "active",
    periodEnd: { $lte: new Date() },
  });

  if (expired.length === 0) {
    console.log("📅 Subscription expiry: nothing due");
    return;
  }

  for (const sub of expired) {
    sub.status = "cancelled";
    await sub.save();

    await User.findByIdAndUpdate(sub.user, { plan: "free", planRenewsAt: null });
    console.log(`⬇️  Downgraded user ${sub.user} to Free (subscription ${sub._id} expired)`);
  }
}

export function startSubscriptionExpiryCron() {
  cron.schedule("30 3 * * *", () => {
    downgradeExpiredSubscriptions().catch((err) => console.error("Subscription expiry job crashed:", err));
  });
  console.log("🕒 Subscription expiry cron scheduled (daily @ 3:30 AM)");
}
