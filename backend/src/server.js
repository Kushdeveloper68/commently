import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import { connectDB } from "./config/db.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import instagramRoutes from "./routes/instagramRoutes.js";
import automationRoutes from "./routes/automationRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { handleRazorpayWebhook } from "./controllers/paymentController.js";

dotenv.config();

const app = express();

// --- Security & infra middleware ---
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Razorpay webhook needs the raw body for signature verification —
// must be mounted BEFORE express.json() so the body isn't pre-parsed
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), handleRazorpayWebhook);

app.use(express.json());
app.use(cookieParser());

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

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Commently backend running on port ${PORT}`);
  });
});
