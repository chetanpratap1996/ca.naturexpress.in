# Brains & Taxes: Product Page and Navigation Blueprint

**Purpose:** Make every existing feature findable by the right person while giving each role a simple daily starting point. This maps the current code and proposes one coherent destination for every feature. It is an information-architecture blueprint, not a statement that every feature is production-ready.

## Product structure in one sentence

The product should be organized around the work moving through a CA firm: **client request → document received → work assigned → prepared → reviewed → approved → filed and evidenced → client informed → billed and collected**. Specialist engines support that flow; they should not feel like unrelated mini-products.

## Starting point that prompted this refactor

There are only two page routes, but each contains several internal views and modals:

| Current route / surface | Current purpose | Main concern |
|---|---|---|
| `/` | Gateway/login plus partner, article staff, and client experiences selected through component state | It is a large role-switching page, not a set of clear, bookmarkable work areas. |
| `/admin` | A second partner/article console with its own, smaller module list | Duplicates the partner console but does not expose the same feature set. Pick one canonical workspace. |
| Partner tab strip | 23 internal modules on `/`; 11 on `/admin` | On mobile, the full catalog is a long dropdown. On desktop, it is a horizontal strip. The floating bar exposes only a few destinations. |
| Article Workbench | Seven internal workbench tabs inside the article view | The global bottom bar still shows partner destinations and does not navigate the article tabs. |
| Client Portal | Ten internal client tabs, a second horizontal tab strip, five floating-bar actions, and a Quick Action modal | The same area has multiple navigation systems; several useful features are absent from the floating bar. |
| Modals | Client master, Firm Hub, client Quick Actions, command palette, install guide, banker docket, upload/payment/sign-off dialogs | Some are core destinations presented as popups, making it harder to return to them or share a direct link. |

Current route source: [src/app/page.tsx](../src/app/page.tsx), [src/app/admin/page.tsx](../src/app/admin/page.tsx). Current navigation source: [TopNav.tsx](../src/components/navigation/TopNav.tsx), [FloatingBottomNav.tsx](../src/components/navigation/FloatingBottomNav.tsx), [ClientPortalPwa.tsx](../src/components/client/ClientPortalPwa.tsx), [ArticleWorkbench.tsx](../src/components/firm/ArticleWorkbench.tsx).

## Refactor now implemented in the local working tree

- `/admin` redirects to the unified `/` workspace.
- Partner navigation is grouped into daily operations, clients and practice, revenue and governance, and specialist engines. The More/Tools destination includes a searchable catalog of every partner module plus Client Master.
- Partner, staff, and client mobile bars now have separate destinations. Staff has working My Day, Tasks, Quick Actions, WhatsApp, and More destinations; client has Filings, Requests, Upload, Vault, and Pay & Tools.
- The client Requests page presents open document and approval requests. Pay & Tools retains invoices and exposes the secondary client tools.
- Compliance task cards offer category-relevant shortcuts to bank OCR, GSTR-2B, AIS/26AS, Form 3CD, or Schedule III, with the originating task shown in the workspace.
- Existing tool components, `useTaxoData()`, and the existing modal workflows were retained.

The shortcuts preserve a visible task reference in the workspace; they do not automatically load that task's data into every specialist engine. The separate security and data-integrity findings from the product review are outside this navigation refactor.

## Page-by-page product blueprint

### 0. Public entry and account access

| Proposed page | Audience | What belongs here | Entry point |
|---|---|---|---|
| Public product/firm landing | New CA firms and invited clients | Clear product purpose, firm identity, sign-in, invitation acceptance, support | `/` when signed out |
| Sign-in and invitation acceptance | All users | Secure sign-in, password reset or verified link, firm invitation, account recovery | Landing and invite links |
| Evaluation sandbox | Prospective firms / internal demos | Clearly marked fictional sample firm and data; resettable and isolated from live work | Explicit “Explore demo” action |

Keep the product landing separate from the signed-in workspace. Do not make role switching or a demo profile look like normal production access.

### 1. Partner workspace

| Proposed page | Existing feature(s) mapped here | Use rhythm | Navigation priority |
|---|---|---|---|
| **Partner Home / Firm Pulse** | Existing KPI dashboard, deadline risk, notices, collections, WIP | Daily glance | Primary |
| **Work & Compliance** | Statutory Calendar; task creation; filing status; batch dispatch queue | Daily, with monthly/quarterly/annual peaks | Primary |
| **Clients** | Client Master directory, single onboarding, bulk import, promoter groups, Entity DNA | Daily / onboarding | Primary |
| **Client Inbox** | WhatsApp Desk, document requests, upload follow-up, batch outward dispatch, inward/outward register | Daily | Primary |
| **Review & Approvals** | Assessee Approval Desk, partner sign-off, document review, peer-review manager | Daily / weekly | Primary for approvers |
| **Billing & Collections** | Billing/WIP, invoices, UTR review, payment reconciliation, fee-release settings | Weekly / monthly | Primary |
| **Notices & Cases** | Notice Center, portal-sync sandbox records, notice reply drafter | Exception-driven | Visible in More and surfaced on Home when active |
| **Audit & Filing Tools** | GST 2B Reconciler, AIS/26AS Analyzer, ITR Computation, Form 3CD, Schedule III engine, UDIN Vault | Monthly / quarterly / seasonal | Full catalog in Tools; contextual links from engagements |
| **Firm Operations** | DSC custody, staff workload/security/realization, vCFO, engagement letters | Weekly / on demand | Full catalog in More |
| **Practice Growth** | CA Creator Content Studio | Occasional | More → Growth |

