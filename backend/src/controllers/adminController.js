import User from "../models/User.js";
import InstagramAccount from "../models/InstagramAccount.js";
import Automation from "../models/Automation.js";
import InteractionLog from "../models/InteractionLog.js";
import Subscription from "../models/Subscription.js";
import Plan from "../models/Plan.js";
import SupportMessage from "../models/SupportMessage.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import FeatureFlag from "../models/FeatureFlag.js";
import { PLAN_LIMITS } from "../config/planLimits.js";
import { getEffectivePlanLimits, getCustomOverrideStatus } from "../services/planResolver.js";
import { WIRED_FEATURE_FLAGS } from "../services/featureFlags.js";
import { logAdminAction } from "../services/auditLog.js";
import { deleteUserCascade } from "../services/userDeletion.js";

// ── Platform overview ────────────────────────────────────────────────────

// GET /api/admin/overview — platform-wide stats for the admin dashboard
export async function getPlatformOverview(req, res) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    newUsersThisMonth,
    totalAutomations,
    liveAutomations,
    totalAccounts,
    accountsNeedingReconnect,
    totalDmsSent,
    dmsSentThisMonth,
    planCounts,
    revenueThisMonth,
    suspendedCount,
    openSupportCount,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ createdAt: { $gte: monthStart } }),
    Automation.countDocuments({}),
    Automation.countDocuments({ status: "live" }),
    InstagramAccount.countDocuments({ isActive: true }),
    InstagramAccount.countDocuments({ isActive: true, needsReconnect: true }),
    InteractionLog.countDocuments({ dmSent: true }),
    InteractionLog.countDocuments({ dmSent: true, createdAt: { $gte: monthStart } }),
    User.aggregate([{ $group: { _id: "$plan", count: { $sum: 1 } } }]),
    Subscription.aggregate([
      { $match: { status: "active", createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    User.countDocuments({ isSuspended: true }),
    SupportMessage.countDocuments({ type: "support", status: { $ne: "resolved" } }),
  ]);

  res.json({
    users: { total: totalUsers, newThisMonth: newUsersThisMonth, suspended: suspendedCount },
    automations: { total: totalAutomations, live: liveAutomations },
    accounts: { total: totalAccounts, needingReconnect: accountsNeedingReconnect },
    dms: { total: totalDmsSent, thisMonth: dmsSentThisMonth },
    revenueThisMonthInPaise: revenueThisMonth[0]?.total || 0,
    planDistribution: planCounts.map((p) => ({ plan: p._id, count: p.count })),
    openSupportCount,
  });
}

// GET /api/admin/stats?days=30 — daily trend stats (signup rate, automation
// creation rate, etc), for the "average per day" view
export async function getPlatformStats(req, res) {
  const days = Math.min(90, parseInt(req.query.days) || 30);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [signupSeries, automationSeries] = await Promise.all([
    User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Automation.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const totalSignups = signupSeries.reduce((s, r) => s + r.count, 0);
  const totalAutomations = automationSeries.reduce((s, r) => s + r.count, 0);

  res.json({
    days,
    signups: { series: signupSeries.map((r) => ({ date: r._id, count: r.count })), avgPerDay: Math.round((totalSignups / days) * 10) / 10, total: totalSignups },
    automationsCreated: { series: automationSeries.map((r) => ({ date: r._id, count: r.count })), avgPerDay: Math.round((totalAutomations / days) * 10) / 10, total: totalAutomations },
  });
}

// ── Users ────────────────────────────────────────────────────────────────

// GET /api/admin/users?page=1&limit=20&search=&plan=
export async function listUsers(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const { search, plan } = req.query;

  const filter = {};
  if (plan && typeof plan === "string") filter.plan = plan;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    users: users.map((u) => {
      const overrideStatus = getCustomOverrideStatus(u);
      return {
        id: u._id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        plan: u.plan,
        hasOverride: u.customPlanOverride?.enabled || false,
        // Every user's current period, so admins can see "took this plan on
        // X, ends on Y" at a glance — whether that's a self-serve
        // subscription or a negotiated override overlay.
        planStartedAt: u.planStartedAt,
        planRenewsAt: u.planRenewsAt,
        customPlanOverrideStatus: overrideStatus, // { state: "scheduled"|"active"|"expired", effectiveFrom, periodEnd, ... } | null
        dmsSentThisMonth: u.dmsSentThisMonth,
        isSuspended: u.isSuspended,
        createdAt: u.createdAt,
      };
    }),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// GET /api/admin/users/:id — full detail for one user
export async function getUserDetail(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const [accounts, automations, subscriptions, limits] = await Promise.all([
    InstagramAccount.find({ user: user._id }).select("-accessTokenEncrypted"),
    Automation.find({ user: user._id }).populate("instagramAccount", "username"),
    Subscription.find({ user: user._id }).sort({ createdAt: -1 }),
    getEffectivePlanLimits(user),
  ]);

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      plan: user.plan,
      role: user.role,
      dmsSentThisMonth: user.dmsSentThisMonth,
      isSuspended: user.isSuspended,
      suspendedReason: user.suspendedReason,
      customPlanOverride: user.customPlanOverride,
      customPlanOverrideStatus: getCustomOverrideStatus(user),
      planStartedAt: user.planStartedAt,
      planRenewsAt: user.planRenewsAt,
      createdAt: user.createdAt,
    },
    effectiveLimits: limits,
    accounts,
    automations,
    subscriptions,
  });
}

// PATCH /api/admin/users/:id/plan — { plan: "starter" | "pro" | <custom key> }
export async function changeUserPlan(req, res) {
  const { plan } = req.body;
  if (typeof plan !== "string" || !plan) {
    return res.status(400).json({ error: "plan must be a string" });
  }
  const isValidPlan = PLAN_LIMITS[plan] || (await Plan.exists({ key: plan }));
  if (!isValidPlan) return res.status(400).json({ error: "Unknown plan key" });

  const before = await User.findById(req.params.id).select("plan");
  const user = await User.findByIdAndUpdate(req.params.id, { plan }, { new: true });
  if (!user) return res.status(404).json({ error: "User not found" });

  await logAdminAction(req.user._id, "user.plan_change", "User", user._id, { from: before?.plan, to: plan });

  res.json({ success: true, plan: user.plan });
}

// PATCH /api/admin/users/:id/override
export async function setUserOverride(req, res) {
  const {
    enabled,
    label,
    priceInPaise,
    maxInstagramAccounts,
    maxAutomations,
    maxDmsPerMonth,
    features,
    note,
    effectiveFrom,
    durationDays,
  } = req.body;

  // effectiveFrom defaults to "now" (immediate) if the admin doesn't pick a
  // future date — durationDays defaults to a 30-day cycle. periodEnd is
  // computed here rather than left to the frontend so it's always
  // consistent with whatever effectiveFrom/durationDays were actually saved.
  const from = effectiveFrom ? new Date(effectiveFrom) : new Date();
  const days = Number.isFinite(Number(durationDays)) && Number(durationDays) > 0 ? Number(durationDays) : 30;
  const periodEnd = new Date(from.getTime() + days * 24 * 60 * 60 * 1000);

  const override = {
    enabled: !!enabled,
    label,
    priceInPaise,
    maxInstagramAccounts,
    maxAutomations,
    maxDmsPerMonth,
    features,
    note,
    effectiveFrom: from,
    periodEnd,
    durationDays: days,
    // Reset renewal bookkeeping whenever an admin (re)configures the deal —
    // a fresh admin edit shouldn't be treated as "already activated" by the
    // scheduler cron, and any pending renewal-reminder guard is stale now.
    activatedAt: null,
    renewalReminderSentAt: null,
  };
  const user = await User.findByIdAndUpdate(req.params.id, { customPlanOverride: override }, { new: true });
  if (!user) return res.status(404).json({ error: "User not found" });

  await logAdminAction(req.user._id, "user.override_set", "User", user._id, override);

  res.json({ success: true, customPlanOverride: user.customPlanOverride });
}

// PATCH /api/admin/users/:id/suspend — { suspended: true/false, reason? }
export async function setUserSuspension(req, res) {
  const { suspended, reason } = req.body;

  const update = suspended
    ? { isSuspended: true, suspendedReason: reason || "", suspendedAt: new Date() }
    : { isSuspended: false, suspendedReason: null, suspendedAt: null };

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!user) return res.status(404).json({ error: "User not found" });

  await logAdminAction(req.user._id, suspended ? "user.suspend" : "user.reactivate", "User", user._id, { reason });

  res.json({ success: true, isSuspended: user.isSuspended });
}

