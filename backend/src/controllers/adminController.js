import User from "../models/User.js";
import InstagramAccount from "../models/InstagramAccount.js";
import Automation from "../models/Automation.js";
import InteractionLog from "../models/InteractionLog.js";
import Subscription from "../models/Subscription.js";
import Plan from "../models/Plan.js";
import { PLAN_LIMITS } from "../config/planLimits.js";
import { getEffectivePlanLimits } from "../services/planResolver.js";

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
  ]);

  res.json({
    users: { total: totalUsers, newThisMonth: newUsersThisMonth, suspended: suspendedCount },
    automations: { total: totalAutomations, live: liveAutomations },
    accounts: { total: totalAccounts, needingReconnect: accountsNeedingReconnect },
    dms: { total: totalDmsSent, thisMonth: dmsSentThisMonth },
    revenueThisMonthInPaise: revenueThisMonth[0]?.total || 0,
    planDistribution: planCounts.map((p) => ({ plan: p._id, count: p.count })),
  });
}

// ── Users ────────────────────────────────────────────────────────────────

// GET /api/admin/users?page=1&limit=20&search=&plan=
export async function listUsers(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const { search, plan } = req.query;

  const filter = {};
  if (plan) filter.plan = plan;
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
    users: users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl,
      plan: u.plan,
      hasOverride: u.customPlanOverride?.enabled || false,
      dmsSentThisMonth: u.dmsSentThisMonth,
      isSuspended: u.isSuspended,
      createdAt: u.createdAt,
    })),
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
  const isValidPlan = PLAN_LIMITS[plan] || (await Plan.exists({ key: plan }));
  if (!isValidPlan) return res.status(400).json({ error: "Unknown plan key" });

  const user = await User.findByIdAndUpdate(req.params.id, { plan }, { new: true });
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({ success: true, plan: user.plan });
}

// PATCH /api/admin/users/:id/override — sets or clears a negotiated per-user deal
// Body: { enabled, label, priceInPaise, maxInstagramAccounts, maxAutomations, maxDmsPerMonth, features, note }
export async function setUserOverride(req, res) {
  const { enabled, label, priceInPaise, maxInstagramAccounts, maxAutomations, maxDmsPerMonth, features, note } =
    req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      customPlanOverride: {
        enabled: !!enabled,
        label,
        priceInPaise,
        maxInstagramAccounts,
        maxAutomations,
        maxDmsPerMonth,
        features,
        note,
      },
    },
    { new: true },
  );
  if (!user) return res.status(404).json({ error: "User not found" });

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

  res.json({ success: true, isSuspended: user.isSuspended });
}

// PATCH /api/admin/users/:id/quota — manual adjustment, e.g. goodwill reset
// Body: { dmsSentThisMonth: number }
export async function adjustUserQuota(req, res) {
  const { dmsSentThisMonth } = req.body;
  if (typeof dmsSentThisMonth !== "number" || dmsSentThisMonth < 0) {
    return res.status(400).json({ error: "dmsSentThisMonth must be a non-negative number" });
  }

  const user = await User.findByIdAndUpdate(req.params.id, { dmsSentThisMonth }, { new: true });
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({ success: true, dmsSentThisMonth: user.dmsSentThisMonth });
}

// ── Custom plans ─────────────────────────────────────────────────────────

// GET /api/admin/plans — built-in + all custom plans (including inactive, for admin visibility)
export async function listPlans(req, res) {
  const customPlans = await Plan.find({}).sort({ createdAt: -1 });
  res.json({
    builtIn: PLAN_LIMITS,
    custom: customPlans,
  });
}

// POST /api/admin/plans — create a new custom plan tier
export async function createPlan(req, res) {
  const { key, label, priceInPaise, maxInstagramAccounts, maxAutomations, maxDmsPerMonth, features, isPubliclyVisible } =
    req.body;

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
      isPubliclyVisible: !!isPubliclyVisible,
      createdBy: req.user._id,
    });
    res.status(201).json({ plan });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "A plan with that key already exists" });
    throw err;
  }
}

// PATCH /api/admin/plans/:key — edit a custom plan
export async function updatePlan(req, res) {
  const allowedFields = [
    "label",
    "priceInPaise",
    "maxInstagramAccounts",
    "maxAutomations",
    "maxDmsPerMonth",
    "features",
    "isActive",
    "isPubliclyVisible",
  ];
  const update = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) update[field] = req.body[field];
  }

  const plan = await Plan.findOneAndUpdate({ key: req.params.key }, update, { new: true });
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  res.json({ plan });
}

// DELETE /api/admin/plans/:key — soft delete (deactivate, don't break existing subscribers)
export async function deactivatePlan(req, res) {
  const plan = await Plan.findOneAndUpdate({ key: req.params.key }, { isActive: false }, { new: true });
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  res.json({ success: true });
}
