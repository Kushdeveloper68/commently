import SupportMessage from "../models/SupportMessage.js";

// POST /api/support/message — submits a support request or feedback,
// always tied to the logged-in user (the Help page lives behind auth).
export async function submitMessage(req, res) {
  const { type, subject, message, rating } = req.body;

  if (!["support", "feedback"].includes(type)) {
    return res.status(400).json({ error: "type must be 'support' or 'feedback'" });
  }
  if (!subject?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "Subject and message are required" });
  }

  const doc = await SupportMessage.create({
    user: req.user._id,
    name: req.user.name,
    email: req.user.email,
    type,
    subject: subject.trim(),
    message: message.trim(),
    rating: type === "feedback" ? rating : undefined,
  });

  res.status(201).json({ success: true, id: doc._id });
}
