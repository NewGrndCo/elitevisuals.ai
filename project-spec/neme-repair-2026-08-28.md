# Neme V2 Repair Record — 2026-08-28

Mode: Repair and Verify. Object: Next.js public cutover branch. Modification authority: user-reported defects. Environment: local development. Contract: Elite Visuals V2 + CR-004.

## Findings

- NV2-001, High, verified closed: `/admin` returned 404 after the App Router cutover. Repaired with a PIN-gated Next.js admin route and allowlisted server APIs. Retested: route 200, PIN session 200, content read 200.
- NV2-002, Medium, verified closed: hero visual showcase was static despite the approved two-direction motion requirement. Repaired with two continuous CSS marquee tracks moving in opposite directions. Retested through rendered markup and production build.
- NV2-003, Medium, verified closed: image-formatted demo URLs were rendered as `<video>` and failed visibly. Repaired with media-type detection, cover-to-demo fallback, load-error recovery, and a branded visual fallback.
- NV2-004, High, blocked by environment: admin mutation requires `SUPABASE_SERVICE_ROLE_KEY`. Read access falls back to the publishable client; mutation stays disabled by the server boundary until the secret is configured.

## Verification

- Next.js production build: pass.
- TypeScript: pass through `next build`.
- Focused ESLint: zero errors; framework metadata warnings remain advisory.
- Production dependency audit: zero vulnerabilities.
- Homepage: HTTP 200; two marquee tracks rendered.
- Admin route: HTTP 200; PIN session accepted; content endpoint HTTP 200 in read-only mode.

Readiness: verification pending. Production remains blocked by NV2-004 and the broader Next.js authentication/checkout migration recorded in CR-004.
