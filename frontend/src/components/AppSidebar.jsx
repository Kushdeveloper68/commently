import { NavLink } from "react-router-dom";
import { LayoutDashboard, Bot, Instagram, BarChart3, CreditCard, Settings, Plus, MessageSquare, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/automations", label: "Automations", icon: Bot },
  { to: "/connect-instagram", label: "Instagram Accounts", icon: Instagram },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/profile", label: "Settings", icon: Settings },
];

export default function AppSidebar({ open, onClose }) {
  const { user } = useAuth();
  const logoSrc = "/dmloop-logo-design-rectrangle-blue-landingpage.png";
  return (
    <>
      {open && <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={onClose} />}

      <aside
        className={`h-screen w-64 fixed left-0 top-0 bg-surface border-r border-outline-variant flex flex-col p-4 z-50 transition-transform duration-200 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-10 flex items-center">
          <img src={logoSrc} alt="DMLoop" className="block h-14 w-auto max-w-[180px] object-contain shrink-0" />
          <div className="min-w-0 flex items-center">
            <div className="font-sans text-[16px] font-extrabold uppercase tracking-[0.22em] text-white leading-none whitespace-nowrap">
              DMLOOP
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? "bg-secondary-container text-on-secondary-container font-bold"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 mt-2 pt-3 border-t border-outline-variant ${
                  isActive ? "text-primary font-bold" : "text-on-surface-variant hover:bg-surface-container-high"
                }`
              }
            >
              <ShieldCheck size={19} />
              <span>Admin</span>
            </NavLink>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-outline-variant">
          <NavLink
            to="/automations/new"
            className="w-full py-2.5 bg-primary text-on-primary font-bold rounded-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            New Automation
          </NavLink>
        </div>
      </aside>
    </>
  );
}