// PATCH /api/admin/users/:id/quota — { dmsSentThisMonth: number }
export async function adjustUserQuota(req, res) {
  const { dmsSentThisMonth } = req.body;
  if (typeof dmsSentThisMonth !== "number" || dmsSentThisMonth < 0) {
    return res.status(400).json({ error: "dmsSentThisMonth must be a non-negative number" });
  }

  const before = await User.findById(req.params.id).select("dmsSentThisMonth");
  const user = await User.findByIdAndUpdate(req.params.id, { dmsSentThisMonth }, { new: true });
  if (!user) return res.status(404).json({ error: "User not found" });

  await logAdminAction(req.user._id, "user.quota_adjust", "User", user._id, { from: before?.dmsSentThisMonth, to: dmsSentThisMonth });

  res.json({ success: true, dmsSentThisMonth: user.dmsSentThisMonth });
}

// DELETE /api/admin/users/:id — permanent, cascades everything
export async function deleteUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (user._id.equals(req.user._id)) {
    return res.status(400).json({ error: "You can't delete your own account from here." });
  }

  await logAdminAction(req.user._id, "user.delete", "User", user._id, { email: user.email, name: user.name });
  await deleteUserCascade(user._id);

  res.json({ success: true });
}

// ── Custom plans ─────────────────────────────────────────────────────────

