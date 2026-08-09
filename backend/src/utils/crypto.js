import crypto from "crypto";

// AES-256-GCM encryption for sensitive tokens at rest (e.g. Instagram access tokens).
const ALGORITHM = "aes-256-gcm";

let warnedAboutFallback = false;

function getKey() {
  // Prefer a dedicated encryption key so rotating JWT_SECRET (e.g. to force
  // logout everyone) doesn't also silently turn every stored Instagram token
  // undecryptable. Falling back to JWT_SECRET keeps existing deployments
  // that only ever set that var working without a data migration.
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;

  if (!secret) {
    // No hardcoded fallback anymore — a missing secret used to silently
    // encrypt every Instagram access token with a fixed, publicly-known
    // string ("fallback_dev_secret_change_me"), which is effectively no
    // encryption at all if that ever shipped to production by accident.
    throw new Error(
      "ENCRYPTION_KEY (or JWT_SECRET as a fallback) must be set in the environment — refusing to encrypt/decrypt sensitive tokens without a real secret.",
    );
  }

  if (!process.env.ENCRYPTION_KEY && !warnedAboutFallback) {
    warnedAboutFallback = true;
    console.warn(
      "⚠️ ENCRYPTION_KEY is not set — deriving the token-encryption key from JWT_SECRET instead. Set a dedicated ENCRYPTION_KEY in production so the two concerns don't share a key.",
    );
  }

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