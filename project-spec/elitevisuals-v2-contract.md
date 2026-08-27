# EliteVisuals.ai V2 Product Contract

Contract ID: EV2-CONTRACT-0.3  
Mode: Product  
Status: Approved for weekend-release implementation  
Date: 2026-08-26

## Objective

Evolve EliteVisuals.ai from a single-pack prompt storefront into an image-first AI visual discovery product with downloadable AI skills. Preserve all V1 prompts, packs, media, users, purchases, URLs, and administrative access while introducing a more editorial public experience inspired by the structural strengths of Tunnelbox.

The reference informs layout principles only. EliteVisuals.ai will retain its own identity, copy, imagery, color system, and interaction details.

## Locked product decisions

- Keep the existing TanStack application and Supabase project.
- Extend the existing database through additive migrations; do not recreate live records.
- Keep the `elite-media` storage bucket and current media URLs.
- Preserve V1 UUIDs, slugs, timestamps, pack relationships, purchases, memberships, and copy counts.
- Keep V1 routes working or provide permanent redirects.
- Expand the existing admin rather than introducing a separate CMS.
- Include downloadable, versioned AI skill packages in the first V2 release.
- Exclude native AI image generation from the first V2 release.
- Build and verify V2 separately before switching the production domain.

## Public information architecture

| Route                | Purpose                                                   | Primary action           |
| -------------------- | --------------------------------------------------------- | ------------------------ |
| `/`                  | Editorial, image-first landing page                       | Explore visuals          |
| `/library`           | Searchable visual prompt library                          | Open a prompt            |
| `/prompt/$slug`      | Prompt detail and usage workflow                          | Copy or use prompt       |
| `/pack/$slug`        | Curated prompt-pack landing page                          | Explore or purchase pack |
| `/login`             | Customer authentication                                   | Sign in                  |
| `/account`           | Purchases, saved prompts, and history                     | Resume activity          |
| `/pricing`           | Packs, membership, and future credits                     | Purchase access          |
| `/skills`            | Browse downloadable AI skills                             | Open a skill             |
| `/skill/$slug`       | Skill details, compatibility, versions, and documentation | Download skill           |
| `/account/downloads` | Customer-owned skill packages and version history         | Download owned version   |
| `/admin`             | Protected operating dashboard                             | Manage the product       |

## Homepage composition

1. Floating, rounded navigation shell.
2. Short centered hero with one primary and one secondary action.
3. Animated horizontal runway using published EliteVisuals media.
4. Featured prompt grid using 4:5 visual cards.
5. Curated pack or collection row.
6. Simple three-step usage explanation.
7. Supported AI-model strip.
8. Membership or pack conversion section.
9. Compact footer with legal and account links.

Desktop should feel spacious and editorial. Mobile should prioritize a two-column visual grid, thumb-friendly actions, and minimal copy.

## Admin architecture

### Existing capabilities to retain

- Overview
- Landing-page content
- Homepage section ordering
- Packs
- Prompts
- Categories
- AI-model logos
- Administrator whitelist

### V2 capabilities to add

- Media library with usage references and orphan detection
- Featured and scheduled content controls
- Collection management
- User and purchase lookup
- Prompt-view, copy, and conversion analytics
- Generation operations if image generation enters approved scope
- Draft preview and scheduled publishing
- Administrative activity log
- Export and backup controls
- Skill catalog, compatibility, pricing, and publication controls
- Skill-version uploads with changelogs and integrity hashes
- Download-entitlement and download-activity lookup

## Canonical requirements

- `EV2-R01` — Provide an original, image-first responsive homepage.
- `EV2-R02` — Provide library search, category filters, pack filters, and useful empty states.
- `EV2-R03` — Preserve every existing public prompt and pack URL.
- `EV2-R04` — Preserve V1 content records and their relationships without manual re-entry.
- `EV2-R05` — Preserve media files and verify every referenced URL before launch.
- `EV2-R06` — Preserve users, roles, purchases, memberships, and Stripe references.
- `EV2-R07` — Keep administrative operations protected by authenticated role authorization.
- `EV2-R08` — Add preview, publication-state, and destructive-action safeguards to admin workflows.
- `EV2-R09` — Meet keyboard, focus, contrast, reduced-motion, and responsive accessibility expectations.
- `EV2-R10` — Record views, copies, saves, purchases, and key conversion events without storing prompt text in analytics payloads.
- `EV2-R11` — Maintain a tested rollback path to the V1 deployment until V2 passes independent verification.
- `EV2-R12` — Do not expose unpublished or paid prompt content through public page data or client-side hiding.
- `EV2-R13` — Provide a searchable catalog of downloadable AI skills with clear compatibility and installation instructions.
- `EV2-R14` — Store downloadable skill archives privately and issue short-lived downloads only after server-side entitlement checks.
- `EV2-R15` — Version every skill release and retain its changelog, file size, integrity hash, publication state, and compatibility metadata.
- `EV2-R16` — Let administrators create skills, upload versions, preview listings, publish or unpublish releases, and inspect download activity.
- `EV2-R17` — Let entitled customers revisit and download owned skills from their account without repurchasing.
- `EV2-R18` — Log skill downloads without exposing private storage paths, service credentials, or unrestricted public URLs.

