import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import AppLayout from "../components/AppLayout.jsx";
import api from "../api/axios.js";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
    <AppLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Profile</h1>
        <p className="text-muted mt-1">Your account details.</p>
      </div>

      <div className="card max-w-lg mb-6">
        <div className="flex items-center gap-4 mb-6">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-16 h-16 rounded-full" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center text-gold-bright text-xl font-semibold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-semibold text-lg">{user?.name}</div>
            <div className="text-muted text-sm">{user?.email}</div>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <Row label="Current plan" value={<span className="capitalize">{user?.plan}</span>} />
          <Row label="Account type" value={<span className="capitalize">{user?.role}</span>} />
        </div>
      </div>

      {/* Danger zone */}
      <div className="card max-w-lg border-danger/30">
        <h3 className="font-semibold text-danger mb-1 flex items-center gap-2">
          <Trash2 size={16} /> Delete account
        </h3>
        <p className="text-sm text-muted mb-4">
          This permanently deletes your account, disconnects all Instagram accounts, and removes
          every automation, interaction log, and subscription record. This can't be undone.
        </p>

        {!showConfirm ? (
          <button onClick={() => setShowConfirm(true)} className="text-sm font-medium text-danger hover:underline">
            Delete my account
          </button>
        ) : (
          <div className="space-y-3">
            <label className="label-sm">
              Type <span className="font-mono text-ink">DELETE</span> to confirm
            </label>
            <input
              className="input-field"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
            />
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={confirmText !== "DELETE" || deleting}
                className="bg-danger text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                {deleting ? "Deleting..." : "Permanently delete"}
              </button>
              <button
                onClick={() => { setShowConfirm(false); setConfirmText(""); }}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
