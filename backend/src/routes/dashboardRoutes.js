import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { getDashboardOverview } from "../controllers/dashboardController.js";

const router = express.Router();

router.use(requireAuth);
router.get("/overview", getDashboardOverview);

export default router;
