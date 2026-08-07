import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Zap, PlayCircle, Bot, Key, MessageSquare, BarChart3, Globe, AtSign, Share2,
  Heart, Check, ChevronDown, ShieldCheck, Lock, Users,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="bg-background text-on-surface min-h-screen selection:bg-primary selection:text-white overflow-x-hidden">
      <Helmet>
        <title>DMLoop | Industrial-Grade Instagram Automation</title>
        <meta name="description" content="Trigger auto-replies and DMs based on Instagram comments, Story replies, and DMs. Move from manual engagement to 24/7 conversion." />
      </Helmet>

      <Header />
      <main className="max-w-[1200px] mx-auto px-gutter">
        <Hero />
        <TrustBar />
        <Features />
        <HowItWorks />
        <Pricing />
        <WhyDifferent />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="flex justify-between items-center px-gutter w-full sticky top-0 z-50 bg-background/80 backdrop-blur-md h-16 border-b border-outline-variant">
      <div className="max-w-[1200px] w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="text-h2 font-black tracking-tighter">DMLoop</span>
          <nav className="hidden md:flex items-center gap-6">
            <a className="text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#features">Features</a>
            <a className="text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#pricing">Pricing</a>
            <a className="text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#faq">FAQ</a>
          </nav>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <Link className="text-label-sm text-on-surface-variant hover:text-white transition-colors px-4 py-2" to="/login">Login</Link>
          <Link to="/login" className="bg-primary text-white text-label-sm px-5 py-2.5 rounded-lg font-semibold hover:brightness-110 active:scale-95 transition-all">
            Get Started
          </Link>
        </div>
        <button className="sm:hidden text-on-surface-variant" onClick={() => setOpen((o) => !o)}>
          <ChevronDown className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="sm:hidden absolute top-16 left-0 right-0 bg-surface border-b border-outline-variant p-4 flex flex-col gap-3">
          <a href="#features" onClick={() => setOpen(false)} className="text-sm text-on-surface-variant">Features</a>
          <a href="#pricing" onClick={() => setOpen(false)} className="text-sm text-on-surface-variant">Pricing</a>
          <Link to="/login" className="btn-secondary text-center text-sm">Login</Link>
          <Link to="/login" className="btn-primary text-center text-sm">Get Started</Link>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="grid md:grid-cols-12 gap-stack-lg items-center pt-16 sm:pt-24 pb-section-gap">
      <div className="md:col-span-6 space-y-stack-lg">
        <div className="space-y-stack-md">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container/30 border border-outline-variant text-primary text-label-sm">
            <Zap size={13} className="mr-2" />
            Built on Meta's official Instagram API
          </span>
          <h1 className="text-[40px] sm:text-[56px] md:text-display-xl tracking-tighter leading-[1.05] font-bold">
            Automate Instagram engagement with DMLoop.
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-lg">
            Trigger auto-replies and DMs from comments, Story replies, and DMs. Move from manual engagement to 24/7 conversion.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link to="/login" className="bg-primary text-white text-body-md px-8 py-4 rounded-lg font-bold hover:brightness-110 transition-all active:scale-95 text-center">
            Get Started — It's Free
          </Link>
          <a href="#how" className="bg-surface-container-high border border-outline-variant text-white text-body-md px-8 py-4 rounded-lg font-bold hover:bg-surface-container-highest transition-all active:scale-95 flex items-center justify-center gap-2">
            <PlayCircle size={19} />
            See how it works
          </a>
        </div>
      </div>

      <div className="md:col-span-6 relative mt-12 md:mt-0">
        <div className="absolute -inset-4 bg-primary/10 blur-[120px] rounded-full" aria-hidden="true" />
        <div className="relative glass-card rounded-2xl p-6 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center">
                <Bot size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-none">IG Workflow</p>
                <p className="text-[10px] text-on-surface-variant">Active automation</p>
              </div>
            </div>
            <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-1 rounded border border-primary/30">LIVE</span>
          </div>

          <div className="space-y-6">
            <div className="bg-surface-container rounded-lg p-4 border-l-4 border-primary">
              <p className="font-mono text-xs text-on-surface-variant mb-1 uppercase tracking-widest">Trigger</p>
              <p className="text-white font-medium">Comment contains "link"</p>
            </div>
            <div className="flex justify-center -my-2 relative z-10">
              <div className="w-px h-8 bg-gradient-to-b from-primary to-transparent" />
            </div>
            <div className="bg-surface-container rounded-lg p-4 border-l-4 border-primary">
              <p className="font-mono text-xs text-on-surface-variant mb-1 uppercase tracking-widest">Action</p>
              <p className="text-white font-medium">Send DM with the link</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    { icon: ShieldCheck, label: "Meta-verified API access" },
    { icon: Lock, label: "Tokens encrypted at rest" },
    { icon: Users, label: "Built by an agency, for agencies" },
  ];
  return (
    <section className="pb-section-gap border-t border-outline-variant pt-12">
      <div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Icon size={16} className="text-primary" /> {label}
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const cards = [
    { icon: Key, title: "Keyword Triggers", body: "Set specific words to trigger replies. Effortlessly filter high-intent comments from noise." },
    { icon: MessageSquare, title: "Instant DM Replies", body: "Deliver links, magnets, or booking pages instantly — on comments, Story replies, and DMs." },
    { icon: BarChart3, title: "Detailed Analytics", body: "Track conversion rates from a central dashboard. Understand which triggers drive results." },
  ];
  return (
    <section id="features" className="pb-section-gap scroll-mt-20">
      <div className="text-center mb-16 space-y-stack-sm">
        <h2 className="text-h1 text-white">Built for high-growth engagement</h2>
        <p className="text-body-md text-on-surface-variant max-w-xl mx-auto">Scale your social presence without scaling your team's manual workload.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {cards.map(({ icon: Icon, title, body }) => (
          <div key={title} className="bg-surface rounded-xl p-padding-card border border-outline-variant hover:border-primary/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center mb-6 border border-outline-variant group-hover:bg-primary/10 transition-colors">
              <Icon size={20} className="text-primary" />
            </div>
            <h3 className="text-h2 text-white mb-3">{title}</h3>
            <p className="text-body-md text-on-surface-variant">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: 1, title: "Connect IG", body: "Securely link your professional account through Meta's official API." },
    { n: 2, title: "Set Keywords", body: "Define trigger phrases for automated, personalized responses." },
    { n: 3, title: "Automate", body: "Sit back while DMLoop handles every comment, reply, and DM in real time." },
  ];
  return (
    <section id="how" className="pb-section-gap scroll-mt-20">
      <div className="glass-card rounded-2xl p-8 sm:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" aria-hidden="true" />
        <h2 className="text-h1 text-white mb-16 text-center relative">Seamless implementation</h2>
        <div className="grid md:grid-cols-3 gap-12 relative">
          {steps.map((s, i) => (
            <div key={s.n} className="relative space-y-stack-md text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold mx-auto mb-6 shadow-[0_0_20px_rgba(60,123,250,0.3)]">
                {s.n}
              </div>
              <h4 className="text-h2 text-white">{s.title}</h4>
              <p className="text-body-md text-on-surface-variant px-4">{s.body}</p>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[calc(50%+2rem)] w-full h-px bg-outline-variant" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    { name: "Free", price: "₹0", period: "forever", features: ["1 Instagram account", "1 automation", "50 DMs / month", "Comment automation only"] },
    { name: "Starter", price: "₹399", period: "/month", badge: "Most popular", highlight: true, features: ["1 Instagram account", "5 automations", "2,000 DMs / month", "Public replies + follow-gating", "Story-reply & DM automation"] },
    { name: "Pro", price: "₹899", period: "/month", badge: "Best value per DM", features: ["5 Instagram accounts", "50 automations", "20,000 DMs / month", "Everything in Starter", "Analytics & leads dashboard"] },
  ];
  return (
    <section id="pricing" className="pb-section-gap scroll-mt-20">
      <div className="text-center mb-16 space-y-stack-sm">
        <h2 className="text-h1 text-white">Simple plans, no surprises</h2>
        <p className="text-body-md text-on-surface-variant max-w-xl mx-auto">Every plan includes a monthly DM limit — automations pause (not delete) if you hit it.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 items-start">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl p-7 relative flex flex-col h-full ${
              plan.highlight ? "bg-surface-container border-2 border-primary shadow-2xl md:-translate-y-3" : "bg-surface-container border border-outline-variant"
            }`}
          >
            {plan.badge && (
              <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${plan.highlight ? "bg-primary text-white" : "bg-green-400/15 text-green-400"}`}>
                {plan.badge}
              </div>
            )}
            <h3 className="font-semibold text-lg text-white">{plan.name}</h3>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">{plan.price}</span>
              <span className="text-sm text-on-surface-variant">{plan.period}</span>
            </div>
            <ul className="mt-6 space-y-2.5 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check size={16} className="text-green-400 shrink-0 mt-0.5" />
                  <span className="text-on-surface">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/login"
              className={`mt-7 text-center text-sm font-semibold px-5 py-3 rounded-lg transition-colors ${
                plan.highlight ? "bg-primary text-white hover:brightness-110" : "border border-outline-variant text-white hover:border-primary hover:text-primary"
              }`}
            >
              {plan.name === "Free" ? "Start free" : "Start free trial"}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function WhyDifferent() {
  const points = [
    { title: "Priced for India", body: "Plans start at ₹399/month — built for creators and small agencies, not enterprise budgets." },
    { title: "You own the data", body: "Every comment, reply, and lead lives in your dashboard. Export or delete it whenever you want." },
    { title: "No black-box AI", body: "Automations run on rules you write and can read back — you always know why a message was sent." },
    { title: "Built by operators", body: "We run our own agency on Instagram. DMLoop is the tool we needed and couldn't find." },
  ];
  return (
    <section className="pb-section-gap">
      <h2 className="text-h1 text-white mb-12">Why DMLoop</h2>
      <div className="grid md:grid-cols-2 gap-x-10 gap-y-8">
        {points.map((p) => (
          <div key={p.title} className="bg-surface-container rounded-xl p-padding-card border border-outline-variant flex gap-4">
            <Check size={18} className="text-green-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white mb-1">{p.title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{p.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="pb-section-gap">
      <div className="bg-primary rounded-2xl p-10 sm:p-16 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px" }}
          aria-hidden="true"
        />
        <h2 className="text-[36px] sm:text-display-lg text-white mb-6 relative z-10 font-bold">Ready to scale your engagement?</h2>
        <p className="text-body-lg text-white/80 max-w-2xl mx-auto mb-10 relative z-10">Set it up in under 5 minutes. Your first 50 DMs a month are free.</p>
        <Link to="/login" className="inline-block bg-white text-primary text-h2 px-12 py-5 rounded-lg font-black transition-all hover:scale-105 active:scale-95 relative z-10 shadow-xl">
          Get Started
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-surface-container border-t border-outline-variant py-16 sm:py-20">
      <div className="max-w-[1200px] mx-auto px-gutter grid sm:grid-cols-2 md:grid-cols-4 gap-10 sm:gap-12">
        <div className="space-y-6">
          <span className="text-h2 font-black tracking-tighter text-white">DMLoop</span>
          <p className="text-label-sm text-on-surface-variant leading-relaxed">
            Instagram automation for high-growth creators and agencies.
          </p>
          <div className="flex gap-4">
            {[Globe, AtSign, Share2].map((Icon, i) => (
              <a key={i} className="w-10 h-10 rounded bg-surface border border-outline-variant flex items-center justify-center hover:text-primary transition-colors" href="#">
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h5 className="text-white font-bold mb-6">Product</h5>
          <ul className="space-y-4 text-label-sm text-on-surface-variant">
            <li><a className="hover:text-primary transition-colors" href="#features">Features</a></li>
            <li><a className="hover:text-primary transition-colors" href="#pricing">Pricing</a></li>
            <li><a className="hover:text-primary transition-colors" href="#faq">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h5 className="text-white font-bold mb-6">Legal</h5>
          <ul className="space-y-4 text-label-sm text-on-surface-variant">
            <li><Link className="hover:text-primary transition-colors" to="/terms">Terms of Service</Link></li>
            <li><Link className="hover:text-primary transition-colors" to="/privacy">Privacy Policy</Link></li>
            <li><Link className="hover:text-primary transition-colors" to="/refund-policy">Refund Policy</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="text-white font-bold mb-6">Contact</h5>
          <p className="text-label-sm text-on-surface-variant">support@dmloop.app</p>
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto px-gutter mt-16 pt-8 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-label-sm text-on-surface-variant">© 2026 DMLoop. Not affiliated with or endorsed by Meta or Instagram.</p>
        <p className="text-label-sm text-on-surface-variant flex items-center gap-2">
          Built for Instagram <Heart size={14} className="text-primary fill-primary" />
        </p>
      </div>
    </footer>
  );
}
