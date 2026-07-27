import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import toast from "react-hot-toast";
import AppLayout from "../components/AppLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

const PLAN_DISPLAY = {
  free: { label: "Free", price: "₹0", features: ["1 Instagram account", "50 DMs/month", "1 automation"] },
  starter: {
    label: "Starter",
    price: "₹399/mo",
    features: ["1 Instagram account", "2,000 DMs/month", "5 automations", "Public replies", "Follow-gating"],
  },
  pro: {
    label: "Pro",
    price: "₹899/mo",
    features: ["5 Instagram accounts", "20,000 DMs/month", "Unlimited automations", "Analytics dashboard"],
  },
};

export default function Billing() {
  const { user, refetch } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const handleUpgrade = async (plan) => {
    setLoadingPlan(plan);
    try {
      const { data } = await api.post("/billing/create-order", { plan });

      const razorpay = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "Commently",
        description: `${PLAN_DISPLAY[plan].label} Plan Subscription`,
        theme: { color: "#c9a86a" },
        handler: async (response) => {
          try {
            await api.post("/billing/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success(`Upgraded to ${PLAN_DISPLAY[plan].label}!`);
            refetch();
          } catch {
            toast.error("Payment verification failed. Contact support if money was deducted.");
          }
        },
      });
      razorpay.open();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to start checkout");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Billing</h1>
        <p className="text-muted mt-1">
          You're currently on the <span className="text-gold-bright capitalize font-medium">{user?.plan}</span> plan.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {Object.entries(PLAN_DISPLAY).map(([key, plan]) => {
          const isCurrent = user?.plan === key;
          return (
            <div key={key} className={`card ${isCurrent ? "border-gold" : ""}`}>
              <div className="text-sm text-muted">{plan.label}</div>
              <div className="font-display text-3xl font-bold text-gold-bright mt-1">{plan.price}</div>
              <ul className="mt-4 space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted">
                    <Check size={14} className="text-gold" /> {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <button disabled className="btn-secondary w-full opacity-50">
                  Current plan
                </button>
              ) : key === "free" ? (
                <button disabled className="btn-secondary w-full opacity-50">
                  Downgrade not available
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(key)}
                  disabled={loadingPlan === key}
                  className="btn-primary w-full"
                >
                  {loadingPlan === key ? "Loading..." : `Upgrade to ${plan.label}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
