import InstagramAccount from "../models/InstagramAccount.js";
import Automation from "../models/Automation.js";
import InteractionLog from "../models/InteractionLog.js";
import Subscription from "../models/Subscription.js";
import { getPlanLimits } from "../config/planLimits.js";

// Small helper: every analytics query is scoped to the logged-in user, but
// InteractionLog only stores instagramAccount (not user directly) — so we
// resolve the user's account IDs once and reuse them across queries.
async function getUserAccountIds(userId) {
  const accounts = await InstagramAccount.find({ user: userId, isActive: true }).select("_id");
  return accounts.map((a) => a._id);
}

// GET /api/analytics/overview
// Top-level numbers for the dashboard header: total comments matched, DMs
// sent, success rate, current plan usage, and subscription/renewal info.
export async function getOverview(req, res) {
  const accountIds = await getUserAccountIds(req.user._id);

  const [totalComments, dmsSent, dmsFailed, pendingGates, subscription] = await Promise.all([
    InteractionLog.countDocuments({ instagramAccount: { $in: accountIds } }),
    InteractionLog.countDocuments({ instagramAccount: { $in: accountIds }, dmSent: true, gateStatus: { $ne: "pending_follow" } }),
    InteractionLog.countDocuments({ instagramAccount: { $in: accountIds }, dmSent: false }),
    InteractionLog.countDocuments({ instagramAccount: { $in: accountIds }, gateStatus: "pending_follow" }),
    Subscription.findOne({ user: req.user._id, status: "active" }).sort({ periodEnd: -1 }),
  ]);

  const limits = getPlanLimits(req.user.plan);
  const successRate = totalComments > 0 ? Math.round((dmsSent / totalComments) * 100) : 0;

  res.json({
    totals: {
      commentsMatched: totalComments,
      dmsSent,
      dmsFailed,
      pendingFollowConfirmations: pendingGates,
      successRate, // %
    },
    usage: {
      plan: req.user.plan,
      dmsSentThisMonth: req.user.dmsSentThisMonth,
      maxDmsPerMonth: limits.maxDmsPerMonth,
      usagePercent: Math.min(100, Math.round((req.user.dmsSentThisMonth / limits.maxDmsPerMonth) * 100)),
    },
    subscription: subscription
      ? {
          plan: subscription.plan,
          status: subscription.status,
          renewsAt: subscription.periodEnd,
        }
      : null,
  });
}

// GET /api/analytics/keywords
// Ranks automations by how often their keywords actually triggered a match,
// so the user can see which keywords are pulling their weight.
export async function getKeywordPerformance(req, res) {
  const automations = await Automation.find({ user: req.user._id })
    .select("name keywordMatch.keywords stats")
    .sort({ "stats.triggeredCount": -1 });

  const rows = automations.map((a) => ({
    automationId: a._id,
    automationName: a.name,
    keywords: a.keywordMatch.keywords,
    triggeredCount: a.stats.triggeredCount,
    dmsSentCount: a.stats.dmsSentCount,
    lastTriggeredAt: a.stats.lastTriggeredAt,
  }));

  res.json({ keywords: rows });
}

// GET /api/analytics/activity?page=1&limit=20
// Paginated recent-activity feed — comment text, who commented, whether the
// DM went out, for a live "what's happening" view.
export async function getRecentActivity(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const accountIds = await getUserAccountIds(req.user._id);

  const [logs, total] = await Promise.all([
    InteractionLog.find({ instagramAccount: { $in: accountIds } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("automation", "name")
      .populate("instagramAccount", "username"),
    InteractionLog.countDocuments({ instagramAccount: { $in: accountIds } }),
  ]);

  res.json({
    activity: logs.map((log) => ({
      id: log._id,
      automationName: log.automation?.name,
      accountUsername: log.instagramAccount?.username,
      commenterUsername: log.commenterUsername,
      commentText: log.commentText,
      dmSent: log.dmSent,
      dmError: log.dmError,
      gateStatus: log.gateStatus,
      createdAt: log.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// GET /api/analytics/timeseries?days=30
// Daily counts of comments matched vs DMs sent, for a trend chart.
export async function getTimeseries(req, res) {
  const days = Math.min(90, parseInt(req.query.days) || 30);
  const accountIds = await getUserAccountIds(req.user._id);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const results = await InteractionLog.aggregate([
    { $match: { instagramAccount: { $in: accountIds }, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        commentsMatched: { $sum: 1 },
        dmsSent: { $sum: { $cond: ["$dmSent", 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    series: results.map((r) => ({
      date: r._id,
      commentsMatched: r.commentsMatched,
      dmsSent: r.dmsSent,
    })),
  });
}