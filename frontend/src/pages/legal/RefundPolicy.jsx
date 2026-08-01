import LegalLayout, { Section } from "./LegalLayout.jsx";

export default function RefundPolicy() {
  return (
    <LegalLayout
      title="Refund Policy"
      description="Commently's refund and cancellation policy for Starter and Pro subscriptions."
      updatedAt="31 July 2026"
    >
      <p className="text-muted">
        We want you to feel confident trying Commently. Here's exactly how billing, cancellations,
        and refunds work — no fine print surprises.
      </p>

      <Section heading="1. Cancelling your subscription">
        <p>
          You can cancel a paid plan any time from Billing → Manage Subscription. Cancelling stops
          future renewals, but you keep full access to your current plan until the end of the period
          you've already paid for. We don't prorate or refund the unused portion of a cancelled
          period, since you retain access for all of it.
        </p>
      </Section>

      <Section heading="2. Refund eligibility">
        <p>You're eligible for a full refund if:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>You were charged due to a billing error on our end (duplicate charge, wrong plan amount)</li>
          <li>You request a refund within <strong className="text-ink">7 days</strong> of your first-ever payment to Commently, and haven't sent more than 50 automated replies on the plan you're cancelling</li>
        </ul>
        <p>
          Refunds are not available for renewal charges (i.e. your subscription auto-renewing for a
          second or later month), or for accounts suspended for violating our{" "}
          <a href="/terms" className="text-gold-bright hover:underline">Terms of Service</a>.
        </p>
      </Section>

      <Section heading="3. How refunds are processed">
        <p>
          Approved refunds are issued to your original payment method through Razorpay within 5–7
          business days of approval. Email us at <span className="text-ink">billing@commently.app</span> with
          your account email and order ID to request one — we typically respond within 24 hours.
        </p>
      </Section>

      <Section heading="4. Failed or disputed payments">
        <p>
          If a renewal payment fails, we'll retry it and email you before pausing your plan — your
          automations stay live on your current plan for a short grace period so nothing breaks
          mid-conversation. If you believe a charge is fraudulent or unauthorized, contact us before
          raising a chargeback with your bank; we can usually resolve it faster directly.
        </p>
      </Section>
    </LegalLayout>
  );
}
