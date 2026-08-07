import LegalLayout, { Section } from "./LegalLayout.jsx";

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="How DMLoop collects, stores, and protects your data and your Instagram account information."
      updatedAt="31 July 2026"
    >
      <p className="text-muted">
        This Privacy Policy explains what data DMLoop collects when you use our platform, why we
        collect it, and how it's protected. We built DMLoop to handle real Instagram accounts and
        real customer conversations, so we've tried to keep this as specific and honest as possible.
      </p>

      <Section heading="1. What we collect">
        <p><strong className="text-ink">Account information</strong> — your name, email, and (if you sign in with Google) your Google profile basics.</p>
        <p><strong className="text-ink">Instagram account data</strong> — when you connect an Instagram Business or Creator account, we store your Instagram user ID, username, profile picture URL, and an encrypted long-lived access token issued by Meta. The token is encrypted at rest (AES-256-GCM) and is never shown in plain text, including to our own team.</p>
        <p><strong className="text-ink">Interaction data</strong> — when your automations run, we log the comment, Story reply, or DM text that triggered them, the commenter's username or Instagram-scoped ID (where Instagram provides one), and whether the reply was sent successfully. This is what powers your Analytics dashboard.</p>
        <p><strong className="text-ink">Payment data</strong> — we don't store your card details. Payments are handled by Razorpay, and we only keep the order ID, payment status, and plan you subscribed to.</p>
      </Section>

      <Section heading="2. How we use it">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>To run the automations you set up — matching keywords and sending the replies you've configured</li>
          <li>To show you Analytics: comment/DM volume, keyword performance, and lead activity</li>
          <li>To keep your Instagram connection alive (refreshing access tokens before they expire)</li>
          <li>To enforce plan limits and process billing</li>
          <li>To provide support if something breaks</li>
        </ul>
        <p>We don't sell your data, and we don't use commenter data to train any AI models.</p>
      </Section>

      <Section heading="3. Who we share it with">
        <p>
          We share data only with the services that make DMLoop work: Meta (to operate the
          Instagram API connection you've authorized), Razorpay (to process payments), and our cloud
          hosting and database providers (to run the service). None of these are permitted to use
          your data for anything beyond that.
        </p>
      </Section>

      <Section heading="4. How long we keep it">
        <p>
          Interaction logs are kept for as long as your account is active, so your Analytics stay
          accurate. If you disconnect an Instagram account, we stop collecting new data for it
          immediately. If you delete your DMLoop account, we delete your stored access tokens and
          personal account information within 30 days.
        </p>
      </Section>

      <Section heading="5. Your choices">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Disconnect any Instagram account at any time from your dashboard — this revokes our API access to it immediately</li>
          <li>Request a copy or deletion of your data by emailing us</li>
          <li>Turn off any individual automation without disconnecting the account</li>
        </ul>
      </Section>

      <Section heading="6. Security">
        <p>
          Instagram access tokens are encrypted at rest and only decrypted in memory when actually
          sending a message. Passwords (for non-Google accounts) are hashed, never stored in plain
          text. We use HTTPS for all traffic between your browser, our servers, and Meta's API.
        </p>
      </Section>

      <Section heading="7. Contact">
        <p>
          Questions about this policy, or want your data deleted? Email us at{" "}
          <span className="text-ink">privacy@dmloop.app</span>.
        </p>
      </Section>
    </LegalLayout>
  );
}
