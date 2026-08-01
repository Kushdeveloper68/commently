import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowRight, MessageSquare, CircleDot, Send, Users, Lock, Zap, BarChart3,
  Check, ChevronDown, Instagram, ShieldCheck, Sparkles, Menu, X,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle.jsx";

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg overflow-x-hidden">
      <Helmet>
        <title>Commently — Turn Instagram Comments Into DMs, Automatically</title>
        <meta name="description" content="Commently turns Instagram comments, Story replies, and DMs into automatic, on-brand conversations — so every 'link please?' gets an instant reply, even while you sleep." />
      </Helmet>

      <Nav />
      <Hero />
      <TrustBar />
      <Features />
      <WhyDifferent />
      <ComingSoon />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  );
}

// ── Nav ──────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all ${
        scrolled ? "bg-bg/80 backdrop-blur-md border-b border-border" : "border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-xl font-bold tracking-tight flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-gold flex items-center justify-center text-white">
            <MessageSquare size={15} />
          </span>
          Commently
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted hover:text-ink transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className="text-sm font-medium text-muted hover:text-ink transition-colors px-3 py-2">
            Log in
          </Link>
          <Link to="/login" className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5">
            Start free <ArrowRight size={15} />
          </Link>
        </div>

        <button className="md:hidden text-muted" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-bg px-5 py-4 space-y-3">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-muted py-1">
              {l.label}
            </a>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <Link to="/login" className="flex-1 btn-secondary text-sm text-center">Log in</Link>
            <Link to="/login" className="flex-1 btn-primary text-sm text-center">Start free</Link>
          </div>
        </div>
      )}
    </header>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-24">
      <div className="grid md:grid-cols-2 gap-12 md:gap-8 items-center">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-bright bg-gold/10 px-3 py-1.5 rounded-full mb-5">
            <Sparkles size={13} /> Built on Meta's official Instagram API
          </div>
          <h1 className="font-display text-[2.5rem] sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight leading-[1.08]">
            Turn every comment into a conversation
          </h1>
          <p className="text-lg text-muted mt-5 max-w-md leading-relaxed">
            Commently replies to comments, Story replies, and DMs the moment they happen —
            with the right message, to the right person, without you touching your phone.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link to="/login" className="btn-primary flex items-center justify-center gap-2 text-[15px] px-6 py-3">
              Start free <ArrowRight size={17} />
            </Link>
            <a href="#features" className="btn-secondary flex items-center justify-center gap-2 text-[15px] px-6 py-3">
              See how it works
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-7 text-sm text-muted">
            <span className="flex items-center gap-1.5"><Check size={15} className="text-mint" /> No credit card to start</span>
            <span className="flex items-center gap-1.5"><Check size={15} className="text-mint" /> Cancel anytime</span>
          </div>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          <CommentToDmDemo />
        </div>
      </div>
    </section>
  );
}

