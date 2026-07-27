import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import AppLayout from "../components/AppLayout.jsx";
import { AutomationCardSkeleton } from "../components/Skeletons.jsx";
import api from "../api/axios.js";

export default function Automations() {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAutomations = () => {
    setLoading(true);
    api
      .get("/automations")
      .then((res) => setAutomations(res.data.automations))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const handleToggle = async (id) => {
    const { data } = await api.patch(`/automations/${id}/toggle`);
    setAutomations((prev) => prev.map((a) => (a._id === id ? data.automation : a)));
    toast.success(`Automation ${data.automation.status === "live" ? "went live" : "paused"}`);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this automation permanently?")) return;
    await api.delete(`/automations/${id}`);
    setAutomations((prev) => prev.filter((a) => a._id !== id));
    toast.success("Automation deleted");
  };

  return (
    <AppLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Automations</h1>
          <p className="text-muted mt-1">Manage your comment-to-DM flows.</p>
        </div>
        <Link to="/automations/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New automation
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => <AutomationCardSkeleton key={i} />)}
        </div>
      ) : automations.length === 0 ? (
        <div className="card text-center py-16">
          <MessageCircle size={40} className="mx-auto text-muted mb-4" />
          <h3 className="font-semibold mb-2">No automations yet</h3>
          <p className="text-sm text-muted mb-6">Create your first comment-to-DM automation.</p>
          <Link to="/automations/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> Create automation
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {automations.map((a) => (
            <div key={a._id} className="card">
              <div className="flex items-center justify-between">
                <Link to={`/automations/${a._id}`} className="flex-1">
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-muted mt-1 flex items-center gap-3">
                    <span className="capitalize">{a.status}</span>
                    <span>•</span>
                    <span>{a.keywordMatch?.keywords?.join(", ") || "any word"}</span>
                    <span>•</span>
                    <span>{a.stats?.dmsSentCount || 0} DMs sent</span>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(a._id)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      a.status === "live" ? "bg-gold" : "bg-panel2"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        a.status === "live" ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleDelete(a._id)}
                    className="text-muted hover:text-danger transition-colors p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
