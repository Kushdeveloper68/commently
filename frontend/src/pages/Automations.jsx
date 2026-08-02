import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import { Plus, Search, Pencil, Copy, Trash2, FolderOpen } from "lucide-react";
import AppLayout from "../components/AppLayout.jsx";
import { SkeletonProvider } from "../components/Skeletons.jsx";
import api from "../api/axios.js";

function timeAgo(dateStr) {
  if (!dateStr) return "Never run";
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function Automations() {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchAutomations = () => {
    setLoading(true);
    api
      .get("/automations")
      .then((res) => setAutomations(res.data.automations))
      .catch(() => toast.error("Couldn't load automations"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const counts = useMemo(
    () => ({
      all: automations.length,
      live: automations.filter((a) => a.status === "live").length,
      paused: automations.filter((a) => a.status !== "live").length,
    }),
    [automations]
  );

  const filtered = useMemo(() => {
    return automations.filter((a) => {
      if (filter === "live" && a.status !== "live") return false;
      if (filter === "paused" && a.status === "live") return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesName = a.name.toLowerCase().includes(q);
        const matchesKeyword = a.keywordMatch?.keywords?.some((k) => k.toLowerCase().includes(q));
        if (!matchesName && !matchesKeyword) return false;
      }
      return true;
    });
  }, [automations, filter, search]);

  const handleToggle = async (id) => {
    try {
      const { data } = await api.patch(`/automations/${id}/toggle`);
      setAutomations((prev) => prev.map((a) => (a._id === id ? { ...a, status: data.automation.status } : a)));
      toast.success(`Automation ${data.automation.status === "live" ? "went live" : "paused"}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't update automation");
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const { data } = await api.post(`/automations/${id}/duplicate`);
      setAutomations((prev) => [data.automation, ...prev]);
      toast.success("Automation duplicated as draft");
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't duplicate automation");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this automation permanently?")) return;
    try {
      await api.delete(`/automations/${id}`);
      setAutomations((prev) => prev.filter((a) => a._id !== id));
      toast.success("Automation deleted");
    } catch {
      toast.error("Couldn't delete automation");
    }
  };

  return (
    <AppLayout>
      <SkeletonProvider>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-h1 font-bold">Automations</h1>
            <p className="text-on-surface-variant mt-1">Manage your active comment triggers and responses.</p>
          </div>
          <Link to="/automations/new" className="btn-primary px-4 py-2 flex items-center gap-2 text-label-sm">
            <Plus size={18} /> New Automation
          </Link>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-surface p-4 border border-outline-variant rounded-xl">
          <div className="flex gap-2">
            {[
              { key: "all", label: `All (${counts.all})` },
              { key: "live", label: `Live (${counts.live})` },
              { key: "paused", label: `Paused (${counts.paused})` },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-1.5 rounded-lg text-label-sm border transition-colors ${
                  filter === f.key ? "bg-surface-container-highest text-on-surface border-outline-variant" : "border-transparent text-on-surface-variant hover:bg-surface-container-highest"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              className="input-field w-full pl-10 pr-4 py-2 text-label-sm"
              placeholder="Search keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <Skeleton height={300} className="rounded-xl" />
        ) : automations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-outline-variant rounded-xl bg-surface">
            <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-6">
              <FolderOpen size={36} className="text-on-surface-variant" />
            </div>
            <h3 className="text-h2 text-on-surface mb-2">No automations yet</h3>
            <p className="text-on-surface-variant text-center max-w-sm mb-6">
              Create your first automation to start replying to comments, Story replies, and DMs instantly.
            </p>
            <Link to="/automations/new" className="btn-primary px-6 py-3 text-label-sm">Create Automation</Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant text-sm">No automations match your filter.</div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-outline-variant">
                    <th className="py-3 px-4 text-label-sm text-on-surface-variant whitespace-nowrap">Name</th>
                    <th className="py-3 px-4 text-label-sm text-on-surface-variant whitespace-nowrap">Trigger Keywords</th>
                    <th className="py-3 px-4 text-label-sm text-on-surface-variant whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 text-label-sm text-on-surface-variant whitespace-nowrap">Replies Sent</th>
                    <th className="py-3 px-4 text-label-sm text-on-surface-variant whitespace-nowrap">Last Run</th>
                    <th className="py-3 px-4 text-label-sm text-on-surface-variant whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {filtered.map((a) => (
                    <tr key={a._id} className="hover:bg-surface-container-high transition-colors group">
                      <td className="py-4 px-4">
                        <Link to={`/automations/${a._id}`} className="text-label-sm text-on-surface hover:text-primary transition-colors">{a.name}</Link>
                        <div className="text-[12px] text-on-surface-variant mt-0.5">
                          IG: @{a.instagramAccount?.username || "unknown"}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2 flex-wrap">
                          {(a.keywordMatch?.keywords?.length > 0 ? a.keywordMatch.keywords : ["any word"]).slice(0, 3).map((k) => (
                            <span key={k} className="chip px-2 py-1 text-[11px] font-mono bg-outline-variant text-on-surface-variant rounded">{k}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggle(a._id)}
                            className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${a.status === "live" ? "bg-primary" : "bg-outline-variant"}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${a.status === "live" ? "translate-x-5" : ""}`} />
                          </button>
                          <span className="text-[12px] text-on-surface-variant">{a.status === "live" ? "Live" : "Paused"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-label-sm">{(a.stats?.dmsSentCount || 0).toLocaleString("en-IN")}</td>
                      <td className="py-4 px-4 text-[12px] text-on-surface-variant">{timeAgo(a.stats?.lastTriggeredAt)}</td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link to={`/automations/${a._id}`} className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-outline-variant rounded">
                            <Pencil size={16} />
                          </Link>
                          <button onClick={() => handleDuplicate(a._id)} className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-outline-variant rounded">
                            <Copy size={16} />
                          </button>
                          <button onClick={() => handleDelete(a._id)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-outline-variant rounded">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SkeletonProvider>
    </AppLayout>
  );
}
