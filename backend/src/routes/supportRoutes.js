import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { submitMessage } from "../controllers/supportController.js";

const router = express.Router();

router.post("/message", requireAuth, submitMessage);

export default router;
