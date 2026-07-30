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
  try {
    const { plan } = req.body;

    if (!["starter", "pro"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const limits = getPlanLimits(plan);
    const order = await createOrder(limits.priceInPaise, `ord_${req.user._id}`.slice(0, 40));

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
  } catch (err) {
    console.error("Create order failed:", JSON.stringify(err, null, 2));
    res.status(502).json({ error: "Could not start checkout. Please try again." });
  }
}

// POST /api/billing/verify  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
export async function verifyPayment(req, res) {
  try {
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
        status: "active", // was "paid" — analytics/overview and renewal checks query "active"
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
  } catch (err) {
    console.error("Payment verification crashed:", err.message);
    res.status(500).json({ error: "Could not verify payment. Contact support if money was deducted." });
  }
}

// POST /api/billing/webhook — Razorpay server-to-server events (e.g. auto-renewals, failures)
// Mounted with express.raw() in server.js since signature verification needs the raw body
export async function handleRazorpayWebhook(req, res) {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const isValid = verifyWebhookSignature(req.body, signature);

    if (!isValid) return res.status(400).send("Invalid signature");

    const event = JSON.parse(req.body.toString());
    console.log("Razorpay webhook event:", event.event);

    // Backup path for verifyPayment — covers the case where the checkout
    // succeeded but the browser closed/lost connection before the
    // client-side /billing/verify call fired.
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const orderId = event.payload.payment.entity.order_id;
      const paymentId = event.payload.payment.entity.id;

      const subscription = await Subscription.findOne({ razorpayOrderId: orderId });
      if (subscription && subscription.status !== "active") {
        subscription.status = "active";
        subscription.razorpayPaymentId = paymentId;
        subscription.periodStart = new Date();
        subscription.periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await subscription.save();

        await User.findByIdAndUpdate(subscription.user, {
          plan: subscription.plan,
          planRenewsAt: subscription.periodEnd,
        });

        console.log(`✅ Webhook reconciled subscription for order ${orderId}`);
      }
    }

    if (event.event === "payment.failed") {
      const orderId = event.payload.payment.entity.order_id;
      await Subscription.findOneAndUpdate({ razorpayOrderId: orderId }, { status: "failed" });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook processing failed:", err.message);
    res.sendStatus(200); // still 200 — we don't want Razorpay retry-storming us over our own bug
  }
}

// GET /api/billing/history
export async function getBillingHistory(req, res) {
  const subscriptions = await Subscription.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ subscriptions });
}