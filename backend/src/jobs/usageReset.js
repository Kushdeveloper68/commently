import cron from "node-cron";
import User from "../models/User.js";

// Was previously missing entirely: dmsSentThisMonth was incremented on every
// DM sent but NEVER reset — meaning once a user hit their plan's monthly
// limit, they'd be permanently locked out, forever, even into next month.
// This resets any user whose cycle (usageResetAt) is 30+ days old.
export async function resetMonthlyUsage() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const dueUsers = await User.find({ usageResetAt: { $lte: cutoff } });

  for (const user of dueUsers) {
    user.dmsSentThisMonth = 0;
    user.usageResetAt = new Date();
    user.quota80AlertSentAt = null;
    user.quota100AlertSentAt = null;
    await user.save();
  }

  if (dueUsers.length > 0) {
    console.log(`🔄 Monthly usage reset for ${dueUsers.length} user(s)`);
  } else {
    console.log("🔄 Usage reset: nothing due");
  }
}

export function startUsageResetCron() {
  cron.schedule("0 2 * * *", () => {
    resetMonthlyUsage().catch((err) => console.error("Usage reset job crashed:", err));
  });
  console.log("🕒 Monthly usage reset cron scheduled (daily @ 2:00 AM)");
}
