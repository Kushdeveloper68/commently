# Commently — Instagram Comment-to-DM Automation SaaS

A ManyChat-style platform: users connect their Instagram Business account, set up
comment-to-DM automations with keyword matching, public replies, and follow-gating,
and manage billing via Razorpay.

## Project structure

```
commently/
├── backend/     Node.js + Express + MongoDB API
└── frontend/    React + Vite + Tailwind CSS
```

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in: MONGODB_URI, JWT secrets, GOOGLE_CLIENT_ID, META_APP_ID/SECRET, RAZORPAY keys
npm run dev
```

Runs on `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Fill in: VITE_GOOGLE_CLIENT_ID (same as backend's GOOGLE_CLIENT_ID)
npm run dev
```

Runs on `http://localhost:5173`.

## What's built so far

**Backend:**
- Google OAuth login + JWT auth (access + refresh tokens, httpOnly cookies)
- Instagram Business Login OAuth flow (multi-tenant — each user connects their own IG account)
- Automation CRUD (keyword matching, public reply, follow-gate, DM message + button)
- Webhook engine — receives real Instagram comment events, matches automations, sends private replies
- Razorpay billing (order creation, payment verification, webhook handler)
- Plan limits (Free / Starter / Pro) centrally defined and enforced
- Security: encrypted token storage, rate limiting, Helmet, CORS

**Frontend:**
- Landing page, Google Sign-In login
- Dashboard with stats
- Instagram account connection flow
- Automations list (toggle live/paused, delete)
- Automation Builder — guided step-by-step flow with **live phone preview** (mirrors ManyChat's UX)
- Profile page
- Billing page with Razorpay Checkout integration

## Still to configure/build (next steps)

1. **Meta App setup** — create/reuse your Meta Developer App, get `META_APP_ID` / `META_APP_SECRET`,
   set the webhook callback URL to `https://your-backend-domain.com/api/webhook/instagram`
2. **Google OAuth** — create credentials at console.cloud.google.com, add your frontend
   domain to authorized origins
3. **Razorpay** — get API keys from the Razorpay dashboard, set up webhook endpoint
4. **MongoDB Atlas** — create a free cluster, whitelist your server's IP, get connection string
5. **Deploy** — backend to Render/Railway, frontend to Vercel/Netlify
6. **Cron job** — for refreshing Instagram long-lived tokens before they expire (60-day cycle)
7. **Monthly usage reset** — a scheduled job to reset `dmsSentThisMonth` to 0 each billing cycle
8. **Public reply toggle in webhook** — already wired in `webhookController.js`, verify end-to-end

## Notes

- No `node_modules` included — run `npm install` in both `backend/` and `frontend/` yourself
- All secrets are placeholders in `.env.example` — never commit real `.env` files
