import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  getPlatformOverview,
  listUsers,
  getUserDetail,
  changeUserPlan,
  setUserOverride,
  setUserSuspension,
  adjustUserQuota,
  listPlans,
  createPlan,
  updatePlan,
  deactivatePlan,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/overview", getPlatformOverview);

router.get("/users", listUsers);
router.get("/users/:id", getUserDetail);
router.patch("/users/:id/plan", changeUserPlan);
router.patch("/users/:id/override", setUserOverride);
router.patch("/users/:id/suspend", setUserSuspension);
router.patch("/users/:id/quota", adjustUserQuota);

router.get("/plans", listPlans);
router.post("/plans", createPlan);
router.patch("/plans/:key", updatePlan);
router.delete("/plans/:key", deactivatePlan);

export default router;
