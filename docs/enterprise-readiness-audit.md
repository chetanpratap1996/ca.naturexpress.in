# Enterprise Readiness Audit

**Audit date:** 2026-10-30  
**Scope:** Static review of the Next.js application, API handlers, auth/session code, Supabase schema/migration, local persistence, PWA worker, and product-facing login claims.  
**Validation:** TypeScript check and whitespace/diff check passed after the changes listed below. No live Supabase project, deployed environment, penetration test, or end-to-end role exercise was available, so this is not a production certification.

## Changes made in this pass

- Removed acceptance of caller-crafted `tok_*`, `bt_*`, unsigned base64 JSON, user metadata roles, and sandbox headers as server identity. Server identity now requires a valid Supabase Auth session and an active linked `public.users` profile with a firm and client scope.
- Replaced the legacy login path with Supabase email/phone and password authentication. Removed the browser-network-error fallback that silently accepted hard-coded demo credentials.
- Made API routes private by default and applied coarse role restrictions to firm-only endpoints and the client workspace surface.
- Removed the app token from client-generated bearer headers and stopped writing it into a script-readable cookie.
- Added server-side Supabase sign-out to the existing logout action.
- Bound `/api/data` queries to the caller's Supabase session so RLS applies. Production now fails closed when durable data reads fail and returns an allowlisted workspace shape rather than mock internal fields.
- Added client entity checks for document uploads in development, file payload validation, and a production `503` while private durable upload storage is unavailable.
- Restricted invoice actions so clients can submit a syntactically valid UTR only for their assigned entity; partner reconciliation is role checked.
- Restricted notification creation/deletion to partners and limited client notification reads to entity-targeted client notifications.
- Updated login guidance to match Supabase email/phone and password authentication.

## Prioritized improvements still needed

