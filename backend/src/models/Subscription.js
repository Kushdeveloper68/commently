import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    plan: { type: String, enum: ["starter", "pro"], required: true },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySubscriptionId: { type: String },

    amount: { type: Number, required: true }, // in paise (INR smallest unit)
    currency: { type: String, default: "INR" },

    status: {
      type: String,
      enum: ["created", "paid", "active", "cancelled", "failed"],
      default: "created",
    },

    periodStart: { type: Date },
    periodEnd: { type: Date },

    // Note: billing today uses one-time Razorpay Orders, not Razorpay's
    // recurring Subscriptions API — nothing auto-charges the user next
    // month. autoRenew/cancelledAt are bookkeeping for the cancel flow and
    // support visibility; the expiry cron downgrades ANY subscription past
    // periodEnd regardless of this flag, since nothing re-charges it anyway.
    autoRenew: { type: Boolean, default: true },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Subscription", subscriptionSchema);
