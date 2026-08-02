import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAnalyticsAccess } from "../middleware/planLimit.js";
import {
  getOverview,
  getKeywordPerformance,
  getRecentActivity,
  getTimeseries,
  getLeads,
  getTopPosts,
} from "../controllers/analyticsController.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireAnalyticsAccess);

router.get("/overview", getOverview);
router.get("/keywords", getKeywordPerformance);
router.get("/activity", getRecentActivity);
router.get("/timeseries", getTimeseries);
router.get("/leads", getLeads);
router.get("/posts", getTopPosts);

export default router;
