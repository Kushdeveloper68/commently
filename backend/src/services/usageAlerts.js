import { getEffectivePlanLimits } from "./planResolver.js";
import { sendEmailAsync } from "./emailService.js";
import { quota80Email, quota100Email } from "./emailTemplates.js";

// Called right after user.dmsSentThisMonth is incremented and saved.
// Fires at most one 80% warning and one 100%-reached email per usage cycle
// (the alert flags are cleared by the monthly usage-reset cron). This
// never blocks the caller — sendEmailAsync is fire-and-forget.
export async function maybeSendQuotaAlerts(user) {
  if (user.emailPreferences?.quotaAlerts === false) return;

  const limits = await getEffectivePlanLimits(user);
  const pct = user.dmsSentThisMonth / limits.maxDmsPerMonth;

  if (pct >= 1 && !user.quota100AlertSentAt) {
    user.quota100AlertSentAt = new Date();
    await user.save();
    sendEmailAsync(quota100Email(user, limits));
  } else if (pct >= 0.8 && !user.quota80AlertSentAt) {
    user.quota80AlertSentAt = new Date();
    await user.save();
    sendEmailAsync(quota80Email(user, limits));
  }
}
