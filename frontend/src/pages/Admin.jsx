import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import {
  Users, Bot, Instagram, Send, IndianRupee, AlertTriangle, Search, Plus, X,
} from "lucide-react";
import AppLayout from "../components/AppLayout.jsx";
import { SkeletonProvider } from "../components/Skeletons.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import Badge from "../components/ui/Badge.jsx";
import api from "../api/axios.js";

const TABS = ["Overview", "Users", "Plans"];

export default function Admin() {
  const [tab, setTab] = useState("Overview");

  return (
    <AppLayout>
      <SkeletonProvider>
        <header className="mb-8">
          <h1 className="text-h1 font-bold flex items-center gap-2">
            Admin <Badge variant="primary">Internal</Badge>
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">Platform-wide visibility and controls.</p>
        </header>

        <div className="flex gap-8 border-b border-outline-variant mb-8">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 text-label-sm transition-all ${
                tab === t ? "text-primary border-b-2 border-primary font-semibold" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Overview" && <OverviewTab />}
        {tab === "Users" && <UsersTab />}
        {tab === "Plans" && <PlansTab />}
      </SkeletonProvider>
    </AppLayout>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/overview").then(({ data }) => setData(data)).catch(() => toast.error("Couldn't load overview")).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton height={300} className="rounded-xl" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <StatCard icon={Users} label="Total Users" value={data.users.total.toLocaleString("en-IN")} caption={`+${data.users.newThisMonth} this month`} />
        <StatCard icon={Bot} label="Automations" value={data.automations.total.toLocaleString("en-IN")} caption={`${data.automations.live} live`} />
        <StatCard icon={Instagram} label="Connected Accounts" value={data.accounts.total.toLocaleString("en-IN")} iconBg="bg-tertiary/10" iconColor="text-tertiary" caption={data.accounts.needingReconnect > 0 ? `${data.accounts.needingReconnect} need reconnect` : "All healthy"} />
        <StatCard icon={Send} label="DMs Sent" value={data.dms.total.toLocaleString("en-IN")} iconBg="bg-secondary-container" iconColor="text-secondary" caption={`${data.dms.thisMonth.toLocaleString("en-IN")} this month`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee size={18} className="text-primary" />
            <h3 className="text-h2">Revenue (this month)</h3>
          </div>
          <p className="text-3xl font-bold mt-3">₹{(data.revenueThisMonthInPaise / 100).toLocaleString("en-IN")}</p>
          <p className="text-xs text-on-surface-variant mt-1">From new subscriptions/renewals created this month</p>
        </div>

        <div className="card">
          <h3 className="text-h2 mb-4">Plan distribution</h3>
          <div className="space-y-2">
            {data.planDistribution.map((p) => (
              <div key={p.plan} className="flex justify-between items-center text-sm">
                <span className="capitalize text-on-surface">{p.plan}</span>
                <span className="font-mono text-on-surface-variant">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(data.users.suspended > 0 || data.accounts.needingReconnect > 0) && (
        <div className="bg-tertiary/5 border border-tertiary/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-tertiary shrink-0" />
          <p className="text-sm text-on-surface-variant">
            {data.users.suspended > 0 && `${data.users.suspended} user(s) suspended. `}
            {data.accounts.needingReconnect > 0 && `${data.accounts.needingReconnect} account(s) need reconnecting.`}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Users ────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (search) params.set("search", search);
    api.get(`/admin/users?${params}`).then(({ data }) => {
      setUsers(data.users);
      setPagination(data.pagination);
    }).catch(() => toast.error("Couldn't load users")).finally(() => setLoading(false));
  }, [page, search]);

  return (
    <div className="card overflow-hidden p-0">
      <div className="p-4 border-b border-outline-variant">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input className="input-field pl-9 py-2 text-sm" placeholder="Search name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-high text-[11px] text-on-surface-variant uppercase tracking-wider border-b border-outline-variant">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">DMs this month</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-4"><Skeleton height={40} /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-on-surface-variant text-sm">No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-container-high transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/admin/users/${u.id}`} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest shrink-0">
                        {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-on-surface-variant">{u.name?.[0]}</div>}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-on-surface hover:text-primary transition-colors">{u.name}</p>
                        <p className="text-xs text-on-surface-variant">{u.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-sm">{u.plan}</span>
                    {u.hasOverride && <Badge variant="primary">Custom</Badge>}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono">{u.dmsSentThisMonth.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    {u.isSuspended ? <Badge variant="error">Suspended</Badge> : <Badge variant="success">Active</Badge>}
                  </td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant">{new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-outline-variant flex justify-between items-center text-xs text-on-surface-variant">
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border border-outline-variant rounded disabled:opacity-30">Prev</button>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border border-outline-variant rounded disabled:opacity-30">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Plans ────────────────────────────────────────────────────────────────

function PlansTab() {
  const [builtIn, setBuiltIn] = useState({});
  const [custom, setCustom] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchPlans = () => {
    setLoading(true);
    api.get("/admin/plans").then(({ data }) => { setBuiltIn(data.builtIn); setCustom(data.custom); }).catch(() => toast.error("Couldn't load plans")).finally(() => setLoading(false));
  };

  useEffect(fetchPlans, []);

  const handleToggleActive = async (key, isActive) => {
    try {
      await api.patch(`/admin/plans/${key}`, { isActive: !isActive });
      toast.success(isActive ? "Plan deactivated" : "Plan activated");
      fetchPlans();
    } catch {
      toast.error("Couldn't update plan");
    }
  };

  if (loading) return <Skeleton height={300} className="rounded-xl" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-h2">Custom plan tiers</h3>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
          <Plus size={16} /> New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(builtIn).map(([key, p]) => (
          <div key={key} className="card opacity-70">
            <div className="flex justify-between items-start mb-2">
              <p className="font-bold capitalize">{p.label}</p>
              <Badge variant="neutral">Built-in</Badge>
            </div>
            <p className="text-2xl font-bold">₹{p.priceInPaise / 100}</p>
            <p className="text-xs text-on-surface-variant mt-2">{p.maxInstagramAccounts} accounts · {p.maxAutomations} automations · {p.maxDmsPerMonth.toLocaleString("en-IN")} DMs/mo</p>
          </div>
        ))}
        {custom.map((p) => (
          <div key={p.key} className={`card ${!p.isActive ? "opacity-50" : ""}`}>
            <div className="flex justify-between items-start mb-2">
              <p className="font-bold">{p.label}</p>
              <div className="flex gap-1">
                {p.isPubliclyVisible && <Badge variant="primary">Public</Badge>}
                <Badge variant={p.isActive ? "success" : "neutral"}>{p.isActive ? "Active" : "Inactive"}</Badge>
              </div>
            </div>
            <p className="text-2xl font-bold">₹{p.priceInPaise / 100}</p>
            <p className="text-xs text-on-surface-variant mt-2">{p.maxInstagramAccounts} accounts · {p.maxAutomations} automations · {p.maxDmsPerMonth.toLocaleString("en-IN")} DMs/mo</p>
            <p className="text-[10px] text-on-surface-variant font-mono mt-2">key: {p.key}</p>
            <button onClick={() => handleToggleActive(p.key, p.isActive)} className="mt-3 text-xs font-medium text-primary hover:underline">
              {p.isActive ? "Deactivate" : "Reactivate"}
            </button>
          </div>
        ))}
      </div>

      {showForm && <NewPlanModal onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); fetchPlans(); }} />}
    </div>
  );
}

function NewPlanModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    key: "", label: "", priceInPaise: "", maxInstagramAccounts: 1, maxAutomations: 5, maxDmsPerMonth: 1000,
    features: { publicReply: true, followGate: true, analytics: true }, isPubliclyVisible: false,
  });
  const [saving, setSaving] = useState(false);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async () => {
    if (!form.key.trim() || !form.label.trim()) return toast.error("Key and label are required");
    setSaving(true);
    try {
      await api.post("/admin/plans", { ...form, priceInPaise: Number(form.priceInPaise) * 100 });
      toast.success("Plan created");
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't create plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface-container border border-outline-variant rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-h2">New custom plan</h3>
          <button onClick={onClose}><X size={18} className="text-on-surface-variant" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm">Key (no spaces)</label>
              <input className="input-field text-sm" placeholder="agency" value={form.key} onChange={(e) => update({ key: e.target.value.toLowerCase().replace(/\s+/g, "-") })} />
            </div>
            <div>
              <label className="label-sm">Label</label>
              <input className="input-field text-sm" placeholder="Agency" value={form.label} onChange={(e) => update({ label: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label-sm">Price (₹/month)</label>
            <input type="number" className="input-field text-sm" placeholder="1499" value={form.priceInPaise} onChange={(e) => update({ priceInPaise: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label-sm text-[11px]">IG accounts</label>
              <input type="number" className="input-field text-sm" value={form.maxInstagramAccounts} onChange={(e) => update({ maxInstagramAccounts: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label-sm text-[11px]">Automations</label>
              <input type="number" className="input-field text-sm" value={form.maxAutomations} onChange={(e) => update({ maxAutomations: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label-sm text-[11px]">DMs/month</label>
              <input type="number" className="input-field text-sm" value={form.maxDmsPerMonth} onChange={(e) => update({ maxDmsPerMonth: Number(e.target.value) })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm pt-2">
            <input type="checkbox" checked={form.isPubliclyVisible} onChange={(e) => update({ isPubliclyVisible: e.target.checked })} />
            Show on public pricing page
          </label>
        </div>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full mt-6 py-2.5">
          {saving ? "Creating..." : "Create Plan"}
        </button>
      </div>
    </div>
  );
}
