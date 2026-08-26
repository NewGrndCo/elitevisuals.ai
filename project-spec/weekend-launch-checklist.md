# EliteVisuals.ai V2 Weekend Launch Checklist

## Required before deployment

- Back up the production Supabase database and `elite-media` bucket.
- Apply `20260826191432_add_downloadable_skills.sql` to staging first.
- Confirm the private `skill-packages` bucket exists and is not public.
- Confirm customer email/password authentication and confirmation-email URLs.
- Configure production `SUPABASE_URL`, publishable key, service-role key, Stripe restricted key, and Stripe webhook secret in the host secret store.
- Register `/api/public/stripe-webhook` for `checkout.session.completed`.
- Upload at least one valid ZIP version through Admin → Skills.
- Test a free download with a new customer account.
- Test a paid purchase in Stripe test mode and confirm the entitlement appears under `/account/downloads`.
- Confirm anonymous users cannot list or download objects from `skill-packages`.
- Confirm existing prompt, pack, image, admin, and donation paths still work.
- Run a production build and smoke-test `/`, `/library`, `/skills`, `/skill/:slug`, `/login`, `/account/downloads`, and `/admin`.

## Release sequence

1. Deploy the database migration.
2. Deploy the application to a preview/staging URL.
3. Run the free and paid download tests.
4. Capture record counts and storage-object counts.
5. Deploy production.
6. Run production smoke tests.
7. Keep the previous deployment available for immediate rollback.

## Rollback

Roll back the application deployment first. The database migration is additive and should remain in place during an application rollback; dropping the new tables or bucket is unnecessary and risks deleting uploaded skill packages.
