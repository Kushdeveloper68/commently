import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // always set — Help page is behind login
    name: { type: String, required: true },
    email: { type: String, required: true },
    type: { type: String, enum: ["support", "feedback"], required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 }, // feedback only, optional
    status: { type: String, enum: ["new", "in_progress", "resolved"], default: "new" },
    adminNote: { type: String }, // internal, not shown to the user
  },
  { timestamps: true },
);

export default mongoose.model("SupportMessage", supportMessageSchema);
