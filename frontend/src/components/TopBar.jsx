import { Link } from "react-router-dom";
import { Search, Bell, HelpCircle, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

// hasAlerts: optional, pages can pass true (e.g. Instagram account needs
// reconnecting) to light up the notification dot — no fake indicator shown
// by default.
export default function TopBar({ onMenuClick, hasAlerts = false }) {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 md:left-64 h-16 bg-surface-container-low border-b border-outline-variant flex items-center justify-between px-4 md:px-gutter z-30">
      <div className="flex items-center gap-3 flex-1">
        <button onClick={onMenuClick} className="md:hidden text-on-surface-variant" aria-label="Open menu">
          <Menu size={22} />
        </button>

        <div className="relative w-full max-w-64 hidden sm:block">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            className="w-full bg-surface-container-lowest border border-outline rounded-lg pl-10 pr-4 py-1.5 text-label-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
            placeholder="Search..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <button className="text-on-surface-variant hover:text-primary transition-colors relative" aria-label="Notifications">
            <Bell size={20} />
            {hasAlerts && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-error rounded-full" />}
          </button>
          <Link to="/help" className="text-on-surface-variant hover:text-primary transition-colors" aria-label="Help">
            <HelpCircle size={20} />
          </Link>
        </div>

        <div className="h-6 w-px bg-outline-variant hidden sm:block" />

        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/help" className="text-on-surface-variant text-label-sm hover:text-on-surface transition-colors hidden md:block">
            Support
          </Link>
          {user?.plan !== "pro" && (
            <Link to="/billing" className="btn-outline hidden sm:block">
              Upgrade
            </Link>
          )}
          <Link to="/profile" className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
