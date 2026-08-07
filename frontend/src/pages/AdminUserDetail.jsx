import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import { ArrowLeft, ShieldAlert, ShieldCheck, Save } from "lucide-react";
import AppLayout from "../components/AppLayout.jsx";
import { SkeletonProvider } from "../components/Skeletons.jsx";
import Badge from "../components/ui/Badge.jsx";
import api from "../api/axios.js";

export default function AdminUserDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("");
  const [override, setOverride] = useState({ enabled: false, label: "", priceInPaise: "", maxInstagramAccounts: "", maxAutomations: "", maxDmsPerMonth: "", note: "" });
  const [quota, setQuota] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchDetail = () => {
    setLoading(true);
    api.get(`/admin/users/${id}`).then(({ data }) => {
      setData(data);
      setPlan(data.user.plan);
      setQuota(data.user.dmsSentThisMonth);
      if (data.user.customPlanOverride) {
        const o = data.user.customPlanOverride;
        setOverride({
          enabled: o.enabled || false, label: o.label || "", priceInPaise: o.priceInPaise ?? "",
          maxInstagramAccounts: o.maxInstagramAccounts ?? "", maxAutomations: o.maxAutomations ?? "",
          maxDmsPerMonth: o.maxDmsPerMonth ?? "", note: o.note || "",
        });
      }
    }).catch(() => toast.error("Couldn't load user")).finally(() => setLoading(false));
  };

  useEffect(fetchDetail, [id]);

  const handlePlanChange = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/users/${id}/plan`, { plan });
      toast.success("Plan updated");
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't update plan");
    } finally {
      setSaving(false);
    }
  };

  const handleOverrideSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/users/${id}/override`, {
        ...override,
        priceInPaise: override.priceInPaise === "" ? undefined : Number(override.priceInPaise),
        maxInstagramAccounts: override.maxInstagramAccounts === "" ? undefined : Number(override.maxInstagramAccounts),
        maxAutomations: override.maxAutomations === "" ? undefined : Number(override.maxAutomations),
        maxDmsPerMonth: override.maxDmsPerMonth === "" ? undefined : Number(override.maxDmsPerMonth),
      });
      toast.success("Override saved");
      fetchDetail();
    } catch {
      toast.error("Couldn't save override");
    } finally {
      setSaving(false);
    }
  };

  const handleSuspendToggle = async () => {
    const suspending = !data.user.isSuspended;
    const reason = suspending ? window.prompt("Reason for suspension (internal note):") : "";
    if (suspending && reason === null) return; // cancelled prompt
    try {
      await api.patch(`/admin/users/${id}/suspend`, { suspended: suspending, reason });
      toast.success(suspending ? "User suspended" : "User reactivated");
      fetchDetail();
    } catch {
      toast.error("Couldn't update suspension status");
    }
  };

  const handleQuotaSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/users/${id}/quota`, { dmsSentThisMonth: Number(quota) });
      toast.success("Quota adjusted");
      fetchDetail();
    } catch {
      toast.error("Couldn't adjust quota");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <AppLayout>
        <Skeleton height={400} className="rounded-xl" />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SkeletonProvider>
        <Link to="/admin" className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-4">
          <ArrowLeft size={15} /> Back to Admin
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-container-highest">
            {data.user.avatarUrl ? <img src={data.user.avatarUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-lg text-on-surface-variant">{data.user.name?.[0]}</div>}
          </div>
          <div>
            <h1 className="text-h1 font-bold flex items-center gap-2">{data.user.name} {data.user.isSuspended && <Badge variant="error">Suspended</Badge>}</h1>
            <p className="text-on-surface-variant">{data.user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Plan management */}
          <div className="card space-y-4">
            <h3 className="text-h2">Plan</h3>
            <div className="flex gap-2">
              <select className="input-field flex-1" value={plan} onChange={(e) => setPlan(e.target.value)}>
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
              </select>
              <button onClick={handlePlanChange} disabled={saving} className="btn-primary px-4 text-sm">Set</button>
            </div>
            <p className="text-xs text-on-surface-variant">
              Effective limits right now: {data.effectiveLimits.maxInstagramAccounts} accounts · {data.effectiveLimits.maxAutomations} automations · {data.effectiveLimits.maxDmsPerMonth.toLocaleString("en-IN")} DMs/mo
              {data.effectiveLimits.isCustomOverride && " (custom override active)"}
            </p>
          </div>

          {/* Quota */}
          <div className="card space-y-4">
            <h3 className="text-h2">DM Quota</h3>
            <div className="flex gap-2">
              <input type="number" className="input-field flex-1" value={quota} onChange={(e) => setQuota(e.target.value)} />
              <button onClick={handleQuotaSave} disabled={saving} className="btn-primary px-4 text-sm">Save</button>
            </div>
            <p className="text-xs text-on-surface-variant">Manually adjust this month's usage counter — e.g. a goodwill reset.</p>
          </div>
        </div>

        {/* Custom override */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h2">Negotiated Override</h3>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={override.enabled} onChange={(e) => setOverride((o) => ({ ...o, enabled: e.target.checked }))} />
              Enabled
            </label>
          </div>
          {override.enabled && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-sm text-[11px]">Label</label><input className="input-field text-sm" value={override.label} onChange={(e) => setOverride((o) => ({ ...o, label: e.target.value }))} /></div>
                <div><label className="label-sm text-[11px]">Price (₹/mo)</label><input type="number" className="input-field text-sm" value={override.priceInPaise} onChange={(e) => setOverride((o) => ({ ...o, priceInPaise: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label-sm text-[11px]">Accounts</label><input type="number" className="input-field text-sm" value={override.maxInstagramAccounts} onChange={(e) => setOverride((o) => ({ ...o, maxInstagramAccounts: e.target.value }))} /></div>
                <div><label className="label-sm text-[11px]">Automations</label><input type="number" className="input-field text-sm" value={override.maxAutomations} onChange={(e) => setOverride((o) => ({ ...o, maxAutomations: e.target.value }))} /></div>
                <div><label className="label-sm text-[11px]">DMs/month</label><input type="number" className="input-field text-sm" value={override.maxDmsPerMonth} onChange={(e) => setOverride((o) => ({ ...o, maxDmsPerMonth: e.target.value }))} /></div>
              </div>
              <div><label className="label-sm text-[11px]">Internal note (why this deal?)</label><input className="input-field text-sm" value={override.note} onChange={(e) => setOverride((o) => ({ ...o, note: e.target.value }))} /></div>
            </div>
          )}
          <button onClick={handleOverrideSave} disabled={saving} className="btn-primary mt-4 text-sm px-4 py-2 flex items-center gap-2">
            <Save size={15} /> Save Override
          </button>
        </div>

        {/* Suspension */}
        <div className="card mb-6 border-error/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-h2 flex items-center gap-2">
                {data.user.isSuspended ? <ShieldAlert size={18} className="text-error" /> : <ShieldCheck size={18} className="text-primary" />}
                Account Status
              </h3>
              <p className="text-sm text-on-surface-variant mt-1">
                {data.user.isSuspended ? `Suspended: ${data.user.suspendedReason || "No reason given"}` : "Account is active. Automations will pause if suspended."}
              </p>
            </div>
            <button onClick={handleSuspendToggle} className={`text-sm font-semibold px-4 py-2 rounded-lg ${data.user.isSuspended ? "bg-primary text-on-primary" : "bg-error/10 text-error border border-error/30"}`}>
              {data.user.isSuspended ? "Reactivate" : "Suspend"}
            </button>
          </div>
        </div>

        {/* Accounts + Automations summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-h2 mb-4">Instagram Accounts ({data.accounts.length})</h3>
            <div className="space-y-2">
              {data.accounts.map((a) => (
                <div key={a._id} className="flex items-center justify-between text-sm">
                  <span>@{a.username}</span>
                  {a.needsReconnect ? <Badge variant="error">Reconnect</Badge> : <Badge variant="success">Active</Badge>}
                </div>
              ))}
              {data.accounts.length === 0 && <p className="text-sm text-on-surface-variant">No accounts connected.</p>}
            </div>
          </div>
          <div className="card">
            <h3 className="text-h2 mb-4">Automations ({data.automations.length})</h3>
            <div className="space-y-2">
              {data.automations.map((a) => (
                <div key={a._id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{a.name}</span>
                  <Badge variant={a.status === "live" ? "success" : "neutral"}>{a.status}</Badge>
                </div>
              ))}
              {data.automations.length === 0 && <p className="text-sm text-on-surface-variant">No automations created.</p>}
            </div>
          </div>
        </div>
      </SkeletonProvider>
    </AppLayout>
  );
}
