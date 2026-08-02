import mongoose from "mongoose";

const instagramAccountSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    igBusinessId: { type: String, required: true, unique: true }, // Instagram-scoped account ID
    username: { type: String, required: true },
    profilePictureUrl: { type: String },
    accountType: { type: String }, // "BUSINESS" | "MEDIA_CREATOR" — as reported by Instagram
    followersCount: { type: Number },

    // Long-lived access token — encrypted at rest (see utils/crypto.js)
    accessTokenEncrypted: { type: String, required: true, select: false },
    tokenExpiresAt: { type: Date, required: true },

    isActive: { type: Boolean, default: true },
    connectedAt: { type: Date, default: Date.now },

    // Token refresh bookkeeping — used by the daily refresh cron job
    lastRefreshedAt: { type: Date },
    needsReconnect: { type: Boolean, default: false }, // true if refresh has failed repeatedly — surface a "reconnect" prompt in the UI
  },
  { timestamps: true }
);

export default mongoose.model("InstagramAccount", instagramAccountSchema);
