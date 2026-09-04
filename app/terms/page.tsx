import { PageShell } from "@/components-next/page-shell";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Terms of Service"
      description="The terms that apply when you access EliteVisuals.ai and use its prompts, resources, and downloadable materials."
    >
      <article className="legal-card">
        <p className="legal-updated">Effective September 4, 2026</p>
        <h2>Using EliteVisuals.ai</h2>
        <p>
          You must use the site lawfully and avoid interfering with its operation, security, or
          other users. You are responsible for the content you create with prompts or resources
          obtained through the site and for complying with the rules of any third-party AI service
          you use.
        </p>
        <h2>Accounts</h2>
        <p>
          You are responsible for access to your email account and for activity performed through
          your EliteVisuals.ai sign-in link. We may restrict access used for abuse, unauthorized
          sharing, or attempts to compromise the service.
        </p>
        <h2>Content and licenses</h2>
        <p>
          EliteVisuals.ai retains ownership of its site, branding, original prompts, packs, and
          downloadable materials. Access does not transfer ownership. The license stated with an
          applicable product or material controls how it may be used. You may not resell, republish,
          or distribute the source materials as a competing prompt or resource library unless that
          license expressly allows it.
        </p>
        <h2>Third-party services</h2>
        <p>
          Links and integrations may lead to third-party services. Their terms, availability, and
          outputs are controlled by those providers. EliteVisuals.ai does not guarantee that a
          prompt will produce the same result across models, versions, or settings.
        </p>
        <h2>Availability and liability</h2>
        <p>
          The service is provided on an “as available” basis. To the extent permitted by law,
          EliteVisuals.ai disclaims implied warranties and is not liable for indirect, incidental,
          or consequential losses arising from use of the site or third-party tools.
        </p>
        <h2>Changes</h2>
        <p>
          These terms may be updated as the service changes. The effective date above identifies the
          current version. Continued use after an update means you accept the revised terms.
        </p>
      </article>
    </PageShell>
  );
}
