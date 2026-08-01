import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <Helmet>
        <title>Page not found — Commently</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="text-center max-w-sm">
        <div className="font-display text-6xl font-bold text-gold-bright mb-3">404</div>
        <h1 className="font-semibold text-lg mb-2">Page not found</h1>
        <p className="text-muted text-sm mb-6">The page you're looking for doesn't exist or moved.</p>
        <Link to="/" className="btn-primary inline-block">
          Back to home
        </Link>
      </div>
    </div>
  );
}
