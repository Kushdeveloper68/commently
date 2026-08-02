dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import * as Sentry from "@sentry/node";

import { connectDB } from "./config/db.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { startTokenRefreshCron } from "./jobs/tokenRefresh.js";
import { startSubscriptionExpiryCron } from "./jobs/subscriptionExpiry.js";
import { startUsageResetCron } from "./jobs/usageReset.js";

import authRoutes from "./routes/authRoutes.js";
import instagramRoutes from "./routes/instagramRoutes.js";
import automationRoutes from "./routes/automationRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import { handleRazorpayWebhook } from "./controllers/paymentController.js";

const app = express();

// Error monitoring — no-ops harmlessly if SENTRY_DSN isn't set, so this is
// safe to leave in even before you've created a Sentry project.
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV, tracesSampleRate: 0.1 });
  console.log("✅ Sentry error monitoring active");
} else {
  console.log("⚠️ Sentry disabled (SENTRY_DSN not set)");
}

// --- Security & infra middleware ---
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://diminish-stipend-harmonize.ngrok-free.dev",
    credentials: true,
  })
);

// Razorpay webhook needs the raw body for signature verification —
// must be mounted BEFORE express.json() so the body isn't pre-parsed
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), handleRazorpayWebhook);

// Instagram webhook: also needs the raw bytes to verify Meta's
// X-Hub-Signature-256 header (see middleware/verifyMetaSignature.js).
// express.json()'s `verify` hook lets us capture the raw buffer while still
// getting a normally-parsed req.body — must be mounted before the generic
// express.json() below, same reasoning as the Razorpay line above.
app.use(
  "/api/webhook/instagram",
  express.json({ verify: (req, res, buf) => { req.rawBody = buf; } })
);

app.use(express.json());
app.use(cookieParser());
// Meta's deauthorize/data-deletion callbacks POST as form-encoded, not JSON
app.use(express.urlencoded({ extended: true }));

// Basic rate limiting on auth endpoints to slow down brute-force attempts
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
app.use("/api/auth", authLimiter);

// --- Routes ---
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

app.use("/api/auth", authRoutes);
app.use("/api/instagram", instagramRoutes);
app.use("/api/automations", automationRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/billing", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFoundHandler);
if (process.env.SENTRY_DSN) Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Commently backend running on port ${PORT}`);
  });
  startTokenRefreshCron();
  startSubscriptionExpiryCron();
  startUsageResetCron();
});
