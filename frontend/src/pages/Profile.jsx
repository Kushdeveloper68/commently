import { useAuth } from "../context/AuthContext.jsx";
import AppLayout from "../components/AppLayout.jsx";

export default function Profile() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Profile</h1>
        <p className="text-muted mt-1">Your account details.</p>
      </div>

      <div className="card max-w-lg">
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
