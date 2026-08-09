// Strips MongoDB query-operator keys ($ne, $gt, $regex, $where, etc.) and
// dotted keys out of anything that came from the client, recursively.
//
// Without this, an object anywhere it's expected a plain value — e.g.
// `{ "plan": { "$ne": "xyz" } }` as the body of POST /billing/create-order —
// gets handed straight to Mongoose/MongoDB as a query filter fragment,
// letting the client control query logic instead of just supplying a value.
// This is the standard "NoSQL injection via req.body" class of bug for
// Express + Mongo apps that don't otherwise sanitize input.
//
// Applied globally in server.js, after the body parsers. Route handlers can
// still (and should) add their own `typeof x === "string"` checks for
// fields used directly in a query — this is defense-in-depth, not a
// replacement for validating shapes at the point of use.
function sanitizeValue(value) {
  if (Buffer.isBuffer(value)) return value; // raw webhook bodies (Razorpay) — never touch

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    const clean = {};
    for (const key of Object.keys(value)) {
      if (key.startsWith("$") || key.includes(".")) continue; // drop operator/dotted keys entirely
      clean[key] = sanitizeValue(value[key]);
    }
    return clean;
  }

  return value;
}

export function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === "object") req.body = sanitizeValue(req.body);
  if (req.query && typeof req.query === "object") {
    for (const key of Object.keys(req.query)) {
      req.query[key] = sanitizeValue(req.query[key]);
    }
  }
  if (req.params && typeof req.params === "object") {
    for (const key of Object.keys(req.params)) {
      req.params[key] = sanitizeValue(req.params[key]);
    }
  }
  next();
}
