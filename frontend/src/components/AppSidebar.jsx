import { NavLink } from "react-router-dom";
import { LayoutDashboard, Bot, Instagram, BarChart3, CreditCard, Settings, Plus, MessageSquare } from "lucide-react";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/automations", label: "Automations", icon: Bot },
  { to: "/connect-instagram", label: "Instagram Accounts", icon: Instagram },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/profile", label: "Settings", icon: Settings },
];

export default function AppSidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={onClose} />}

      <aside
        className={`h-screen w-64 fixed left-0 top-0 bg-surface border-r border-outline-variant flex flex-col p-4 z-50 transition-transform duration-200 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-10 px-2 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shrink-0">
            <MessageSquare size={17} className="text-on-primary" />
          </div>
          <div>
            <h2 className="text-h2 font-bold text-primary leading-tight">Commently</h2>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Command Center</p>
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
