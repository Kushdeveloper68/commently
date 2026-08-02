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

    plan: {
      type: String,
      enum: ["free", "starter", "pro"],
      default: "free",
    },
    planRenewsAt: { type: Date },
    razorpayCustomerId: { type: String },

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
