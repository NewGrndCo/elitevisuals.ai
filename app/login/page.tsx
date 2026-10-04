import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components-next/site-header";
import { LoginForm } from "@/components-next/login-form";
import { MemberAccessPreview } from "@/components-next/member-access-preview";
import "./access.css";
export const metadata = { title: "Sign In", robots: { index: false, follow: true } };
export default function Login() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="auth-page member-access-page">
        <Suspense fallback={null}>
          <MemberAccessPreview />
        </Suspense>
        <div className="access-backdrop" aria-hidden="true" />
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
