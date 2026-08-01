import crypto from "crypto";

// Every real webhook from Meta includes X-Hub-Signature-256, an HMAC-SHA256
// of the raw request body signed with our App Secret. Without this check,
// anyone who finds the webhook URL (it's not a secret — it's public in the
// Meta App Dashboard config) could POST fake comment/DM/postback events and
// trigger real automations — burning DM quota and sending unwanted messages
// on a connected account's behalf.
//
// Requires req.rawBody to be populated — see server.js, where express.json()
// is mounted for this route with a `verify` callback that captures it.
export function verifyMetaSignature(req, res, next) {
  const signature = req.headers["x-hub-signature-256"];

  if (!signature || !req.rawBody) {
    console.warn("⚠️ Webhook rejected: missing signature or raw body");
    return res.sendStatus(401);
  }

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", process.env.META_APP_SECRET).update(req.rawBody).digest("hex");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    console.warn("⚠️ Webhook rejected: signature mismatch");
    return res.sendStatus(401);
  }

  next();
}
