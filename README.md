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

# Commently — UI overhaul (this session's changes)

Extract this into your `commently/` repo root and overwrite the matching paths.
All paths below are relative to `frontend/`.

## New files
- `src/context/ThemeContext.jsx` — light/dark mode state, persisted in localStorage
- `src/components/ThemeToggle.jsx` — sun/moon toggle button
- `src/pages/legal/LegalLayout.jsx` — shared wrapper for legal pages
- `src/pages/legal/Terms.jsx`
- `src/pages/legal/PrivacyPolicy.jsx`
- `src/pages/legal/RefundPolicy.jsx`
- `public/robots.txt`
- `public/sitemap.xml`

## Rewritten files
- `tailwind.config.js` — new trust-blue palette, CSS-variable-driven for light/dark
- `src/index.css` — theme CSS variables (`:root` = dark, `.light` = light), fixed `.btn-primary`/`.input-field`
- `index.html` — new fonts (Instrument Sans / Manrope / IBM Plex Mono), SEO meta tags
- `src/App.jsx` — wrapped with `ThemeProvider` + `HelmetProvider`, added `/terms` `/privacy` `/refund-policy` routes
- `src/components/Sidebar.jsx` — responsive mobile drawer nav + theme toggle
- `src/components/AppLayout.jsx` — responsive spacing for the mobile top bar
- `src/components/Skeletons.jsx` — skeleton colors now read the live theme instead of being hardcoded
- `src/pages/Landing.jsx` — full rebuild
- `src/pages/Analytics.jsx` — only the `TrendChart` component changed (chart colors now theme-aware)
- `src/pages/Billing.jsx` — only the Razorpay checkout `theme.color` line changed (now `#2954ff`)

## After extracting
```bash
cd frontend
npm install    # picks up react-helmet-async (newly added)
npm run dev
```

## Two things to double check
1. **Domain placeholders**: `index.html`, `public/robots.txt`, and `public/sitemap.xml` all reference `commently.app` as a placeholder domain. Update these once you've picked/hosted on a real domain.
2. **Legal page emails**: Terms/Privacy/Refund pages reference `support@commently.app`, `privacy@commently.app`, `billing@commently.app`, `sales@commently.app` — swap these for real inboxes you'll actually monitor before launch. These pages are a solid first draft but haven't been reviewed by a lawyer — worth a quick pass before you're taking real payments from client accounts.


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