export async function listPlans(req, res) {
  const customPlans = await Plan.find({}).sort({ createdAt: -1 });
  res.json({ builtIn: PLAN_LIMITS, custom: customPlans });
}

export async function createPlan(req, res) {
  const {
    key, label, priceInPaise, maxInstagramAccounts, maxAutomations, maxDmsPerMonth,
    features, customFeatureLabels, isPubliclyVisible, validFrom, validUntil,
  } = req.body;

  if (!key || !label) return res.status(400).json({ error: "key and label are required" });
  if (PLAN_LIMITS[key]) return res.status(400).json({ error: "That key collides with a built-in plan" });

  try {
    const plan = await Plan.create({
      key: key.toLowerCase().trim(),
      label,
      priceInPaise,
      maxInstagramAccounts,
      maxAutomations,
      maxDmsPerMonth,
      features,
      customFeatureLabels,
      isPubliclyVisible: !!isPubliclyVisible,
      validFrom: validFrom || undefined,
      validUntil: validUntil || undefined,
      createdBy: req.user._id,
    });

    await logAdminAction(req.user._id, "plan.create", "Plan", plan._id, { key: plan.key, label: plan.label });

    res.status(201).json({ plan });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "A plan with that key already exists" });
    throw err;
  }
}

export async function updatePlan(req, res) {
  const allowedFields = [
    "label", "priceInPaise", "maxInstagramAccounts", "maxAutomations", "maxDmsPerMonth",
    "features", "customFeatureLabels", "isActive", "isPubliclyVisible", "validFrom", "validUntil",
  ];
  const update = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) update[field] = req.body[field];
  }

  const plan = await Plan.findOneAndUpdate({ key: req.params.key }, update, { new: true });
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  await logAdminAction(req.user._id, "plan.update", "Plan", plan._id, { key: plan.key, changes: update });

  res.json({ plan });
}

export async function deactivatePlan(req, res) {
  const plan = await Plan.findOneAndUpdate({ key: req.params.key }, { isActive: false }, { new: true });
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  await logAdminAction(req.user._id, "plan.deactivate", "Plan", plan._id, { key: plan.key });

  res.json({ success: true });
}

// ── Support messages & feedback ─────────────────────────────────────────

// GET /api/admin/messages?type=support&status=new&page=1
export async function listSupportMessages(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const { type, status } = req.query;

  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;

  const [messages, total] = await Promise.all([
    SupportMessage.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("user", "name email"),
    SupportMessage.countDocuments(filter),
  ]);

  res.json({ messages, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

// PATCH /api/admin/messages/:id — { status?, adminNote? }
export async function updateSupportMessage(req, res) {
  const { status, adminNote } = req.body;
  const update = {};
  if (status) update.status = status;
  if (adminNote !== undefined) update.adminNote = adminNote;

  const message = await SupportMessage.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!message) return res.status(404).json({ error: "Message not found" });

  res.json({ message });
}

// ── Audit log ────────────────────────────────────────────────────────────

// GET /api/admin/audit-log?page=1
export async function listAuditLog(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 30);

  const [logs, total] = await Promise.all([
    AdminAuditLog.find({}).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("admin", "name email"),
    AdminAuditLog.countDocuments({}),
  ]);

  res.json({ logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

// ── Feature flags ────────────────────────────────────────────────────────

export async function listFeatureFlags(req, res) {
  const flags = await FeatureFlag.find({}).sort({ key: 1 });
  const wiredKeys = new Set(WIRED_FEATURE_FLAGS.map((f) => f.key));
  const withWiredFlag = flags.map((f) => ({ ...f.toObject(), wired: wiredKeys.has(f.key) }));
  res.json({ flags: withWiredFlag });
}

// GET /api/admin/feature-flags/wired-keys — the keys that actually control
// something in code, so the "New Flag" form can offer a picker instead of a
// free-text field an admin can typo their way into a useless flag with.
export async function listWiredFeatureFlagKeys(req, res) {
  res.json({ keys: WIRED_FEATURE_FLAGS });
}

// POST /api/admin/feature-flags — create or update (upsert by key)
export async function upsertFeatureFlag(req, res) {
  const { key, label, description, enabledGlobally, enabledForUserIds } = req.body;
  if (!key || !label) return res.status(400).json({ error: "key and label are required" });

  const flag = await FeatureFlag.findOneAndUpdate(
    { key: key.toLowerCase().trim() },
    { label, description, enabledGlobally, enabledForUserIds: enabledForUserIds || [] },
    { new: true, upsert: true },
  );

  await logAdminAction(req.user._id, "feature_flag.upsert", "FeatureFlag", flag._id, { key: flag.key, enabledGlobally });

  res.json({ flag });
}

export async function deleteFeatureFlag(req, res) {
  const flag = await FeatureFlag.findOneAndDelete({ key: req.params.key });
  if (!flag) return res.status(404).json({ error: "Flag not found" });

  await logAdminAction(req.user._id, "feature_flag.delete", "FeatureFlag", flag._id, { key: flag.key });

  res.json({ success: true });
}