// Signature element: a self-playing loop showing the product's core
// mechanic — a comment arrives, Commently catches the keyword, and a DM
// goes out — instead of a generic dashboard screenshot or stock photo.
function CommentToDmDemo() {
  const [step, setStep] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const steps = [0, 1, 2, 3];
    let i = 0;
    timerRef.current = setInterval(() => {
      i = (i + 1) % (steps.length + 1); // +1 for a pause on the final state
      setStep(steps[i] ?? 3);
    }, 1600);
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <div className="relative mx-auto max-w-sm">
      <div className="absolute -inset-6 bg-gold/10 blur-3xl rounded-full -z-10" aria-hidden="true" />
      <div className="bg-panel border border-border rounded-2xl shadow-lifted p-5 sm:p-6">
        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-border">
          <Instagram size={16} className="text-muted" />
          <span className="text-sm font-medium text-muted">Live automation</span>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-mint font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" /> Active
          </span>
        </div>

        {/* Incoming comment */}
        <div className={`flex gap-2.5 mb-3 transition-opacity duration-300 ${step >= 0 ? "opacity-100" : "opacity-0"}`}>
          <div className="w-8 h-8 rounded-full bg-panel2 flex items-center justify-center text-xs font-semibold text-muted shrink-0">
            SP
          </div>
          <div className="bg-panel2 rounded-2xl rounded-tl-sm px-3.5 py-2 text-sm animate-bubble-in">
            {step >= 0 && (
              <>
                Loved this reel!{" "}
                <span className={step >= 1 ? "bg-gold/25 text-gold-bright rounded px-0.5 transition-colors duration-300" : ""}>
                  link please 🙏
                </span>
              </>
            )}
          </div>
        </div>

        {/* Keyword matched indicator */}
        <div className={`flex items-center gap-2 text-xs text-gold-bright font-medium mb-3 pl-10 transition-all duration-300 ${step >= 1 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}>
          <Zap size={12} /> Matched keyword "link" → automation triggered
        </div>

        {/* Outgoing DM */}
        <div className={`flex justify-end mb-2 transition-all duration-300 ${step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          <div className="bg-gold text-white rounded-2xl rounded-br-sm px-3.5 py-2 text-sm max-w-[80%] animate-bubble-in">
            Hey! Here's the link 👉 commently.app/demo
          </div>
        </div>

        <div className={`flex justify-end transition-all duration-300 ${step >= 3 ? "opacity-100" : "opacity-0"}`}>
          <span className="flex items-center gap-1 text-xs text-mint font-medium">
            <Check size={13} /> Delivered in 0.4s
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Trust bar ────────────────────────────────────────────────────────────

function TrustBar() {
  const items = [
    { icon: ShieldCheck, label: "Meta-verified API access" },
    { icon: Lock, label: "Tokens encrypted at rest" },
    { icon: Users, label: "Built by an agency, for agencies" },
  ];
  return (
    <section className="border-y border-border bg-panel/40">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-sm text-muted">
            <Icon size={16} className="text-gold-bright" /> {label}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Features ─────────────────────────────────────────────────────────────

function Features() {
  const features = [
    { icon: MessageSquare, title: "Comment automation", body: "Reply publicly and privately when a comment matches your keywords — on any post, or one you pick." },
    { icon: CircleDot, title: "Story-reply automation", body: "Someone replies to your Story? They get an instant DM back, no manual checking required." },
    { icon: Send, title: "DM automation", body: "Auto-reply to direct messages sent straight to your account, keyword by keyword." },
    { icon: Lock, title: "Follow-gated replies", body: "Ask people to follow before you hand over the link — Commently checks, then releases the message." },
    { icon: BarChart3, title: "Analytics & leads", body: "See exactly which keywords convert, who engaged, and how many DMs went out — in one dashboard." },
    { icon: Users, title: "Multi-account", body: "Run automations across multiple Instagram accounts from a single login — built for agencies." },
  ];

  return (
    <section id="features" className="max-w-6xl mx-auto px-5 sm:px-6 py-20 sm:py-28">
      <div className="max-w-xl mb-14">
        <div className="text-xs font-semibold text-gold-bright uppercase tracking-wide mb-3">What Commently does</div>
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          Everything that happens after someone comments
        </h2>
        <p className="text-muted mt-4 text-[15px] leading-relaxed">
          One rule, set once: when this happens, send that. Commently handles the rest.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map(({ icon: Icon, title, body }) => (
          <div key={title} className="card hover:border-gold/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center mb-4">
              <Icon size={18} className="text-gold-bright" />
            </div>
            <h3 className="font-semibold text-[15px] mb-1.5">{title}</h3>
            <p className="text-sm text-muted leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Why different ────────────────────────────────────────────────────────

function WhyDifferent() {
  const points = [
    { title: "Priced for India", body: "Plans start at ₹399/month — built for creators and small agencies, not enterprise budgets." },
    { title: "You own the data", body: "Every comment, reply, and lead lives in your dashboard. Export or delete it whenever you want." },
    { title: "No black-box AI", body: "Automations run on rules you write and can read back — you always know why a message was sent." },
    { title: "Built by operators", body: "We run our own agency on Instagram. Commently is the tool we needed and couldn't find." },
  ];
  return (
    <section className="bg-panel/40 border-y border-border">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-20 sm:py-24">
        <div className="max-w-xl mb-14">
          <div className="text-xs font-semibold text-gold-bright uppercase tracking-wide mb-3">Why Commently</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Built differently, on purpose</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8">
          {points.map((p) => (
            <div key={p.title} className="flex gap-4">
              <Check size={18} className="text-mint shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[15px] mb-1">{p.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Coming soon ──────────────────────────────────────────────────────────

function ComingSoon() {
  const upcoming = [
    { title: "AI-powered dynamic replies", body: "Automations that write context-aware responses instead of a fixed template." },
    { title: "Team seats", body: "Invite teammates or clients to manage automations without sharing logins." },
    { title: "Zapier & webhook exports", body: "Push every lead straight into your CRM or spreadsheet as it comes in." },
  ];
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-6 py-20 sm:py-24">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <div className="text-xs font-semibold text-gold-bright uppercase tracking-wide mb-3">On the roadmap</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">What's coming next</h2>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-5">
        {upcoming.map((u) => (
          <div key={u.title} className="border border-dashed border-border rounded-xl2 p-6">
            <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Coming soon</div>
            <h3 className="font-semibold text-[15px] mb-1.5">{u.title}</h3>
            <p className="text-sm text-muted leading-relaxed">{u.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Pricing ──────────────────────────────────────────────────────────────

function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      tagline: "Try it on one account",
      cta: "Start free",
      features: ["1 Instagram account", "1 automation", "50 DMs / month", "Comment automation only"],
      highlight: false,
    },
    {
      name: "Starter",
      price: "₹399",
      period: "/month",
      tagline: "For active creators",
      cta: "Start free trial",
      features: ["1 Instagram account", "5 automations", "2,000 DMs / month", "Public replies + follow-gating", "Story-reply & DM automation"],
      highlight: true,
      badge: "Most popular",
    },
    {
      name: "Pro",
      price: "₹899",
      period: "/month",
      tagline: "For agencies & multi-account",
      cta: "Start free trial",
      features: ["5 Instagram accounts", "50 automations", "20,000 DMs / month", "Everything in Starter", "Analytics & leads dashboard"],
      highlight: false,
      badge: "Best value per DM",
    },
  ];

  return (
    <section id="pricing" className="max-w-6xl mx-auto px-5 sm:px-6 py-20 sm:py-28">
      <div className="text-center max-w-xl mx-auto mb-14">
        <div className="text-xs font-semibold text-gold-bright uppercase tracking-wide mb-3">Pricing</div>
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Simple plans, no surprises</h2>
        <p className="text-muted mt-4 text-[15px]">
          Every plan includes a monthly DM limit — automations pause (not delete) if you hit it, so nothing's lost.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl p-7 relative flex flex-col h-full ${
              plan.highlight
                ? "bg-panel border-2 border-gold shadow-lifted md:-translate-y-3"
                : "bg-panel border border-border"
            }`}
          >
            {plan.badge && (
              <div
                className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
                  plan.highlight ? "bg-gold text-white" : "bg-mint/15 text-mint"
                }`}
              >
                {plan.badge}
              </div>
            )}
            <h3 className="font-semibold text-lg">{plan.name}</h3>
            <p className="text-sm text-muted mt-1">{plan.tagline}</p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold">{plan.price}</span>
              <span className="text-sm text-muted">{plan.period}</span>
            </div>

            <ul className="mt-6 space-y-2.5 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check size={16} className="text-mint shrink-0 mt-0.5" />
                  <span className="text-ink/90">{f}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/login"
              className={`mt-7 text-center text-sm font-semibold px-5 py-3 rounded-lg transition-colors ${
                plan.highlight
                  ? "bg-gold text-white hover:bg-gold-bright"
                  : "border border-border text-ink hover:border-gold hover:text-gold-bright"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-muted mt-10">
        Need more than 5 accounts or 20,000 DMs/month?{" "}
        <a href="mailto:sales@commently.app" className="text-gold-bright hover:underline">Talk to us</a> about a custom plan.
      </p>
    </section>
  );
}

// ── FAQ ──────────────────────────────────────────────────────────────────

function Faq() {
  const items = [
    { q: "Is this against Instagram's rules?", a: "No. Commently connects through Meta's official Instagram API — the same one used by tools like ManyChat. You authorize access, and you can revoke it anytime from your dashboard or Instagram settings." },
    { q: "Do I need a Business or Creator account?", a: "Yes — Instagram's automation API only works with Business or Creator accounts. Switching is free and takes about 30 seconds in the Instagram app." },
    { q: "What happens if I hit my monthly DM limit?", a: "Automations pause until your next billing cycle, or you can upgrade instantly to keep them running. No messages are lost or queued incorrectly — they simply stop firing until the limit resets." },
    { q: "Can I cancel anytime?", a: "Yes, from Billing → Manage Subscription. You keep access through the end of your current billing period, no questions asked." },
    { q: "Is my Instagram access token safe?", a: "Yes — tokens are encrypted at rest (AES-256) and are never visible in plain text, including to our own team. See our Privacy Policy for details." },
  ];
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="max-w-3xl mx-auto px-5 sm:px-6 py-20 sm:py-28">
      <div className="text-center mb-12">
        <div className="text-xs font-semibold text-gold-bright uppercase tracking-wide mb-3">FAQ</div>
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Questions, answered</h2>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.q} className="border border-border rounded-xl2 overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? -1 : i)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-medium text-[15px]">{item.q}</span>
              <ChevronDown
                size={18}
                className={`text-muted shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`}
              />
            </button>
            {open === i && <p className="px-5 pb-4 text-sm text-muted leading-relaxed">{item.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Final CTA ────────────────────────────────────────────────────────────

function FinalCta() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-6 pb-24">
      <div className="bg-gold rounded-3xl px-8 py-14 sm:py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 0%, transparent 40%)" }} aria-hidden="true" />
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight relative">
          Stop replying to the same comment twice
        </h2>
        <p className="text-white/85 mt-4 max-w-md mx-auto relative">
          Set it up in under 5 minutes. Your first 50 DMs a month are free.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 bg-white text-brand-deep font-semibold px-7 py-3.5 rounded-lg mt-8 hover:opacity-90 transition-opacity relative"
        >
          Start free <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-12 grid sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="font-display text-lg font-bold mb-2">Commently</div>
          <p className="text-sm text-muted leading-relaxed">Instagram automation for creators and agencies.</p>
        </div>
        <div>
          <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Product</div>
          <div className="space-y-2 text-sm">
            <a href="#features" className="block text-muted hover:text-ink transition-colors">Features</a>
            <a href="#pricing" className="block text-muted hover:text-ink transition-colors">Pricing</a>
            <a href="#faq" className="block text-muted hover:text-ink transition-colors">FAQ</a>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Legal</div>
          <div className="space-y-2 text-sm">
            <Link to="/terms" className="block text-muted hover:text-ink transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="block text-muted hover:text-ink transition-colors">Privacy Policy</Link>
            <Link to="/refund-policy" className="block text-muted hover:text-ink transition-colors">Refund Policy</Link>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Contact</div>
          <div className="space-y-2 text-sm text-muted">
            <p>support@commently.app</p>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-5 text-xs text-muted">
          © 2026 Commently. Not affiliated with or endorsed by Meta or Instagram.
        </div>
      </div>
    </footer>
  );
}
