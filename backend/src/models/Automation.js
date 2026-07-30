import mongoose from "mongoose";

const automationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    instagramAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InstagramAccount",
      required: true,
      index: true,
    },

    name: { type: String, required: true, trim: true }, // e.g. "Website link automation"
    status: { type: String, enum: ["live", "draft", "paused"], default: "draft" },

    // Which Instagram event this automation listens to. "comment" = V1/V2
    // (post/reel comments). "story_reply" = someone replies to your Story.
    // "dm" = any direct message sent to your account (no post/story tie-in).
    channel: { type: String, enum: ["comment", "story_reply", "dm"], default: "comment" },

    trigger: {
      type: { type: String, enum: ["specific_post", "any_post"], default: "any_post" },
      mediaId: { type: String }, // Instagram media/story ID, if type === "specific_post" (unused for channel: "dm")
      mediaThumbnailUrl: { type: String },
    },

    keywordMatch: {
      mode: { type: String, enum: ["specific_words", "any_word"], default: "specific_words" },
      keywords: [{ type: String, lowercase: true, trim: true }],
    },

    publicReply: {
      enabled: { type: Boolean, default: false },
      message: { type: String, default: "" },
    },

    followGate: {
      enabled: { type: Boolean, default: false },
      promptMessage: { type: String, default: "Follow us to get the link! Tap below once you have 👇" },
      confirmButtonText: { type: String, default: "I followed ✅" },
    },

    dmReply: {
      message: { type: String, required: true },
      buttonText: { type: String }, // optional CTA button label
      buttonUrl: { type: String }, // optional CTA link
    },

    stats: {
      triggeredCount: { type: Number, default: 0 },
      dmsSentCount: { type: Number, default: 0 },
      lastTriggeredAt: { type: Date },
    },
  },
  { timestamps: true }
);

automationSchema.index({ instagramAccount: 1, status: 1 });

export default mongoose.model("Automation", automationSchema);