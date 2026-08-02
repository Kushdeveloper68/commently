import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import {
  MessageCircle, Send, TrendingUp, UserPlus, Plus, MessageSquare, Instagram, ArrowUpRight,
} from "lucide-react";
import AppLayout from "../components/AppLayout.jsx";
import { SkeletonProvider } from "../components/Skeletons.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const CHANNEL_META = {
  comment: { label: "commented", color: "border-primary" },
  story_reply: { label: "replied to story", color: "border-tertiary" },
  dm: { label: "sent a DM", color: "border-secondary" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    api
      .get("/dashboard/overview")
      .then(({ data }) => setData(data))
      .catch(() => toast.error("Couldn't load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  const hasAlerts = data?.accounts?.some((a) => a.needsReconnect);

  return (
    <AppLayout hasAlerts={hasAlerts}>
      <SkeletonProvider>
        <div className="space-y-stack-lg pb-24">
          {/* Command Center hero */}
          <section className="relative overflow-hidden rounded-[2rem] p-8 lg:p-12 border border-outline-variant bg-surface-container-low min-h-[220px] flex flex-col justify-end">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-4 border border-primary/20">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                SYSTEMS ACTIVE
              </span>
              <h1 className="text-display-lg font-bold tracking-tighter mb-4 leading-none">Command Center.</h1>
              {loading ? (
                <Skeleton width={340} height={20} />
              ) : (
                <p className="text-on-surface-variant text-body-lg max-w-lg">
                  Welcome back, {user?.name?.split(" ")[0]}.{" "}
                  {data?.stats.commentsChangePct != null && data.stats.commentsChangePct > 0 && (
                    <>
                      Your automations are converting{" "}
                      <span className="text-primary font-bold">{data.stats.commentsChangePct}% higher</span> than last week.{" "}
                    </>
                  )}
                  {data?.stats.leadsCaptured || 0} leads captured so far.
                </p>
              )}
            </div>
          </section>

          {/* Stats grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-surface-container p-padding-card rounded-2xl">
                  <Skeleton height={100} />
                </div>
              ))
            ) : (
              <>
                <StatCard
                  icon={MessageCircle}
                  label="Comments Handled"
                  value={data.stats.commentsHandled.toLocaleString("en-IN")}
                  delta={data.stats.commentsChangePct != null ? `${data.stats.commentsChangePct > 0 ? "+" : ""}${data.stats.commentsChangePct}%` : null}
                  deltaPositive={data.stats.commentsChangePct >= 0}
                />
                <StatCard
                  icon={Send}
                  label="Automated DMs"
                  value={data.stats.dmsSent.toLocaleString("en-IN")}
                  delta={data.stats.dmsChangePct != null ? `${data.stats.dmsChangePct > 0 ? "+" : ""}${data.stats.dmsChangePct}%` : null}
                  deltaPositive={data.stats.dmsChangePct >= 0}
                />
                <StatCard
                  icon={TrendingUp}
                  label="Conversion Rate"
                  value={`${data.stats.conversionRate}%`}
                  iconBg="bg-tertiary/10"
                  iconColor="text-tertiary"
                />
                <div className="bg-primary/5 border border-primary/40 p-padding-card rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-primary text-label-sm uppercase tracking-wider">Leads Captured</span>
                    <div className="p-2 bg-primary rounded-lg">
                      <UserPlus size={19} className="text-on-primary" />
                    </div>
                  </div>
                  <span className="text-3xl font-bold text-on-surface">{data.stats.leadsCaptured.toLocaleString("en-IN")}</span>
                </div>
              </>
            )}
          </section>

          {/* Activity + Channels */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
            <div className="lg:col-span-2 glass-card rounded-3xl overflow-hidden flex flex-col min-h-[420px]">
              <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                <div>
                  <h3 className="text-h2 font-bold">Live Automation Activity</h3>
                  <p className="text-label-sm text-on-surface-variant">Real-time conversions across all channels</p>
                </div>
                <div className="flex gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(60,123,250,0.8)]" />
                  <span className="text-[10px] font-bold text-primary uppercase">Live</span>
                </div>
              </div>
              <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-surface-container-lowest/50">
                {loading ? (
                  [1, 2, 3].map((i) => <Skeleton key={i} height={64} className="rounded-xl" />)
                ) : data.activity.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-on-surface-variant text-sm py-12">
                    No activity yet — connect an Instagram account and create an automation to get started.
                  </div>
                ) : (
                  data.activity.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-l-4 ${CHANNEL_META[item.channel]?.color || "border-primary"} bg-surface-container-high/40 hover:bg-surface-container-high transition-colors`}
                    >
                      <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center shrink-0">
                        <MessageSquare size={16} className="text-on-surface-variant" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">
                          {item.commenterUsername ? `@${item.commenterUsername}` : "Someone"} {CHANNEL_META[item.channel]?.label}
                        </p>
                        <p className="text-xs text-on-surface-variant font-mono">
                          {item.automationName ? `Automation: [${item.automationName}] → ${item.dmSent ? "DM Sent" : "Failed"}` : "—"}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-outline shrink-0">{timeAgo(item.createdAt)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 flex flex-col space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-h2 font-bold">Channels</h3>
                <Link to="/connect-instagram" className="text-outline hover:text-primary">
                  <Plus size={20} />
                </Link>
              </div>
              <div className="space-y-4">
                {loading ? (
                  [1, 2].map((i) => <Skeleton key={i} height={64} className="rounded-2xl" />)
                ) : data.accounts.length === 0 ? (
                  <Link to="/connect-instagram" className="p-4 bg-surface-container rounded-2xl border border-dashed border-outline-variant flex items-center gap-3 text-on-surface-variant text-sm hover:border-primary transition-colors">
                    <Instagram size={18} /> Connect your first account
                  </Link>
                ) : (
                  data.accounts.map((acc) => (
                    <div key={acc.id} className={`p-4 bg-surface-container rounded-2xl border border-outline-variant/30 flex items-center gap-4 ${acc.needsReconnect ? "opacity-70" : ""}`}>
                      <div className={`w-12 h-12 rounded-full overflow-hidden shrink-0 ${acc.needsReconnect ? "border border-outline-variant" : "ring-2 ring-primary ring-offset-2 ring-offset-background"}`}>
                        {acc.profilePictureUrl ? (
                          <img src={acc.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant text-xs font-bold">
                            {acc.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">@{acc.username}</p>
                        <p className={`text-xs ${acc.needsReconnect ? "text-error" : "text-tertiary"}`}>
                          {acc.needsReconnect ? "Re-auth required" : `Active • ${acc.triggerCount.toLocaleString("en-IN")} DMs sent`}
                        </p>
                      </div>
                      <span className={`h-2 w-2 rounded-full shrink-0 ${acc.needsReconnect ? "bg-error" : "bg-primary"}`} />
                    </div>
                  ))
                )}
              </div>
              {!loading && (
                <div className="mt-auto">
                  <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
                    <p className="text-xs font-bold text-primary mb-2 uppercase tracking-widest">Delivery Health</p>
                    <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${data.stats.deliveryHealth}%` }} />
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-2 text-right">{data.stats.deliveryHealth}% successful delivery</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </SkeletonProvider>

      <Link
        to="/automations/new"
        className="fixed bottom-8 right-8 z-40 flex items-center gap-3 px-6 py-4 bg-primary text-on-primary rounded-2xl shadow-2xl hover:scale-105 transition-all duration-300 active:scale-95 group"
      >
        <Plus size={20} className="group-hover:rotate-90 transition-transform" />
        <span className="font-bold text-sm hidden sm:inline">New Automation</span>
      </Link>
    </AppLayout>
  );
}
