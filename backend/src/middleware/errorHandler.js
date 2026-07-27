export function errorHandler(err, req, res, next) {
  console.error("Unhandled error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: "Duplicate entry" });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Something went wrong" : err.message,
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: "Route not found" });
}
