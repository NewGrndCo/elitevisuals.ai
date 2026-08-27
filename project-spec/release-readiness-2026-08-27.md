# EliteVisuals.ai V2 Release Readiness

Audit authority: Neme V2  
Mode: Verify  
Contract: EV2-CONTRACT-0.3  
Environment: local Netlify-emulated development and production build  
Modification authority: bounded engineering repairs authorized by the owner's commercial-readiness request

## Verified coverage

- Public routes: homepage, library, pack, prompt, skills, skill detail, waitlist, login, downloads, checkout success, and admin entry.
- Responsive homepage at desktop and 390 × 844; no horizontal document overflow.
- Homepage renders two independently animated visual ribbons and the prompt-pack row.
- Anonymous prompt copy is blocked and preserves the return URL through login.
- Waitlist form validates on the server and writes through the service role to an RLS-protected table.
- Admin entry remains PIN-throttled plus role-authorized; waitlist records are admin-readable and CSV-exportable.
- Skill archives remain private and downloads use 60-second signed URLs after entitlement checks.
- Stripe webhook signatures are verified with constant-time comparison and five-minute tolerance.
- Delayed Stripe webhooks are covered by an authenticated checkout-session verification fallback.
- Netlify adapter emits `.netlify/v1/functions/server.mjs` and the production build passes.
- Typecheck, focused lint, production dependency audit, browser console checks, and security-header checks pass.

## Findings

### EV2-N-001 — Remote database migration not applied

- Severity: High; confidence: high; status: blocked.
- Gate: data, waitlist, downloadable skills.
- Evidence: Supabase CLI requires account authentication before it can link to the production project and dry-run/push migrations.
- Impact: production skills and waitlist routes cannot persist or load their V2 records until migrations are applied.
- Resolution: authenticate the Supabase CLI, dry-run, apply migrations, and run RLS/advisor checks.

### EV2-N-002 — Netlify site is not linked/authenticated

- Severity: High; confidence: high; status: blocked.
- Gate: deployment and production smoke test.
- Evidence: the local Netlify adapter works and builds, but no authenticated site context was returned by the CLI.
- Resolution: authenticate/link Netlify, configure production environment variables, deploy a preview, and smoke-test before production promotion.

### EV2-N-003 — Netlify development toolchain advisories

- Severity: Low; confidence: high; status: open/upstream.
- Evidence: production dependency audit reports zero vulnerabilities; full audit reports seven high advisories inside Netlify development tooling (`extract-zip` and image tooling). Netlify's current plugin has no non-breaking audited upgrade path for all advisories.
- Impact: build/development environment only; no affected package is in the deployed browser/server dependency audit.
- Resolution: track Netlify upstream releases and upgrade when patched.

## Readiness decision

Verification pending. The codebase is a verification candidate, not yet production ready. EV2-N-001 and EV2-N-002 must be closed with remote evidence before the production domain is switched.
