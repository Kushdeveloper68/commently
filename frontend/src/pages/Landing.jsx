import { Link } from "react-router-dom";
import { MessageCircle, Zap, IndianRupee, Check } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border">
        <div className="font-display text-2xl font-bold text-gold-bright">Commently</div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-muted hover:text-ink text-sm font-medium">
            Log in
          </Link>
          <Link to="/login" className="btn-primary text-sm">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center px-6 py-24">
        <h1 className="font-display text-5xl md:text-6xl font-bold text-ink leading-tight">
          Turn Instagram comments into <span className="text-gold-bright">customers</span>
        </h1>
        <p className="text-muted text-lg mt-6 max-w-2xl mx-auto">
          Automatically DM anyone who comments a keyword on your posts or Reels.
          Flat pricing, no per-contact tax — built for creators and small businesses in India.
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link to="/login" className="btn-primary px-8 py-3 text-base">
            Start Free — No Card Required
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
        {[
          {
            icon: MessageCircle,
            title: "Comment → DM, automatically",
            desc: "Someone comments 'PRICE'? They get an instant DM with your link. No manual replying.",
          },
          {
            icon: Zap,
            title: "Set up in 5 minutes",
            desc: "Connect your Instagram, pick keywords, write your message. Go live instantly.",
          },
          {
            icon: IndianRupee,
            title: "Flat pricing, always",
            desc: "Unlike other tools, your bill never spikes as your audience grows. Ever.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card">
            <Icon className="text-gold-bright mb-3" size={28} />
            <h3 className="font-semibold text-ink mb-2">{title}</h3>
            <p className="text-sm text-muted">{desc}</p>
          </div>
        ))}
      </section>

      {/* Pricing teaser */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="font-display text-3xl font-bold mb-8">Simple, honest pricing</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Free", price: "₹0", features: ["1 Instagram account", "50 DMs/month", "1 automation"] },
            { name: "Starter", price: "₹399/mo", features: ["1 account", "2,000 DMs/month", "5 automations", "Public replies"], highlight: true },
            { name: "Pro", price: "₹899/mo", features: ["5 accounts", "20,000 DMs/month", "Unlimited automations", "Analytics"] },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`card text-left ${plan.highlight ? "border-gold" : ""}`}
            >
              <div className="text-sm text-muted">{plan.name}</div>
              <div className="font-display text-3xl font-bold text-gold-bright mt-1">{plan.price}</div>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted">
                    <Check size={14} className="text-gold" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center text-muted text-sm py-10 border-t border-border">
        © 2026 Commently by KV Agency
      </footer>
    </div>
  );
}
