// Falls back to the dmloop.app production domain if FRONTEND_URL isn't set
// (e.g. a script run without full env config) — but in normal operation
// this always reflects wherever FRONTEND_URL actually points (local dev,
// staging, or production), so links in emails never go stale or point at
// the wrong environment.
const APP_URL = (process.env.FRONTEND_URL || "https://dmloop.app").replace(/\/$/, "");

function wrapper(bodyHtml) {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #101828;">
    <div style="font-size: 20px; font-weight: 700; color: #2954ff; margin-bottom: 24px;">DMLoop</div>
    ${bodyHtml}
    <p style="font-size: 13px; color: #8892a6; margin-top: 32px; border-top: 1px solid #e3e7f0; padding-top: 16px;">
      DMLoop · <a href="${APP_URL}/dashboard" style="color: #2954ff;">Open dashboard</a> ·
      <a href="${APP_URL}/billing" style="color: #2954ff;">Manage billing</a>
    </p>
  </div>`;
}

export function quota80Email(user, limits) {
  return {
    to: user.email,
    subject: "You're at 80% of your monthly DM limit",
    html: wrapper(`
      <p>Hi ${user.name},</p>
      <p>You've sent <strong>${user.dmsSentThisMonth.toLocaleString("en-IN")}</strong> of your
      <strong>${limits.maxDmsPerMonth.toLocaleString("en-IN")}</strong> DMs this month on the
      <strong style="text-transform: capitalize;">${user.plan}</strong> plan.</p>
      <p>Once you hit the limit, automations pause automatically (nothing breaks, nothing sends
      double) until next month — or you can upgrade to keep them running without interruption.</p>
      <p><a href="${APP_URL}/billing" style="display:inline-block; background:#2954ff; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:600; margin-top:8px;">Upgrade plan</a></p>
    `),
  };
}

export function quota100Email(user, limits) {
  return {
    to: user.email,
    subject: "Your automations have paused — monthly DM limit reached",
    html: wrapper(`
      <p>Hi ${user.name},</p>
      <p>You've reached your <strong>${limits.maxDmsPerMonth.toLocaleString("en-IN")} DMs/month</strong>
      limit on the <strong style="text-transform: capitalize;">${user.plan}</strong> plan.
      Your automations have paused — comments and DMs will stop triggering replies until your
      usage resets or you upgrade.</p>
      <p><a href="${APP_URL}/billing" style="display:inline-block; background:#2954ff; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:600; margin-top:8px;">Upgrade to keep automations running</a></p>
    `),
  };
}

export function subscriptionCancelledEmail(user, subscription) {
  const accessUntil = subscription.periodEnd.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  return {
    to: user.email,
    subject: "Your DMLoop subscription has been cancelled",
    html: wrapper(`
      <p>Hi ${user.name},</p>
      <p>Your <strong style="text-transform: capitalize;">${subscription.plan}</strong> plan won't renew.
      You'll keep full access until <strong>${accessUntil}</strong>, after which your account moves to the Free plan.</p>
      <p>Changed your mind? You can resubscribe anytime from Billing.</p>
    `),
  };
}

export function paymentReceiptEmail(user, subscription) {
  const amount = (subscription.amount / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  return {
    to: user.email,
    subject: `Receipt: DMLoop ${subscription.plan} plan — ${amount}`,
    html: wrapper(`
      <p>Hi ${user.name},</p>
      <p>Thanks for your payment — here's your receipt.</p>
      <table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <tr><td style="padding:6px 0; color:#5b6472;">Plan</td><td style="padding:6px 0; text-align:right; text-transform:capitalize;">${subscription.plan}</td></tr>
        <tr><td style="padding:6px 0; color:#5b6472;">Amount</td><td style="padding:6px 0; text-align:right;">${amount}</td></tr>
        <tr><td style="padding:6px 0; color:#5b6472;">Date</td><td style="padding:6px 0; text-align:right;">${date}</td></tr>
        <tr><td style="padding:6px 0; color:#5b6472;">Payment ID</td><td style="padding:6px 0; text-align:right;">${subscription.razorpayPaymentId}</td></tr>
      </table>
      <p style="font-size: 13px; color: #8892a6;">This is a payment receipt, not a GST tax invoice. Contact billing@dmloop.app if you need a GST invoice for your records.</p>
    `),
  };
}

// Sent once (guarded by customPlanOverride.renewalReminderSentAt) when a
// user's negotiated custom plan window ends without being renewed.
export function customPlanExpiredEmail(user, override) {
  return {
    to: user.email,
    subject: `Your ${override.label || "custom"} plan has ended`,
    html: wrapper(`
      <p>Hi ${user.name},</p>
      <p>Your negotiated <strong>${override.label || "custom"}</strong> plan ended today. Your account has
      moved to whatever plan/subscription you had underneath it (or Free, if none).</p>
      <p>Want to keep your same custom terms? You can renew it in one click from Billing — the price
      and limits stay exactly as negotiated.</p>
      <p><a href="${APP_URL}/billing" style="display:inline-block; background:#2954ff; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:600; margin-top:8px;">Renew my plan</a></p>
    `),
  };
}