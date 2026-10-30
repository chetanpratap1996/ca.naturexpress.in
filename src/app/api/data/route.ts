// ============================================================================
// ENTERPRISE DATA API ROUTE
// Multi-tenant data segregation, Supabase Cloud sync, resilient local persistence,
// and role-based data shaping (Partner / Article Trainee / Corporate Client)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase } from "@/lib/server/db";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { createServerClient } from "@supabase/ssr";
import { SANDBOX_DATA } from "@/lib/data/sandboxData";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    const isClientRole = auth.role === "CLIENT";
    const isArticleRole = auth.role === "ARTICLE";

    // 1. Sandbox Evaluation Mode
    if (auth.isSandboxMode) {
      const sandboxPayload = JSON.parse(JSON.stringify(SANDBOX_DATA));
      if (isClientRole && (auth.clientGroupId || auth.clientEntityId)) {
        sandboxPayload.clients = (sandboxPayload.clients || []).filter(
          (c: any) => c.groupId === auth.clientGroupId || c.id === auth.clientEntityId
        );
        sandboxPayload.groups = (sandboxPayload.groups || []).filter((g: any) => g.id === auth.clientGroupId);
        sandboxPayload.tasks = (sandboxPayload.tasks || []).filter(
          (t: any) => t.groupId === auth.clientGroupId || t.entityId === auth.clientEntityId
        );
        sandboxPayload.invoices = (sandboxPayload.invoices || []).filter(
          (i: any) => i.groupId === auth.clientGroupId || i.entityId === auth.clientEntityId
        );
        sandboxPayload.documents = (sandboxPayload.documents || []).filter((d: any) => d.entityId === auth.clientEntityId);
        sandboxPayload.dscTokens = [];
        sandboxPayload.notices = [];
      }
      return NextResponse.json({
        success: true,
        source: "SANDBOX_EVALUATION",
        data: sandboxPayload,
      });
    }

    // 2. Query Supabase Cloud if configured and tables are ready
    if (isSupabaseConfigured()) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
        const supabaseKey =
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          process.env.SUPABASE_ANON_KEY!;

        const scopedSupabase = createServerClient(supabaseUrl, supabaseKey, {
          cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} },
        });

        const results = await Promise.all([
          scopedSupabase.from("firms").select("*").limit(1),
          scopedSupabase.from("client_entities").select("*"),
          scopedSupabase.from("client_groups").select("*"),
          scopedSupabase.from("compliance_tasks").select("*"),
          scopedSupabase.from("invoices").select("*"),
          scopedSupabase.from("dsc_vault").select("*"),
          scopedSupabase.from("documents").select("*"),
        ]);

        const hasDbErrors = results.some((r) => r.error);
        if (!hasDbErrors) {
          const [firmsResult, entitiesResult, groupsResult, tasksResult, invoicesResult, dscResult, docsResult] = results;
          const dbFirms = firmsResult.data || [];
          const dbEntities = entitiesResult.data || [];
          const dbGroups = groupsResult.data || [];
          const dbTasks = tasksResult.data || [];
          const dbInvoices = invoicesResult.data || [];
          const dbDsc = dscResult.data || [];
          const dbDocs = docsResult.data || [];

          if (dbEntities.length > 0) {
            const firm = dbFirms[0];
            let mappedGroups = dbGroups.map((g: any) => ({
              id: g.id,
              name: g.group_name,
              promoterName: g.promoter_name,
              promoterPhone: g.promoter_phone,
              promoterEmail: g.promoter_email,
              totalEntities: dbEntities.filter((e: any) => e.group_id === g.id).length,
              totalTurnoverCr: dbEntities
                .filter((e: any) => e.group_id === g.id)
                .reduce((acc: number, curr: any) => acc + Number(curr.turnover_cr || 0), 0),
              unbilledWipTotal: Number(g.unbilled_wip_total || 0),
              overdueFeesTotal: Number(g.overdue_fees_total || 0),
              entityIds: dbEntities.filter((e: any) => e.group_id === g.id).map((e: any) => e.id),
            }));

            let mappedClients = dbEntities.map((e: any) => {
              const parentGroup = dbGroups.find((g: any) => g.id === e.group_id) || dbGroups[0];
              return {
                id: e.id,
                groupId: e.group_id || parentGroup?.id || "GRP-001",
                groupName: parentGroup ? parentGroup.group_name : "Practice Group",
                name: e.entity_name,
                type: e.type,
                pan: e.pan,
                gstin: e.gstin || undefined,
                cin: e.cin || undefined,
                turnoverCr: Number(e.turnover_cr || 0),
                partnerInCharge: "CA Partner (In-Charge)",
                assignedArticle: "Audit Trainee",
                incorporationYear: e.incorporation_year || 2024,
                penaltyRiskAccrued: Number(e.penalty_risk_accrued || 0),
                primaryContact: {
                  name: parentGroup ? parentGroup.promoter_name : "Authorized Signatory",
                  phone: parentGroup ? parentGroup.promoter_phone : "+91 98000 00000",
                  email: parentGroup ? parentGroup.promoter_email : "accounts@client.com",
                  designation: "Director / CFO",
                },
              };
            });

            let mappedTasks = dbTasks.map((t: any) => {
              const ent = mappedClients.find((c: any) => c.id === t.entity_id);
              return {
                id: t.id,
                entityId: t.entity_id,
                entityName: ent ? ent.name : "Practice Client",
                groupId: ent ? ent.groupId : "GRP-001",
                category: t.category,
                title: t.title,
                period: t.period,
                dueDate: t.due_date ? new Date(t.due_date).toISOString().split("T")[0] : "2026-10-31",
                status: t.status,
                assignedTo: "Audit Senior",
                reviewedBy: "CA Partner",
                priority: t.priority,
                penaltyRisk: Number(t.penalty_risk || 0),
                accruingDailyPenalty: Number(t.accruing_daily_penalty || 0),
                missingDocumentsCount: Number(t.missing_documents_count || 0),
                chaseCount: t.chase_count || 0,
              };
            });

            let mappedInvoices = dbInvoices.map((inv: any) => {
              const ent = mappedClients.find((c: any) => c.id === inv.entity_id);
              return {
                id: inv.id,
                invoiceNumber: inv.invoice_number,
                entityId: inv.entity_id,
                entityName: ent ? ent.name : "Practice Client",
                groupId: ent ? ent.groupId : "GRP-001",
                period: inv.period || "Q3 FY 2026-27",
                issueDate: inv.issue_date || new Date().toISOString().split("T")[0],
                dueDate: inv.due_date || new Date().toISOString().split("T")[0],
                amount: Number(inv.amount || 0),
                status: inv.status || "PENDING",
                description: inv.description || "Professional CA Audit & Statutory Retainer",
                utrNumber: inv.utr_number || undefined,
                paymentMode: inv.payment_mode || undefined,
              };
            });

            let mappedDsc = isClientRole
              ? []
              : dbDsc.map((d: any) => {
                  const ent = mappedClients.find((c: any) => c.id === d.entity_id);
                  const daysToExpiry = Math.ceil(
                    (new Date(d.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return {
                    id: d.id,
                    entityId: d.entity_id,
                    entityName: ent ? ent.name : "Practice Client",
                    groupId: ent ? ent.groupId : "GRP-001",
                    signatoryName: d.signatory_name,
                    signatoryPan: d.signatory_pan,
                    signatoryDesignation: d.signatory_designation || "Director",
                    provider: d.provider || "eMudhra Class 3",
                    expiryDate: d.expiry_date,
                    daysToExpiry,
                    expiryStatus: daysToExpiry <= 0 ? "EXPIRED" : daysToExpiry <= 30 ? "EXPIRING_SOON" : "ACTIVE",
                    currentCustodian: d.current_custodian || "Firm Master Safe",
                    vaultSlot: d.vault_slot || "Slot A-01",
                  };
                });

            let mappedDocuments = dbDocs.map((doc: any) => ({
              id: doc.id,
              entityId: doc.entity_id,
              entityName: mappedClients.find((c: any) => c.id === doc.entity_id)?.name || "Client Entity",
              category: doc.category || "BANK_STATEMENT",
              fileName: doc.file_name,
              fileSize: doc.file_size || "500 KB",
              uploadedAt: doc.created_at || new Date().toISOString(),
              financialYear: "FY 2026-27",
              uploadedBy: doc.uploaded_by || "FIRM_STAFF",
              isPasswordProtected: false,
              isUnlocked: true,
              reviewStatus: doc.review_status || "APPROVED",
              reviewedBy: "CA Partner",
            }));

            // Multi-tenant segregation for Client users
            if (isClientRole && (auth.clientGroupId || auth.clientEntityId)) {
              mappedClients = mappedClients.filter(
                (c: any) => c.groupId === auth.clientGroupId || c.id === auth.clientEntityId
              );
              mappedGroups = mappedGroups.filter((g: any) => g.id === auth.clientGroupId);
              mappedTasks = mappedTasks.filter(
                (t: any) => t.groupId === auth.clientGroupId || t.entityId === auth.clientEntityId
              );
              mappedInvoices = mappedInvoices.filter(
                (i: any) => i.groupId === auth.clientGroupId || i.entityId === auth.clientEntityId
              );
              mappedDocuments = mappedDocuments.filter((d: any) => d.entityId === auth.clientEntityId);
              mappedDsc = [];
            }

            return NextResponse.json({
              success: true,
              source: "SUPABASE_CLOUD_LIVE",
              data: {
                firmMetrics: {
                  name: firm?.firm_name || "GPA & Co., Chartered Accountants",
                  frn: firm?.frn || "022998C",
                  totalClients: mappedClients.length,
                  activeEntities: mappedClients.length,
                  criticalDeadlinesNext72h: mappedTasks.filter(
                    (t: any) => t.priority === "CRITICAL" && t.status !== "FILED_AND_COMPLETED"
                  ).length,
                  complianceHealthScore: 100,
                  pendingCollections: mappedInvoices
                    .filter((i: any) => i.status !== "PAID")
                    .reduce((sum: number, i: any) => sum + i.amount, 0),
                },
                groups: mappedGroups,
                clients: mappedClients,
                tasks: mappedTasks,
                invoices: mappedInvoices,
                dscTokens: mappedDsc,
                documents: mappedDocuments,
                notices: [],
                auditTrail: [],
                payToReleaseConfigs: [],
                notifications: [],
                lastUpdated: new Date().toISOString(),
              },
            });
          }
        }
      } catch (sbErr) {
        console.warn("Supabase query fallback initiated:", sbErr);
      }
    }

    // 3. Resilient Local Practice Store Fallback (Guarantees zero-downtime and offline resilience)
    const rawData = ensureDatabase();
    const localData = JSON.parse(JSON.stringify(rawData));

    // Multi-tenant segregation for Client users
    if (isClientRole && (auth.clientGroupId || auth.clientEntityId)) {
      localData.clients = (localData.clients || []).filter(
        (c: any) => c.groupId === auth.clientGroupId || c.id === auth.clientEntityId
      );
      localData.groups = (localData.groups || []).filter((g: any) => g.id === auth.clientGroupId);
      localData.tasks = (localData.tasks || []).filter(
        (t: any) => t.groupId === auth.clientGroupId || t.entityId === auth.clientEntityId
      );
      localData.invoices = (localData.invoices || []).filter(
        (i: any) => i.groupId === auth.clientGroupId || i.entityId === auth.clientEntityId
      );
      localData.documents = (localData.documents || []).filter((d: any) => d.entityId === auth.clientEntityId);
      localData.dscTokens = [];
      localData.notices = [];
      localData.auditTrail = [];
      localData.payToReleaseConfigs = [];
      localData.firmMetrics = {
        name: "GPA & Co., Chartered Accountants",
        totalClients: localData.clients.length,
        activeEntities: localData.clients.length,
        criticalDeadlinesNext72h: localData.tasks.filter(
          (t: any) => t.priority === "CRITICAL" && t.status !== "FILED_AND_COMPLETED"
        ).length,
        complianceHealthScore: 100,
      };
    } else if (isArticleRole) {
      // Article Trainees should not see Partner Hourly realization rates or firm fee shares
      if (localData.firmMetrics) {
        delete localData.firmMetrics.unbilledWipAmount;
        delete localData.firmMetrics.partnerRealizationPct;
      }
      localData.auditTrail = [];
    }

    return NextResponse.json({
      success: true,
      source: "PERSISTENT_SYNC_DB",
      data: localData,
    });
  } catch (error: any) {
    console.error("Critical error in /api/data:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
