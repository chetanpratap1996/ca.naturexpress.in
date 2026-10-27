# Phases 2–3: production safeguards and daily workflow

## Phase 2 safeguards implemented

- Authenticated API responses are marked private and non-cacheable by the production middleware.
- The PWA caches only its static shell. It does not store authenticated HTML, API responses, or documents. Offline mode presents a neutral reconnect message.
- Security response headers cover content sniffing, framing, referrer leakage, browser permissions, and HTTPS transport.
- Partners can export core firm records, task and client details, invoice/notice records, the most recent 500 audit entries, and document metadata as JSON. The export excludes document bytes, storage paths, and credential/bank-processing configuration; each export is audited.

The export is a portability tool, not a database backup or restore mechanism. Before production use, configure backups/point-in-time recovery for the chosen Supabase plan, set the retention period the firm approves, and perform a restore drill. Keep exports in a firm-controlled encrypted location with access limited to authorized partners.

## Phase 3 daily workflow implemented

- The partner task board has one-tap filters for all open work, due/overdue within seven days, client-blocked work, review queues, and tasks without an owner.
- A document reminder opens a prefilled WhatsApp draft using the existing `wa.me` preset flow. A person reviews and sends the message in WhatsApp.
- The app records the draft as **prepared**, not sent. No WhatsApp API, background delivery, or payment gateway is used.
- The install guidance now describes visit-based status checks and connected uploads; it does not promise push notifications or offline access to private records.

## Before opening the production pilot

1. Apply the outstanding SQL migrations to the intended Supabase project after confirming the target and backup state.
2. Configure and test database recovery independently of the JSON export.
3. Have the firm validate client phone/contact authorization and reminder wording before staff use the WhatsApp drafts.
4. Review the export fields and retention/access policy with the firm. The export contains confidential client data even though credentials and document bytes are excluded.
