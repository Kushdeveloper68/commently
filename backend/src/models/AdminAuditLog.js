import mongoose from "mongoose";

const adminAuditLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // e.g. "user.plan_change", "plan.create", "user.suspend"
    targetType: { type: String }, // e.g. "User", "Plan"
    targetId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: mongoose.Schema.Types.Mixed }, // before/after values, free-form
  },
  { timestamps: true },
);

export default mongoose.model("AdminAuditLog", adminAuditLogSchema);