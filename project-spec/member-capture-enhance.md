# Verified member capture and Enhance image prompts - 2026-10-04

Scope: persist verified sign-in emails in existing CMS Members; preserve pending
magic-link rows, stable IDs and signup dates; deduplicate by normalized email or
Auth user ID; display status and last sign-in with existing CSV export. Source
identity comes only from Supabase getUser, never a client-supplied email. Use
existing ETag-conditional Blobs updates with bounded conflict retries; capture
failure returns a retryable error before establishing the member cookie. Existing
members are upgraded on their next verified session synchronization. Historical
Supabase-only accounts are not silently backfilled or claimed imported. No new
marketing subscriptions, role changes or production database migrations.

Enhance: load all published image-only Promptbox entries (same !pack_id rule),
without truncation; searchable title/description list, persistent ID selection,
selected description, optional extra direction, simple-enhancement fallback.
Downloaded briefs include the selected prompt's identity and current full text.
Save/restore stores its ID and rejects unavailable selections gracefully. Prompt
text is supplied only after the existing server member guard. Actual generation
remains unconnected; no billable generation is part of this task.

Validation: security/capture failure unit tests, deduplication and preserved-record
tests, actual isolated Blobs concurrent create/update/read, all-preset selection
tests, typecheck, lint, production build, isolated Enhance UI verification.
Status: locally verified. Not committed, pushed or deployed.

Evidence: 21/21 tests pass, including real local Blobs create/read/concurrent
update and session route capture-failure rejection. Typecheck, lint and production
build pass. Isolated browser fixture from captured local content shows all 10
image prompts, searches upscale to two matches, selects Ultra Upscale, and
restores it after New brief. JSON export contents are verified in unit tests;
the in-app browser did not expose a download artifact, so an actual downloaded
file is not browser-verified. Real-account sign-in and live CMS capture are not
tested; prior callback allow-list verification still applies before deployment.
