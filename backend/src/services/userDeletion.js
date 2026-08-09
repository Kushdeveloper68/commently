import User from "../models/User.js";
import InstagramAccount from "../models/InstagramAccount.js";
import Automation from "../models/Automation.js";
import InteractionLog from "../models/InteractionLog.js";
import Subscription from "../models/Subscription.js";

// Permanently deletes a user and every record tied to them. Used by both
// self-serve account deletion (authController) and admin-triggered deletion
// (adminController) — one place for this logic so they can't drift apart.
export async function deleteUserCascade(userId) {
  const accounts = await InstagramAccount.find({ user: userId }).select("_id");
  const accountIds = accounts.map((a) => a._id);

  await InteractionLog.deleteMany({ instagramAccount: { $in: accountIds } });
  await Automation.deleteMany({ instagramAccount: { $in: accountIds } });
  await InstagramAccount.deleteMany({ user: userId });
  await Subscription.deleteMany({ user: userId });
  await User.findByIdAndDelete(userId);
}
