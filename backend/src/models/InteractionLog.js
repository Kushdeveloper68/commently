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

    // Follow-gate flow: when an automation has followGate.enabled, we send a
    // "please follow" button first and only release the real dmReply.message
    // once the user taps it (a postback event on the messaging webhook).
    recipientPsid: { type: String, index: true }, // Instagram-scoped user ID for this commenter, returned when we send the first DM
    gateStatus: {
      type: String,
      enum: ["none", "pending_follow", "confirmed"],
      default: "none",
    },
  },
  { timestamps: true }
);

export default mongoose.model("InteractionLog", interactionLogSchema);