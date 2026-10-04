# EliteVisuals website audit and refinement

Date: October 4, 2026, Eastern time.

## Outcome and scope

The public production site responds correctly across the tested routes and rejects unsigned requests to protected content APIs. The local refinement improves mobile controls, shared visual styling, motion, form feedback, and two data/access boundaries. This is a broad audit with targeted local repairs, not a certification that every production journey is perfect.

Readiness: **assessment incomplete**. Real member sign-in, authorized downloads, and authenticated CMS CRUD/uploads still need end-to-end verification. Changes in this audit have not been committed, pushed, or deployed.

Reviewed checkout: `elitevisuals-site`, remote `https://github.com/NewGrndCo/elitevisuals.ai.git`, branch `codex/elitevisuals-refinement`, starting HEAD `5b508e5`. Live target: `https://elitevisualsai.netlify.app`. Repository configuration uses Next.js, React, Supabase, Netlify Blobs, and the existing Framer Motion dependency.

The checkout started with package/lockfile/TypeScript changes and untracked documentation and an example file. Additional metadata, sitemap, robots, and social-image work appeared during the audit. Those changes are separate from this refinement and were preserved. Builds/checks describe the current working tree, including that concurrent work; no clean-commit release was tested.

## Coverage

| Surface | Evidence | Result and limits |
| --- | --- | --- |
| Homepage | Live browser, narrow/desktop local preview, HTTP | Loaded; sampled images rendered; menu, pause control, and theme switching tested locally |
| Prompt catalog | Live browser and HTTP; source | Public catalog rendered on production; one card flipped to its sign-in state; local route requires membership |
| Skills catalog | Live browser and HTTP; source | Four public skill cards rendered on production; local route requires membership |
| Resources | Live browser and HTTP; source | Directory and sign-in gate rendered; signed-in resource navigation unverified |
| Workspace | Live browser and HTTP; source/tests | Cover-art and transition modes rendered and switched; generation is explicitly not connected |
| Login | Live and local browser, source/tests | Empty email rejected; local catalog link redirects to the correct login destination; actual email delivery/callback not tested |
| Waitlist | Live/local browser, source, concurrency tests | Empty email rejected; local pause and release selectors worked; no production signup was created |
| Terms/privacy | Live HTTP and source | Routes returned 200; complete legal review and assistive-technology review not performed |
| Prompt/pack/skill details | Sampled live HTTP; source | `/prompt/ultra-upscale`, `/pack/Kinetic-V1`, `/skill/helix-lite` returned 200; authorized copy/download unverified |
| Legacy library link | Live HTTP | `/library` redirects to `/promptbox` |
| Missing page | Live HTTP | A nonexistent page returned 404 |
| Sitemap | Live HTTP; current source/build | Served successfully; separate concurrent metadata changes not authored by this audit |
| Admin page | Live HTTP; source | Page responded; authenticated dashboard operations not exercised |
| Admin session status | Live unsigned GET | Status endpoint responded; protected admin content/workspace/members returned 401 |
| Protected prompt/package APIs | Live unsigned GET; local route tests | Unsigned live requests returned 401; local tests verify anonymous/expired rejection |
| Invalid form payloads | Local HTTP | Invalid email returns 400 for member signup and waitlist; cross-origin session deletion returns 403 |
| Responsive styling | Local browser at actual widths 320, 390, 768, 1440 | No page-level horizontal overflow in sampled home/login views; 44px menu and carousel targets verified |
| Reduced motion | Source inspection | Section motion skipped; CSS disables animation; carousel and theme motion respect preference. OS preference was not switched during browser testing |
| Performance | Source review and existing tests | Responsive images, lazy loading, concurrent homepage reads, and pointer motion patterns covered; no field Core Web Vitals or throttled-device benchmark collected |

Live HTTP routes checked: `/`, `/promptbox`, `/skills`, `/resources`, `/workspace`, `/login`, `/waitlist`, `/terms`, `/privacy`, `/library`, `/prompt/ultra-upscale`, `/pack/Kinetic-V1`, `/skill/helix-lite`, `/admin`, `/sitemap.xml`, and a nonexistent path.

Live API paths checked without credentials: `/api/admin/session`, `/api/admin/content?table=prompts`, `/api/admin/workspace`, `/api/admin/members`, `/api/prompts/ultra-upscale`, `/api/skills/helix-lite/download`, and `/api/workspace-status`.

## Material findings

### EV-01 — Concurrent waitlist updates can lose a signup

- Severity: High. Confidence: High for the source defect; production data loss was not deliberately reproduced.
- Location: `app/api/waitlist/route.ts`, `lib-next/beta-content.ts`.
- Evidence: The original route read the full table, modified its local copy, and unconditionally wrote the whole table. Two simultaneous requests could write from the same snapshot and overwrite each other's additions.
- Impact: A person could receive success while their record is subsequently lost.
- Repair: Use the existing ETag conditional mutation with bounded conflict retries and normalized duplicate detection. Existing IDs, dates, and other rows are retained.
- Additional guard: A missing storage ETag now rejects an update rather than silently disabling the conditional-write header.
- Verification: Concurrent distinct/duplicate signup tests and a missing-ETag preservation test pass.
- Status: **verified locally**. Production concurrency/load verification pending.
- Risk/retest: Shared conditional mutation also serves the CMS and member capture. Test authenticated saves and member capture in a Netlify preview before release.

