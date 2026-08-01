import crypto from "crypto";

function base64UrlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64");
}

// Meta's deauthorize/data-deletion callbacks POST a single `signed_request`
// field: "<base64url signature>.<base64url JSON payload>", HMAC-SHA256
// signed with the App Secret over the payload segment. This verifies it and
// returns the decoded payload (contains `user_id`), or throws if invalid.
export function parseSignedRequest(signedRequest, appSecret) {
  if (!signedRequest || !signedRequest.includes(".")) {
    throw new Error("Malformed signed_request");
  }

  const [encodedSig, encodedPayload] = signedRequest.split(".");
  const sig = base64UrlDecode(encodedSig);
  const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8"));

  if (payload.algorithm !== "HMAC-SHA256") {
    throw new Error(`Unsupported signed_request algorithm: ${payload.algorithm}`);
  }

  const expectedSig = crypto.createHmac("sha256", appSecret).update(encodedPayload).digest();

  if (sig.length !== expectedSig.length || !crypto.timingSafeEqual(sig, expectedSig)) {
    throw new Error("signed_request signature mismatch");
  }

  return payload;
}
