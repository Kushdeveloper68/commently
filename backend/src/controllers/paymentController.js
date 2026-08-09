import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import { getPlanLimitsByKey, getAllVisiblePlans } from "../services/planResolver.js";
import { createOrder, verifyPaymentSignature, verifyWebhookSignature } from "../services/razorpayService.js";
import { sendEmailAsync } from "../services/emailService.js";
import { subscriptionCancelledEmail, paymentReceiptEmail } from "../services/emailTemplates.js";

// GET /api/billing/plans — public pricing data for the pricing page
// (built-in plans + any admin-created custom plans marked publicly visible)
export async function getPlans(req, res) {
  const plans = await getAllVisiblePlans();
  res.json({ plans });
}

// POST /api/billing/create-order  { plan: "starter" | "pro" | <custom plan key> }
export async function createPaymentOrder(req, res) {
  try {
    const { plan } = req.body;

    if (typeof plan !== "string" || !plan) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    if (plan === "free") {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const limits = await getPlanLimitsByKey(plan);
    if (!limits) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    // Built-in plans (free/starter/pro) have no isPubliclyVisible field and
    // are always self-purchasable. Custom DB plans default isPubliclyVisible
    // to false (see models/Plan.js) — those are admin-assign-only (e.g.
    // negotiated enterprise pricing) and must never be reachable via a
    // direct API call, even if someone guesses/leaks the plan key.
    if (limits.isPubliclyVisible === false) {
      return res.status(403).json({ error: "This plan isn't available for self-purchase. Contact us to get set up." });
    }

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

    const existing = await Subscription.findOne({ razorpayOrderId: razorpay_order_id, user: req.user._id });
    if (!existing) return res.status(404).json({ error: "Subscription record not found" });

    // Idempotency guard: if this order was already verified and activated
    // (retry, double-click, network resend), don't touch periodEnd again —
    // otherwise every duplicate call pushes it another 30 days out for free.
    // The Razorpay webhook backup path already had this guard; this brings
    // this endpoint in line with it.
    if (existing.status === "active") {
      return res.json({ success: true, plan: existing.plan });
    }

    const subscription = await Subscription.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, user: req.user._id, status: { $ne: "active" } },
      {
        razorpayPaymentId: razorpay_payment_id,
        status: "active", // was "paid" — analytics/overview and renewal checks query "active"
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      { new: true }
    );

    // Lost the race to a concurrent verify/webhook call — treat as success,
    // don't re-extend.
    if (!subscription) {
      const already = await Subscription.findOne({ razorpayOrderId: razorpay_order_id, user: req.user._id });
      return res.json({ success: true, plan: already?.plan ?? existing.plan });
    }

    await User.findByIdAndUpdate(req.user._id, {
      plan: subscription.plan,
      planRenewsAt: subscription.periodEnd,
    });

    if (req.user.emailPreferences?.billingReceipts !== false) sendEmailAsync(paymentReceiptEmail(req.user, subscription));

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

// POST /api/billing/cancel — stops the plan from continuing past the
// current period. Note: billing here uses one-time Razorpay Orders, not
// Razorpay's recurring Subscriptions API, so there's no actual auto-charge
// to cancel on Razorpay's side — this just marks intent and stops the
// renewal reminder / access after periodEnd. The expiry cron (see
// jobs/subscriptionExpiry.js) downgrades the account to Free once
// periodEnd passes.
export async function cancelSubscription(req, res) {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id, status: "active" }).sort({
      periodEnd: -1,
    });

    if (!subscription) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    subscription.autoRenew = false;
    subscription.cancelledAt = new Date();
    await subscription.save();

    if (req.user.emailPreferences?.billingReceipts !== false) sendEmailAsync(subscriptionCancelledEmail(req.user, subscription));

    res.json({
      success: true,
      message: `Your plan stays active until ${subscription.periodEnd.toLocaleDateString("en-IN")}, then moves to Free.`,
      accessUntil: subscription.periodEnd,
    });
  } catch (err) {
    console.error("Cancel subscription failed:", err.message);
    res.status(500).json({ error: "Could not cancel subscription. Please try again." });
  }
}

// GET /api/billing/history
export async function getBillingHistory(req, res) {
  const subscriptions = await Subscription.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ subscriptions });
}