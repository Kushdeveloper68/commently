import crypto from "crypto";

// AES-256-GCM encryption for sensitive tokens at rest (e.g. Instagram access tokens).
// JWT_SECRET is reused here as the encryption key source — in production, use a
// dedicated 32-byte ENCRYPTION_KEY env var instead for cleaner separation.
const ALGORITHM = "aes-256-gcm";

function getKey() {
  const secret = process.env.JWT_SECRET || "fallback_dev_secret_change_me";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decrypt(payload) {
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
