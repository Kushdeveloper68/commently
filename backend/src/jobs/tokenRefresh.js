import cron from "node-cron";
import InstagramAccount from "../models/InstagramAccount.js";
import { refreshLongLivedToken } from "../services/instagramService.js";
import { encrypt, decrypt } from "../utils/crypto.js";

// Instagram long-lived tokens last 60 days and can only be refreshed once
// they're at least 24 hours old but not yet expired. We refresh anything
// expiring in the next 7 days, and run daily so no account slips through.
const REFRESH_WINDOW_DAYS = 7;

export async function refreshExpiringTokens() {
  const cutoff = new Date(Date.now() + REFRESH_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const accounts = await InstagramAccount.find({
    isActive: true,
    tokenExpiresAt: { $lte: cutoff },
  }).select("+accessTokenEncrypted");

  if (accounts.length === 0) {
    console.log("🔄 Token refresh: nothing due");
    return;
  }

  console.log(`🔄 Token refresh: ${accounts.length} account(s) due`);

  for (const account of accounts) {
    try {
      const currentToken = decrypt(account.accessTokenEncrypted);
      const refreshed = await refreshLongLivedToken(currentToken);

      account.accessTokenEncrypted = encrypt(refreshed.access_token);
      account.tokenExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
      account.lastRefreshedAt = new Date();
      account.needsReconnect = false;
      await account.save();

      console.log(`✅ Refreshed token for ${account.username} (${account.igBusinessId})`);
    } catch (err) {
      const meta = err.response?.data?.error;
      console.error(
        `❌ Refresh failed for ${account.username} (${account.igBusinessId}):`,
        meta || err.message,
      );

      // Instagram rejects refreshing a token that's less than 24h old — that's
      // not a real problem, just try again on tomorrow's run. Anything else
      // (revoked access, invalid token, etc.) genuinely needs a reconnect.
      const tooYoung = meta?.message?.toLowerCase().includes("24 hours");
      if (!tooYoung) {
        account.needsReconnect = true;
        await account.save();
      }
    }
  }
}

// Runs once a day at 3:00 AM server time. Cheap and safe to run more often
// if you want, since accounts outside the window are skipped anyway.
export function startTokenRefreshCron() {
  cron.schedule("0 3 * * *", () => {
    console.log("⏰ Running scheduled token refresh...");
    refreshExpiringTokens().catch((err) =>
      console.error("Token refresh job crashed:", err),
    );
  });

  console.log("🕒 Token refresh cron scheduled (daily @ 3:00 AM)");
}