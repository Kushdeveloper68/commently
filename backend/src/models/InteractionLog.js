import mongoose from "mongoose";

const interactionLogSchema = new mongoose.Schema(
  {
    automation: { type: mongoose.Schema.Types.ObjectId, ref: "Automation", required: true, index: true },
    instagramAccount: { type: mongoose.Schema.Types.ObjectId, ref: "InstagramAccount", required: true },

    // "comment" logs use the Instagram comment ID here; "story_reply" and
    // "dm" logs use the message ID (mid) — either way, this is what prevents
    // double-replying to the same event on webhook retries.
    channel: { type: String, enum: ["comment", "story_reply", "dm"], required: true, default: "comment" },
    sourceId: { type: String, required: true, unique: true },
    commenterUsername: { type: String },
    commentText: { type: String }, // holds the comment text, story-reply text, or DM text depending on channel

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