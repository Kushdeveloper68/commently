import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import ThemeToggle from "../../components/ThemeToggle.jsx";

export default function LegalLayout({ title, description, updatedAt, children }) {
  return (
    <div className="min-h-screen bg-bg">
      <Helmet>
        <title>{title} — Commently</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft size={16} /> Back to Commently
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted mt-3">Last updated: {updatedAt}</p>

        <div className="prose-legal mt-10 space-y-8 text-[15px] leading-7 text-ink/90">{children}</div>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-8 text-sm text-muted flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/terms" className="hover:text-ink transition-colors">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
          <Link to="/refund-policy" className="hover:text-ink transition-colors">Refund Policy</Link>
        </div>
      </footer>
    </div>
  );
}

export function Section({ heading, children }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold mb-3">{heading}</h2>
      <div className="space-y-3 text-muted">{children}</div>
    </section>
  );
}
