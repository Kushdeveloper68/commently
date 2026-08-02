import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import {
  MessageCircle, Send, Zap, MousePointerClick, Download, Lock,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import AppLayout from "../components/AppLayout.jsx";
import { SkeletonProvider } from "../components/Skeletons.jsx";
import api from "../api/axios.js";

const CHANNEL_LABELS = { comment: "Comments", story_reply: "Story replies", dm: "Direct messages" };
const CHANNEL_COLORS = { comment: "#3C7BFA", story_reply: "#ffb68b", dm: "#bac8da" };

export default function Analytics() {
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [series, setSeries] = useState([]);
  const [posts, setPosts] = useState([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsPagination, setPostsPagination] = useState(null);
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/analytics/overview"),
      api.get("/analytics/keywords"),
      api.get("/analytics/timeseries?days=30"),
    ])
      .then(([o, k, t]) => {
        setOverview(o.data);
        setKeywords(k.data.keywords);
        setSeries(t.data.series);
      })
      .catch((err) => {
        if (err.response?.status === 403) setLocked(true);
        else toast.error("Couldn't load analytics");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (locked) return;
    setPostsLoading(true);
    api
      .get(`/analytics/posts?page=${postsPage}&limit=10`)
      .then(({ data }) => {
        setPosts(data.posts);
        setPostsPagination(data.pagination);
      })
      .catch(() => toast.error("Couldn't load post performance"))
      .finally(() => setPostsLoading(false));
  }, [postsPage, locked]);

  if (locked) return <LockedAnalytics />;

  return (
    <AppLayout>
      <SkeletonProvider>
        <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-h1 font-bold">Analytics</h1>
            <p className="text-on-surface-variant text-body-md mt-1">How your automations are performing.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high border border-outline-variant rounded-lg text-label-sm hover:border-primary transition-colors">
            <Download size={15} /> Export Report
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-8">
          {loading ? (
            [1, 2, 3, 4].map((i) => <Skeleton key={i} height={130} className="rounded-xl" />)
          ) : (
            <>
              <StatBox icon={MessageCircle} label="Total Comments" value={overview.totals.commentsMatched.toLocaleString("en-IN")} caption="Comment-triggered events" />
              <StatBox icon={Send} label="DMs Sent" value={overview.totals.dmsSent.toLocaleString("en-IN")} iconBg="bg-secondary-container" iconColor="text-secondary" caption={`${overview.totals.successRate}% success rate`} />
              <StatBox icon={Zap} label="Pending Follow Taps" value={overview.totals.pendingFollowConfirmations} iconBg="bg-tertiary-container/20" iconColor="text-tertiary" caption="Awaiting confirmation" />
              <StatBox icon={MousePointerClick} label="Conversion Rate" value={`${overview.totals.successRate}%`} caption="DMs sent / comments matched" />
            </>
          )}
        </div>

        {/* Engagement trends chart */}
        <div className="bg-surface-container rounded-xl border border-outline-variant mb-8 overflow-hidden">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-body-lg font-bold">Engagement Trends</h3>
              <p className="text-on-surface-variant text-label-sm">Daily volume: comments matched vs. DMs sent</p>
            </div>
            <div className="flex items-center gap-6">
              <Legend color="bg-primary" label="Comments" />
              <Legend color="bg-secondary" label="DMs Sent" />
            </div>
          </div>
          <div className="p-6 h-[320px] w-full">
            {loading ? (
              <Skeleton height="100%" />
            ) : series.length === 0 ? (
              <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">No activity in this range yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#23252A" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#A0AEC0", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} />
                  <YAxis tick={{ fill: "#A0AEC0", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "#161718", border: "1px solid #23252A", borderRadius: 8 }}
                    labelStyle={{ color: "#e1e2ed" }}
                    labelFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  />
                  <Line type="monotone" dataKey="commentsMatched" name="Comments" stroke="#3C7BFA" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="dmsSent" name="DMs Sent" stroke="#bac8da" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Keywords + channel distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-surface-container rounded-xl border border-outline-variant p-6">
            <h3 className="text-body-lg font-bold mb-8">Top Performing Keywords</h3>
            {loading ? (
              <Skeleton count={4} height={30} className="mb-4" />
            ) : keywords.length === 0 ? (
              <p className="text-on-surface-variant text-sm py-8 text-center">No keyword activity yet.</p>
            ) : (
              <div className="space-y-6">
                {[...keywords]
                  .sort((a, b) => b.triggeredCount - a.triggeredCount)
                  .slice(0, 5)
                  .map((k) => {
                    const max = Math.max(1, ...keywords.map((x) => x.triggeredCount));
                    return (
                      <div key={k.automationId} className="space-y-2">
                        <div className="flex justify-between items-center text-label-sm">
                          <span className="font-mono text-on-surface truncate">{k.automationName}{k.keywords?.length > 0 && ` — "${k.keywords.join('", "')}"`}</span>
                          <span className="text-on-surface-variant font-bold shrink-0 ml-2">{k.triggeredCount} triggers</span>
                        </div>
                        <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${(k.triggeredCount / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          <div className="bg-surface-container rounded-xl border border-outline-variant p-6 flex flex-col">
            <h3 className="text-body-lg font-bold mb-8">Channel Distribution</h3>
            {loading ? (
              <Skeleton circle height={160} width={160} className="mx-auto" />
            ) : (
              <ChannelDonut byChannel={overview.byChannel} />
            )}
          </div>
        </div>

        {/* Top Engaged Posts */}
        <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
          <div className="p-6 border-b border-outline-variant">
            <h3 className="text-body-lg font-bold">Top Engaged Posts</h3>
            <p className="text-on-surface-variant text-label-sm mt-1">Which posts are driving the most automated conversations</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant">
                  <th className="px-6 py-4 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Post</th>
                  <th className="px-6 py-4 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Triggered Comments</th>
                  <th className="px-6 py-4 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">DMs Sent</th>
                  <th className="px-6 py-4 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {postsLoading ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i}><td colSpan={4} className="px-6 py-4"><Skeleton height={48} /></td></tr>
                  ))
                ) : posts.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-on-surface-variant text-sm">No post-level activity yet.</td></tr>
                ) : (
                  posts.map((p) => (
                    <tr key={p.mediaId} className="hover:bg-surface-container-high/50 transition-colors">
                      <td className="px-6 py-4">
                        <a href={p.permalink || undefined} target="_blank" rel="noreferrer" className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-outline flex-shrink-0 bg-surface-container-highest">
                            {p.thumbnailUrl && <img src={p.thumbnailUrl} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-on-surface font-bold text-sm truncate max-w-xs">{p.caption}</p>
                            <p className="text-[10px] text-on-surface-variant font-mono mt-1">ID: {p.mediaId.slice(0, 12)}…</p>
                          </div>
                        </a>
                      </td>
                      <td className="px-6 py-4"><span className="text-on-surface font-bold">{p.triggeredCount.toLocaleString("en-IN")}</span></td>
                      <td className="px-6 py-4"><span className="text-on-surface font-bold">{p.dmsSentCount.toLocaleString("en-IN")}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-on-surface font-bold">{p.conversion}%</span>
                          <div className="w-12 h-1.5 bg-surface-container-highest rounded-full">
                            <div className="h-full bg-green-400 rounded-full" style={{ width: `${p.conversion}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {postsPagination && postsPagination.total > 0 && (
            <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-low">
              <span className="text-[11px] text-on-surface-variant">
                Showing {(postsPagination.page - 1) * postsPagination.limit + 1}-{Math.min(postsPagination.page * postsPagination.limit, postsPagination.total)} of {postsPagination.total} posts
              </span>
              <div className="flex gap-2">
                <button disabled={postsPage <= 1} onClick={() => setPostsPage((p) => p - 1)} className="p-1 rounded hover:bg-surface-container-highest transition-colors disabled:opacity-30">
                  <ChevronLeft size={18} />
                </button>
                <button disabled={postsPage >= postsPagination.totalPages} onClick={() => setPostsPage((p) => p + 1)} className="p-1 rounded hover:bg-surface-container-highest transition-colors disabled:opacity-30">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </SkeletonProvider>
    </AppLayout>
  );
}

function StatBox({ icon: Icon, label, value, iconBg = "bg-primary/10", iconColor = "text-primary", caption }) {
  return (
    <div className="bg-surface-container p-padding-card rounded-xl border border-outline-variant hover:border-primary/50 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <span className="text-on-surface-variant text-label-sm uppercase tracking-wider">{label}</span>
        <div className={`p-2 ${iconBg} rounded-lg`}>
          <Icon size={19} className={iconColor} />
        </div>
      </div>
      <span className="text-3xl font-bold text-on-surface">{value}</span>
      {caption && <p className="text-[11px] text-on-surface-variant mt-2 font-mono">{caption}</p>}
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-label-sm text-on-surface">{label}</span>
    </div>
  );
}

function ChannelDonut({ byChannel }) {
  const data = byChannel.filter((c) => c.matched > 0).map((c) => ({ name: CHANNEL_LABELS[c.channel], value: c.matched, color: CHANNEL_COLORS[c.channel] }));
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return <p className="text-on-surface-variant text-sm py-12 text-center">No activity yet.</p>;
  }

  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="w-40 h-40 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none">
                {data.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-on-surface">{total.toLocaleString("en-IN")}</span>
            <span className="text-[9px] uppercase tracking-widest text-on-surface-variant">Total</span>
          </div>
        </div>
        <div className="mt-10 w-full grid grid-cols-1 gap-3">
          {data.map((d) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                <span className="text-label-sm text-on-surface-variant">{d.name}</span>
              </div>
              <span className="text-label-sm font-bold text-on-surface">{Math.round((d.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function LockedAnalytics() {
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-h1 font-bold">Analytics</h1>
        <p className="text-on-surface-variant mt-1">How your automations are performing.</p>
      </div>
      <div className="bg-surface-container rounded-xl border border-outline-variant text-center py-16">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock size={20} className="text-primary" />
        </div>
        <h3 className="font-semibold text-lg mb-1.5">Analytics is a Pro feature</h3>
        <p className="text-sm text-on-surface-variant mb-6 max-w-sm mx-auto">
          Upgrade to Pro to track comment matches, DM performance, top keywords, top posts, and usage.
        </p>
        <Link to="/billing" className="btn-primary inline-block">Upgrade to Pro</Link>
      </div>
    </AppLayout>
  );
}
