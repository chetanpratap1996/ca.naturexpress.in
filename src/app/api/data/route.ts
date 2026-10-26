import { NextResponse } from "next/server";
import { ensureDatabase } from "@/lib/server/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export async function GET() {
  try {
    // 1. If Supabase is connected, fetch live verified records from Supabase
    if (isSupabaseConfigured()) {
      try {
        const [
          { data: dbFirms },
          { data: dbEntities },
          { data: dbGroups },
          { data: dbTasks },
          { data: dbInvoices },
          { data: dbDsc }
        ] = await Promise.all([
          supabase.from("firms").select("*").limit(1),
          supabase.from("client_entities").select("*"),
          supabase.from("client_groups").select("*"),
          supabase.from("compliance_tasks").select("*"),
          supabase.from("invoices").select("*"),
          supabase.from("dsc_vault").select("*")
        ]);

        const firm = dbFirms?.[0];
        const localFallback = ensureDatabase();

        const mappedGroups = (dbGroups || []).map((g: any) => ({
          id: g.id,
          name: g.group_name,
          promoterName: g.promoter_name,
          promoterPhone: g.promoter_phone,
          promoterEmail: g.promoter_email,
          totalEntities: (dbEntities || []).filter((e: any) => e.group_id === g.id).length,
          totalTurnoverCr: (dbEntities || []).filter((e: any) => e.group_id === g.id).reduce((acc: number, curr: any) => acc + Number(curr.turnover_cr), 0),
          unbilledWipTotal: Number(g.unbilled_wip_total || 0),
          overdueFeesTotal: Number(g.overdue_fees_total || 0),
          entityIds: (dbEntities || []).filter((e: any) => e.group_id === g.id).map((e: any) => e.id)
        }));

        const mappedClients = (dbEntities || []).map((e: any) => {
          const parentGroup = (dbGroups || []).find((g: any) => g.id === e.group_id) || dbGroups?.[0];
          return {
            id: e.id,
            groupId: e.group_id,
            groupName: parentGroup ? parentGroup.group_name : "Practice Group",
            name: e.entity_name,
            type: e.type,
            pan: e.pan,
            gstin: e.gstin || undefined,
            cin: e.cin || undefined,
            turnoverCr: Number(e.turnover_cr),
            partnerInCharge: "CA Gunjan Jain",
            assignedArticle: "Kriti Jain (Article)",
            incorporationYear: e.incorporation_year,
            penaltyRiskAccrued: Number(e.penalty_risk_accrued || 0),
            primaryContact: {
              name: parentGroup ? parentGroup.promoter_name : "Authorized Signatory",
              phone: parentGroup ? parentGroup.promoter_phone : "+91 98000 00000",
              email: parentGroup ? parentGroup.promoter_email : "accounts@client.com",
              designation: "Director / CFO"
            }
          };
        });

        const mappedTasks = (dbTasks || []).map((t: any, idx: number) => {
          const ent = mappedClients.find((c: any) => c.id === t.entity_id);
          return {
            id: `TSK-${1000 + idx}`,
            entityId: t.entity_id,
            entityName: ent ? ent.name : "Practice Client",
            groupId: ent ? ent.groupId : "GRP-001",
            category: t.category,
            title: t.title,
            period: t.period,
            dueDate: t.due_date ? new Date(t.due_date).toISOString().split("T")[0] : "2026-10-31",
            status: t.status,
            assignedTo: "Kriti Jain (Article)",
            reviewedBy: "CA Gunjan Jain (Partner)",
            priority: t.priority,
            penaltyRisk: Number(t.penalty_risk || 0),
            accruingDailyPenalty: Number(t.accruing_daily_penalty || 0),
            missingDocumentsCount: 0,
            chaseCount: t.chase_count || 0,
            arnNumber: t.arn_number || undefined,
            officialUdin: t.official_udin || undefined
          };
        });

        const mappedInvoices = (dbInvoices || []).map((inv: any, idx: number) => {
          const ent = mappedClients.find((c: any) => c.id === inv.entity_id);
          return {
            id: `INV-${Date.now()}-${idx}`,
            invoiceNo: inv.invoice_no,
            entityId: inv.entity_id,
            entityName: ent ? ent.name : "Practice Client",
            groupId: ent ? ent.groupId : "GRP-001",
            serviceDescription: inv.service_description,
            taxableAmount: Number(inv.taxable_amount),
            gstRate: 18,
            gstAmount: Number(inv.gst_amount),
            amount: Number(inv.total_amount),
            dueDate: inv.due_date ? new Date(inv.due_date).toISOString().split("T")[0] : "2026-10-31",
            status: inv.status,
            sacCode: inv.sac_code || "998231",
            clientPaymentMode: "NEFT_RTGS"
          };
        });

        const mappedDsc = (dbDsc || []).map((d: any, idx: number) => ({
          id: `DSC-${idx + 1}`,
          entityId: d.entity_id,
          entityName: "Practice Client",
          groupId: "GRP-001",
          holderName: d.holder_name,
          pan: d.holder_pan,
          serialNumber: d.serial_number,
          tokenType: d.token_type || "ProxKey",
          validTill: d.valid_till ? new Date(d.valid_till).toISOString().split("T")[0] : "2027-08-14",
          daysToExpiry: 292,
          expiryStatus: "ACTIVE",
          currentCustodian: "CA Gunjan Jain (Partner Vault)",
          vaultSlot: d.vault_slot || "Slot A-04"
        }));

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
              openScrutinyNotices: (localFallback.notices || []).length,
              totalDemandRiskINR: (localFallback.notices || []).reduce((sum: number, n: any) => sum + (n.demandAmount || 0), 0),
              unbilledWipAmount: mappedGroups.reduce((acc: number, g: any) => acc + g.unbilledWipTotal, 0),
              pendingCollections: mappedInvoices.filter((i: any) => i.status !== "PAID").reduce((acc: number, i: any) => acc + i.amount, 0),
              complianceHealthScore: 100
            },
            groups: mappedGroups,
            clients: mappedClients,
            tasks: mappedTasks,
            invoices: mappedInvoices,
            dscTokens: mappedDsc,
            notices: localFallback.notices || [],
            documents: localFallback.documents || [],
            lastUpdated: new Date().toISOString()
          }
        });
      } catch (sbError) {
        console.warn("Supabase live query failed, falling back to local sync cache:", sbError);
      }
    }

    // 2. Default to verified synced database
    const localData = ensureDatabase();
    return NextResponse.json({ success: true, source: "PERSISTENT_SYNC_DB", data: localData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
