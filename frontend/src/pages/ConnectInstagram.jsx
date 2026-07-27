import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Instagram, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import AppLayout from "../components/AppLayout.jsx";
import { ListRowSkeleton } from "../components/Skeletons.jsx";
import api from "../api/axios.js";

export default function ConnectInstagram() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [searchParams] = useSearchParams();

  const fetchAccounts = () => {
    setLoading(true);
    api
      .get("/instagram/accounts")
      .then((res) => setAccounts(res.data.accounts))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
    if (searchParams.get("error")) {
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

  const handleDisconnect = async (id) => {
    if (!confirm("Disconnect this Instagram account? Its automations will stop working.")) return;
    await api.delete(`/instagram/accounts/${id}`);
    toast.success("Account disconnected");
    fetchAccounts();
  };

  return (
    <AppLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Instagram Accounts</h1>
          <p className="text-muted mt-1">Connect the accounts you want to automate.</p>
        </div>
        <button onClick={handleConnect} disabled={connecting} className="btn-primary flex items-center gap-2">
          <Instagram size={16} /> {connecting ? "Redirecting..." : "Connect Instagram"}
        </button>
      </div>

      {loading ? (
        <ListRowSkeleton rows={2} />
      ) : accounts.length === 0 ? (
        <div className="card text-center py-16">
          <Instagram size={40} className="mx-auto text-muted mb-4" />
          <h3 className="font-semibold mb-2">No accounts connected yet</h3>
          <p className="text-sm text-muted max-w-sm mx-auto">
            Connect your Instagram Business or Creator account to start setting up automations.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <div key={acc._id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                {acc.profilePictureUrl ? (
                  <img src={acc.profilePictureUrl} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                    <Instagram size={18} className="text-gold-bright" />
                  </div>
                )}
                <div>
                  <div className="font-medium">@{acc.username}</div>
                  <div className="text-xs text-success">Connected</div>
                </div>
              </div>
              <button
                onClick={() => handleDisconnect(acc._id)}
                className="text-muted hover:text-danger transition-colors p-2"
                title="Disconnect"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
