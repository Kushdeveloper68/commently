import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import { Instagram, RefreshCw, Settings, LogOut, Plus, Camera, Gauge, Bot, ArrowRight } from "lucide-react";
import AppLayout from "../components/AppLayout.jsx";
import { SkeletonProvider } from "../components/Skeletons.jsx";
import api from "../api/axios.js";

function timeAgo(dateStr) {
  if (!dateStr) return "Never synced";
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatFollowers(n) {
  if (n == null) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export default function ConnectInstagram() {
  const [accounts, setAccounts] = useState([]);
  const [automationCount, setAutomationCount] = useState(0);
  const [deliveryHealth, setDeliveryHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [searchParams] = useSearchParams();

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get("/instagram/accounts"),
      api.get("/automations"),
      api.get("/dashboard/overview"),
    ])
      .then(([acc, auto, dash]) => {
        setAccounts(acc.data.accounts);
        setAutomationCount(auto.data.automations.filter((a) => a.status === "live").length);
        setDeliveryHealth(dash.data.stats.deliveryHealth);
      })
      .catch(() => toast.error("Couldn't load account data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
    const error = searchParams.get("error");
    if (error === "account_already_linked") {
      toast.error("That Instagram account is already connected to another DMLoop account. Disconnect it there first, or contact support.");
    } else if (error === "account_limit_reached") {
      toast.error("You've reached your plan's Instagram account limit. Upgrade to connect more.");
    } else if (error) {
      toast.error("Couldn't connect Instagram. Please try again.");
    }
  }, [searchParams]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { data } = await api.get("/instagram/connect");
      window.location.href = data.authUrl;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to start connection");
      setConnecting(false);
    }
  };

  const handleSync = async (id) => {
    setSyncingId(id);
    try {
      const { data } = await api.post(`/instagram/accounts/${id}/sync`);
      setAccounts((prev) => prev.map((a) => (a._id === id ? data.account : a)));
      toast.success("Synced");
    } catch (err) {
      toast.error(err.response?.data?.error || "Sync failed");
    } finally {
      setSyncingId(null);
    }
  };

  const handleDisconnect = async (id) => {
    if (!confirm("Disconnect this Instagram account? Its automations will stop working.")) return;
    try {
      await api.delete(`/instagram/accounts/${id}`);
      toast.success("Account disconnected");
      fetchAll();
    } catch {
      toast.error("Couldn't disconnect account");
    }
  };

  return (
    <AppLayout>
      <SkeletonProvider>
        <div className="flex justify-between items-end mb-10 flex-wrap gap-4">
          <div>
            <h1 className="text-h1 text-on-surface">Instagram Accounts</h1>
            <p className="text-body-md text-on-surface-variant mt-2 max-w-2xl">Manage and monitor your connected Instagram profiles and their connection status.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="border border-outline-variant bg-surface-container px-5 py-2.5 rounded-xl font-medium text-label-sm flex items-center gap-2 hover:bg-surface-container-highest transition-colors">
              <RefreshCw size={16} /> Refresh
            </button>
            <button onClick={handleConnect} disabled={connecting} className="btn-primary px-5 py-2.5 rounded-xl flex items-center gap-2 text-label-sm">
              <Plus size={16} /> {connecting ? "Redirecting..." : "Connect Account"}
            </button>
          </div>
        </div>

        {loading ? (
          <Skeleton height={300} className="rounded-xl mb-6" />
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-surface-container border border-dashed border-outline-variant rounded-xl mb-6">
            <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-6 border border-outline-variant">
              <Camera size={40} className="text-outline-variant" />
            </div>
            <h3 className="text-h2 text-on-surface mb-2">No Accounts Connected</h3>
            <p className="text-on-surface-variant text-body-md max-w-sm mb-8">Ready to automate? Connect your first Instagram Business or Creator account to get started.</p>
            <button onClick={handleConnect} disabled={connecting} className="btn-primary px-8 py-3 rounded-xl font-bold flex items-center gap-2">
              <Plus size={18} /> Connect Your First Account
            </button>
          </div>
        ) : (
          <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden mb-8">
            <div className="px-padding-card py-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
              <h3 className="text-[16px] text-on-surface font-semibold">Connected Profiles ({accounts.length})</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-[12px] text-on-surface-variant font-mono">Live</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-lowest text-on-surface-variant uppercase text-[11px] tracking-wider border-b border-outline-variant">
                  <tr>
                    <th className="px-padding-card py-4 font-semibold">Profile</th>
                    <th className="px-4 py-4 font-semibold">Type</th>
                    <th className="px-4 py-4 font-semibold">Followers</th>
                    <th className="px-4 py-4 font-semibold">Status</th>
                    <th className="px-4 py-4 font-semibold">Last Sync</th>
                    <th className="px-padding-card py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {accounts.map((acc) => (
                    <tr key={acc._id} className="hover:bg-surface-container-high transition-colors group">
                      <td className="px-padding-card py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant shrink-0 bg-surface-container-highest">
                            {acc.profilePictureUrl ? (
                              <img src={acc.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-xs font-bold">{acc.username?.[0]?.toUpperCase()}</div>
                            )}
                          </div>
                          <p className="text-on-surface font-bold text-label-sm leading-tight">@{acc.username}</p>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant rounded text-[11px] font-medium uppercase border border-outline-variant">
                          {acc.accountType === "BUSINESS" ? "Business" : acc.accountType === "MEDIA_CREATOR" ? "Creator" : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <span className="text-on-surface font-mono font-medium">{formatFollowers(acc.followersCount)}</span>
                      </td>
                      <td className="px-4 py-5">
                        {acc.needsReconnect ? (
                          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-tertiary-container/10 border border-tertiary/20 w-fit">
                            <div className="w-1.5 h-1.5 bg-tertiary rounded-full" />
                            <span className="text-[12px] text-tertiary font-medium">Action Required</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-primary-container/10 border border-primary/20 w-fit">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            <span className="text-[12px] text-primary font-medium">Connected</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-5">
                        {acc.needsReconnect ? (
                          <span className="text-error text-[13px] font-medium">Token Expired</span>
                        ) : (
                          <span className="text-on-surface-variant text-[13px]">{timeAgo(acc.lastRefreshedAt)}</span>
                        )}
                      </td>
                      <td className="px-padding-card py-5 text-right space-x-1">
                        {acc.needsReconnect ? (
                          <button onClick={handleConnect} className="bg-primary text-on-primary px-3 py-1.5 rounded-lg text-[12px] font-bold hover:brightness-110">Reconnect</button>
                        ) : (
                          <button onClick={() => handleSync(acc._id)} disabled={syncingId === acc._id} className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-highest rounded-lg transition-all" title="Sync">
                            <RefreshCw size={17} className={syncingId === acc._id ? "animate-spin" : ""} />
                          </button>
                        )}
                        <button onClick={() => handleDisconnect(acc._id)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-all" title="Disconnect">
                          <LogOut size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bento info grid — real metrics only */}
        {!loading && accounts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-primary bg-primary/10 p-2 rounded-lg"><Gauge size={19} /></span>
                <span className="text-[11px] text-primary font-bold uppercase tracking-widest">Delivery</span>
              </div>
              <div>
                <p className="text-[28px] font-mono font-bold text-on-surface leading-tight">{deliveryHealth}%</p>
                <p className="text-[13px] text-on-surface-variant">Successful DM delivery rate</p>
              </div>
              <div className="w-full bg-outline-variant h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${deliveryHealth}%` }} />
              </div>
            </div>
            <div className="bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-tertiary bg-tertiary/10 p-2 rounded-lg"><Bot size={19} /></span>
                <span className="text-[11px] text-tertiary font-bold uppercase tracking-widest">Automations</span>
              </div>
              <div>
                <p className="text-[28px] font-mono font-bold text-on-surface leading-tight">{automationCount}</p>
                <p className="text-[13px] text-on-surface-variant">Currently live, across all accounts</p>
              </div>
            </div>
            <Link to="/analytics" className="bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col gap-4 group cursor-pointer hover:bg-surface-container-high transition-all">
              <div className="flex items-center justify-between">
                <span className="text-outline bg-outline/10 p-2 rounded-lg"><Instagram size={19} /></span>
                <span className="text-[11px] text-outline font-bold uppercase tracking-widest">Activity</span>
              </div>
              <div>
                <p className="text-on-surface font-bold text-[16px]">View Analytics</p>
                <p className="text-[13px] text-on-surface-variant mt-1">Check detailed logs of every interaction and automated response.</p>
              </div>
              <div className="mt-auto flex items-center text-primary text-[13px] font-medium group-hover:gap-2 transition-all">
                View Logs <ArrowRight size={16} />
              </div>
            </Link>
          </div>
        )}
      </SkeletonProvider>
    </AppLayout>
  );
}