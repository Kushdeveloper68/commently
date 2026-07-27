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

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
