# Desktop refinement and member access - 2026-10-04

Mode: product. Status: validated locally; real-account verification pending.

User-authorized changes: larger clean homepage Promptbox; remove thick decorative
card frames; require sign-in for all non-home main navigation tabs and their
prompt/pack/skill details. Preserve purple identity, content, mobile swipe rows,
CMS, workspace hide setting, admin security and existing magic-link login.
Assumption: sign-in, legal and waitlist pages remain public. Admin retains its
separate PIN/session. No dependency changes, DB migrations, release or API usage.

Architecture: server page guards verify HttpOnly access-token cookies through
Supabase getUser before returning member page content. Existing browser session
refresh/login/logout synchronizes through a same-origin verified endpoint.
Cookie writes are HttpOnly, SameSite=Lax, Secure in production, one hour max;
expiry/revocation is checked server-side on each render. No service-role key used.
Magic links return through /login?next=...; safe local destinations are retained.
No new shared caching of authenticated pages. Published homepage artwork remains
public; underlying Supabase RLS/storage policies are unchanged by this UI task.

Acceptance: anonymous direct navigation to each main tab/detail redirects to
sign-in before content retrieval; invalid/anonymous/revoked tokens do not unlock
pages; successful server verification sets a cookie; sign-out clears it and
refreshes the page. Login must show errors rather than an empty/looping screen.
Desktop at 1440px uses three large edge-to-edge showcase cards; mobile preserves
its swipe layout; focus outlines remain visible; decorative frames are zero width.

QA: unit security tests with explicit mocked Supabase users, typecheck, lint,
build, isolated route checks, desktop/mobile browser and direct-link tests.
Real magic-link completion requires a private account and current Supabase
redirect allow-list; do not claim production readiness without that test.
No active global HELIX quality lessons applied. Existing identity provider takes
precedence over the generic Netlify Identity skill's provider recommendation.

Local evidence: 15/15 tests passed; typecheck, lint and production build passed.
Anonymous direct requests to all seven routes redirect to login (some use Next's
streamed redirect because their existing loading boundary flushes HTTP 200 first).
Browser navigation from Home to Prompts reached /login?next=%2Fpromptbox and
rendered the login form, not protected content. Desktop at 1440px: six 381px cards,
zero-width borders, no horizontal overflow. At 390px: 304px swipe cards, no page
overflow, and Home visible in the opened mobile menu. Session endpoint locally
rejects missing tokens and cross-origin writes. Valid-user and logout behavior
are unit tested against mocked Auth; a real authenticated browser flow has NOT
been tested. Supabase must allow the /login?next=... callback URLs before release.
Source media outages remain a known limitation; cards now hide broken previews
behind an accessible fallback. No commit, push or deployment in this task.
