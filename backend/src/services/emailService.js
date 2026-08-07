import nodemailer from "nodemailer";

let transporter = null;
let attempted = false;

// Lazily built, same reasoning as razorpayService.js — dotenv.config() runs
// after ES module imports resolve, so building this at module load time
// would race against env vars being populated.
function getTransporter() {
  if (transporter || attempted) return transporter;
  attempted = true;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("⚠️ Email disabled (SMTP not configured — set SMTP_HOST/SMTP_USER/SMTP_PASS)");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  console.log("✅ Email transporter configured");
  return transporter;
}

// Fire-and-forget: schedules the send on the next tick and returns
// immediately. NEVER await this from a request handler or webhook path —
// that's the whole point of using it, so a slow/down SMTP server can't add
// latency to comment/DM processing. Failures are logged, not thrown.
export function sendEmailAsync({ to, subject, html }) {
  if (!to) return;

  setImmediate(async () => {
    try {
      const t = getTransporter();
      if (!t) return;

      await t.sendMail({
        from: process.env.EMAIL_FROM || '"DMLoop" <no-reply@dmloop.app>',
        to,
        subject,
        html,
      });
      console.log(`✉️  Sent "${subject}" → ${to}`);
    } catch (err) {
      console.error(`✉️  Failed "${subject}" → ${to}:`, err.message);
    }
  });
}
