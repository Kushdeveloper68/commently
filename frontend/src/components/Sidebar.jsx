import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Zap, Instagram, CreditCard, User, LogOut, BarChart3, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/automations", label: "Automations", icon: Zap },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/connect-instagram", label: "Instagram Accounts", icon: Instagram },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/profile", label: "Profile", icon: User },
];

// Renders both the always-visible mobile top bar AND the sidebar itself.
// On mobile the sidebar becomes a slide-in drawer, triggered by the top bar's
// hamburger button; on desktop (md+) it's a fixed rail, always visible.
export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const NavContent = (
    <>
      <div className="px-6 py-6 border-b border-border flex items-center justify-between">
        <div>
          <div className="font-display text-2xl font-bold text-gold-bright tracking-tight">DMLoop</div>
          <div className="text-xs text-muted mt-1 capitalize">{user?.plan || "free"} plan</div>
        </div>
        <button onClick={() => setOpen(false)} className="md:hidden text-muted hover:text-ink">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-gold/10 text-gold-bright" : "text-muted hover:bg-panel2 hover:text-ink"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center text-gold-bright text-sm font-semibold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.name}</div>
            <div className="text-xs text-muted truncate">{user?.email}</div>
          </div>
          <ThemeToggle />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-danger transition-colors w-full rounded-lg hover:bg-panel2"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-panel border-b border-border flex items-center justify-between px-4 z-30">
        <button onClick={() => setOpen(true)} className="text-muted hover:text-ink" aria-label="Open menu">
          <Menu size={22} />
        </button>
        <div className="font-display text-lg font-bold text-gold-bright">DMLoop</div>
        <ThemeToggle />
      </header>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar: fixed rail on desktop, slide-in drawer on mobile */}
      <aside
        className={`bg-panel border-r border-border h-screen flex flex-col fixed left-0 top-0 w-72 z-50 transition-transform duration-200 md:translate-x-0 md:w-64 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {NavContent}
      </aside>
    </>
  );
}
