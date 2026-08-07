import InstagramAccount from "../models/InstagramAccount.js";
import Automation from "../models/Automation.js";
import InteractionLog from "../models/InteractionLog.js";
import Subscription from "../models/Subscription.js";
import { getEffectivePlanLimits } from "../services/planResolver.js";
import { decrypt } from "../utils/crypto.js";
import { getMediaById } from "../services/instagramService.js";

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

  const [totalComments, dmsSent, dmsFailed, pendingGates, subscription, channelBreakdown] = await Promise.all([
    InteractionLog.countDocuments({ instagramAccount: { $in: accountIds } }),
    InteractionLog.countDocuments({ instagramAccount: { $in: accountIds }, dmSent: true, gateStatus: { $ne: "pending_follow" } }),
    InteractionLog.countDocuments({ instagramAccount: { $in: accountIds }, dmSent: false }),
    InteractionLog.countDocuments({ instagramAccount: { $in: accountIds }, gateStatus: "pending_follow" }),
    Subscription.findOne({ user: req.user._id, status: "active" }).sort({ periodEnd: -1 }),
    InteractionLog.aggregate([
      { $match: { instagramAccount: { $in: accountIds } } },
      { $group: { _id: "$channel", matched: { $sum: 1 }, dmsSent: { $sum: { $cond: ["$dmSent", 1, 0] } } } },
    ]),
  ]);

  const limits = await getEffectivePlanLimits(req.user);
  const successRate = totalComments > 0 ? Math.round((dmsSent / totalComments) * 100) : 0;

  res.json({
    totals: {
      commentsMatched: totalComments,
      dmsSent,
      dmsFailed,
      pendingFollowConfirmations: pendingGates,
      successRate, // %
    },
    // Breaks the same totals down by trigger source — comments, story
    // replies, and plain DMs — so it's clear which channel is pulling weight.
    byChannel: ["comment", "story_reply", "dm"].map((channel) => {
      const row = channelBreakdown.find((c) => c._id === channel);
      return { channel, matched: row?.matched || 0, dmsSent: row?.dmsSent || 0 };
    }),
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

// GET /api/analytics/leads?page=1&limit=20
// A "lead" is a unique person who engaged with an automation (commented,
// replied to a story, or DM'd) and got a DM back — deduplicated by whoever
// we actually have an identifier for (PSID, falling back to username for
// comment-channel leads where we only captured a username).
export async function getLeads(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const accountIds = await getUserAccountIds(req.user._id);

  const pipeline = [
    { $match: { instagramAccount: { $in: accountIds }, dmSent: true } },
    {
      $group: {
        _id: { $ifNull: ["$recipientPsid", "$commenterUsername"] },
        commenterUsername: { $first: "$commenterUsername" },
        recipientPsid: { $first: "$recipientPsid" },
        channels: { $addToSet: "$channel" },
        interactionCount: { $sum: 1 },
        lastInteractionAt: { $max: "$createdAt" },
        lastAutomation: { $last: "$automation" },
      },
    },
    { $sort: { lastInteractionAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ];

  const [leads, totalResult] = await Promise.all([
    InteractionLog.aggregate(pipeline),
    InteractionLog.aggregate([
      { $match: { instagramAccount: { $in: accountIds }, dmSent: true } },
      { $group: { _id: { $ifNull: ["$recipientPsid", "$commenterUsername"] } } },
      { $count: "total" },
    ]),
  ]);

  const populated = await Automation.populate(leads, { path: "lastAutomation", select: "name" });

  res.json({
    leads: populated.map((l) => ({
      id: l._id,
      commenterUsername: l.commenterUsername,
      recipientPsid: l.recipientPsid,
      channels: l.channels,
      interactionCount: l.interactionCount,
      lastInteractionAt: l.lastInteractionAt,
      lastAutomationName: l.lastAutomation?.name,
    })),
    pagination: {
      page,
      limit,
      total: totalResult[0]?.total || 0,
      totalPages: Math.ceil((totalResult[0]?.total || 0) / limit),
    },
  });
}

// GET /api/analytics/posts?page=1&limit=10
// Per-post breakdown for the "Top Engaged Posts" table — aggregates
// comment-channel InteractionLogs by mediaId, then fetches each post's
// thumbnail/caption live from Instagram (only for the current page, to
// keep API calls bounded). Posts that fail to fetch (deleted, token issue)
// degrade to a placeholder rather than breaking the table.
export async function getTopPosts(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(25, parseInt(req.query.limit) || 10);
  const accountIds = await getUserAccountIds(req.user._id);

  const pipeline = [
    { $match: { instagramAccount: { $in: accountIds }, channel: "comment", mediaId: { $ne: null } } },
    {
      $group: {
        _id: { mediaId: "$mediaId", account: "$instagramAccount" },
        triggeredCount: { $sum: 1 },
        dmsSentCount: { $sum: { $cond: ["$dmSent", 1, 0] } },
        lastActivityAt: { $max: "$createdAt" },
      },
    },
    { $sort: { triggeredCount: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ];

  const [rows, totalResult] = await Promise.all([
    InteractionLog.aggregate(pipeline),
    InteractionLog.aggregate([
      { $match: { instagramAccount: { $in: accountIds }, channel: "comment", mediaId: { $ne: null } } },
      { $group: { _id: { mediaId: "$mediaId", account: "$instagramAccount" } } },
      { $count: "total" },
    ]),
  ]);

  // Fetch live post details, one token-decrypt per unique account on this page
  const accountsById = new Map();
  for (const row of rows) {
    const accId = row._id.account.toString();
    if (!accountsById.has(accId)) {
      const acc = await InstagramAccount.findById(accId).select("+accessTokenEncrypted");
      accountsById.set(accId, acc);
    }
  }

  const posts = await Promise.all(
    rows.map(async (row) => {
      const acc = accountsById.get(row._id.account.toString());
      let media = null;
      if (acc) {
        try {
          media = await getMediaById(decrypt(acc.accessTokenEncrypted), row._id.mediaId);
        } catch {
          media = null;
        }
      }

      const conversion = row.triggeredCount > 0 ? Math.round((row.dmsSentCount / row.triggeredCount) * 1000) / 10 : 0;

      return {
        mediaId: row._id.mediaId,
        caption: media?.caption?.slice(0, 80) || "Post unavailable",
        thumbnailUrl: media?.thumbnail_url || media?.media_url || null,
        permalink: media?.permalink || null,
        triggeredCount: row.triggeredCount,
        dmsSentCount: row.dmsSentCount,
        conversion,
        lastActivityAt: row.lastActivityAt,
      };
    })
  );

  res.json({
    posts,
    pagination: {
      page,
      limit,
      total: totalResult[0]?.total || 0,
      totalPages: Math.ceil((totalResult[0]?.total || 0) / limit),
    },
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
