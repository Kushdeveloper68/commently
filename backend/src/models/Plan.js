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
      publicReply: { type: Boolean, default: true },
      followGate: { type: Boolean, default: true },
      analytics: { type: Boolean, default: true },
    },
    isActive: { type: Boolean, default: true }, // soft-disable without breaking existing subscribers on it
    isPubliclyVisible: { type: Boolean, default: false }, // show on the public /billing page, or admin-assign only
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export default mongoose.model("Plan", planSchema);
