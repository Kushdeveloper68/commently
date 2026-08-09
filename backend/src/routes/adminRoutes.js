import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  getPlatformOverview,
  getPlatformStats,
  listUsers,
  getUserDetail,
  changeUserPlan,
  setUserOverride,
  setUserSuspension,
  adjustUserQuota,
  deleteUser,
  listPlans,
  createPlan,
  updatePlan,
  deactivatePlan,
  listSupportMessages,
  updateSupportMessage,
  listAuditLog,
  listFeatureFlags,
  upsertFeatureFlag,
  deleteFeatureFlag,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/overview", getPlatformOverview);
router.get("/stats", getPlatformStats);

router.get("/users", listUsers);
router.get("/users/:id", getUserDetail);
router.patch("/users/:id/plan", changeUserPlan);
router.patch("/users/:id/override", setUserOverride);
router.patch("/users/:id/suspend", setUserSuspension);
router.patch("/users/:id/quota", adjustUserQuota);
router.delete("/users/:id", deleteUser);

router.get("/plans", listPlans);
router.post("/plans", createPlan);
router.patch("/plans/:key", updatePlan);
router.delete("/plans/:key", deactivatePlan);

router.get("/messages", listSupportMessages);
router.patch("/messages/:id", updateSupportMessage);

router.get("/audit-log", listAuditLog);

router.get("/feature-flags", listFeatureFlags);
router.post("/feature-flags", upsertFeatureFlag);
router.delete("/feature-flags/:key", deleteFeatureFlag);

export default router;
