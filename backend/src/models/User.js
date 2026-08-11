import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    // Google OAuth
    googleId: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String },

    // Password auth is optional if user only ever logs in via Google
    passwordHash: { type: String, select: false },

    role: { type: String, enum: ["user", "admin"], default: "user" },
    timezone: { type: String, default: "Asia/Kolkata" },
    emailPreferences: {
      quotaAlerts: { type: Boolean, default: true }, // 80%/100% DM limit emails
      billingReceipts: { type: Boolean, default: true }, // payment receipts + cancellation confirmation
    },

    // Plain string, not an enum — can hold a built-in key ("free"/"starter"/
    // "pro") or a custom plan's key (see models/Plan.js) created by an admin.
    plan: {
      type: String,
      default: "free",
    },
    planRenewsAt: { type: Date },
    planStartedAt: { type: Date }, // when the CURRENT plan/subscription period began — shown to admins so they can see "took this plan on X"
    razorpayCustomerId: { type: String },

    // Admin-set negotiated deal for THIS one user specifically — takes
    // priority over whatever `plan`/Subscription says, but only while
    // `now` falls inside [effectiveFrom, periodEnd). Different from a
    // custom Plan (which is a reusable tier multiple users could be on).
    customPlanOverride: {
      enabled: { type: Boolean, default: false }, // master kill switch — admin can permanently turn it off regardless of dates
      label: { type: String, default: "Custom" },
      priceInPaise: { type: Number },
      maxInstagramAccounts: { type: Number },
      maxAutomations: { type: Number },
      maxDmsPerMonth: { type: Number },
      features: {
        publicReply: { type: Boolean, default: true },
        followGate: { type: Boolean, default: true },
        analytics: { type: Boolean, default: true },
      },
      note: { type: String }, // admin's internal reason, not shown to the user

      // Scheduling/expiry — without these, an admin-assigned custom plan
      // would apply immediately and forever, with no renewal ever asked
      // for. See services/planResolver.js's getEffectivePlanLimits for how
      // these gate whether the override is actually in effect right now.
      effectiveFrom: { type: Date, default: Date.now }, // when this deal starts overriding whatever the user currently has
      periodEnd: { type: Date }, // when this cycle ends — null means "never expires" (legacy/no-expiry deals)
      durationDays: { type: Number, default: 30 }, // used to compute periodEnd on create/renewal
      activatedAt: { type: Date }, // bookkeeping: last time the scheduler actually flipped this override "live" (superseded any concurrent Subscription) — prevents redoing that on every cron tick
      renewalReminderSentAt: { type: Date }, // idempotency guard for the "your custom plan ended, renew" email
    },

    isSuspended: { type: Boolean, default: false },
    suspendedReason: { type: String },
    suspendedAt: { type: Date },

    // Usage limits enforced at the plan level (see planLimits.js)
    dmsSentThisMonth: { type: Number, default: 0 },
    usageResetAt: { type: Date, default: Date.now },
    // Prevents spamming quota-warning emails — set once per usage cycle,
    // cleared by the monthly usage-reset cron.
    quota80AlertSentAt: { type: Date },
    quota100AlertSentAt: { type: Date },

    termsAcceptedAt: { type: Date }, // recorded when the user signs up (clickwrap: "by continuing you agree...")

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);