### EV-02 — Anonymous-user handling differs between page and API guards

- Severity: Medium. Confidence: High for the source mismatch; live exploitability depends on whether anonymous Supabase sign-in is enabled.
- Location: `app/api/prompts/[slug]/route.ts`, `app/api/skills/[slug]/download/route.ts`.
- Evidence: The member page/session guards rejected `is_anonymous`; these two APIs accepted any returned Auth user.
- Impact: If anonymous sign-in is enabled, anonymous identities could pass the content API boundary.
- Repair: Align both APIs with the existing member guard.
- Verification: Tests reject missing/anonymous/expired identities before any content read and retain verified-member access.
- Status: **verified locally**. Production Auth configuration and real account flow remain unverified.

### EV-03 — Hidden prompt-card faces remain interactive to assistive navigation

- Severity: Medium. Confidence: High.
- Location: `components/ui/flipping-card.tsx`.
- Reproduction: Inspect a production prompt card before flipping; its hidden Back and Sign In controls appear alongside the front in the accessibility snapshot.
- Cause: CSS backface hiding does not remove controls from keyboard or accessibility navigation.
- Repair: Mark the inactive face `inert` and `aria-hidden`; move focus to the active face when flipped.
- Retest: With a signed-in test session, Tab through a card, flip, verify focus on Back, return to cover, and verify hidden-face controls are skipped.
- Status: **fixed-unverified** for authenticated browser interaction. Compilation/type checks pass; the original defect was reproduced on production.

### EV-04 — Featured-release carousel lacks explicit motion control and adequate dot targets

- Severity: Medium. Confidence: High.
- Location: `components/ui/card-stack.tsx`, `app/premium.css`.
- Evidence: Auto advance originally stopped for mouse hover/reduced motion, with small selector buttons and no persistent pause action.
- Repair: Add pause/resume, pause while focus is within the carousel, increase selector targets to 44px, and remove spring duration under reduced motion.
- Verification: Local pause state and explicit HELIX Lite selection tested; DOM measurements confirm 44×44px targets and no page overflow at 390px.
- Status: **verified locally** for normal-motion controls; reduced-motion behavior source-reviewed.

### EV-05 — Mobile navigation and shared surfaces need consistent interaction feedback

- Severity: Low/Advisory. Confidence: High.
- Location: `components-next/site-header.tsx`, `app/premium.css`.
- Repair: 44px menu button, clear open/close icon, menu entrance animation, outside click/focus dismissal, touch press feedback, quieter shadows, readable form fields, improved footer wrapping, and a compact brand treatment at 320px.
- Verification: Escape closes the menu and returns focus; clicking the motion control outside the menu closes it and pauses the marquee. Light/dark switching and responsive fit tested.
- Status: **verified locally** for sampled paths.

### EV-06 — Sign-in success feedback can survive a subsequent failed request

- Severity: Low. Confidence: High from source.
- Location: `components-next/login-form.tsx`, `components-next/waitlist-form.tsx`.
- Repair: Clear the prior sign-in success state on submission; announce success and associate error/status messages with the input. Email inputs use 16px text for phone readability and the server's length limit.
- Verification: Local/live empty-form validation tested. Source and build confirm status/error associations. No real email was sent during this audit.
- Status: **fixed-unverified** for real delivery and repeat-submit scenarios.

### EV-07 — Prompt-card errors can prevent recovery or hide copyable text

- Severity: Medium. Confidence: High from source.
- Location: `components-next/prompt-flip-card.tsx`.
- Evidence: An old error remained when reopening/refetching the card; the error branch could override a subsequently loaded prompt. Clipboard failure also replaced the prompt with an error, undermining the manual-copy fallback.
- Repair: Clear load errors on a new attempt, expose Retry, and keep available text visible when copying fails.
- Retest: In an authenticated preview, interrupt the prompt request, retry after restoring connectivity, then deny clipboard access and manually copy visible text.
- Status: **fixed-unverified** for authenticated network/clipboard browser scenarios.

### EV-08 — Ordinary local startup cannot load the current homepage content

- Severity: Medium for developer reliability. Confidence: High.
- Evidence: `next start` outside Netlify content context reaches the homepage error screen. Read-only checks against the local Supabase configuration returned missing-table errors for Skills and Resources. Production content loads through its current CMS storage.
- Repair recommendation: Establish a documented Netlify preview/development environment with the correct isolated content store. Avoid hiding a missing source by substituting empty production catalogs.
- Audit workaround: Used an isolated local Blobs preview populated only with public DOM-derived titles/artwork to verify UI. No live CMS records were changed, and no member session was invented.
- Status: **open**. The isolated preview validates layout/motion, not full backend parity.

