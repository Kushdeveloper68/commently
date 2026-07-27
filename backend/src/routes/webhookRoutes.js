import express from "express";
import { verifyWebhook, handleWebhook } from "../controllers/webhookController.js";

const router = express.Router();

router.get("/instagram", verifyWebhook);
router.post("/instagram", handleWebhook);

export default router;
