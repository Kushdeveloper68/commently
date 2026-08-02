import InstagramAccount from "../models/InstagramAccount.js";
import Automation from "../models/Automation.js";
import InteractionLog from "../models/InteractionLog.js";

async function getUserAccountIds(userId) {
  const accounts = await InstagramAccount.find({ user: userId, isActive: true });
  return accounts;
}

// GET /api/dashboard/overview — the "Command Center" data. Unlike
// /api/analytics/*, this is available on every plan (including Free) since
// it's the first thing any user sees after logging in.
export async function getDashboardOverview(req, res) {
  const accounts = await getUserAccountIds(req.user._id);
  const accountIds = accounts.map((a) => a._id);

  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    commentsHandled,
    dmsSent,
    dmsFailed,
    leadsResult,
    thisWeekComments,
    lastWeekComments,
    thisWeekDms,
    lastWeekDms,
    recentActivity,
  ] = await Promise.all([
    InteractionLog.countDocuments({ instagramAccount: { $in: accountIds } }),
    InteractionLog.countDocuments({ instagramAccount: { $in: accountIds }, dmSent: true, gateStatus: { $ne: "pending_follow" } }),
    InteractionLog.countDocuments({ instagramAccount: { $in: accountIds }, dmSent: false }),
    InteractionLog.aggregate([
      { $match: { instagramAccount: { $in: accountIds }, dmSent: true } },
      { $group: { _id: { $ifNull: ["$recipientPsid", "$commenterUsername"] } } },
      { $count: "total" },
    ]),
    InteractionLog.countDocuments({ instagramAccount: { $in: accountIds }, createdAt: { $gte: weekStart } }),
    InteractionLog.countDocuments({ instagramAccount: { $in: accountIds }, createdAt: { $gte: prevWeekStart, $lt: weekStart } }),
    InteractionLog.countDocuments({ instagramAccount: { $in: accountIds }, dmSent: true, createdAt: { $gte: weekStart } }),
    InteractionLog.countDocuments({ instagramAccount: { $in: accountIds }, dmSent: true, createdAt: { $gte: prevWeekStart, $lt: weekStart } }),
    InteractionLog.find({ instagramAccount: { $in: accountIds } })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("automation", "name channel")
      .populate("instagramAccount", "username"),
  ]);

  const leadsCaptured = leadsResult[0]?.total || 0;
  const conversionRate = commentsHandled > 0 ? Math.round((dmsSent / commentsHandled) * 1000) / 10 : 0;
  const deliveryHealth = dmsSent + dmsFailed > 0 ? Math.round((dmsSent / (dmsSent + dmsFailed)) * 100) : 100;

  // Week-over-week % change — null when there's no prior-week baseline to compare against
  const pctChange = (curr, prev) => (prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : null);

  // Per-account trigger counts, for the "Channels" panel
  const accountStats = await Promise.all(
    accounts.map(async (acc) => {
      const triggerCount = await InteractionLog.countDocuments({ instagramAccount: acc._id, dmSent: true });
      return {
        id: acc._id,
        username: acc.username,
        profilePictureUrl: acc.profilePictureUrl,
        needsReconnect: acc.needsReconnect,
        triggerCount,
      };
    })
  );

  res.json({
    stats: {
      commentsHandled,
      commentsChangePct: pctChange(thisWeekComments, lastWeekComments),
      dmsSent,
      dmsChangePct: pctChange(thisWeekDms, lastWeekDms),
      conversionRate,
      leadsCaptured,
      deliveryHealth,
    },
    activity: recentActivity.map((log) => ({
      id: log._id,
      commenterUsername: log.commenterUsername,
      channel: log.channel,
      automationName: log.automation?.name,
      accountUsername: log.instagramAccount?.username,
      dmSent: log.dmSent,
      createdAt: log.createdAt,
    })),
    accounts: accountStats,
  });
}
