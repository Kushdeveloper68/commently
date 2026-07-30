import Razorpay from "razorpay";
import crypto from "crypto";

let razorpay = null;
let attempted = false;

// Lazily construct the client on first actual use, not at module load time.
// ES Modules resolve every `import` chain (server.js -> paymentRoutes ->
// paymentController -> this file) BEFORE any regular code runs — including
// dotenv.config() at the top of server.js, even though it's textually first.
// Initializing Razorpay at module top-level meant process.env.RAZORPAY_KEY_ID
// was always undefined at that point. Deferring the check until createOrder()
// is actually called (well after the server has started) sidesteps this.
function getClient() {
  if (razorpay || attempted) return razorpay;
  attempted = true;

  if (
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    !process.env.RAZORPAY_KEY_ID.startsWith("your_")
  ) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log("✅ Razorpay initialized");
  } else {
    console.log("⚠️ Razorpay disabled (missing/placeholder keys)");
  }

  return razorpay;
}

export async function createOrder(amountInPaise, receipt) {
  const client = getClient();
  if (!client) {
    throw new Error("Razorpay is not configured.");
  }

  return client.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt,
  });
}

export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!process.env.RAZORPAY_KEY_SECRET) return false;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expected === signature;
}

export function verifyWebhookSignature(rawBody, signature) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) return false;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return expected === signature;
}