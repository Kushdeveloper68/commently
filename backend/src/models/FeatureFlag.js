import mongoose from "mongoose";

const featureFlagSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true }, // e.g. "follow_gate"
    label: { type: String, required: true },
    description: { type: String },
    enabledGlobally: { type: Boolean, default: true },
    // Only relevant when enabledGloball yis false — lets a flag be turned on
    // for specific users only (e.g. a beta feature).
    enabledForUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

export default mongoose.model("FeatureFlag", featureFlagSchema);
