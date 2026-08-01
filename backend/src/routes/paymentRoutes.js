import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getPlans,
  createPaymentOrder,
  verifyPayment,
  getBillingHistory,
  cancelSubscription,
} from "../controllers/paymentController.js";

const router = express.Router();

router.get("/plans", getPlans);
router.post("/create-order", requireAuth, createPaymentOrder);
router.post("/verify", requireAuth, verifyPayment);
router.get("/history", requireAuth, getBillingHistory);
router.post("/cancel", requireAuth, cancelSubscription);

export default router;
