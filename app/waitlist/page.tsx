import { PageShell } from "@/components-next/page-shell";
export const metadata = { title: "Join the Waitlist" };
export default function Waitlist() {
  return (
    <PageShell
      eyebrow="Early access"
      title="Be first inside."
      description="Join the Elite Visuals list for new prompt packs, downloadable skills, and creator workflow drops."
    >
      <section className="form-card">
        <form>
          <label>
            Email address
            <input type="email" placeholder="you@example.com" required />
          </label>
          <button className="button button-solid" type="submit">
            Join Waitlist
          </button>
        </form>
        <p>Early access. No noise.</p>
      </section>
    </PageShell>
  );
}
