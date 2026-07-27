import mongoose from "mongoose";

const interactionLogSchema = new mongoose.Schema(
  {
    automation: { type: mongoose.Schema.Types.ObjectId, ref: "Automation", required: true, index: true },
    instagramAccount: { type: mongoose.Schema.Types.ObjectId, ref: "InstagramAccount", required: true },

    commentId: { type: String, required: true, unique: true }, // prevents double-replying to same comment
    commenterUsername: { type: String },
    commentText: { type: String },

    dmSent: { type: Boolean, default: false },
    dmError: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("InteractionLog", interactionLogSchema);
