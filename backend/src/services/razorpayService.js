import Razorpay from "razorpay";
import crypto from "crypto";

let razorpay = null;

// Initialize only if real keys exist
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
  console.log("⚠️ Razorpay disabled (Development Mode)");
}

export { razorpay };

export async function createOrder(amountInPaise, receipt) {
  if (!razorpay) {
    throw new Error("Razorpay is not configured.");
  }

  return razorpay.orders.create({
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