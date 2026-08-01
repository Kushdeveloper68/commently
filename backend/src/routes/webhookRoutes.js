import express from "express";
import { verifyWebhook, handleWebhook } from "../controllers/webhookController.js";
import { verifyMetaSignature } from "../middleware/verifyMetaSignature.js";

const router = express.Router();

router.get("/instagram", verifyWebhook);
router.post("/instagram", verifyMetaSignature, handleWebhook);

export default router;
