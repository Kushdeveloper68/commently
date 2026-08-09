import mongoose from "mongoose";

// DB-backed plan tiers, created by admins beyond the 3 built-in ones
// (free/starter/pro, which stay in config/planLimits.js since they're
// stable and don't need a DB round-trip on every request).
const planSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true }, // e.g. "agency"
    label: { type: String, required: true },
    priceInPaise: { type: Number, required: true },
    maxInstagramAccounts: { type: Number, required: true },
    maxAutomations: { type: Number, required: true },
    maxDmsPerMonth: { type: Number, required: true },
    features: {
      // These three are functionally enforced elsewhere in the code
      // (automationController checks them before allowing publicReply/
      // followGate on an automation; requireAnalyticsAccess checks analytics).
      publicReply: { type: Boolean, default: true },
      followGate: { type: Boolean, default: true },
      analytics: { type: Boolean, default: true },
    },
    // Freeform marketing bullets for the pricing card (e.g. "Priority support",
    // "White-label reports") — display-only, admin can write anything here
    // without needing new code for each one.
    customFeatureLabels: { type: [String], default: [] },

    // Optional window for limited-time offer plans — outside this window the
    // plan is excluded from the public pricing page even if isPubliclyVisible
    // is true (existing subscribers already on it are unaffected).
    validFrom: { type: Date },
    validUntil: { type: Date },

    isActive: { type: Boolean, default: true }, // soft-disable without breaking existing subscribers on it
    isPubliclyVisible: { type: Boolean, default: false }, // show on the public /billing page, or admin-assign only
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export default mongoose.model("Plan", planSchema);