### EV-09 — Source and production differ in browsing/access policy

- Severity: Medium. Confidence: High.
- Evidence: Production exposes catalog and workspace previews before sign-in. This checkout requires membership before those pages render. Local Explore Prompts redirects to `/login?next=%2Fpromptbox` as its source specifies.
- Impact: Publishing the current branch changes visitor journeys beyond this visual refinement.
- Recommendation: Review the existing branch's access policy and deployed ancestry before release. Keep public previews if discovery is the intended strategy; otherwise make the pre-sign-in value proposition clear.
- Status: **open decision/release review**, not a permission change made by this audit.

### EV-10 — Whole-product operational assurance is incomplete

- Severity: Advisory verification gap, not a demonstrated outage.
- Remaining checks: real magic-link delivery/return; member sign-out/session expiration; prompt copy; valid ZIP download/open; CMS create/update/archive and image/ZIP uploads; workspace upload/brief save/restore/download; unavailable-network recovery; private Supabase/RLS/storage configuration; physical iOS/Android testing; full keyboard/contrast audit; field performance.
- Source observations: Workspace clearly states that generation is being connected. It currently prepares briefs rather than generating finished media. Admin login throttling uses a process-local map; durable edge/distributed protection should be assessed before relying on that as the only protection in serverless deployment.
- Status: **verification pending**. Passing builds and unsigned API checks do not close these journeys.

## Implemented UI direction

Retain the current white, lavender, purple, Outfit typography, logo, artwork, and page hierarchy. Use smaller shadows, consistent surfaces, readable line height, balanced pack columns, and reliable touch feedback.

Section entrances apply to the homepage and shared PageShell surfaces. They use a short opacity/16px translation, run once when entering the viewport, and leave content visible without JavaScript. No new animation dependency was added. Existing pointer tilt remains disabled for touch and reduced motion.

The shared style layer is `app/premium.css`; the entrance component is `components-next/section-reveal.tsx`. The studio and CMS layouts were not restructured.

## Prioritized next implementation roadmap

| Order | Improvement | Why | Implementation and acceptance |
| --- | --- | --- | --- |
| 1 | Finish member/admin journey verification | Core trust and release gate | Use a real test account and Netlify preview; complete callback, copy, valid ZIP open, logout, CMS CRUD/archive/uploads, and repeat after refresh. Record exact results |
| 2 | Resolve preview/deployed access policy | Conversion and consistency | Review existing membership changes; decide where public previews end; ensure every locked destination explains access and returns users to their intended page |
| 3 | Search and practical filters | Makes the growing catalog easier to use | Filter by title, category, image/video model, and pack; sync search in the URL; add empty result/reset states. Confirm mobile and keyboard use |
| 4 | Refine homepage conversion hierarchy | Reduces competing choices | Make the most important action visually primary, shorten secondary explanations, and introduce a small truthful example of prompt-to-result or skill installation. Keep existing imagery |
| 5 | Add onboarding and clearer detail-page guidance | Helps first-time members get value | Explain copy/use steps, compatible tools, what each download contains, and installation. Avoid promising generation while the studio is a brief builder |
| 6 | Extend the mobile motion system carefully | Adds fluidity without slowing interactions | Apply the shared timing/press conventions to tabs, loading/empty states, upload previews, and confirmations; pause offscreen auto motion; verify reduced motion and physical devices |
| 7 | Consolidate duplicate styles incrementally | Keeps future refinement predictable | Audit the large global stylesheet by component, migrate verified tokens/rules in small steps, and compare before/after screenshots. Avoid a global rewrite |
| 8 | Measure and improve real performance | Optimizes demonstrated bottlenecks | Collect mobile LCP/INP/CLS on home/catalog/detail, profile image/video transfer and long tasks, then address measured causes. No performance score is claimed here |
| 9 | Strengthen operational abuse/recovery controls | Reliability as traffic grows | Review sign-in/waitlist abuse controls, trusted-proxy/durable admin rate limits, storage failure messaging, observability, and backup/recovery. Validate against the deployed configuration |

## Validation and delivery state

- `npm test`: **24 passed, 0 failed**. Initial baseline was 21 passing tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed after the final code changes; Next.js compiled all routes.
- `git diff --check`: passed. Git emitted line-ending notices for separate existing/concurrent files, not whitespace errors.
- Storage tests use the real local Blobs SDK client/server with a test-only adaptation for GET ETags and atomic operations. The SDK's filesystem emulator omits GET ETags and does not serialize condition checks with writes; unchanged baseline tests could therefore pass without proving conflict behavior. These tests model the conditional-write contract and do not replace Netlify preview testing.
- Local screenshots: `../outputs/website-audit-2026-10-04/mobile-home.png`, `mobile-dark.png`, `mobile-login.png`, `mobile-waitlist.png`, and `desktop-home.png`.
- No dependency installation, production mutation, commit, push, or deployment was performed for this audit.

Next release gate: verify real member/admin journeys on a Netlify preview and review the current branch's separate access/metadata work before publishing the combined working tree.