Keep the dashboard actionable: every risk number should open the exact filtered work list behind it. Avoid reporting “100% compliant” from empty data; show “No filings tracked yet” until there is evidence.

### 2. Staff workspace

| Proposed page | Existing feature(s) mapped here | Use rhythm | Navigation priority |
|---|---|---|---|
| **My Day** | Assigned tasks, due today/overdue, blocked work, next review | Several times daily | Primary landing page |
| **My Work** | Article Workbench → tasks and workflow assignments | Daily | Primary |
| **Documents** | Article Workbench → document review; uploads; bank statement parser | Daily | Primary |
| **Client Requests** | Article Workbench → WhatsApp Desk and signatory coordination | Daily | Primary |
| **Timesheet & Training** | Article Workbench → timesheet / articleship logbook | Daily / weekly | More or secondary tab |
| **Articleship Administration** | ICAI articles register / stipend desk | Monthly / partner or admin owned | More; restricted by role |

Do not show partner-only billing, firm-wide analytics, or DSC custody to trainees unless the firm explicitly grants that permission. In the current code, the employee view has seven tabs, but the shared floating bar shows partner tabs and has no staff-specific behavior.

### 3. Client workspace

| Proposed page | Existing feature(s) mapped here | Use rhythm | Navigation priority |
|---|---|---|---|
| **Overview** | Filing progress, upcoming actions, last update, next due date | When notified / monthly | Primary landing page |
| **Requests** | Missing-document list, department notice requests, clarification requests | When notified | Primary |
| **Upload** | Existing upload flow, category and financial-year selection, WhatsApp handoff | When requested | Center action / primary |
| **Documents** | Existing official vault and actual released files/receipts | Monthly / after filing | Primary |
| **Payments** | Invoices, payment instructions, UTR submission and payment history | Monthly / when billed | Primary |
| **Business tools** | Banker loan pack, tax/cash-flow forecast, vendor ITC tracker, company KYC, director risk, MSME watchdog | Monthly / on demand | More; open from a relevant client task when useful |

The current client portal implements ten tabs: progress, banker docket, cash forecast, vendor hold, KYC locker, director risk, MSME watchdog, upload, vault, and billing. Keep all ten discoverable, but make the five recurring actions above the mobile navigation. “Blocked ITC” should appear as a task alert when there is something to act on, rather than occupying a permanent bottom-bar slot for every client.

## Complete existing feature placement map

Every current partner module should remain reachable from a named destination, even if it is not pinned in the mobile bar.

| Existing feature / tab id | Proposed home | Visibility |
|---|---|---|
| Tax Deadlines / `calendar` | Work & Compliance | Partner and assigned staff; client sees only their own timeline |
| Fee Release Gate / `pay-to-release` | Billing & Collections → Delivery rules | Partner/admin; client sees payment status and available documents |
| Tax Scrutiny Notices / `notices` | Notices & Cases | Partner; assigned staff; client only their own notice and requests |
| vCFO Cockpit / `vcfo` | Firm Operations → Advisory tools | Partner/manager; client-facing outputs only when shared |
| Bank OCR to Tally / `bank-parser` | Audit & Filing Tools → Data preparation; staff shortcut | Assigned staff and reviewers |
| GST Matcher (2B) / `gstr2b` | Audit & Filing Tools → GST | Assigned staff, reviewer, partner |
| AIS / 26AS SFT Inspector / `ais-analyzer` | Audit & Filing Tools → Income tax | Assigned staff, reviewer, partner |
| ITR Tax Engine / `itr-calc` | Audit & Filing Tools → Income tax | Assigned staff, reviewer, partner |
| Tax Audit 3CD Workpapers / `tax-audit-3cd` | Audit & Filing Tools → Tax audit | Assigned staff, reviewer, partner |
| Schedule III & Audit Leads / `schedule3-audit` | Audit & Filing Tools → Financial statements | Assigned audit team and partner reviewer |
| UDIN Vault / `udin-vault` | Audit & Filing Tools → Signing & evidence | Partner/signatory; assigned staff if permitted |
| Notice Drafter / `notice-drafter` | Notices & Cases → Draft response | Assigned case team and partner reviewer |
| Assessee Legal Sign-off / `assessee-approval` | Review & Approvals | Partner and authorized client signatory |
| CA Creator Studio / `content-studio` | Practice Growth | Partner / marketing permission |
| Engagement Letters / `engagement-letter` | Clients → Engagement setup | Partner/manager |
| Billing & Invoices / `billing` | Billing & Collections | Partner/manager; client has own invoices only |
| WhatsApp Desk / `whatsapp-ai` | Client Inbox | Assigned staff/partner; all sends need a clear preview and record |
| Entity DNA / `entity-dna` | Clients → Entity profile | Partner/manager; staff read access as assigned |
| DSC Keys / `dsc` | Firm Operations → DSC custody | Authorized staff and partner only |
| Audit Quality / `peer-review` | Review & Approvals → Quality | Partner/quality reviewer |
| Firm Insights / `anti-poaching` | Firm Operations → Firm analytics | Partner/admin only |
| Dispatches & Letters / `inward-outward` | Client Inbox → Dispatch register | Assigned staff/partner |
| Batch Dispatcher / `batch-dispatch` | Client Inbox → Bulk dispatch | Assigned staff/partner |

