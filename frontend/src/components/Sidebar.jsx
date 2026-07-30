import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Zap, Instagram, CreditCard, User, LogOut, BarChart3 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/automations", label: "Automations", icon: Zap },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/connect-instagram", label: "Instagram Accounts", icon: Instagram },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-panel border-r border-border h-screen flex flex-col fixed left-0 top-0">
      <div className="px-6 py-6 border-b border-border">
        <div className="font-display text-2xl font-bold text-gold-bright tracking-wide">
          Commently
        </div>
        <div className="text-xs text-muted mt-1 capitalize">{user?.plan || "free"} plan</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gold/10 text-gold-bright"
                  : "text-muted hover:bg-panel2 hover:text-ink"
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
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold-bright text-sm font-semibold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.name}</div>
            <div className="text-xs text-muted truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-danger transition-colors w-full rounded-lg hover:bg-panel2"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
    </aside>
  );
}