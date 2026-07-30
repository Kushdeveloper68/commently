import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Send, Target, Clock, Lock } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import AppLayout from "../components/AppLayout.jsx";
import { DashboardStatsSkeleton, ListRowSkeleton } from "../components/Skeletons.jsx";
import api from "../api/axios.js";

const RANGE_OPTIONS = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

export default function Analytics() {
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [activity, setActivity] = useState([]);
  const [series, setSeries] = useState([]);
  const [leads, setLeads] = useState([]);
  const [rangeDays, setRangeDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/analytics/overview"),
      api.get("/analytics/keywords"),
      api.get("/analytics/activity?limit=10"),
      api.get(`/analytics/timeseries?days=${rangeDays}`),
      api.get("/analytics/leads?limit=8"),
    ])
      .then(([o, k, a, t, l]) => {
        setOverview(o.data);
        setKeywords(k.data.keywords);
        setActivity(a.data.activity);
        setSeries(t.data.series);
        setLeads(l.data.leads);
      })
      .catch((err) => {
        if (err.response?.status === 403) setLocked(true);
      })
      .finally(() => setLoading(false));
  }, [rangeDays]);

  if (locked) return <LockedAnalytics />;

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Analytics</h1>
        <p className="text-muted mt-1">How your automations are performing, in one place.</p>
      </div>

      {loading ? (
        <DashboardStatsSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <StatCard icon={Target} label="Comments matched" value={overview.totals.commentsMatched} />
            <StatCard icon={Send} label="DMs sent" value={overview.totals.dmsSent} />
            <StatCard icon={TrendingUp} label="Success rate" value={`${overview.totals.successRate}%`} />
            <StatCard icon={Clock} label="Pending follow taps" value={overview.totals.pendingFollowConfirmations} />
          </div>

          <div className="flex gap-3 mb-6">
            {overview.byChannel.map((c) => (
              <div key={c.channel} className="card flex-1 py-3">
                <div className="text-xs text-muted mb-1">{CHANNEL_LABELS[c.channel]}</div>
                <div className="font-display text-xl font-bold text-gold-bright">
                  {c.dmsSent} <span className="text-sm text-muted font-normal">/ {c.matched} matched</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="card col-span-2">
              <UsageBar usage={overview.usage} />
            </div>
            <div className="card">
              <div className="text-sm text-muted mb-1">Subscription</div>
              {overview.subscription ? (
                <>
                  <div className="font-display text-2xl font-bold text-gold-bright capitalize">
                    {overview.subscription.plan}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    Renews {new Date(overview.subscription.renewsAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted mt-2">No active subscription</div>
              )}
            </div>
          </div>

          <div className="card mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Activity trend</h2>
              <div className="flex gap-1">
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    onClick={() => setRangeDays(opt.days)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                      rangeDays === opt.days
                        ? "bg-gold/10 text-gold-bright"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <TrendChart series={series} />
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <KeywordPerformance keywords={keywords} />
            <RecentActivity activity={activity} loading={false} />
          </div>

          <LeadsTable leads={leads} />
        </>
      )}
    </AppLayout>
  );
}

const CHANNEL_LABELS = {
  comment: "Comments",
  story_reply: "Story replies",
  dm: "Direct messages",
};

function LeadsTable({ leads }) {
  return (
    <div className="card mb-8">
      <h2 className="font-semibold text-lg mb-4">Leads</h2>
      <p className="text-xs text-muted -mt-3 mb-4">People who engaged and got a DM, across all channels.</p>
      {leads.length === 0 ? (
        <div className="text-sm text-muted py-8 text-center">No leads captured yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-border">
                <th className="pb-2 font-medium">Person</th>
                <th className="pb-2 font-medium">Channel(s)</th>
                <th className="pb-2 font-medium">Interactions</th>
                <th className="pb-2 font-medium">Last automation</th>
                <th className="pb-2 font-medium">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-border last:border-0">
                  <td className="py-2.5 font-medium">
                    {lead.commenterUsername ? `@${lead.commenterUsername}` : "IG user"}
                  </td>
                  <td className="py-2.5 text-muted">
                    {lead.channels.map((c) => CHANNEL_LABELS[c]).join(", ")}
                  </td>
                  <td className="py-2.5">{lead.interactionCount}</td>
                  <td className="py-2.5 text-muted">{lead.lastAutomationName || "—"}</td>
                  <td className="py-2.5 text-muted">
                    {new Date(lead.lastInteractionAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 text-muted text-sm mb-2">
        <Icon size={16} /> {label}
      </div>
      <div className="font-display text-3xl font-bold text-gold-bright">{value}</div>
    </div>
  );
}

function UsageBar({ usage }) {
  const pct = Math.min(100, usage.usagePercent);
  const nearLimit = pct >= 80;
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-muted">Monthly DM usage</div>
        <div className="text-sm font-medium">
          {usage.dmsSentThisMonth.toLocaleString("en-IN")} / {usage.maxDmsPerMonth.toLocaleString("en-IN")}
        </div>
      </div>
      <div className="h-2.5 bg-panel2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${nearLimit ? "bg-danger" : "bg-gold"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {nearLimit && (
        <p className="text-xs text-danger mt-2">
          You're close to your monthly limit —{" "}
          <Link to="/billing" className="underline">
            upgrade
          </Link>{" "}
          to avoid automations pausing.
        </p>
      )}
    </>
  );
}

function TrendChart({ series }) {
  if (series.length === 0) {
    return <div className="text-sm text-muted py-12 text-center">No activity in this range yet.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={series} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="commentsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#c9a86a" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#c9a86a" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="dmsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6ac98a" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#6ac98a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,106,0.08)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#a39a8a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        />
        <YAxis tick={{ fill: "#a39a8a", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(201,168,106,0.2)", borderRadius: 8 }}
          labelStyle={{ color: "#ece7dd" }}
          labelFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        />
        <Area
          type="monotone"
          dataKey="commentsMatched"
          name="Comments matched"
          stroke="#c9a86a"
          fill="url(#commentsGrad)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="dmsSent"
          name="DMs sent"
          stroke="#6ac98a"
          fill="url(#dmsGrad)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function KeywordPerformance({ keywords }) {
  const top = [...keywords].sort((a, b) => b.triggeredCount - a.triggeredCount).slice(0, 6);
  const maxCount = Math.max(1, ...top.map((k) => k.triggeredCount));

  return (
    <div className="card">
      <h2 className="font-semibold text-lg mb-4">Top keywords</h2>
      {top.length === 0 ? (
        <div className="text-sm text-muted py-8 text-center">No keyword activity yet.</div>
      ) : (
        <div className="space-y-4">
          {top.map((k) => (
            <div key={k.automationId}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium truncate">
                  {k.automationName}
                  {k.keywords?.length > 0 && (
                    <span className="text-muted font-normal"> — {k.keywords.join(", ")}</span>
                  )}
                </span>
                <span className="text-muted whitespace-nowrap ml-2">{k.triggeredCount} matches</span>
              </div>
              <div className="h-2 bg-panel2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold rounded-full"
                  style={{ width: `${(k.triggeredCount / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentActivity({ activity, loading }) {
  return (
    <div className="card">
      <h2 className="font-semibold text-lg mb-4">Recent activity</h2>
      {loading ? (
        <ListRowSkeleton rows={4} />
      ) : activity.length === 0 ? (
        <div className="text-sm text-muted py-8 text-center">No comments matched yet.</div>
      ) : (
        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
          {activity.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
              <div className="min-w-0">
                <div className="text-sm">
                  <span className="font-medium">@{item.commenterUsername || "unknown"}</span>{" "}
                  <span className="text-muted">on {item.automationName}</span>
                </div>
                <div className="text-xs text-muted truncate mt-0.5">{item.commentText}</div>
              </div>
              <ActivityBadge item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityBadge({ item }) {
  if (item.gateStatus === "pending_follow") {
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gold/10 text-gold-bright whitespace-nowrap">Awaiting follow</span>;
  }
  if (item.dmSent) {
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success whitespace-nowrap">DM sent</span>;
  }
  return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-danger/10 text-danger whitespace-nowrap">Failed</span>;
}

function LockedAnalytics() {
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Analytics</h1>
        <p className="text-muted mt-1">How your automations are performing, in one place.</p>
      </div>
      <div className="card text-center py-16">
        <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
          <Lock size={20} className="text-gold-bright" />
        </div>
        <h3 className="font-semibold text-lg mb-1.5">Analytics is a Pro feature</h3>
        <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
          Upgrade to Pro to track comment matches, DM performance, top keywords, and usage — all in one dashboard.
        </p>
        <Link to="/billing" className="btn-primary inline-block">
          Upgrade to Pro
        </Link>
      </div>
    </AppLayout>
  );
}