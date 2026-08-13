import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Zap,
  PlayCircle,
  Bot,
  Key,
  MessageSquare,
  BarChart3,
  Globe,
  AtSign,
  Share2,
  Heart,
  Check,
  ChevronDown,
  ShieldCheck,
  Lock,
  Users,
  ArrowRight,
  Instagram,
  Send,
  Sparkles,
  Activity,
  MousePointer2,
  TrendingUp,
  Clock3,
  CircleCheck,
} from "lucide-react";

export default function Landing() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";

    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return (
    <div className="dmloop-page min-h-screen overflow-x-hidden bg-[#070A12] text-[#F7F9FC] selection:bg-[#2954FF] selection:text-white">
      <Helmet>
        <title>DMLoop — Instagram Automation That Converts</title>

        <meta
          name="description"
          content="Automate Instagram comments, Story replies and DMs with DMLoop. Turn conversations into leads 24/7."
        />
      </Helmet>

      <Header />

      <main>
        <Hero />
        <LiveMarquee />
        <TrustBar />
        <Features />
        <AutomationShowcase />
        <HowItWorks />
        <Pricing />
        <WhyDifferent />
        <FAQ />
        <FinalCta />
      </main>

      <Footer />
    </div>
  );
}

/* =========================================================
   HEADER
========================================================= */

