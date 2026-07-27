import InstagramAccount from "../models/InstagramAccount.js";
import { decrypt } from "../utils/crypto.js";
import { getRecentMedia } from "../services/instagramService.js";

// GET /api/instagram/accounts/:id/media
export async function listMedia(req, res) {
  const account = await InstagramAccount.findOne({
    _id: req.params.id,
    user: req.user._id,
    isActive: true,
  }).select("+accessTokenEncrypted");

  if (!account) return res.status(404).json({ error: "Instagram account not found" });

  try {
    const token = decrypt(account.accessTokenEncrypted);
    const media = await getRecentMedia(token, account.igBusinessId);
    res.json({ media });
  } catch (err) {
    console.error("Media fetch error:", err.response?.data || err.message);
    res.status(502).json({ error: "Failed to fetch media from Instagram" });
  }
}
