import Automation from "../models/Automation.js";
import InstagramAccount from "../models/InstagramAccount.js";
import { getEffectivePlanLimits } from "../services/planResolver.js";

// Shared by createAutomation and updateAutomation — validates that whatever
// publicReply/followGate state a request is trying to set is actually
// covered by the user's current plan. Takes the values that WOULD be in
// effect after the update (i.e. already merged with the existing doc for
// updates), so an update that doesn't touch these fields never trips it.
function assertFeatureEntitlement(limits, { channel, publicReply, followGate }) {
  if (publicReply?.enabled && channel && channel !== "comment") {
    return { status: 400, error: "Public reply is only available for the comment channel" };
  }
  if (publicReply?.enabled && !limits.features.publicReply) {
    return { status: 403, error: "Public reply requires a paid plan", code: "PLAN_FEATURE_LOCKED" };
  }
  if (followGate?.enabled && !limits.features.followGate) {
    return { status: 403, error: "Follow-gating requires a paid plan", code: "PLAN_FEATURE_LOCKED" };
  }
  return null;
}

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

  // If the original was created on a higher plan (or the account has since
  // been downgraded), don't silently carry locked features onto the clone —
  // degrade them off instead of blocking the whole duplicate action.
  const publicReply = !limits.features.publicReply && original.publicReply?.enabled
    ? { ...original.publicReply.toObject?.() ?? original.publicReply, enabled: false }
    : original.publicReply;
  const followGate = !limits.features.followGate && original.followGate?.enabled
    ? { ...original.followGate.toObject?.() ?? original.followGate, enabled: false }
    : original.followGate;

  const clone = await Automation.create({
    user: original.user,
    instagramAccount: original.instagramAccount,
    name: `${original.name} (copy)`,
    channel: original.channel,
    trigger: original.trigger,
    keywordMatch: original.keywordMatch,
    publicReply,
    followGate,
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

  const violation = assertFeatureEntitlement(limits, { channel, publicReply, followGate });
  if (violation) {
    const { status, ...body } = violation;
    return res.status(status).json(body);
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

  const existing = await Automation.findOne({ _id: req.params.id, user: req.user._id });
  if (!existing) return res.status(404).json({ error: "Automation not found" });

  // Re-run the same plan-feature gate as createAutomation, against what the
  // document would look like AFTER this update — without this, a free-plan
  // user could create a plain automation (allowed) then immediately PUT
  // { followGate: { enabled: true } } and get the paid feature for free
  // forever, since nothing else re-checks it after creation.
  const limits = await getEffectivePlanLimits(req.user);
  const effective = {
    channel: updates.channel !== undefined ? updates.channel : existing.channel,
    publicReply: updates.publicReply !== undefined ? updates.publicReply : existing.publicReply,
    followGate: updates.followGate !== undefined ? updates.followGate : existing.followGate,
  };
  const violation = assertFeatureEntitlement(limits, effective);
  if (violation) {
    const { status, ...body } = violation;
    return res.status(status).json(body);
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