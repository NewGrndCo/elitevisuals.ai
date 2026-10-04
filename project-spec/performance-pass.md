# Scoped performance pass - 2026-10-04

Mode: product maintenance. Status: validated locally; production candidate.

Approved scope: refine/refactor for speed while retaining current brand, layout,
content, auth, CMS and workspace behavior. No deployment or billable API calls.
Pending SDK setup files are preserved, not included in this performance scope.

Observed hotspots: eager unoptimized showcase images; React state updates on
every tilt pointer event; sequential homepage content/visibility reads; duplicate
marquee links eligible for speculative page requests; undersized mobile catalog
image hints. Decisions: use existing Next Image and Framer Motion spring values,
parallelize independent reads, disable marquee prefetch, correct catalog sizes.
No new dependencies, persistence changes or shared public/private caching.

Acceptance: given existing cards, when shown on mobile/desktop, then layout and
links remain unchanged and images have responsive lazy-loading metadata. Given
pointer movement, then tilt updates without React state updates. Given touch or
reduced motion, then tilt does not activate. Given homepage loading, then content
and visibility reads begin concurrently; admin hide setting remains respected.

Validation: targeted regression tests, existing unit tests, typecheck, lint,
production build, isolated local route and browser checks where available.
Limitations: no measured production speedup until deployment and profiling.
Global HELIX quality registry contained no applicable active lesson IDs.

Verification: 11/11 unit tests passed; typecheck, lint (including changed UI
primitives), production build and diff whitespace checks passed. Isolated local
production server returned HTTP 200 for homepage, promptbox, skills, resources,
workspace and workspace status. Browser confirmed six showcase images use lazy
loading, responsive sizes and the Next image optimizer. Pause control toggles its
pressed state. Desktop and 390px mobile checks found no horizontal page overflow;
mobile navigation opens and exposes the workspace link. Authenticated workflows
were not exercised; no auth logic changed. No production performance score or
percentage gain is claimed. No commit, push or deployment performed.

Media caveat: known animated transition artwork under /media/prompts/ bypasses
optimization to retain animation and avoid optimizer warnings. Responsive resize
savings apply to supported static images. Local logs also showed an unavailable
existing uploaded image and a remote image timeout; hosted media health remains
unverified, and these source-data issues were not removed or replaced.