## Downloadable skills capability contract

### Core entities

| Entity               | Purpose                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `skills`             | Public catalog identity, description, cover, price, compatibility, and publication state |
| `skill_versions`     | Immutable version metadata and private archive location                                  |
| `skill_entitlements` | Records which user can download which skill and why                                      |
| `skill_downloads`    | Append-only audit record for successful download issuance                                |

### Package lifecycle

`draft -> review -> published -> deprecated -> archived`

Publishing a new version does not delete earlier versions. An entitled user can access supported versions associated with the purchased skill. Archived packages remain unavailable for new downloads unless an administrator explicitly restores them.

### Secure download flow

1. The customer signs in.
2. The server verifies the requested skill and version are available.
3. The server verifies ownership, membership access, or a free entitlement.
4. The server issues a short-lived signed URL from a private storage bucket.
5. A download event is recorded without storing the signed URL.
6. Expired links require a new entitlement check.

The browser never receives a Supabase service-role credential or a permanent private-file URL.

## V1 preservation map

| V1 source                      | V2 handling                                                            |
| ------------------------------ | ---------------------------------------------------------------------- |
| `packs`                        | Reuse in place; extend only when approved                              |
| `prompts`                      | Reuse in place; preserve UUIDs and slugs                               |
| `categories`                   | Reuse in place                                                         |
| `site_content`                 | Reuse initially; add versioned blocks if needed                        |
| `ai_logos`                     | Reuse in place                                                         |
| `purchases`                    | Reuse without destructive transformation                               |
| `user_roles` and Supabase Auth | Reuse; review authorization before release                             |
| `admin_whitelist`              | Preserve; consider replacing PIN layering with stronger staff controls |
| `elite-media` bucket           | Reuse; generate an asset inventory before launch                       |

## Migration acceptance criteria

1. Pre-migration counts are recorded for every preserved table.
2. Post-migration counts match unless an approved change record explains the difference.
3. Every prompt retains its pack and category relationship.
4. Every stored media URL returns the expected asset.
5. Existing prompt and pack slugs resolve successfully.
6. Existing users can authenticate.
7. Existing purchases grant the same access as V1.
8. No unpublished or restricted record is readable anonymously.
9. A V1 database backup and deployment rollback procedure are verified.

## Assumptions

- `EV2-A01` — The current Supabase project remains the canonical production data source. Confidence: high. Impact: critical. Confirmation required before implementation.
- `EV2-A02` — V2 remains focused on prompts, packs, downloadable skills, and administration during the first release; built-in image generation is deferred. Confidence: high. Impact: high. Approved by owner on 2026-08-26.
- `EV2-A03` — Stripe remains the payment provider. Confidence: high based on V1 code. Impact: high. Confirm against the live environment.
- `EV2-A04` — Approved visual direction: Tunnelbox-inspired structural rhythm with an original EliteVisuals purple-and-white system, light canvas, floating pill navigation, compact centered hero, horizontal visual runway, and dense 4:5 prompt gallery. Existing EliteVisuals content and assets remain authoritative. Approved by owner on 2026-08-26.
- `EV2-A05` — “Skills” means downloadable ZIP archives compatible with Codex/ChatGPT-style skill packages. Confidence: high. Impact: high. Approved by owner on 2026-08-26.

## Current blockers

- `EV2-B01` — Live Supabase record and storage-object counts have not been captured.
- `EV2-B04` — Production hosting, deployment, and rollback access have not been verified.
- `EV2-B05` — Exact downloadable-skill format and supported platforms require owner confirmation.

## Delivery sequence

1. Approve the V2 product and creative direction.
2. Capture a read-only V1 content and media inventory.
3. Produce responsive homepage and library prototypes using existing content.
4. Extend admin workflows behind feature flags.
5. Apply approved additive database migrations.
6. Run functional, responsive, accessibility, authorization, and migration tests.
7. Submit the build as a verification candidate for independent Neme V2 review.
8. Release with V1 rollback available.

## Next gate

Confirm the downloadable-skill package format and supported platforms, then approve the V2 creative direction.

### EV2-R19 — Auth-gated prompt visibility

Signed-out visitors may discover prompts, but prompt text must be visually obscured and non-selectable until authentication. Copy remains authentication-gated.

### EV2-R20 — Curated resources directory

The public product includes a searchable, filterable Resources page for AI tools, platforms, creators, news sources, and illustrated workflows. Admins can create, publish, unpublish, and remove entries.

### EV2-R21 — Global site asset library

Admins can upload and catalog reusable site images, videos, icons, and documents with stable keys, alt text, notes, and publication status.
