import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components-next/site-header";
import { LoginForm } from "@/components-next/login-form";
export const metadata = { title: "Sign In" };
export default function Login() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="auth-page">
        <div className="auth-card">
          <p className="kicker">Member access</p>
          <h1>Your creative toolkit awaits.</h1>
          <p>Enter your email and we’ll send you a secure sign-in link.</p>
          <Suspense fallback={<p>Loading sign-in…</p>}>
            <LoginForm />
          </Suspense>
          <Link href="/">← Back to Home</Link>
        </div>
      </main>
    </>
  );
}
