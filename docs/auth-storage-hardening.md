# Authentication and Storage Hardening

## What this change establishes

- Production API requests must carry a Supabase Auth session and an active row in `public.users` linked through `auth_user_id`. Client-supplied role values, unsigned JSON tokens, and sandbox headers are not accepted in production.
- Production route policy restricts actions by role. The client workspace response is reduced to the assigned legal entity, and internal DSC, notice, audit, staff-security, and firm-realization data are excluded.
- Production reads/writes for client profiles, compliance tasks, invoices, and documents use Supabase tables. Client uploads go directly to a private Supabase Storage bucket; the API records metadata only after checking the uploaded object and entity scope.
- Local JSON storage is development-only. Production access to file-backed legacy endpoints is rejected until those workflows have durable Supabase storage.
- Demo identities and deterministic-password helpers cannot authenticate in production. Client directory exports no longer contain generated passwords.

## Required Supabase rollout

The application code does not apply schema changes automatically. Review and apply `supabase/migrations/20261028_auth_scope_and_workspace_storage.sql` to the intended Supabase project before deploying this code.

The migration links existing `public.users` profiles to Supabase Auth accounts with a case-insensitive email match. Review those links after the migration. For every client account, set exactly the intended `client_entity_id` (or an explicitly approved `client_group_id`) and an appropriate `CLIENT_PROMOTER` / `CLIENT_ACCOUNTANT` role. A client profile without a data scope is rejected.

This is a schema migration only; it does not copy records from `.data/db.json` or the local uploads folder into Supabase. Back up and migrate any records you need before deploying. Production deliberately refuses the old file-backed store.

Create staff and client accounts in Supabase Auth, then link each account to one active firm profile. Do not reuse the demo partner/article/client profiles or passwords for real users. Keep the publishable key public; never place a Supabase service-role key in `NEXT_PUBLIC_*` variables.

## Production endpoints still awaiting storage migration

These existing workflows still depend on the local JSON database or simulated integrations and deliberately return `503 DURABLE_STORAGE_REQUIRED` in production:

- Pay-to-release configuration and payment release
- Portal sync and notice workflow
- Peer review and partner realization analytics
- WhatsApp parser and password-pattern vault

The DSC custody vault and audit-trail viewer now use the Supabase tables and RLS policies defined by the migration.

Those workflows need route-specific Supabase persistence and, where relevant, trusted payment or government-portal integrations before they can be enabled for real use. They remain available only in local development.

## Release gate

The project build passing confirms compilation only. Before real client data is used, apply the migration, verify the deployed Vercel environment points to the intended Supabase project, provision the Auth/profile rows, and perform authorized end-to-end checks for partner, staff, and client access, cross-entity denial, document upload/read, task changes, invoice UTR submission, and persistence after a new session. Do not enable the file-backed endpoints until each has been migrated and verified.
