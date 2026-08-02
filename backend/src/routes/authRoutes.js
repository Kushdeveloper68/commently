import express from "express";
import { googleLogin, refreshToken, logout, getMe, deleteAccount, updateProfile, updateNotificationPreferences } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/google", googleLogin);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);
router.patch("/profile", requireAuth, updateProfile);
router.patch("/notification-preferences", requireAuth, updateNotificationPreferences);
router.delete("/account", requireAuth, deleteAccount);

export default router;
