import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import { ArrowLeft, ShieldAlert, ShieldCheck, Save, Trash2, Clock } from "lucide-react";
import AppLayout from "../components/AppLayout.jsx";
import { SkeletonProvider } from "../components/Skeletons.jsx";
import Badge from "../components/ui/Badge.jsx";
import api from "../api/axios.js";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// <input type="date"> needs yyyy-mm-dd — this also naturally handles null/undefined
function toDateInputValue(d) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toISOString().slice(0, 10);
}

const OVERRIDE_STATUS_BADGE = {
  scheduled: { variant: "primary", label: "Scheduled" },
  active: { variant: "success", label: "Active" },
  expired: { variant: "error", label: "Expired — awaiting renewal" },
};

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("");
  const [override, setOverride] = useState({
    enabled: false,
    label: "",
    priceInPaise: "",
    maxInstagramAccounts: "",
    maxAutomations: "",
    maxDmsPerMonth: "",
    note: "",
    effectiveFrom: "",
    durationDays: "30",
  });
  const [quota, setQuota] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDetail = () => {
    setLoading(true);
    api.get(`/admin/users/${id}`).then(({ data }) => {
      setData(data);
      setPlan(data.user.plan);
      setQuota(data.user.dmsSentThisMonth);
      if (data.user.customPlanOverride) {
        const o = data.user.customPlanOverride;
        setOverride({
          enabled: o.enabled || false,
          label: o.label || "",
          // Stored in paise (smallest unit) like everywhere else in the
          // app — the input field is rupees, so divide for display. Saving
          // does the inverse (×100) below. Without this round-trip, typing
          // "1499" here saved literally 1499 paise (₹14.99) instead of
          // ₹1499 (149900 paise).
          priceInPaise: o.priceInPaise != null ? o.priceInPaise / 100 : "",
          maxInstagramAccounts: o.maxInstagramAccounts ?? "",
          maxAutomations: o.maxAutomations ?? "",
          maxDmsPerMonth: o.maxDmsPerMonth ?? "",
          note: o.note || "",
          effectiveFrom: toDateInputValue(o.effectiveFrom) || toDateInputValue(new Date()),
          durationDays: o.durationDays ?? 30,
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
        // Rupees entered in the form → paise for storage (×100) — matches
        // the Plan-creation form's convention (see UsersTab/CreatePlanModal:
        // `priceInPaise: Number(form.priceInPaise) * 100`).
        priceInPaise: override.priceInPaise === "" ? undefined : Math.round(Number(override.priceInPaise) * 100),
        maxInstagramAccounts: override.maxInstagramAccounts === "" ? undefined : Number(override.maxInstagramAccounts),
        maxAutomations: override.maxAutomations === "" ? undefined : Number(override.maxAutomations),
        maxDmsPerMonth: override.maxDmsPerMonth === "" ? undefined : Number(override.maxDmsPerMonth),
        durationDays: override.durationDays === "" ? undefined : Number(override.durationDays),
        // effectiveFrom stays as the yyyy-mm-dd string — the backend parses
        // it with `new Date(...)`, which handles that format fine.
      });
      toast.success("Override saved");
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't save override");
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

  const handleDeleteUser = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("User deleted");
      navigate("/admin");
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't delete user");
      setDeleting(false);
    }
  };

  if (loading || !data) {
    return (
      <AppLayout>
        <Skeleton height={400} className="rounded-xl" />
      </AppLayout>
    );
  }

  const overrideStatus = data.user.customPlanOverrideStatus; // { state, label, effectiveFrom, periodEnd, priceInPaise } | null
  const statusBadge = overrideStatus && OVERRIDE_STATUS_BADGE[overrideStatus.state];

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
            {/* Underlying self-serve subscription period, independent of any override overlay */}
            <div className="pt-3 border-t border-outline-variant/50 flex items-center gap-2 text-xs text-on-surface-variant">
              <Clock size={13} />
              Took this plan on <span className="text-on-surface font-medium">{formatDate(data.user.planStartedAt)}</span>
              {data.user.planRenewsAt && (
                <> · ends <span className="text-on-surface font-medium">{formatDate(data.user.planRenewsAt)}</span></>
              )}
            </div>
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
            <div className="flex items-center gap-3">
              <h3 className="text-h2">Negotiated Plan</h3>
              {statusBadge && <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={override.enabled} onChange={(e) => setOverride((o) => ({ ...o, enabled: e.target.checked }))} />
              Enabled
            </label>
          </div>

          {overrideStatus && (
            <p className="text-xs text-on-surface-variant mb-4">
              {overrideStatus.state === "scheduled" && <>Starts <span className="text-on-surface font-medium">{formatDate(overrideStatus.effectiveFrom)}</span> — until then, this user's current plan/subscription keeps running as normal.</>}
              {overrideStatus.state === "active" && <>Active since <span className="text-on-surface font-medium">{formatDate(overrideStatus.effectiveFrom)}</span>, renews/ends <span className="text-on-surface font-medium">{formatDate(overrideStatus.periodEnd)}</span>.</>}
              {overrideStatus.state === "expired" && <>Ended <span className="text-on-surface font-medium">{formatDate(overrideStatus.periodEnd)}</span> — the user sees a "Renew" prompt in Billing until they pay again or you disable this.</>}
            </p>
          )}

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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-sm text-[11px]">Starts on</label>
                  <input type="date" className="input-field text-sm" value={override.effectiveFrom} onChange={(e) => setOverride((o) => ({ ...o, effectiveFrom: e.target.value }))} />
                  <p className="text-[10px] text-on-surface-variant mt-1">Leave as today for "apply immediately." Any active plan/subscription this user has stays running until this date, then gets overwritten automatically.</p>
                </div>
                <div>
                  <label className="label-sm text-[11px]">Cycle length (days)</label>
                  <input type="number" className="input-field text-sm" value={override.durationDays} onChange={(e) => setOverride((o) => ({ ...o, durationDays: e.target.value }))} />
                  <p className="text-[10px] text-on-surface-variant mt-1">When this many days pass, the plan ends and the user is prompted to renew at the same price.</p>
                </div>
              </div>
              <div><label className="label-sm text-[11px]">Internal note (why this deal?)</label><input className="input-field text-sm" value={override.note} onChange={(e) => setOverride((o) => ({ ...o, note: e.target.value }))} /></div>
            </div>
          )}
          <button onClick={handleOverrideSave} disabled={saving} className="btn-primary mt-4 text-sm px-4 py-2 flex items-center gap-2">
            <Save size={15} /> Save Negotiated Plan
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

        {/* Subscription history — every plan/renewal this user has paid for, self-serve or negotiated-plan renewal receipts alike */}
        <div className="card mb-6 p-0 overflow-hidden">
          <h3 className="text-h2 p-padding-card pb-4">Subscription History ({data.subscriptions.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-high text-[11px] text-on-surface-variant uppercase tracking-wider border-y border-outline-variant">
                  <th className="px-4 py-2.5">Plan</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Started</th>
                  <th className="px-4 py-2.5">Ends</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {data.subscriptions.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-on-surface-variant">No subscriptions yet.</td></tr>
                ) : (
                  data.subscriptions.map((s) => (
                    <tr key={s._id}>
                      <td className="px-4 py-2.5 text-sm capitalize">{s.plan === "custom_override" ? "Custom plan renewal" : s.plan}</td>
                      <td className="px-4 py-2.5 text-sm font-mono">₹{(s.amount / 100).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2.5 text-sm text-on-surface-variant">{formatDate(s.periodStart)}</td>
                      <td className="px-4 py-2.5 text-sm text-on-surface-variant">{formatDate(s.periodEnd)}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={s.status === "active" ? "success" : s.status === "created" ? "neutral" : "error"}>{s.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete user */}
        <div className="card mb-6 border-error/30">
          <h3 className="text-h2 text-error mb-2 flex items-center gap-2">
            <Trash2 size={18} /> Delete User
          </h3>
          <p className="text-sm text-on-surface-variant mb-4">
            Permanently deletes this user, their Instagram accounts, automations, interaction logs, and
            subscription records. This can't be undone.
          </p>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} className="bg-error/10 border border-error/30 text-error px-4 py-2 rounded-lg text-sm hover:bg-error/20 transition-colors">
              Delete User
            </button>
          ) : (
            <div className="space-y-3 max-w-sm">
              <label className="label-sm">Type <span className="font-mono text-on-surface">DELETE</span> to confirm</label>
              <input className="input-field" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
              <div className="flex gap-2">
                <button onClick={handleDeleteUser} disabled={deleteConfirm !== "DELETE" || deleting} className="bg-error text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90">
                  {deleting ? "Deleting..." : "Permanently delete"}
                </button>
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm(""); }} className="btn-secondary text-sm">Cancel</button>
              </div>
            </div>
          )}
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