import Automation from "../models/Automation.js";
import InstagramAccount from "../models/InstagramAccount.js";
import { getEffectivePlanLimits } from "../services/planResolver.js";

// GET /api/automations
export async function listAutomations(req, res) {
  const automations = await Automation.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate("instagramAccount", "username profilePictureUrl");
  res.json({ automations });
}

// POST /api/automations/:id/duplicate — clones an automation as a new draft,
// so users can quickly spin off variants without rebuilding from scratch.
export async function duplicateAutomation(req, res) {
  const original = await Automation.findOne({ _id: req.params.id, user: req.user._id });
  if (!original) return res.status(404).json({ error: "Automation not found" });

  const limits = await getEffectivePlanLimits(req.user);
  const count = await Automation.countDocuments({ user: req.user._id });
  if (count >= limits.maxAutomations) {
    return res.status(403).json({
      error: `Your ${req.user.plan} plan allows up to ${limits.maxAutomations} automations.`,
      code: "PLAN_LIMIT_AUTOMATIONS",
    });
  }

  const clone = await Automation.create({
    user: original.user,
    instagramAccount: original.instagramAccount,
    name: `${original.name} (copy)`,
    channel: original.channel,
    trigger: original.trigger,
    keywordMatch: original.keywordMatch,
    publicReply: original.publicReply,
    followGate: original.followGate,
    dmReply: original.dmReply,
    status: "draft",
  });

  res.status(201).json({ automation: clone });
}

// GET /api/automations/:id
export async function getAutomation(req, res) {
  const automation = await Automation.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!automation)
    return res.status(404).json({ error: "Automation not found" });
  res.json({ automation });
}

// POST /api/automations
export async function createAutomation(req, res) {
  const {
    instagramAccountId,
    name,
    channel,
    trigger,
    keywordMatch,
    publicReply,
    followGate,
    dmReply,
  } = req.body;

  const account = await InstagramAccount.findOne({
    _id: instagramAccountId,
    user: req.user._id,
    isActive: true,
  });
  if (!account)
    return res.status(404).json({ error: "Instagram account not found" });

  const limits = await getEffectivePlanLimits(req.user);

  if (publicReply?.enabled && channel && channel !== "comment") {
    return res.status(400).json({ error: "Public reply is only available for the comment channel" });
  }
  if (publicReply?.enabled && !limits.features.publicReply) {
    return res
      .status(403)
      .json({
        error: "Public reply requires a paid plan",
        code: "PLAN_FEATURE_LOCKED",
      });
  }
  if (followGate?.enabled && !limits.features.followGate) {
    return res
      .status(403)
      .json({
        error: "Follow-gating requires a paid plan",
        code: "PLAN_FEATURE_LOCKED",
      });
  }

  const automation = await Automation.create({
    user: req.user._id,
    instagramAccount: account._id,
    name,
    channel,
    trigger,
    keywordMatch,
    publicReply,
    followGate,
    dmReply,
    status: "draft",
  });

  res.status(201).json({ automation });
}

// PUT /api/automations/:id
export async function updateAutomation(req, res) {
  const allowedFields = [
    "name",
    "status",
    "channel",
    "trigger",
    "keywordMatch",
    "publicReply",
    "followGate",
    "dmReply",
  ];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const automation = await Automation.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    updates,
    { new: true, runValidators: true },
  );
  if (!automation)
    return res.status(404).json({ error: "Automation not found" });
  res.json({ automation });
}

// DELETE /api/automations/:id
export async function deleteAutomation(req, res) {
  const result = await Automation.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!result) return res.status(404).json({ error: "Automation not found" });
  res.json({ success: true });
}

// PATCH /api/automations/:id/toggle — quick live/paused switch
export async function toggleAutomation(req, res) {
  const automation = await Automation.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!automation)
    return res.status(404).json({ error: "Automation not found" });

  automation.status = automation.status === "live" ? "paused" : "live";
  await automation.save();
  res.json({ automation });
}
