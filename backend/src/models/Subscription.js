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
  },
  { timestamps: true }
);

export default mongoose.model("Subscription", subscriptionSchema);
