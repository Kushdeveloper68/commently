import LegalLayout, { Section } from "./LegalLayout.jsx";

export default function Terms() {
  return (
    <LegalLayout
      title="Terms of Service"
      description="The terms that govern your use of Commently's Instagram automation platform."
      updatedAt="31 July 2026"
    >
      <p className="text-muted">
        These Terms of Service ("Terms") govern your access to and use of Commently, an Instagram
        automation platform that helps you reply to comments, Story replies, and direct messages
        automatically. By creating an account, you agree to these Terms.
      </p>

      <Section heading="1. What Commently does">
        <p>
          Commently connects to your Instagram Business or Creator account through Meta's official
          Instagram API. Once connected, you can set up automations that watch for comments, Story
          replies, or DMs, and send an automatic reply when they match rules you define. You remain
          in control of what those automations say and when they run.
        </p>
      </Section>

      <Section heading="2. Your Instagram account and Meta's rules">
        <p>
          You're responsible for making sure your use of Commently follows Instagram's Community
          Guidelines and Meta's Platform Terms — Commently is a tool you configure, not a substitute
          for that responsibility. Meta can suspend API access to any account for policy violations
          independent of anything Commently does. We're not able to reverse actions Meta takes on
          your Instagram account.
        </p>
        <p>
          You can disconnect any Instagram account from Commently at any time from your dashboard,
          which revokes our access to it.
        </p>
      </Section>

      <Section heading="3. Plans, billing, and usage limits">
        <p>
          Commently is offered on a subscription basis. Paid plans are billed monthly through
          Razorpay and renew automatically until you cancel. Each plan includes a monthly limit on
          the number of automated replies it can send — if you reach that limit, automations pause
          until the next billing cycle or until you upgrade.
        </p>
        <p>
          You can cancel a paid plan at any time from Billing; you'll keep access through the end of
          the period you've already paid for. See our{" "}
          <a href="/refund-policy" className="text-gold-bright hover:underline">Refund Policy</a> for
          how refunds are handled.
        </p>
      </Section>

      <Section heading="4. Acceptable use">
        <p>You agree not to use Commently to:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Send spam, unsolicited bulk messages, or content that violates Instagram's guidelines</li>
          <li>Automate replies for accounts you don't own or don't have explicit authorization to manage</li>
          <li>Attempt to circumvent Instagram's rate limits or platform policies</li>
          <li>Collect or store personal data from commenters beyond what's needed to run your automations</li>
        </ul>
        <p>We may suspend accounts that violate these terms, particularly where it puts other users' Instagram access at risk.</p>
      </Section>

      <Section heading="5. Service availability">
        <p>
          Commently depends on Meta's Instagram API being available and stable. We work to keep
          automations running reliably, but we can't guarantee uninterrupted service if Meta changes
          or restricts API access, and we're not liable for automations that don't fire due to
          Instagram-side outages or policy changes outside our control.
        </p>
      </Section>

      <Section heading="6. Changes to these terms">
        <p>
          We may update these Terms as the product evolves. We'll post the updated version here with
          a new "Last updated" date; continued use after a change means you accept the update.
        </p>
      </Section>

      <Section heading="7. Contact">
        <p>Questions about these Terms? Reach out to us at <span className="text-ink">support@commently.app</span>.</p>
      </Section>
    </LegalLayout>
  );
}
