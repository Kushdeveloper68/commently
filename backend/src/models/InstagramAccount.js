import mongoose from "mongoose";

const instagramAccountSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    igBusinessId: { type: String, required: true, unique: true }, // Instagram-scoped account ID
    username: { type: String, required: true },
    profilePictureUrl: { type: String },

    // Long-lived access token — encrypted at rest (see utils/crypto.js)
    accessTokenEncrypted: { type: String, required: true, select: false },
    tokenExpiresAt: { type: Date, required: true },

    isActive: { type: Boolean, default: true },
    connectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("InstagramAccount", instagramAccountSchema);
