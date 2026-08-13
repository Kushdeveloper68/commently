import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import {
  Search, Rocket, Bot, Link2, CreditCard, ChevronRight, Mail, ChevronDown, Star, Send,
} from "lucide-react";
import AppLayout from "../components/AppLayout.jsx";
import api from "../api/axios.js";

const CATEGORIES = [
  {
    icon: Rocket,
    title: "Getting Started",
    desc: "New to DMLoop? Start here to connect your first account and go live.",
    links: [
      { label: "Connect your Instagram account", to: "/connect-instagram" },
      { label: "Create your first automation", to: "/automations/new" },
      { label: "Understand plan limits", to: "/billing" },
    ],
  },
  {
    icon: Bot,
    title: "Automations",
    desc: "Comment triggers, Story replies, DMs, follow-gating — how it all works.",
    links: [
      { label: "View your automations", to: "/automations" },
      { label: "Check performance in Analytics", to: "/analytics" },
    ],
  },
  {
    icon: Link2,
    title: "Instagram Integration",
    desc: "Connection issues, re-authorization, and account status.",
    links: [
      { label: "Manage connected accounts", to: "/connect-instagram" },
    ],
  },
  {
    icon: CreditCard,
    title: "Billing & Account",
    desc: "Subscriptions, invoices, and account settings.",
    links: [
      { label: "Manage subscription", to: "/billing" },
      { label: "Account settings", to: "/profile" },
    ],
  },
];

const FAQS = [
  { q: "Is this against Instagram's rules?", a: "No. DMLoop connects through Meta's official Instagram API. You authorize access, and you can revoke it anytime from Instagram Accounts or your Instagram app settings." },
  { q: "Do I need a Business or Creator account?", a: "Yes — Instagram's automation API only works with Business or Creator accounts. Switching is free in the Instagram app under Settings → Account type." },
  { q: "What happens if I hit my monthly DM limit?", a: "Automations pause until your next billing cycle resets, or you can upgrade instantly from Billing to keep them running. No messages are lost — they simply stop firing until the limit resets." },
  { q: "Why did my automation stop working?", a: "The most common cause is a Reconnect required status on Instagram Accounts — Instagram tokens occasionally need re-authorization. Check that page first; if the account shows 'Action Required', click Reconnect." },
  { q: "Can I cancel anytime?", a: "Yes, from Billing → Cancel subscription. You keep access through the end of your current billing period." },
  { q: "How do I set up follow-gating?", a: "In the automation builder, toggle 'Follow to receive DM' — the user gets a prompt to follow first, and only receives your real message once they tap 'I followed'." },
  { q: "Is my Instagram access token safe?", a: "Yes — tokens are encrypted at rest (AES-256) and never shown in plain text, including to our own team. See our Privacy Policy for details." },
];

export default function HelpSupport() {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState(0);

  const filteredFaqs = FAQS.filter(
    (f) => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <Helmet><title>Help &amp; Support — DMLoop</title></Helmet>

      <section className="bg-surface-container/40 rounded-2xl p-8 sm:p-12 border border-outline-variant mb-12">
        <h1 className="text-display-lg text-[40px] sm:text-display-lg mb-4 bg-gradient-to-r from-primary to-white bg-clip-text text-transparent tracking-tighter font-bold">
          How can we help?
        </h1>
        <p className="text-body-lg text-on-surface-variant mb-8 max-w-xl">Search common questions or jump straight to what you need.</p>
        <div className="relative max-w-xl">
          <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
          <input
            className="input-field w-full pl-12 py-3.5"
            placeholder="e.g. 'follow gating' or 'billing'"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-12">
        {CATEGORIES.map(({ icon: Icon, title, desc, links }) => (
          <div key={title} className="bg-surface-container/50 p-padding-card rounded-2xl border border-outline-variant hover:border-primary/30 transition-all flex flex-col">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Icon size={22} className="text-primary" />
            </div>
            <h3 className="text-h2 mb-1.5">{title}</h3>
            <p className="text-on-surface-variant text-label-sm mb-4 flex-1">{desc}</p>
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="flex items-center gap-1.5 text-label-sm text-primary font-medium hover:translate-x-1 transition-transform">
                    <ChevronRight size={14} /> {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mb-12">
        <h2 className="text-h1 mb-6">Frequently asked questions</h2>
        <div className="space-y-2">
          {filteredFaqs.length === 0 ? (
            <p className="text-on-surface-variant text-sm py-8 text-center">No results for "{search}" — try a different search, or email us below.</p>
          ) : (
            filteredFaqs.map((f, i) => (
              <div key={f.q} className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container/30">
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                  <span className="font-medium text-[15px]">{f.q}</span>
                  <ChevronDown size={18} className={`text-on-surface-variant shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <p className="px-5 pb-4 text-sm text-on-surface-variant leading-relaxed">{f.a}</p>}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mb-12">
        <ContactForm />
      </section>

      <section className="bg-surface-container/40 rounded-2xl p-8 sm:p-12 border border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-h1 mb-2">Still have questions?</h2>
          <p className="text-on-surface-variant text-body-md">Email us and we'll get back to you — usually within a day.</p>
        </div>
        <a href="mailto:infokv26@gmail.com" className="btn-primary flex items-center gap-2 px-6 py-3.5 whitespace-nowrap">
          <Mail size={18} /> Email Our Team
        </a>
      </section>
    </AppLayout>
  );
}

function ContactForm() {
  const [type, setType] = useState("support");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) return toast.error("Please fill in both fields");
    setSubmitting(true);
    try {
      await api.post("/support/message", { type, subject, message, rating: type === "feedback" ? rating || undefined : undefined });
      toast.success(type === "support" ? "Support request sent — we'll get back to you soon." : "Thanks for the feedback!");
      setSubject("");
      setMessage("");
      setRating(0);
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't send your message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-container/40 rounded-2xl p-8 sm:p-12 border border-outline-variant">
      <h2 className="text-h1 mb-2">{type === "support" ? "Report an issue" : "Share feedback"}</h2>
      <p className="text-on-surface-variant text-body-md mb-6">
        {type === "support" ? "Tell us what's going wrong — we read every message." : "What's working, what's not, what you wish existed."}
      </p>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setType("support")} className={`px-4 py-2 rounded-lg text-sm font-medium border ${type === "support" ? "bg-primary text-on-primary border-primary" : "border-outline-variant text-on-surface-variant"}`}>
          Report a problem
        </button>
        <button onClick={() => setType("feedback")} className={`px-4 py-2 rounded-lg text-sm font-medium border ${type === "feedback" ? "bg-primary text-on-primary border-primary" : "border-outline-variant text-on-surface-variant"}`}>
          Give feedback
        </button>
      </div>

      <div className="space-y-4 max-w-xl">
        <input className="input-field" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <textarea className="input-field h-28 resize-none" placeholder={type === "support" ? "What happened? Steps to reproduce help a lot." : "Your thoughts..."} value={message} onChange={(e) => setMessage(e.target.value)} />

        {type === "feedback" && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)}>
                <Star size={22} className={n <= rating ? "text-tertiary fill-tertiary" : "text-outline-variant"} />
              </button>
            ))}
          </div>
        )}

        <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex items-center gap-2 px-6 py-3">
          <Send size={16} /> {submitting ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