| Priority | Area | Finding and required improvement | State |
|---|---|---|---|
| P0 | API authorization | Tasks, DSC, pay-to-release, portal-sync, analytics, peer-review, billing, WhatsApp, audit, and client handlers still need route-level role/action checks. Middleware is a coarse outer gate; each handler must authorize its operation and entity. | Open |
| P0 | Tenant isolation | `/api/tasks`, `/api/invoices`, `/api/documents`, and several legacy handlers still read or mutate the shared JSON store. Move all live paths to request-scoped Supabase queries and prove entity/group filters at the query boundary. | Open |
| P0 | Durable data | Task, invoice, notification, portal, pay-to-release, peer-review, analytics, WhatsApp, audit, and other legacy operations still use `.data/db.json` or simulated integrations. Migrate each to durable storage or keep it explicitly disabled in production. | Open |
| P0 | Upload security | The current document route is local-file based and is intentionally disabled in production. Implement private Storage uploads, MIME/signature checks, malware scanning, size quotas, retention rules, and short-lived authorized download URLs. | Open |
| P0 | Invoice consistency | Invoice handlers update local JSON and best-effort Supabase separately. Replace with a single durable transaction/RPC, idempotency keys, state transition validation, trusted reconciliation, and an append-only audit event. | Open |
| P0 | Task integrity | Task handlers still use local JSON and do not enforce assignment-level scope or a full status transition graph. This pass added staff/partner checks, partner-only creation, UDIN validation, and server-derived audit identities. Finish with durable writes, schema validation, and allowed transitions. | In progress |
| P0 | PIN lifecycle | `/api/auth/pin` still targets the legacy PIN store and does not support the new Supabase identity lifecycle cleanly. Replace it with Supabase password update/reset flows, require recent re-authentication, and remove four-digit/default PIN behavior. | Open |
| P0 | Payment integrity | Pay-to-release can simulate a payment and mark invoices paid without a trusted payment-provider callback. Integrate signed provider webhooks, idempotency, reconciliation, and immutable payment records before enabling. | Open |
| P0 | External integrations | Portal-sync and WhatsApp features can return simulated government/dispatch results. Mark simulations clearly and prohibit any message or statutory submission claim until an authenticated, auditable provider integration exists. | Open |
| P0 | Legal output | The notice drafter embeds legal grounds and case references as fixed strings and can imply filing or legal correctness. Add source verification, jurisdiction/date versioning, review requirements, citations, and explicit draft-only states. | Open |
| P0 | Migration rollout | The app depends on `20261028_auth_scope_and_workspace_storage.sql`, but this review did not confirm it is applied, reviewed, or configured in production. Run a controlled migration, verify user-profile links/scopes, and test RLS with separate partner, staff, and client accounts. | Open |
| P1 | Authentication assurance | Add MFA for firm roles, secure recovery/invitation flows, session revocation, inactive-user revocation, and session-age policy. Validate Supabase Auth provider settings and cookie behavior in the deployed domain. | Open |
| P1 | Abuse controls | Login rate limiting previously lived in process memory and is not multi-instance safe. Configure provider-side limits and add shared IP/account throttling, enumeration-resistant responses, alerting, and lockout/recovery policy. | Open |
| P1 | Request validation | Most handlers parse unvalidated JSON and permit mass assignment, invalid enum/state values, oversized strings, and malformed identifiers. Define route schemas, payload limits, normalized error responses, and strict unknown-field rejection. | Open |
| P1 | Error handling | Multiple handlers return raw exception messages or log sensitive request context. Add typed error mapping, request correlation IDs, redaction, structured logs, and no-PII error responses. | Open |
| P1 | Audit trail | Audit data is file-backed in legacy flows, actor fields are often caller controlled, and logging is not atomic with business writes. Use server-derived identities and transactional, append-only, retention-controlled audit records. | Open |
| P1 | Security headers | `next.config.mjs` lacks a Content Security Policy, HSTS, and other deployment-appropriate browser protections. Set and verify headers at the application and edge, including a CSP compatible with the app. | Open |
| P1 | Data protection | Define encryption, secrets management, retention/deletion, data export, breach response, backup, restore, and disaster-recovery policies for PAN, GST, bank, tax, DSC, and identity data. Verify backups can be restored. | Open |
| P1 | Environment safety | Remove hard-coded Supabase project fallbacks and validate required environment variables at startup. Separate development, staging, and production projects and block production startup on missing/mismatched configuration. | Open |
| P1 | Client safety | Review all data returned by `/api/data`, downloads, notifications, and generated documents against each supported client scope, including group-only profiles. Add negative cross-tenant access checks. | In progress |
| P1 | Session presentation | Client profile state is still stored in localStorage and can become stale after logout/revocation. Treat it only as display cache, fetch `/api/session` on startup, and clear/reload on 401/403 and auth changes. | Open |
| P1 | Offline behavior | The client queues mutations and clears the queue after attempted replay even when requests fail. Add per-item acknowledgement/retry, idempotency, conflict handling, expiry, and a visible review step for financial/statutory changes. | Open |
| P1 | Notifications | Notification storage is shared and file-backed, with no per-user read state. Move to durable recipient-scoped rows and tenant-safe querying before enabling client notification mutation. | Open |
| P2 | Performance | Several data paths use `select *`, unpaginated result sets, and nested in-memory joins. Add explicit column selection, pagination, indexes, query plans, caching rules, and load testing against representative tenant sizes. | Open |
| P2 | Reliability | Local JSON locking is process-local and does not provide cross-process transactions or safe multi-instance behavior. Remove it from production paths and define retry, idempotency, queue, and outage behavior. | Open |
| P2 | Frontend state | API failures can leave or restore mock records and make saved/financial actions look successful. Add loading/error/empty states, distinguish demo data visually, and report server persistence outcomes accurately. | Open |
| P2 | Accessibility | Audit the full portal for keyboard navigation, focus handling, semantic structure, screen-reader labels, contrast, reduced motion, and mobile zoom behavior. | Open |
| P2 | Product claims | Review marketing copy that implies “live,” certified, automated, decrypted, AI-verified, or filed outcomes. Claims must match actual enabled integrations and evidence. | Open |
| P2 | Supply chain | Add dependency update monitoring, lockfile review, vulnerability scanning, secret scanning, SBOM generation, and a release process for security patches. | Open |
| P2 | Operations | Add health/readiness checks, uptime and error dashboards, alerts, deployment rollback, database migration gates, and incident runbooks. | Open |
| P2 | Quality gates | Add unit, API authorization, RLS, tenant-isolation, upload, session, and browser end-to-end tests plus CI build/type/lint gates. The current check was TypeScript only. | Open |
| P3 | API contracts | Document each endpoint, schema, role, scope, state transition, error, and deprecation path; generate and validate an OpenAPI contract. | Open |
| P3 | Governance | Establish data ownership, tenant lifecycle, least-privilege staff access, access reviews, retention schedules, and customer support/audit procedures. | Open |

## Recommended delivery sequence

1. Finish P0 handler authorization and tenant-scoped durable persistence; keep unsupported production actions disabled.
2. Complete Supabase migration and run role-by-role cross-tenant denial checks in a staging project.
3. Replace simulated payment, portal, WhatsApp, document, and legal-drafting paths with verified integrations or clearly labelled draft workflows.
4. Add operational controls, monitoring, backups, CI security gates, and end-to-end authorization tests.
5. Complete frontend accessibility, performance, and product-claim review.
