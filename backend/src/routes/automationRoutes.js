import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { enforceAutomationLimit } from "../middleware/planLimit.js";
import {
  listAutomations,
  getAutomation,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  toggleAutomation,
} from "../controllers/automationController.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", listAutomations);
router.get("/:id", getAutomation);
router.post("/", enforceAutomationLimit, createAutomation);
router.put("/:id", updateAutomation);
router.delete("/:id", deleteAutomation);
router.patch("/:id/toggle", toggleAutomation);

export default router;
