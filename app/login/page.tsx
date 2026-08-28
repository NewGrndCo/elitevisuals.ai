import Link from "next/link";
import { SiteHeader } from "@/components-next/site-header";
export const metadata = { title: "Sign In" };
export default function Login() {
  return (
    <>
      <SiteHeader />
      <main className="auth-page">
        <div className="auth-card">
          <p className="kicker">Member access</p>
          <h1>Sign in to reveal prompts.</h1>
          <p>Enter your email and we’ll send you a secure sign-in link.</p>
          <form>
            <label>
              Email address
              <input type="email" placeholder="you@example.com" required />
            </label>
            <button className="button button-solid" type="submit">
              Send magic link
            </button>
          </form>
          <Link href="/promptbox">← Back to Promptbox</Link>
        </div>
      </main>
    </>
  );
}
