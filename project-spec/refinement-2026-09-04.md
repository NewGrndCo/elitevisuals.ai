# EliteVisuals refinement contract

Status: validated for implementation under the September 4 user brief. Mode: product.

## Governing evidence and preservation

The current Next.js runtime, purple/white identity, Outfit typography, floating navigation,
hero, visual runway, public copy, routes, member access and content models are retained.
Baseline: GitHub 0012cb7 plus the deployed September 4 local source, preserved in 68f84fb.
The original source checkout is untouched. No active HELIX quality-memory lessons apply.

## Authorized scope

Refine public navigation, responsive/focus/motion states, metadata, errors and loading.
Improve CMS overview, search, filters, sorting, pagination, editing, drafts, duplicate,
archive/restore, scheduling, previews and shared media uploads/library. Preserve member
listing and CSV export. Validate server inputs and publication rules. Keep existing
Netlify Blobs tables and assets; lifecycle fields are additive and require no SQL migration.
Remove dependencies only when unused by the active Next.js runtime; retain legacy source
as historical reference. No new commerce or branding work.

## Architecture and states

Server routes retain cookie authorization; public/member access is checked server-side.
CMS field definitions, validation, requests and upload controls become shared modules.
Non-production content writes must be isolated from production. Existing records, IDs,
slugs, assets and relationships are preserved. Drafts and archives do not resolve publicly.
Scheduled publication is evaluated at request time; discovery refreshes within 60 seconds.
Uploads support validation, progress, cancellation, retry, preview, replace and reuse.
Editor changes are explicit saves, with unsaved-change protection; no automatic publishing.
The UI must distinguish loading, empty, filtered-empty, validation, expired-session,
network-error, successful-save and conflicting-update states.

## Acceptance and verification

- Given existing published content, every public route and media reference still works.
- Given draft, archived or future content, anonymous detail requests do not expose it.
- Given unauthenticated requests, all CMS mutations and private downloads are rejected.
- Given invalid uploads or unsafe URLs, validation rejects them before publication.
- Given two concurrent edits, a stale save does not silently overwrite newer content.
- Given an interrupted request, the user sees an error and can retry without losing edits.
- Given a phone viewport, navigation, forms, media controls and actions remain usable.
- Given keyboard or reduced-motion preferences, controls and motion remain accessible.

Run lint, TypeScript, focused behavior/security tests and production build. Exercise public
routes and CMS flows against isolated test data. Record measured results and limitations;
do not claim live Supabase RLS or email delivery is verified without evidence.

## Release and rollback

Prepare a reviewable branch and preview before production replacement. Current rollback
deploy: 6a9ad6ab1beb206a6edcd607. No production record deletion or schema migration planned.
Known baseline risks: whole-table last-write-wins storage, client-hidden prompt text,
unvalidated CMS fields, unsupported site-asset uploads and missing sitemap.
