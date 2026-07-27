import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Zap, Instagram, TrendingUp, Plus } from "lucide-react";
import AppLayout from "../components/AppLayout.jsx";
import { DashboardStatsSkeleton, ListRowSkeleton } from "../components/Skeletons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

export default function Dashboard() {
  const { user } = useAuth();
  const [automations, setAutomations] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/automations"), api.get("/instagram/accounts")])
      .then(([autoRes, accRes]) => {
        setAutomations(autoRes.data.automations);
        setAccounts(accRes.data.accounts);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalDms = automations.reduce((sum, a) => sum + (a.stats?.dmsSentCount || 0), 0);
  const liveCount = automations.filter((a) => a.status === "live").length;

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Hello, {user?.name?.split(" ")[0]} 👋</h1>
        <p className="text-muted mt-1">Here's how your automations are performing.</p>
      </div>

      {loading ? (
        <DashboardStatsSkeleton />
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard icon={Zap} label="Live automations" value={liveCount} />
          <StatCard icon={TrendingUp} label="DMs sent (all time)" value={totalDms} />
          <StatCard icon={Instagram} label="Connected accounts" value={accounts.length} />
        </div>
      )}

      {!loading && accounts.length === 0 && (
        <div className="card border-gold/40 mb-8 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Connect your Instagram to get started</h3>
            <p className="text-sm text-muted mt-1">
              Link your Instagram Business account to start creating automations.
            </p>
          </div>
          <Link to="/connect-instagram" className="btn-primary whitespace-nowrap">
            Connect Instagram
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Recent automations</h2>
        <Link to="/automations/new" className="btn-secondary text-sm flex items-center gap-1.5">
          <Plus size={15} /> New automation
        </Link>
      </div>

      {loading ? (
        <ListRowSkeleton rows={3} />
      ) : automations.length === 0 ? (
        <div className="card text-center py-12 text-muted">
          No automations yet — create your first one to start converting comments into DMs.
        </div>
      ) : (
        <div className="space-y-3">
          {automations.slice(0, 5).map((a) => (
            <Link
              key={a._id}
              to={`/automations/${a._id}`}
              className="card flex items-center justify-between hover:border-gold/40 transition-colors block"
            >
              <div>
                <div className="font-medium">{a.name}</div>
                <div className="text-xs text-muted mt-1">
                  {a.stats?.dmsSentCount || 0} DMs sent
                </div>
              </div>
              <StatusBadge status={a.status} />
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
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

function StatusBadge({ status }) {
  const styles = {
    live: "bg-success/10 text-success",
    draft: "bg-muted/10 text-muted",
    paused: "bg-gold/10 text-gold-bright",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}
