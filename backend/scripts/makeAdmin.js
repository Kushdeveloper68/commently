// One-time bootstrap: promotes an existing account to admin.
// Run manually from the backend folder: node scripts/makeAdmin.js your@email.com
// Deliberately NOT an API endpoint — granting admin access must never be
// reachable over HTTP, even behind auth, to avoid it ever becoming an
// attack surface.
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../src/models/User.js";

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/makeAdmin.js your@email.com");
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { role: "admin" },
    { new: true },
  );

  if (!user) {
    console.error(`No user found with email: ${email}`);
  } else {
    console.log(`✅ ${user.email} is now an admin.`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
