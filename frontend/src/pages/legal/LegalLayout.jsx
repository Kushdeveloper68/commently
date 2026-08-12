import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";

const logoSrc = "/dmloop-logo-design-rectrangle-blue-landingpage.png";

export default function LegalLayout({ title, description, updatedAt, children }) {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Helmet>
        <title>{title} — DMLoop</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <header className="border-b border-outline-variant">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
            <ArrowLeft size={16} /> Back to DMLoop
          </Link>
          <Link to="/" className="flex items-center gap-3">
            <img src={logoSrc} alt="DMLoop" className="block h-14 w-auto object-contain shrink-0" />
            <span className="font-sans text-sm font-extrabold uppercase tracking-[0.18em] text-on-surface leading-none whitespace-nowrap">
              DMLOOP
            </span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-h1 tracking-tight font-bold">{title}</h1>
        <p className="text-sm text-on-surface-variant mt-3">Last updated: {updatedAt}</p>

        <div className="mt-10 space-y-8 text-[15px] leading-7 text-on-surface/90">{children}</div>
      </main>

      <footer className="border-t border-outline-variant">
        <div className="max-w-3xl mx-auto px-6 py-8 text-sm text-on-surface-variant flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link to="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link>
        </div>
      </footer>
    </div>
  );
}

export function Section({ heading, children }) {
  return (
    <section>
      <h2 className="text-h2 font-semibold mb-3">{heading}</h2>
      <div className="space-y-3 text-on-surface-variant">{children}</div>
    </section>
  );
}
