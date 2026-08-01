import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { enforceInstagramAccountLimit } from "../middleware/planLimit.js";
import {
  initiateConnect,
  handleCallback,
  listAccounts,
  disconnectAccount,
  handleDeauthorize,
  handleDataDeletionRequest,
  dataDeletionStatus,
} from "../controllers/instagramController.js";
import { listMedia } from "../controllers/mediaController.js";

const router = express.Router();

router.get("/connect", requireAuth, enforceInstagramAccountLimit, initiateConnect);
router.get("/callback", handleCallback); // Meta redirects here directly, no auth header available
router.get("/accounts", requireAuth, listAccounts);
router.delete("/accounts/:id", requireAuth, disconnectAccount);
router.get("/accounts/:id/media", requireAuth, listMedia);

// Called directly by Meta, not the frontend — no auth header available
router.post("/deauthorize", handleDeauthorize);
router.post("/data-deletion", handleDataDeletionRequest);
router.get("/data-deletion-status", dataDeletionStatus);

export default router;
