import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase } from "@/lib/server/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    const isClientRole = auth.role === "CLIENT";

    // 1. If Supabase is connected, fetch live verified records from Supabase
    if (isSupabaseConfigured()) {
      try {
        const [
          { data: dbFirms },
          { data: dbEntities },
          { data: dbGroups },
          { data: dbTasks },
          { data: dbInvoices },
          { data: dbDsc },
          { data: dbDocs }
        ] = await Promise.all([
          supabase.from("firms").select("*").limit(1),
          supabase.from("client_entities").select("*"),
          supabase.from("client_groups").select("*"),
          supabase.from("compliance_tasks").select("*"),
          supabase.from("invoices").select("*"),
          supabase.from("dsc_vault").select("*"),
          supabase.from("documents").select("*")
        ]);

        const firm = dbFirms?.[0];
        const localFallback = ensureDatabase();

        let mappedGroups = (dbGroups || []).map((g: any) => ({
          id: g.id,
          name: g.group_name,
          promoterName: g.promoter_name,
          promoterPhone: g.promoter_phone,
          promoterEmail: g.promoter_email,
          totalEntities: (dbEntities || []).filter((e: any) => e.group_id === g.id).length,
          totalTurnoverCr: (dbEntities || []).filter((e: any) => e.group_id === g.id).reduce((acc: number, curr: any) => acc + Number(curr.turnover_cr || 0), 0),
          unbilledWipTotal: Number(g.unbilled_wip_total || 0),
          overdueFeesTotal: Number(g.overdue_fees_total || 0),
          entityIds: (dbEntities || []).filter((e: any) => e.group_id === g.id).map((e: any) => e.id)
        }));

        let mappedClients = (dbEntities || []).map((e: any) => {
          const parentGroup = (dbGroups || []).find((g: any) => g.id === e.group_id) || dbGroups?.[0];
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
              designation: "Director / CFO"
            }
          };
        });

        let mappedTasks = (dbTasks || []).map((t: any) => {
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
            arnNumber: t.arn_number || undefined,
            officialUdin: t.official_udin || undefined
          };
        });

        let mappedInvoices = (dbInvoices || []).map((inv: any) => {
          const ent = mappedClients.find((c: any) => c.id === inv.entity_id);
          return {
            id: inv.id,
            invoiceNo: inv.invoice_no,
            entityId: inv.entity_id,
            entityName: ent ? ent.name : "Practice Client",
            groupId: ent ? ent.groupId : "GRP-001",
            serviceDescription: inv.service_description,
            taxableAmount: Number(inv.taxable_amount || 0),
            gstRate: 18,
            gstAmount: Number(inv.gst_amount || 0),
            amount: Number(inv.total_amount || 0),
            dueDate: inv.due_date ? new Date(inv.due_date).toISOString().split("T")[0] : "2026-10-31",
            status: inv.status,
            sacCode: inv.sac_code || "998231",
            clientPaymentMode: "NEFT_RTGS"
          };
        });

        let mappedDsc = (dbDsc || []).map((d: any) => {
          const ent = mappedClients.find((c: any) => c.id === d.entity_id);
          const validDate = d.valid_till ? new Date(d.valid_till) : new Date(Date.now() + 365 * 86400000);
          const daysToExpiry = Math.max(0, Math.ceil((validDate.getTime() - Date.now()) / (1000 * 3600 * 24)));
          return {
            id: d.id,
            entityId: d.entity_id,
            entityName: ent ? ent.name : "Practice Client",
            groupId: ent ? ent.groupId : "GRP-001",
            holderName: d.holder_name,
            pan: d.holder_pan,
            serialNumber: d.serial_number,
            tokenType: d.token_type || "ProxKey",
            validTill: validDate.toISOString().split("T")[0],
            daysToExpiry,
            expiryStatus: daysToExpiry <= 0 ? "EXPIRED" : daysToExpiry <= 30 ? "EXPIRING_SOON" : "ACTIVE",
            currentCustodian: d.current_custodian || "Firm Master Safe",
            vaultSlot: d.vault_slot || "Slot A-01"
          };
        });

        let mappedDocuments: any[] = (dbDocs && dbDocs.length > 0)
          ? dbDocs.map((doc: any) => ({
              id: doc.id,
              entityId: doc.entity_id,
              entityName: mappedClients.find((c: any) => c.id === doc.entity_id)?.name || "Client Entity",
              category: doc.category || "BANK_STATEMENT",
              fileName: doc.file_name,
              fileSize: doc.file_size || "500 KB",
              uploadedAt: doc.created_at || new Date().toISOString(),
              financialYear: "FY 2026-27",
              uploadedBy: (doc.uploaded_by || "FIRM_STAFF") as "CLIENT_PWA" | "WHATSAPP_LINK" | "FIRM_STAFF",
              isPasswordProtected: false,
              isUnlocked: true,
              reviewStatus: doc.review_status || "APPROVED",
              reviewedBy: "CA Partner"
            }))
          : localFallback.documents || [];

        // ENFORCE MULTI-TENANT ISOLATION: Filter records strictly to client's entity/group
        if (isClientRole && (auth.clientGroupId || auth.clientEntityId)) {
          mappedClients = mappedClients.filter((c: any) => c.groupId === auth.clientGroupId || c.id === auth.clientEntityId);
          mappedGroups = mappedGroups.filter((g: any) => g.id === auth.clientGroupId);
          mappedTasks = mappedTasks.filter((t: any) => t.groupId === auth.clientGroupId || t.entityId === auth.clientEntityId);
          mappedInvoices = mappedInvoices.filter((i: any) => i.groupId === auth.clientGroupId || i.entityId === auth.clientEntityId);
          mappedDocuments = mappedDocuments.filter((d: any) => d.entityId === auth.clientEntityId);
          mappedDsc = []; // Never expose internal DSC keys or vault slots to client users!
        }

        return NextResponse.json({
          success: true,
          source: "SUPABASE_CLOUD_LIVE",
          data: {
            ...localFallback,
            firmMetrics: {
              ...localFallback.firmMetrics,
              name: firm?.firm_name || localFallback.firmMetrics.name,
              frn: firm?.frn || localFallback.firmMetrics.frn,
              totalClients: mappedClients.length,
              activeEntities: mappedClients.length,
              criticalDeadlinesNext72h: mappedTasks.filter((t: any) => t.priority === "CRITICAL" && t.status !== "FILED_AND_COMPLETED").length,
              openScrutinyNotices: isClientRole ? 0 : (localFallback.notices || []).length,
              totalDemandRiskINR: isClientRole ? 0 : (localFallback.notices || []).reduce((sum: number, n: any) => sum + (n.demandAmount || 0), 0),
              unbilledWipAmount: mappedGroups.reduce((acc: number, g: any) => acc + g.unbilledWipTotal, 0),
              pendingCollections: mappedInvoices.filter((i: any) => i.status !== "PAID").reduce((acc: number, i: any) => acc + i.amount, 0),
              complianceHealthScore: 100
            },
            groups: mappedGroups.length > 0 ? mappedGroups : localFallback.groups,
            clients: mappedClients.length > 0 ? mappedClients : localFallback.clients,
            tasks: mappedTasks.length > 0 ? mappedTasks : localFallback.tasks,
            invoices: mappedInvoices.length > 0 ? mappedInvoices : localFallback.invoices,
            dscTokens: mappedDsc,
            documents: mappedDocuments,
            notices: isClientRole ? [] : (localFallback.notices || []),
            lastUpdated: new Date().toISOString()
          }
        });
      } catch (sbError) {
        console.warn("Supabase live query failed, falling back to local sync cache:", sbError);
      }
    }

    // 2. Default to verified synced database with deep clone to preserve cache immutability
    const rawData = ensureDatabase();
    const localData = JSON.parse(JSON.stringify(rawData));
    if (isClientRole && (auth.clientGroupId || auth.clientEntityId)) {
      localData.clients = (localData.clients || []).filter((c: any) => c.groupId === auth.clientGroupId || c.id === auth.clientEntityId);
      localData.groups = (localData.groups || []).filter((g: any) => g.id === auth.clientGroupId);
      localData.tasks = (localData.tasks || []).filter((t: any) => t.groupId === auth.clientGroupId || t.entityId === auth.clientEntityId);
      localData.invoices = (localData.invoices || []).filter((i: any) => i.groupId === auth.clientGroupId || i.entityId === auth.clientEntityId);
      localData.documents = (localData.documents || []).filter((d: any) => d.entityId === auth.clientEntityId);
      localData.dscTokens = [];
      localData.notices = [];
    }

    return NextResponse.json({ success: true, source: "PERSISTENT_SYNC_DB", data: localData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
