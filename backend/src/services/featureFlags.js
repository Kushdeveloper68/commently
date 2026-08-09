import FeatureFlag from "../models/FeatureFlag.js";

// If a flag has never been created for `key`, the feature is treated as ON —
// admins only need to create a flag record when they want to experiment
// with or kill-switch something specific. This keeps every existing,
// unflagged feature working exactly as before.
export async function isFeatureEnabled(key, user) {
  const flag = await FeatureFlag.findOne({ key });
  if (!flag) return true;

  if (flag.enabledGlobally) return true;
  if (user && flag.enabledForUserIds.some((id) => id.equals(user._id))) return true;
  return false;
}