Other mapped surfaces:

| Existing surface | Proposed placement |
|---|---|
| Article Workbench → tasks | Staff → My Work |
| Article Workbench → doc review | Staff → Documents / Review queue |
| Article Workbench → bank decryptor | Staff → Documents / Data preparation |
| Article Workbench → chat hub | Staff → Client Requests |
| Article Workbench → signatory coordination | Staff → Client Requests / approvals |
| Article Workbench → timesheet & logbook | Staff → Timesheet & Training |
| Article Workbench → ICAI register & stipend | Staff/firm administration, permission restricted |
| Client Quick Action Hub | A “Create / Upload” action menu containing only relevant shortcuts; it should complement, not replace, navigation |
| Client Master modal | Convert to Clients page with directory, add client, import, and onboarding steps as subpages/tabs |
| Firm Hub modal | Keep as quick-create launcher; every action must also have a permanent page destination |
| Command palette | Global search for clients, tasks, documents, notices, and every page/tool; include keyboard and visible search entry |
| `/admin` | Retire as a second workspace or redirect to the canonical Partner Home after migration |

## Mobile navigation blueprint

Use one role-aware bottom navigation system. The center action is an action, not a second menu.

| Role | Bottom bar, left to right | Center action | Full catalog |
|---|---|---|---|
| Partner | Home · Work · Clients · Reviews · More | Create task / request | Sidebar on desktop; searchable More page on mobile |
| Staff | My Day · My Work · Clients · Inbox · More | Upload/request follow-up as context allows | Tools and training in More, filtered by staff permissions |
| Client | Overview · Requests · Upload · Documents · Payments | Upload document | Business tools and account in More |

Keep names stable across devices. Do not show a partner’s Deadlines/Notices/Billing/DSC buttons to an article trainee when they cannot navigate the staff tabs. Do not duplicate a full horizontal tab strip and the bottom bar as competing primary navigation. Every tool still needs a searchable catalog entry, clear permission reason when unavailable, and contextual links from the work item it supports.

## Information architecture rules

1. **Work is the backbone.** Every specialist tool should be reachable from a client or engagement and return its output to that work item.
2. **One canonical route per destination.** `/admin` and `/` must not present competing versions of the same partner workspace.
3. **Role-aware, not role-hidden.** Show tools appropriate to the signed-in user; place lower-frequency tools in a visible catalog rather than burying them in an unexplained modal.
4. **Frequency determines prominence.** Daily queue, client requests, uploads, reviews, and approvals are primary. Seasonal engines remain one or two taps away and are linked from relevant engagements.
5. **Use familiar labels first.** Lead with “Work”, “Clients”, “Reviews”, “Invoices”, and “Documents”. Put specialist names such as “Entity DNA” or “43B(h)” in the page subtitle or tool catalog.
6. **No dead-end or misleading destination.** Every navigation item must open a working page, preserve the selected entity/task, and have an honest empty state.
7. **One entity context.** Client, group, financial year, and engagement selection should carry between calendar, document, workpaper, review, and invoice pages.

## Suggested rollout sequence

1. Build this navigation map into a single route/feature registry and remove duplicate tab definitions between `/` and `/admin`.
2. Create the three role landings and the daily work spine: My Day, Work & Compliance, Client Inbox, Review & Approvals, Client Overview, Requests, Upload, Documents, Payments.
3. Move every specialist tool into the placement map above and add search/catalog visibility so no module is lost.
4. Test findability with one partner, two staff members, and two clients: ask each to find five routine actions without coaching. Record wrong turns and time-to-action.
5. Pilot a full ordinary engagement flow before adding more modules. Use navigation analytics only after privacy, permissions, and durable data handling are in place.

## Code sources used for this inventory

- Routes: `src/app/page.tsx`, `src/app/admin/page.tsx`, `src/app/api/**/route.ts`
- Partner tools and tab conditions: `src/app/page.tsx`
- Duplicate admin module set: `src/app/admin/page.tsx`
- Employee workbench tabs: `src/components/firm/ArticleWorkbench.tsx`
- Client tabs: `src/components/client/ClientPortalPwa.tsx`
- Mobile navigation: `src/components/navigation/FloatingBottomNav.tsx`
- Desktop header, role switch, search, and launchers: `src/components/navigation/TopNav.tsx`
- Quick launchers: `src/components/firm/FirmHubActionModal.tsx`, `src/components/client/ClientQuickActionModal.tsx`, `src/components/shared/CommandPaletteModal.tsx`
