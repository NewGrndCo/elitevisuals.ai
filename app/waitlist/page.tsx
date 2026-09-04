import { PageShell } from "@/components-next/page-shell";
import { WaitlistForm } from "@/components-next/waitlist-form";
export const metadata = { title: "Join the Waitlist" };
export default function Waitlist() {
  return (
    <PageShell
      eyebrow="Early access"
      title="Be first inside."
      description="Join the Elite Visuals list for new prompt packs, downloadable skills, and creator workflow drops."
    >
      <section className="form-card">
        <WaitlistForm />
        <p>Early access. No noise.</p>
      </section>
    </PageShell>
  );
}
