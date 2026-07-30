import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAnalyticsAccess } from "../middleware/planLimit.js";
import {
  getOverview,
  getKeywordPerformance,
  getRecentActivity,
  getTimeseries,
  getLeads,
} from "../controllers/analyticsController.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireAnalyticsAccess);

router.get("/overview", getOverview);
router.get("/keywords", getKeywordPerformance);
router.get("/activity", getRecentActivity);
router.get("/timeseries", getTimeseries);
router.get("/leads", getLeads);

export default router;