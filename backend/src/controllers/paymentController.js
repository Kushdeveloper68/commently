import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import { getPlanLimits, PLAN_LIMITS } from "../config/planLimits.js";
import { createOrder, verifyPaymentSignature, verifyWebhookSignature } from "../services/razorpayService.js";

// GET /api/billing/plans — public pricing data for the pricing page
export function getPlans(req, res) {
  res.json({ plans: PLAN_LIMITS });
}

// POST /api/billing/create-order  { plan: "starter" | "pro" }
export async function createPaymentOrder(req, res) {
  const { plan } = req.body;
  const limits = getPlanLimits(plan);

  if (!["starter", "pro"].includes(plan)) {
    return res.status(400).json({ error: "Invalid plan" });
  }

  const order = await createOrder(limits.priceInPaise, `user_${req.user._id}_${Date.now()}`);

  await Subscription.create({
    user: req.user._id,
    plan,
    razorpayOrderId: order.id,
    amount: limits.priceInPaise,
    status: "created",
  });

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}

// POST /api/billing/verify  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
export async function verifyPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const isValid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    return res.status(400).json({ error: "Payment verification failed" });
  }

  const subscription = await Subscription.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id, user: req.user._id },
    {
      razorpayPaymentId: razorpay_payment_id,
      status: "paid",
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    { new: true }
  );

  if (!subscription) return res.status(404).json({ error: "Subscription record not found" });

  await User.findByIdAndUpdate(req.user._id, {
    plan: subscription.plan,
    planRenewsAt: subscription.periodEnd,
  });

  res.json({ success: true, plan: subscription.plan });
}

// POST /api/billing/webhook — Razorpay server-to-server events (e.g. auto-renewals, failures)
// Mounted with express.raw() in server.js since signature verification needs the raw body
export async function handleRazorpayWebhook(req, res) {
  const signature = req.headers["x-razorpay-signature"];
  const isValid = verifyWebhookSignature(req.body, signature);

  if (!isValid) return res.status(400).send("Invalid signature");

  const event = JSON.parse(req.body.toString());
  console.log("Razorpay webhook event:", event.event);

  // Extend with handling for subscription.charged, payment.failed, etc. as needed
  res.sendStatus(200);
}

// GET /api/billing/history
export async function getBillingHistory(req, res) {
  const subscriptions = await Subscription.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ subscriptions });
}
