import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, HelpCircle, Menu, LogOut, Settings, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";

// hasAlerts: optional, pages can pass true (e.g. Instagram account needs
// reconnecting) to light up the notification dot — no fake indicator shown
// by default.
export default function TopBar({ onMenuClick, hasAlerts = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await logout();
      toast.success("Logged out");
      navigate("/login");
    } catch {
      toast.error("Couldn't log out. Please try again.");
    }
  };

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

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 shrink-0"
              aria-label="Account menu"
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant shrink-0">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <ChevronDown size={15} className={`text-on-surface-variant transition-transform hidden sm:block ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container border border-outline-variant rounded-xl shadow-lg py-1.5 z-50">
                <div className="px-3.5 py-2.5 border-b border-outline-variant">
                  <p className="text-label-sm text-on-surface font-semibold truncate">{user?.name}</p>
                  <p className="text-[12px] text-on-surface-variant truncate">{user?.email}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-label-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                >
                  <Settings size={16} /> Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-label-sm text-error hover:bg-error/10 transition-colors text-left"
                >
                  <LogOut size={16} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}