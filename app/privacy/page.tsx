import { PageShell } from "@/components-next/page-shell";

export const metadata = { alternates: { canonical: "/privacy" }, title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Privacy Policy"
      description="How EliteVisuals.ai handles information used for member access and the waitlist."
    >
      <article className="legal-card">
        <p className="legal-updated">Effective September 4, 2026</p>
        <h2>Information we collect</h2>
        <p>
          We collect the email address you submit for member access or the waitlist. The waitlist
          may also collect your name, interests, and signup source when you provide them. Our
          infrastructure may process standard technical information needed for security and site
          delivery, such as request timestamps and network identifiers.
        </p>
        <h2>How we use information</h2>
        <p>
          We use this information to provide sign-in links, operate member access, manage the
          waitlist, protect the service, respond to requests, and improve site reliability. We do
          not sell personal information.
        </p>
        <h2>Service providers</h2>
        <p>
          Supabase supports authentication and database services. Netlify supports hosting,
          server-side functions, and administrative content storage. These providers process
          information on our behalf under their own security and privacy commitments.
        </p>
        <h2>Cookies and local storage</h2>
        <p>
          EliteVisuals.ai uses essential browser storage for member sessions and preferences such as
          theme selection. These functions are used to operate the service rather than for
          third-party advertising.
        </p>
        <h2>Retention and choices</h2>
        <p>
          Information is retained while needed to provide the service, meet security and legal
          obligations, and maintain legitimate business records. You may request access, correction,
          or deletion through the official EliteVisuals.ai support channel used in your
          communications with us.
        </p>
        <h2>Updates</h2>
        <p>
          We may update this policy as the service or legal requirements change. The effective date
          above identifies the current version.
        </p>
      </article>
    </PageShell>
  );
}
