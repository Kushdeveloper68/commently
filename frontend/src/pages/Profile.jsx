import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Save, Trash2, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import AppLayout from "../components/AppLayout.jsx";
import api from "../api/axios.js";

const TIMEZONES = [
  "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London",
  "America/New_York", "America/Los_Angeles", "UTC",
];

const TABS = ["Profile", "Notifications", "Security", "Integrations"];

export default function Profile() {
  const { user, logout, refetch } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("Profile");

  return (
    <AppLayout>
      <div className="max-w-3xl">
        <header className="mb-8">
          <h1 className="text-h1 text-on-surface mb-2">Settings</h1>
          <p className="text-body-md text-on-surface-variant">Manage your account preferences, notifications, and security.</p>
        </header>

        <div className="flex gap-8 border-b border-outline-variant mb-8 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 text-label-sm whitespace-nowrap transition-all ${
                tab === t ? "text-primary border-b-2 border-primary font-semibold" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Profile" && <ProfileTab user={user} refetch={refetch} />}
        {tab === "Notifications" && <NotificationsTab user={user} refetch={refetch} />}
        {tab === "Security" && <SecurityTab logout={logout} navigate={navigate} />}
        {tab === "Integrations" && <IntegrationsTab />}
      </div>
    </AppLayout>
  );
}

function ProfileTab({ user, refetch }) {
  const [name, setName] = useState(user?.name || "");
  const [timezone, setTimezone] = useState(user?.timezone || "Asia/Kolkata");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/auth/profile", { name, timezone });
      toast.success("Profile updated");
      refetch();
    } catch {
      toast.error("Couldn't save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface-container border border-outline-variant rounded-xl p-padding-card">
        <h3 className="text-h2 mb-6">Personal Information</h3>
        <div className="flex items-center gap-6 mb-8 p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold ring-2 ring-primary/20">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-label-sm text-on-surface font-medium">Synced from your Google account</p>
            <p className="text-[12px] text-on-surface-variant opacity-60">To change your photo, update it in your Google account.</p>
          </div>
        </div>

        <div className="space-y-4">
          <FieldRow label="Full Name">
            <input className="input-field w-full" value={name} onChange={(e) => setName(e.target.value)} />
          </FieldRow>
          <FieldRow label="Email Address">
            <input className="input-field w-full opacity-50 cursor-not-allowed" disabled value={user?.email || ""} />
            <p className="text-[12px] text-on-surface-variant mt-1 italic">Tied to your Google account — can't be changed here.</p>
          </FieldRow>
          <FieldRow label="Timezone">
            <select className="input-field w-full" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </FieldRow>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 px-5 py-2.5">
          <Save size={17} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function NotificationsTab({ user, refetch }) {
  const [prefs, setPrefs] = useState(user?.emailPreferences || { quotaAlerts: true, billingReceipts: true });

  const handleToggle = async (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      await api.patch("/auth/notification-preferences", next);
      toast.success("Preference saved");
      refetch();
    } catch {
      toast.error("Couldn't save preference");
      setPrefs(prefs);
    }
  };

  return (
    <div className="bg-surface-container border border-outline-variant rounded-xl p-padding-card">
      <h3 className="text-h2 mb-2">Email Alerts</h3>
      <p className="text-body-md text-on-surface-variant mb-6">Choose what you want to be notified about via email.</p>
      <div className="space-y-1 divide-y divide-outline-variant/30">
        <ToggleRow
          title="Usage Alerts"
          desc="Get warned at 80% and 100% of your monthly DM limit."
          checked={prefs.quotaAlerts}
          onClick={() => handleToggle("quotaAlerts")}
        />
        <ToggleRow
          title="Billing Receipts"
          desc="Payment confirmations and cancellation emails."
          checked={prefs.billingReceipts}
          onClick={() => handleToggle("billingReceipts")}
        />
      </div>
    </div>
  );
}

function SecurityTab({ logout, navigate }) {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    try {
      await api.delete("/auth/account");
      toast.success("Your account has been deleted.");
      await logout();
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not delete account. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div className="bg-surface-container border border-error/20 rounded-xl p-padding-card">
      <h3 className="text-h2 text-error mb-2 flex items-center gap-2">
        <Trash2 size={19} /> Delete Account
      </h3>
      <p className="text-body-md text-on-surface-variant mb-6">
        This permanently deletes your account, disconnects all Instagram accounts, and removes every
        automation, interaction log, and subscription record. This can't be undone.
      </p>

      {!showConfirm ? (
        <button onClick={() => setShowConfirm(true)} className="bg-error/10 border border-error/30 text-error px-4 py-2 rounded-lg text-label-sm hover:bg-error/20 transition-colors">
          Delete Account
        </button>
      ) : (
        <div className="space-y-3 max-w-sm">
          <label className="label-sm">
            Type <span className="font-mono text-on-surface">DELETE</span> to confirm
          </label>
          <input className="input-field w-full" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={confirmText !== "DELETE" || deleting}
              className="bg-error text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {deleting ? "Deleting..." : "Permanently delete"}
            </button>
            <button onClick={() => { setShowConfirm(false); setConfirmText(""); }} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function IntegrationsTab() {
  const integrations = [
    { name: "Slack", desc: "Send alerts to channels" },
    { name: "Zapier", desc: "Automate with 5000+ apps" },
    { name: "Webhook exports", desc: "Push every lead to your CRM" },
  ];
  return (
    <div className="bg-surface-container border border-outline-variant rounded-xl p-padding-card">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={18} className="text-primary" />
        <h3 className="text-h2">Coming Soon</h3>
      </div>
      <p className="text-body-md text-on-surface-variant mb-6">Third-party integrations are on our roadmap — here's what's planned.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {integrations.map((i) => (
          <div key={i.name} className="p-4 bg-surface-container-low border border-dashed border-outline-variant rounded-xl">
            <p className="text-label-sm font-semibold">{i.name}</p>
            <p className="text-[12px] text-on-surface-variant mt-1">{i.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      <label className="text-label-sm text-on-surface pt-2.5">{label}</label>
      <div className="md:col-span-2">{children}</div>
    </div>
  );
}

function ToggleRow({ title, desc, checked, onClick }) {
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <p className="text-label-sm text-on-surface">{title}</p>
        <p className="text-[13px] text-on-surface-variant">{desc}</p>
      </div>
      <button onClick={onClick} className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${checked ? "bg-primary" : "bg-outline-variant"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`} />
      </button>
    </div>
  );
}
