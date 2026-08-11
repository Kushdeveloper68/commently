import { useEffect, useState } from "react";
import { Check, Star, Info, Sparkles, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import AppLayout from "../components/AppLayout.jsx";
import { SkeletonProvider } from "../components/Skeletons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

// Builds the bullet list for a plan card from its raw limits/features data —
// works for built-in plans (free/starter/pro) and admin-created custom
// plans alike, since both come back in the same shape from /billing/plans.
function buildFeatureBullets(plan) {
  const bullets = [
    `${plan.maxInstagramAccounts} Instagram account${plan.maxInstagramAccounts > 1 ? "s" : ""}`,
    `${plan.maxAutomations} automation${plan.maxAutomations > 1 ? "s" : ""}`,
    `${plan.maxDmsPerMonth.toLocaleString("en-IN")} DMs / month`,
  ];
  if (plan.features?.publicReply) bullets.push("Public replies");
  if (plan.features?.followGate) bullets.push("Follow-gating");
  if (plan.features?.analytics) bullets.push("Analytics & leads dashboard");
  if (plan.customFeatureLabels?.length) bullets.push(...plan.customFeatureLabels);
  return bullets;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function daysUntil(d) {
  return Math.max(0, Math.ceil((new Date(d) - Date.now()) / (24 * 60 * 60 * 1000)));
}

export default function Billing() {
  const { user, refetch } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [renewing, setRenewing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelInfo, setCancelInfo] = useState(null);
  const [plans, setPlans] = useState({});
  const [accountCount, setAccountCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/billing/plans"), api.get("/instagram/accounts"), api.get("/billing/history")])
      .then(([plansRes, accounts, hist]) => {
        setPlans(plansRes.data.plans);
        setAccountCount(accounts.data.accounts.length);
        setHistory(hist.data.subscriptions);
        const active = hist.data.subscriptions.find((s) => s.status === "active");
        if (active) setCancelInfo(active);
      })
      .catch(() => toast.error("Couldn't load billing data"))
      .finally(() => setLoading(false));
  }, [user?.plan]);

  const handleCancel = async () => {
    if (!window.confirm("Cancel your subscription? You'll keep access until the end of your current billing period.")) return;
    setCancelling(true);
    try {
      const { data } = await api.post("/billing/cancel");
      toast.success(data.message);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  // If the user has time left on an active subscription, switching plans
  // right now overwrites it immediately (no proration, no "wait until it
  // ends") — this is a real money/access decision, so we ask before firing
  // the Razorpay checkout, not after.
  const confirmOverwriteIfNeeded = () => {
    if (!cancelInfo || cancelInfo.autoRenew === false) return true; // nothing active, or already set to lapse — nothing to overwrite
    const remaining = daysUntil(cancelInfo.periodEnd);
    if (remaining <= 0) return true;
    return window.confirm(
      `You still have ${remaining} day${remaining === 1 ? "" : "s"} left on your current ${cancelInfo.plan} plan ` +
        `(ends ${formatDate(cancelInfo.periodEnd)}). Switching now replaces it immediately — the remaining time won't ` +
        `carry over. Continue?`,
    );
  };

  const runCheckout = ({ orderData, description, planLabel }) => {
    const razorpay = new window.Razorpay({
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.orderId,
      name: "DMLoop",
      description,
      theme: { color: "#3C7BFA" },
      handler: async (response) => {
        try {
          await api.post("/billing/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          toast.success(planLabel ? `Upgraded to ${planLabel}!` : "Payment successful!");
          refetch();
        } catch {
          toast.error("Payment verification failed. Contact support if money was deducted.");
        }
      },
    });
    razorpay.open();
  };

  const handleUpgrade = async (planKey) => {
    if (!confirmOverwriteIfNeeded()) return;
    setLoadingPlan(planKey);
    try {
      const { data } = await api.post("/billing/create-order", { plan: planKey });
      runCheckout({ orderData: data, description: `${plans[planKey]?.label} Plan Subscription`, planLabel: plans[planKey]?.label });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to start checkout");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleRenewCustomPlan = async () => {
    if (!confirmOverwriteIfNeeded()) return;
    setRenewing(true);
    try {
      const { data } = await api.post("/billing/renew-custom-plan");
      runCheckout({
        orderData: data,
        description: `${user?.customPlanOverrideStatus?.label || "Custom"} Plan Renewal`,
        planLabel: user?.customPlanOverrideStatus?.label,
      });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to start renewal");
    } finally {
      setRenewing(false);
    }
  };

  // effectiveLimits reflects what's ACTUALLY active right now, accounting
  // for a negotiated override — plans[user.plan] alone would miss that
  // entirely, since an active override never changes the `plan` field.
  const currentPlan = user?.effectiveLimits || plans[user?.plan];
  const overrideStatus = user?.customPlanOverrideStatus;
  const dmPct = currentPlan ? Math.min(100, Math.round(((user?.dmsSentThisMonth || 0) / currentPlan.maxDmsPerMonth) * 100)) : 0;
  const accountPct = currentPlan ? Math.min(100, Math.round((accountCount / currentPlan.maxInstagramAccounts) * 100)) : 0;

  return (
    <AppLayout>
      <SkeletonProvider>
        <div className="mb-10">
          <h1 className="text-h1 text-on-surface">Billing &amp; Plans</h1>
          <p className="text-body-md text-on-surface-variant mt-2">Manage your subscription, usage, and invoices from one place.</p>
        </div>

        {overrideStatus?.state === "scheduled" && (
          <div className="mb-8 bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-4">
            <Sparkles size={20} className="text-primary shrink-0" />
            <p className="text-sm text-on-surface-variant">
              You have a custom <strong className="text-on-surface">{overrideStatus.label}</strong> plan starting on{" "}
              <strong className="text-on-surface">{formatDate(overrideStatus.effectiveFrom)}</strong>. Your current plan stays
              active until then.
            </p>
          </div>
        )}

        {overrideStatus?.state === "expired" && (
          <div className="mb-8 bg-error/5 border border-error/20 rounded-xl p-4 flex items-center gap-4">
            <AlertTriangle size={20} className="text-error shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-on-surface">
                Your custom <strong>{overrideStatus.label}</strong> plan ended on {formatDate(overrideStatus.periodEnd)}.
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">Renew to keep the same negotiated price and limits.</p>
            </div>
            <button onClick={handleRenewCustomPlan} disabled={renewing} className="btn-primary shrink-0">
              {renewing ? "Loading..." : `Renew · ₹${(overrideStatus.priceInPaise || 0) / 100}`}
            </button>
          </div>
        )}

        {/* Current plan + usage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-12">
          <div className="lg:col-span-5 bg-surface-container border border-outline-variant rounded-xl p-padding-card flex flex-col justify-between hover:border-primary transition-colors">
            {loading ? (
              <Skeleton height={140} />
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border border-primary/20">
                        {currentPlan?.isCustomOverride ? "Custom Plan" : "Current Plan"}
                      </span>
                      <h3 className="text-h2 mt-3">{currentPlan?.label || user?.plan}</h3>
                      <p className="text-body-md text-on-surface-variant">₹{(currentPlan?.priceInPaise || 0) / 100} {currentPlan?.priceInPaise > 0 ? "/mo" : ""}</p>
                    </div>
                    {(user?.plan !== "free" || currentPlan?.isCustomOverride) && (
                      <div className="flex items-center gap-2 text-primary">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-label-sm font-bold uppercase tracking-wider">Active</span>
                      </div>
                    )}
                  </div>
                  {currentPlan?.isCustomOverride && currentPlan.periodEnd && (
                    <div className="pt-4 border-t border-outline-variant/30">
                      <p className="text-sm text-on-surface-variant">
                        Renews on <span className="text-on-surface font-semibold">{formatDate(currentPlan.periodEnd)}</span>
                      </p>
                    </div>
                  )}
                  {!currentPlan?.isCustomOverride && cancelInfo && (
                    <div className="pt-4 border-t border-outline-variant/30">
                      <p className="text-sm text-on-surface-variant">
                        {cancelInfo.autoRenew === false ? (
                          <>Moves to Free on <span className="text-on-surface font-semibold">{formatDate(cancelInfo.periodEnd)}</span></>
                        ) : (
                          <>Renews on <span className="text-on-surface font-semibold">{formatDate(cancelInfo.periodEnd)}</span></>
                        )}
                      </p>
                    </div>
                  )}
                </div>
                {!currentPlan?.isCustomOverride && user?.plan !== "free" && cancelInfo?.autoRenew !== false && (
                  <button onClick={handleCancel} disabled={cancelling} className="mt-6 text-label-sm text-on-surface-variant hover:text-error transition-colors self-start">
                    {cancelling ? "Cancelling..." : "Cancel subscription"}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="lg:col-span-7 bg-surface-container border border-outline-variant rounded-xl p-padding-card space-y-stack-lg">
            <h4 className="text-[18px] font-semibold">Usage Metrics</h4>
            {loading ? (
              <Skeleton height={100} />
            ) : (
              <>
                <div className="space-y-6">
                  <UsageBar label="Monthly DMs Sent" current={user?.dmsSentThisMonth || 0} max={currentPlan?.maxDmsPerMonth} pct={dmPct} />
                  <UsageBar label="Instagram Accounts Connected" current={accountCount} max={currentPlan?.maxInstagramAccounts} pct={accountPct} />
                </div>
                {dmPct >= 80 && (
                  <div className="bg-primary/5 rounded-xl p-4 flex items-center gap-4 border border-primary/10">
                    <Info size={18} className="text-primary shrink-0" />
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      You're close to your monthly DM limit — automations will pause once you hit it. Consider upgrading to avoid interruption.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Plan comparison — fully dynamic, includes any admin-created custom plans */}
        <div className="space-y-stack-lg mb-12">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-h1">Choose the right path</h2>
            <p className="text-on-surface-variant">Simple plans, no surprises — automations pause (not delete) if you hit a limit.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {Object.entries(plans).map(([key, plan]) => {
              const isCurrent = user?.plan === key && !currentPlan?.isCustomOverride;
              const featured = key === "pro"; // highlight the built-in Pro plan; custom plans just render plainly
              return (
                <div key={key} className={`bg-surface-container rounded-xl p-8 flex flex-col relative ${featured ? "border-2 border-primary shadow-2xl shadow-primary/5" : "border border-outline-variant hover:border-outline transition-colors"}`}>
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">Current Plan</div>
                  )}
                  <div className="mb-8">
                    <h3 className={`font-bold uppercase tracking-widest text-[12px] ${featured ? "text-primary" : "text-on-surface-variant"}`}>{plan.label}</h3>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl font-black text-on-surface">₹{plan.priceInPaise / 100}</span>
                      {plan.priceInPaise > 0 && <span className="text-on-surface-variant">/mo</span>}
                    </div>
                  </div>
                  <ul className="space-y-4 flex-1">
                    {buildFeatureBullets(plan).map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm">
                        <Check size={18} className="text-primary shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <div className="mt-8 w-full bg-primary/20 text-primary border border-primary/30 py-3 rounded-lg font-bold text-sm text-center">Active Now</div>
                  ) : key === "free" ? (
                    <button disabled className="mt-8 w-full bg-surface-container-high border border-outline-variant py-3 rounded-lg font-bold text-sm opacity-50 cursor-not-allowed">Downgrade not available</button>
                  ) : (
                    <button onClick={() => handleUpgrade(key)} disabled={loadingPlan === key} className="mt-8 w-full btn-primary py-3 rounded-lg font-bold text-sm">
                      {loadingPlan === key ? "Loading..." : `Upgrade to ${plan.label}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Payments info + Invoice history */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <section className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-padding-card">
            <h4 className="text-[18px] font-semibold mb-6">Payments</h4>
            <div className="bg-surface-container-high border border-outline-variant p-4 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Star size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">Secured by Razorpay</p>
                <p className="text-[11px] text-on-surface-variant">Cards, UPI, netbanking — no card details stored on our servers</p>
              </div>
            </div>
          </section>

          <section className="lg:col-span-8 bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-padding-card border-b border-outline-variant bg-surface-container-low">
              <h4 className="text-[18px] font-semibold">Invoice History</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-lowest/50">
                    <th className="px-6 py-4 text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {loading ? (
                    <tr><td colSpan={4} className="px-6 py-4"><Skeleton height={40} /></td></tr>
                  ) : history.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-on-surface-variant text-sm">No invoices yet.</td></tr>
                  ) : (
                    history.map((h) => (
                      <tr key={h._id} className="hover:bg-surface-container-high transition-colors">
                        <td className="px-6 py-4 text-sm text-on-surface">{new Date(h.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                        <td className="px-6 py-4 text-sm text-on-surface capitalize">{h.plan === "custom_override" ? "Custom plan renewal" : h.plan}</td>
                        <td className="px-6 py-4 text-sm text-on-surface font-mono">₹{(h.amount / 100).toLocaleString("en-IN")}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            h.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                            h.status === "created" ? "bg-outline-variant text-on-surface-variant border-outline-variant" :
                            "bg-error/10 text-error border-error/20"
                          }`}>
                            {h.status === "active" ? "Paid" : h.status === "created" ? "Pending" : h.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </SkeletonProvider>
    </AppLayout>
  );
}

function UsageBar({ label, current, max, pct }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-label-sm text-on-surface-variant">{label}</span>
        <span className="font-mono text-sm text-on-surface">{current.toLocaleString("en-IN")} <span className="text-on-surface-variant">/ {max?.toLocaleString("en-IN")}</span></span>
      </div>
      <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${pct >= 80 ? "bg-error" : "bg-primary"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}