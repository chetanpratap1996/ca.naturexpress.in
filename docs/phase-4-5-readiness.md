# Phase 4–5: Firm notice control and pilot proof

## Phase 4 — Notice register

- Partners record notices from the original document received by the firm.
- Each entry stores client entity, authority, section/form, optional DIN/reference, issue date, statutory deadline, amount, risk, responsible partner, summary and response stage.
- Deadline urgency is calculated from the statutory deadline on read; there is no government portal sync or claim that a notice was fetched or validated.
- Create and status changes are recorded in the firm audit trail. The API is partner-only, firm-scoped and returns no-store responses.
- The queue supports searching by entity/section/reference/summary and exposes overdue dates and stage.
- The product does not draft legal responses, sign, or file them. Staff should preserve the original notice and independently verify the deadline.

## Phase 5 — Pilot readiness and scorecard

- The readiness checklist reflects stored firm data: client entities, compliance tasks, task ownership, documents and client uploads linked to tasks.
- Baseline and review measures are manually entered and saved in the firm-scoped state: weekly client-chasing hours, typical task minutes, overdue open tasks and pilot-client count, with date and method notes.
- Comparisons show the entered values and arithmetic difference only. Blank data stays blank; the app does not claim causal impact, savings, adoption, ROI, or a customer price.
- Both scorecard saves create audit records. API reads/writes are partner-only and no-store.

## Live rollout checklist

1. Apply the existing Supabase schema and workspace migrations in the target environment; this code change does not apply database changes to the live firm.
2. Create one firm workspace and partner account, then confirm the partner can access the production workspace.
3. Enter a small, consenting pilot set of client entities and staff assignments; confirm task owners and portal access before inviting clients.
4. Log a real notice from its source document and confirm the deadline, owner, stage and audit trail with a second firm user.
5. Capture baseline using a documented measurement method; review after the agreed pilot interval using the same client/work sample.
6. Record issues and observed outcomes. Decide whether to expand based on partner/client feedback and measured data, not on an assumed ROI claim.

WhatsApp reminders remain one-tap preset drafts that open the user's WhatsApp app; no WhatsApp API credentials or automated sends are used. There is no payment gateway. Billing/payment reconciliation workflows remain outside these phases.
