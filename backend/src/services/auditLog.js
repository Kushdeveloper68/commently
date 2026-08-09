import AdminAuditLog from "../models/AdminAuditLog.js";

// Called from every mutating admin action. Not fire-and-forget — admin
// actions are low-volume (not a hot path like webhooks), so it's fine to
// await this and let a logging failure surface as a normal error.
export async function logAdminAction(adminId, action, targetType, targetId, details = {}) {
  await AdminAuditLog.create({ admin: adminId, action, targetType, targetId, details });
}