function Header() {
  const [open, setOpen] = useState(false);

  const navItems = [
    ["Features", "features"],
    ["How it works", "how"],
    ["Pricing", "pricing"],
    ["FAQ", "faq"],
  ];

  return (
    <header className="dmloop-header fixed top-0 z-50 w-full border-b border-white/[0.07] bg-[#070A12]/75 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-5 sm:px-6">
        <div className="flex items-center gap-8">
          <a href="#" className="group flex items-center">
            <img
              src="/dmloop-logo-design-rectrangle-blue-landingpage.png"
              alt="DMLoop"
              className="h-12 w-auto object-contain transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </a>

          <nav className="hidden items-center gap-7 md:flex">
            {navItems.map(([label, id]) => (
              <a
                key={id}
                href={`#${id}`}
                className="dm-nav-link text-[13px] font-medium text-[#929AAF]"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <Link
            to="/login"
            className="dm-login px-4 py-2.5 text-[13px] font-semibold text-[#929AAF]"
          >
            Login
          </Link>

          <Link
            to="/login"
            className="dm-primary-button group inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold text-white"
          >
            Get Started
            <ArrowRight
              size={15}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-white/10 p-2 text-[#929AAF] transition hover:border-[#2954FF]/40 hover:text-white sm:hidden"
        >
          <ChevronDown
            size={19}
            className={`transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      <div
        className={`mobile-menu sm:hidden ${
          open ? "mobile-menu-open" : ""
        }`}
      >
        <div className="mx-4 mb-4 rounded-2xl border border-white/[0.08] bg-[#0D111C] p-3 shadow-2xl">
          {navItems.map(([label, id]) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm text-[#929AAF] transition hover:bg-white/[0.04] hover:text-white"
            >
              {label}
            </a>
          ))}

          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.07] pt-3">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Login
            </Link>

            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-[#2954FF] px-4 py-3 text-center text-sm font-bold text-white"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   HERO
========================================================= */

function Hero() {
  return (
    <section className="relative mx-auto grid max-w-[1200px] items-center gap-16 px-5 pb-24 pt-36 sm:px-6 sm:pt-44 lg:grid-cols-12 lg:pb-32">
      <div className="pointer-events-none absolute left-[5%] top-[15%] h-72 w-72 rounded-full bg-[#2954FF]/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-[5%] top-[25%] h-96 w-96 rounded-full bg-indigo-500/[0.06] blur-[140px]" />

      <div className="relative z-10 lg:col-span-6">
        <div className="dm-reveal dm-delay-1 mb-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2954FF]/25 bg-[#2954FF]/[0.08] px-3.5 py-2 text-[11px] font-semibold tracking-wide text-[#7EA0FF]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2954FF] opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2954FF]" />
            </span>

            Built on Meta's official Instagram API
          </div>
        </div>

        <h1 className="dm-reveal dm-delay-2 max-w-[700px] font-[Manrope] text-[44px] font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-[62px] lg:text-[68px]">
          Turn Instagram
          <span className="dm-gradient-text block">
            conversations into conversions.
          </span>
        </h1>

        <p className="dm-reveal dm-delay-3 mt-7 max-w-xl text-[17px] leading-8 text-[#929AAF]">
          DMLoop automatically replies to comments, Story replies and DMs —
          so your audience gets the right response while you're busy doing
          everything else.
        </p>

        <div className="dm-reveal dm-delay-4 mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/login"
            className="dm-primary-button group inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 text-sm font-bold text-white"
          >
            Get Started — It's Free
            <ArrowRight
              size={17}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>

          <a
            href="#how"
            className="dm-secondary-button inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 text-sm font-bold text-white"
          >
            <PlayCircle size={18} />
            See how it works
          </a>
        </div>

        <div className="dm-reveal dm-delay-5 mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-[#687287]">
          <span className="flex items-center gap-1.5">
            <CircleCheck size={13} className="text-[#22C55E]" />
            No credit card
          </span>

          <span className="flex items-center gap-1.5">
            <CircleCheck size={13} className="text-[#22C55E]" />
            Free forever plan
          </span>

          <span className="flex items-center gap-1.5">
            <CircleCheck size={13} className="text-[#22C55E]" />
            Official API
          </span>
        </div>
      </div>

      <HeroAutomation />
    </section>
  );
}

/* =========================================================
   HERO AUTOMATION
========================================================= */

function HeroAutomation() {
  const [liveCount, setLiveCount] = useState(482);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount((value) => value + Math.floor(Math.random() * 3));
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative z-10 mt-4 lg:col-span-6 lg:mt-0">
      <div className="dm-float relative">
        <div className="absolute -inset-8 rounded-[40px] bg-[#2954FF]/10 blur-[80px]" />

        <div className="dm-dashboard relative overflow-hidden rounded-[26px] border border-white/[0.1] bg-[#0D111C]/95 p-4 shadow-[0_40px_100px_rgba(0,0,0,0.45)] sm:p-6">
          <div className="mb-6 flex items-center justify-between border-b border-white/[0.07] pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2954FF]/10 text-[#6F91FF]">
                <Bot size={19} />
              </div>

              <div>
                <p className="text-xs font-bold text-white">
                  Instagram Automation
                </p>

                <div className="mt-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#647087]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                  workflow active
                </div>
              </div>
            </div>

            <div className="rounded-md border border-[#22C55E]/20 bg-[#22C55E]/[0.08] px-2.5 py-1 font-mono text-[9px] font-bold tracking-widest text-[#4ADE80]">
              LIVE
            </div>
          </div>

          <div className="space-y-3">
            <AutomationNode
              icon={MessageSquare}
              label="TRIGGER"
              title='Comment contains "LINK"'
              value="instagram / reel / comment"
              active
            />

            <FlowConnector />

            <AutomationNode
              icon={Zap}
              label="AUTOMATION"
              title="Keyword matched"
              value="rule_0042 executed"
              active
            />

            <FlowConnector />

            <AutomationNode
              icon={Send}
              label="ACTION"
              title="Send DM with link"
              value="message delivered"
              active
            />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <MiniMetric
              icon={Activity}
              value={liveCount}
              label="events"
            />

            <MiniMetric
              icon={TrendingUp}
              value="18.4%"
              label="conversion"
            />

            <MiniMetric
              icon={Clock3}
              value="0.8s"
              label="response"
            />
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Instagram size={13} className="text-[#F472B6]" />
              <span className="text-[10px] text-[#7C879B]">
                @yourbrand
              </span>
            </div>

            <span className="font-mono text-[9px] text-[#22C55E]">
              +1 automation
            </span>
          </div>
        </div>

        <div className="dm-floating-badge absolute -right-4 top-16 hidden rounded-xl border border-white/[0.08] bg-[#111622] px-3 py-2 shadow-2xl sm:block">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-[#22C55E]/10 p-1.5 text-[#4ADE80]">
              <Send size={12} />
            </div>
            <div>
              <p className="font-mono text-[8px] uppercase tracking-widest text-[#687287]">
                DM sent
              </p>
              <p className="text-[10px] font-bold text-white">
                0.8 sec ago
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AutomationNode({
  icon: Icon,
  label,
  title,
  value,
  active,
}) {
  return (
    <div
      className={`dm-node rounded-xl border p-4 ${
        active
          ? "border-[#2954FF]/20 bg-[#111622]"
          : "border-white/[0.06] bg-white/[0.02]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2954FF]/10 text-[#6F91FF]">
          <Icon size={16} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-mono text-[8px] font-bold tracking-[0.18em] text-[#647087]">
            {label}
          </p>

          <p className="mt-1 truncate text-xs font-semibold text-white">
            {title}
          </p>

          <p className="mt-1 truncate font-mono text-[9px] text-[#596579]">
            {value}
          </p>
        </div>

        <span className="h-2 w-2 rounded-full bg-[#22C55E] shadow-[0_0_12px_rgba(34,197,94,.7)]" />
      </div>
    </div>
  );
}

function FlowConnector() {
  return (
    <div className="flex h-5 justify-center">
      <div className="dm-flow-line relative h-full w-px bg-gradient-to-b from-[#2954FF] via-[#2954FF]/50 to-transparent" />
    </div>
  );
}

function MiniMetric({ icon: Icon, value, label }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <Icon size={12} className="mb-2 text-[#607DFF]" />

      <p className="font-[Manrope] text-sm font-bold text-white">
        {value}
      </p>

      <p className="mt-0.5 font-mono text-[8px] uppercase tracking-widest text-[#5F6B80]">
        {label}
      </p>
    </div>
  );
}

/* =========================================================
   LIVE MARQUEE
========================================================= */

function LiveMarquee() {
  const items = [
    "COMMENT → DM",
    "STORY REPLY → DM",
    "KEYWORD TRIGGERS",
    "LEAD CAPTURE",
    "24/7 AUTOMATION",
    "REAL-TIME ANALYTICS",
    "INSTAGRAM API",
  ];

  const content = [...items, ...items];

  return (
    <section className="border-y border-white/[0.06] bg-[#0A0D16] py-4">
      <div className="dm-marquee">
        <div className="dm-marquee-track">
          {content.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="mx-7 flex shrink-0 items-center gap-7 font-mono text-[10px] font-bold tracking-[0.16em] text-[#69758B]"
            >
              <span className="h-1 w-1 rounded-full bg-[#2954FF]" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   TRUST
========================================================= */

function TrustBar() {
  const items = [
    {
      icon: ShieldCheck,
      label: "Official Meta API",
    },
    {
      icon: Lock,
      label: "Encrypted tokens",
    },
    {
      icon: Users,
      label: "Creator & agency focused",
    },
    {
      icon: Activity,
      label: "Real-time automation",
    },
  ];

  return (
    <section className="mx-auto max-w-[1200px] px-5 py-14 sm:px-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="dm-trust-item flex items-center justify-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3 text-center"
          >
            <Icon size={14} className="shrink-0 text-[#5D7FFF]" />
            <span className="text-[11px] font-medium text-[#788398]">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   FEATURES
========================================================= */

function Features() {
  const cards = [
    {
      icon: Key,
      number: "01",
      title: "Keyword Triggers",
      body: "Turn specific words and phrases into automation triggers. Capture intent while it is happening.",
    },
    {
      icon: MessageSquare,
      number: "02",
      title: "Instant DM Replies",
      body: "Automatically deliver links, lead magnets, booking pages and personalised responses.",
    },
    {
      icon: BarChart3,
      number: "03",
      title: "Conversion Analytics",
      body: "See which automations create conversations, clicks and leads instead of guessing.",
    },
  ];

  return (
    <section
      id="features"
      className="dm-section mx-auto max-w-[1200px] scroll-mt-24 px-5 pb-28 sm:px-6 lg:pb-36"
    >
      <div className="mb-14 max-w-2xl">
        <p className="dm-eyebrow">AUTOMATION ENGINE</p>

        <h2 className="dm-section-title mt-4">
          Less manual engagement.
          <span> More conversations that convert.</span>
        </h2>

        <p className="mt-5 max-w-xl text-[16px] leading-7 text-[#7E899D]">
          DMLoop turns repetitive Instagram interactions into automated
          workflows your team can actually measure.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(({ icon: Icon, number, title, body }) => (
          <div key={title} className="dm-feature-card group">
            <div className="flex items-start justify-between">
              <div className="dm-icon-box">
                <Icon size={19} />
              </div>

              <span className="font-mono text-[10px] text-[#424C5F]">
                {number}
              </span>
            </div>

            <h3 className="mt-8 font-[Manrope] text-xl font-bold tracking-[-0.025em] text-white">
              {title}
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#778297]">
              {body}
            </p>

            <div className="mt-7 flex items-center gap-2 text-[11px] font-bold text-[#607DFF] opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
              Explore feature
              <ArrowRight size={13} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   AUTOMATION SHOWCASE
========================================================= */

function AutomationShowcase() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 pb-28 sm:px-6 lg:pb-36">
      <div className="dm-showcase grid overflow-hidden rounded-[28px] border border-white/[0.08] lg:grid-cols-2">
        <div className="p-8 sm:p-12 lg:p-16">
          <p className="dm-eyebrow">ONE COMMENT. FULL WORKFLOW.</p>

          <h2 className="mt-4 font-[Manrope] text-3xl font-extrabold tracking-[-0.04em] text-white sm:text-4xl">
            From “LINK” to lead
            <span className="dm-gradient-text block">
              without lifting a finger.
            </span>
          </h2>

          <p className="mt-5 max-w-lg text-sm leading-7 text-[#7E899D]">
            Build rules once. DMLoop watches for the trigger, executes the
            action and gives you the data to understand what happened.
          </p>

          <div className="mt-8 space-y-3">
            {[
              "Detect a keyword",
              "Match the automation",
              "Send the right DM",
              "Track the result",
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-3 text-sm text-[#B1B8C7]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#2954FF]/30 bg-[#2954FF]/10 font-mono text-[9px] font-bold text-[#6F91FF]">
                  0{index + 1}
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[420px] overflow-hidden bg-[#090C15] p-6 sm:p-10">
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:32px_32px]" />

          <div className="relative mx-auto flex h-full max-w-md flex-col justify-center gap-4">
            <ShowcaseNode
              label="INSTAGRAM"
              title='Comment: "LINK PLEASE"'
              icon={Instagram}
            />

            <div className="dm-animated-connector" />

            <ShowcaseNode
              label="DMLoop"
              title="Keyword matched"
              icon={Sparkles}
              accent
            />

            <div className="dm-animated-connector" />

            <ShowcaseNode
              label="INSTAGRAM DM"
              title="Your requested link →"
              icon={Send}
              success
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ShowcaseNode({
  label,
  title,
  icon: Icon,
  accent,
  success,
}) {
  return (
    <div
      className={`dm-showcase-node ${
        accent ? "dm-showcase-accent" : ""
      } ${success ? "dm-showcase-success" : ""}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
        <Icon size={17} />
      </div>

      <div>
        <p className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-[#68748A]">
          {label}
        </p>
        <p className="mt-1 text-sm font-semibold text-white">{title}</p>
      </div>

      {success && (
        <span className="ml-auto rounded-full bg-[#22C55E]/10 p-1.5 text-[#4ADE80]">
          <Check size={12} />
        </span>
      )}
    </div>
  );
}

/* =========================================================
   HOW IT WORKS
========================================================= */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: Instagram,
      title: "Connect Instagram",
      body: "Connect your professional account through Meta's official API.",
    },
    {
      n: "02",
      icon: MousePointer2,
      title: "Create a rule",
      body: "Choose a trigger, keyword and the response you want to send.",
    },
    {
      n: "03",
      icon: Zap,
      title: "Let it run",
      body: "DMLoop watches your conversations and executes the workflow automatically.",
    },
  ];

  return (
    <section
      id="how"
      className="mx-auto max-w-[1200px] scroll-mt-24 px-5 pb-28 sm:px-6 lg:pb-36"
    >
      <div className="mb-14 text-center">
        <p className="dm-eyebrow">HOW IT WORKS</p>

        <h2 className="dm-section-title mx-auto mt-4 max-w-2xl">
          Set it once.
          <span> Let automation do the rest.</span>
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {steps.map(({ n, icon: Icon, title, body }) => (
          <div key={n} className="dm-step-card">
            <div className="flex items-center justify-between">
              <div className="dm-icon-box">
                <Icon size={18} />
              </div>

              <span className="font-mono text-[10px] text-[#40495B]">
                {n}
              </span>
            </div>

            <h3 className="mt-8 font-[Manrope] text-lg font-bold text-white">
              {title}
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#778297]">
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   PRICING
========================================================= */

function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      description: "Start automating without paying upfront.",
      features: [
        "1 Instagram account",
        "1 automation",
        "50 DMs / month",
        "Comment automation",
      ],
    },
    {
      name: "Starter",
      price: "₹99",
      period: "/month",
      description: "For creators starting to scale.",
      badge: "MOST POPULAR",
      highlight: true,
      features: [
        "1 Instagram account",
        "5 automations",
        "10,000 DMs / month",
        "Public replies + follow-gating",
        "Story-reply & DM automation",
      ],
    },
    {
      name: "Pro",
      price: "₹199",
      period: "/month",
      description: "For teams and serious operators.",
      badge: "BEST VALUE",
      features: [
        "5 Instagram accounts",
        "20 automations",
        "20,000 DMs / month",
        "Everything in Starter",
        "Analytics & leads dashboard",
      ],
    },
  ];

  return (
    <section
      id="pricing"
      className="mx-auto max-w-[1200px] scroll-mt-24 px-5 pb-28 sm:px-6 lg:pb-36"
    >
      <div className="mb-14 text-center">
        <p className="dm-eyebrow">PRICING</p>

        <h2 className="dm-section-title mt-4">
          Simple pricing.
          <span> Serious automation.</span>
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-[#778297]">
          Start free. Upgrade when automation becomes part of your growth
          engine.
        </p>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`dm-pricing-card ${
              plan.highlight ? "dm-pricing-featured" : ""
            }`}
          >
            {plan.badge && (
              <div
                className={`absolute -top-3 left-6 rounded-full px-3 py-1 font-mono text-[8px] font-bold tracking-[0.14em] ${
                  plan.highlight
                    ? "bg-[#2954FF] text-white"
                    : "border border-[#22C55E]/20 bg-[#22C55E]/10 text-[#4ADE80]"
                }`}
              >
                {plan.badge}
              </div>
            )}

            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#657086]">
              {plan.name}
            </p>

            <div className="mt-5 flex items-end gap-1">
              <span className="font-[Manrope] text-5xl font-extrabold tracking-[-0.05em] text-white">
                {plan.price}
              </span>

              <span className="mb-2 text-xs text-[#69758A]">
                {plan.period}
              </span>
            </div>

            <p className="mt-3 min-h-10 text-sm leading-5 text-[#737F94]">
              {plan.description}
            </p>

            <div className="my-7 h-px bg-white/[0.07]" />

            <ul className="space-y-3">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex gap-2.5 text-sm text-[#B6BDCA]"
                >
                  <Check
                    size={15}
                    className="mt-0.5 shrink-0 text-[#4ADE80]"
                  />
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              to="/login"
              className={`mt-8 block rounded-xl px-5 py-3 text-center text-sm font-bold transition-all duration-300 ${
                plan.highlight
                  ? "bg-[#2954FF] text-white shadow-[0_10px_35px_rgba(41,84,255,.25)] hover:-translate-y-0.5 hover:bg-[#3A69FF]"
                  : "border border-white/10 text-white hover:-translate-y-0.5 hover:border-[#2954FF]/50 hover:bg-[#2954FF]/[0.06]"
              }`}
            >
              Choose {plan.name}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   WHY DIFFERENT
========================================================= */

function WhyDifferent() {
  const points = [
    {
      title: "Priced for creators",
      body: "Automation should not require an enterprise budget. Start small and scale when you need more.",
    },
    {
      title: "You own your data",
      body: "Your comments, replies and leads belong to you. Export or delete them when you want.",
    },
    {
      title: "No black-box automation",
      body: "Rules are explicit and understandable. You know exactly why a workflow fired.",
    },
    {
      title: "Built by operators",
      body: "DMLoop is designed around real Instagram workflows instead of abstract automation theory.",
    },
  ];

  return (
    <section className="mx-auto max-w-[1200px] px-5 pb-28 sm:px-6 lg:pb-36">
      <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
        <div>
          <p className="dm-eyebrow">WHY DMLOOP</p>

          <h2 className="mt-4 font-[Manrope] text-3xl font-extrabold tracking-[-0.04em] text-white sm:text-4xl">
            Automation without
            <span className="dm-gradient-text block">
              losing control.
            </span>
          </h2>

          <p className="mt-5 max-w-md text-sm leading-7 text-[#778297]">
            DMLoop is built to make Instagram automation understandable,
            affordable and measurable.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {points.map((point, index) => (
            <div key={point.title} className="dm-reason-card group">
              <div className="mb-5 flex items-center justify-between">
                <span className="font-mono text-[9px] tracking-widest text-[#414A5C]">
                  0{index + 1}
                </span>

                <ArrowRight
                  size={14}
                  className="text-[#49546A] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#607DFF]"
                />
              </div>

              <h3 className="font-[Manrope] text-base font-bold text-white">
                {point.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#758196]">
                {point.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   FAQ
========================================================= */

function FAQ() {
  const questions = [
    {
      q: "Do I need an Instagram Business or Professional account?",
      a: "DMLoop is designed around Meta's official Instagram APIs, so the connected account needs to meet Meta's requirements for the supported automation features.",
    },
    {
      q: "Will DMLoop send spam automatically?",
      a: "No. You define the automation rules and responses. DMLoop executes those rules rather than randomly generating outbound messages.",
    },
    {
      q: "What happens when I reach my DM limit?",
      a: "Your automations pause rather than being deleted. You can continue after the limit resets or upgrade your plan.",
    },
    {
      q: "Can I cancel whenever I want?",
      a: "Yes. There is no long-term contract. Your account remains subject to the plan and billing terms shown at checkout.",
    },
  ];

  return (
    <section
      id="faq"
      className="mx-auto max-w-[900px] scroll-mt-24 px-5 pb-28 sm:px-6 lg:pb-36"
    >
      <div className="mb-12 text-center">
        <p className="dm-eyebrow">FAQ</p>

        <h2 className="dm-section-title mt-4">
          Questions?
          <span> We've got answers.</span>
        </h2>
      </div>

      <div className="space-y-3">
        {questions.map((item) => (
          <details key={item.q} className="dm-faq">
            <summary>
              <span>{item.q}</span>
              <ChevronDown size={17} />
            </summary>

            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   FINAL CTA
========================================================= */

function FinalCta() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 pb-24 sm:px-6 lg:pb-32">
      <div className="dm-final-cta relative overflow-hidden rounded-[28px] px-7 py-16 text-center sm:px-12 sm:py-20">
        <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />

        <div className="relative z-10">
          <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 font-mono text-[9px] font-bold tracking-widest text-white/70">
            <Zap size={11} />
            START AUTOMATING
          </div>

          <h2 className="font-[Manrope] text-3xl font-extrabold tracking-[-0.04em] text-white sm:text-5xl">
            Your next customer might
            <span className="block text-white/70">
              already be in your comments.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/65">
            Let DMLoop start the conversation automatically.
          </p>

          <Link
            to="/login"
            className="mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 text-sm font-extrabold text-[#2954FF] shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,.35)]"
          >
            Get Started Free
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   FOOTER
========================================================= */

function Footer() {
  return (
    <footer className="border-t border-white/[0.07] bg-[#05070C]">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-16 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <img
            src="/dmloop-logo-design-rectrangle-blue-landingpage.png"
            alt="DMLoop"
            className="h-12 w-auto object-contain"
          />

          <p className="mt-5 max-w-sm text-sm leading-6 text-[#6E798D]">
            Instagram automation for creators, businesses and agencies that
            want more conversations without more manual work.
          </p>

          <div className="mt-6 flex gap-2">
            <a
              href="https://dmloop.app"
              target="_blank"
              rel="noopener noreferrer"
              className="dm-social"
              aria-label="DMLoop website"
            >
              <Globe size={16} />
            </a>

            <a
              href="mailto:infokv26@gmail.com"
              className="dm-social"
              aria-label="Email DMLoop"
            >
              <AtSign size={16} />
            </a>

            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="dm-social"
              aria-label="Instagram"
            >
              <Share2 size={16} />
            </a>
          </div>
        </div>

        <div>
          <h5 className="mb-5 text-xs font-bold uppercase tracking-widest text-white">
            Product
          </h5>

          <ul className="space-y-3 text-sm text-[#69758A]">
            <li>
              <a className="dm-footer-link" href="#features">
                Features
              </a>
            </li>

            <li>
              <a className="dm-footer-link" href="#how">
                How it works
              </a>
            </li>

            <li>
              <a className="dm-footer-link" href="#pricing">
                Pricing
              </a>
            </li>

            <li>
              <a className="dm-footer-link" href="#faq">
                FAQ
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="mb-5 text-xs font-bold uppercase tracking-widest text-white">
            Legal
          </h5>

          <ul className="space-y-3 text-sm text-[#69758A]">
            <li>
              <Link className="dm-footer-link" to="/terms">
                Terms of Service
              </Link>
            </li>

            <li>
              <Link className="dm-footer-link" to="/privacy">
                Privacy Policy
              </Link>
            </li>

            <li>
              <Link className="dm-footer-link" to="/refund-policy">
                Refund Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-5 py-6 text-center sm:px-6 md:flex-row md:text-left">
          <p className="font-mono text-[9px] tracking-wide text-[#525C6D]">
            © 2026 DMLoop. Not affiliated with or endorsed by Meta or
            Instagram.
          </p>

          <p className="flex items-center gap-2 text-[10px] text-[#525C6D]">
            Built for Instagram
            <Heart size={12} className="fill-[#2954FF] text-[#2954FF]" />
          </p>
        </div>
      </div>
    </footer>
  );
}