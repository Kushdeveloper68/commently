import FeatureFlag from "../models/FeatureFlag.js";

// Single source of truth for which flag keys are actually wired up to real
// checks in the codebase (grep for isFeatureEnabled(...) call sites). The
// admin "New Flag" form reads this list so admins pick a real key instead of
// free-typing one — a flag whose key isn't in here can be created, but it
// won't control anything: FeatureFlag records are just data, this is what
// gives a key meaning.
export const WIRED_FEATURE_FLAGS = [
  {
    key: "follow_gate",
    description: "Emergency off switch for the follow-gate feature on automations (controllers/webhookController.js).",
  },
];

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