import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

const numberOrZero = (value: unknown) => Number(value || 0);

/**
 * Client-facing read model. Every query runs with the caller's Supabase
 * session, so the user_client_entities RLS policies scope rows to assigned
 * entities. This endpoint never reads the firm's JSON snapshot.
 */
export async function GET() {
  try {
    const supabase = createClient(await cookies());
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id,firm_id,role,is_active")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (profileError) return NextResponse.json({ success: false, error: "Workspace access could not be verified." }, { status: 503 });
    if (!profile?.is_active || !profile.firm_id || !["CLIENT_PROMOTER", "CLIENT_ACCOUNTANT"].includes(profile.role)) {
      return NextResponse.json({ success: false, error: "This account does not have client portal access." }, { status: 403 });
    }

    const [entityResult, taskResult, documentResult, invoiceResult] = await Promise.all([
      supabase.from("client_entities").select(`
        id,firm_id,group_id,entity_name,type,pan,gstin,cin,tan,turnover_cr,incorporation_year,
        client_groups(id,group_name)
      `).eq("firm_id", profile.firm_id),
      supabase.from("compliance_tasks").select(`
        id,firm_id,entity_id,category,title,period,due_date,status,missing_docs_list,arn_number,filing_date
      `).eq("firm_id", profile.firm_id).order("due_date", { ascending: true }),
      supabase.from("documents").select(`
        id,firm_id,entity_id,task_id,category,file_name,file_size_bytes,storage_path,mime_type,financial_year,
        review_status,created_at
      `).eq("firm_id", profile.firm_id).order("created_at", { ascending: false }),
      supabase.from("invoices").select(`
        id,entity_id,invoice_no,service_description,sac_code,taxable_amount,gst_rate,gst_amount,total_amount,
        due_date,status,client_utr_number,client_payment_mode,client_payment_date,client_payer_note,created_at
      `).eq("firm_id", profile.firm_id).order("due_date", { ascending: false }),
    ]);

    const queryError = entityResult.error || taskResult.error || documentResult.error || invoiceResult.error;
    if (queryError) {
      return NextResponse.json({ success: false, error: "Client records are temporarily unavailable." }, { status: 503 });
    }

    const entities = entityResult.data || [];
    const entityById = new Map(entities.map((entity: any) => [entity.id, entity]));
    const groupsById = new Map<string, any>();
    const clients = entities.map((entity: any) => {
      const group = Array.isArray(entity.client_groups) ? entity.client_groups[0] : entity.client_groups;
      if (group && !groupsById.has(group.id)) groupsById.set(group.id, group);
      return {
        id: entity.id,
        groupId: entity.group_id,
        groupName: group?.group_name || "Client group",
        name: entity.entity_name,
        type: entity.type,
        pan: entity.pan,
        gstin: entity.gstin || undefined,
        cin: entity.cin || undefined,
        tan: entity.tan || undefined,
        turnoverCr: numberOrZero(entity.turnover_cr),
        partnerInCharge: "",
        assignedArticle: "",
        incorporationYear: numberOrZero(entity.incorporation_year),
        penaltyRiskAccrued: 0,
        primaryContact: {
          name: "",
          phone: "",
          email: "",
          designation: "",
        },
      };
    });
    const groups = [...groupsById.values()].map((group: any) => {
      const scopedEntities = clients.filter((entity: any) => entity.groupId === group.id);
      return {
        id: group.id,
        name: group.group_name,
        promoterName: "",
        promoterPhone: "",
        promoterEmail: "",
        totalEntities: scopedEntities.length,
        totalTurnoverCr: scopedEntities.reduce((total: number, entity: any) => total + entity.turnoverCr, 0),
        unbilledWipTotal: 0,
        overdueFeesTotal: 0,
        entityIds: scopedEntities.map((entity: any) => entity.id),
      };
    });

    const tasks = (taskResult.data || []).filter((task: any) => entityById.has(task.entity_id)).map((task: any) => {
      const entity = entityById.get(task.entity_id)!;
      return {
        id: task.id,
        entityId: task.entity_id,
        entityName: entity.entity_name,
        groupId: entity.group_id,
        category: task.category,
        title: task.title,
        period: task.period,
        dueDate: task.due_date,
        status: task.status,
        assignedTo: "",
        reviewedBy: "",
        priority: "MEDIUM",
        penaltyRisk: 0,
        accruingDailyPenalty: 0,
        missingDocumentsCount: Array.isArray(task.missing_docs_list) ? task.missing_docs_list.length : 0,
        missingDocumentsList: Array.isArray(task.missing_docs_list) ? task.missing_docs_list : [],
        chaseCount: 0,
        arnNumber: task.arn_number || undefined,
        filingDate: task.filing_date || undefined,
      };
    });

    const documents = (documentResult.data || []).filter((document: any) => entityById.has(document.entity_id)).map((document: any) => {
      const entity = entityById.get(document.entity_id)!;
      return {
        id: document.id,
        entityId: document.entity_id,
        entityName: entity.entity_name,
        category: document.category,
        fileName: document.file_name,
        fileSize: `${(numberOrZero(document.file_size_bytes) / 1024).toFixed(1)} KB`,
        sizeBytes: numberOrZero(document.file_size_bytes),
        mimeType: document.mime_type || undefined,
        uploadedAt: document.created_at,
        uploadedBy: document.storage_path.split("/")[2] === authData.user.id ? "CLIENT_PWA" : "FIRM_STAFF",
        financialYear: document.financial_year,
        taskId: document.task_id || undefined,
        reviewStatus: document.review_status,
      };
    });

    const invoices = (invoiceResult.data || []).filter((invoice: any) => entityById.has(invoice.entity_id)).map((invoice: any) => {
      const entity = entityById.get(invoice.entity_id)!;
      return {
        id: invoice.id,
        invoiceNo: invoice.invoice_no,
        entityId: invoice.entity_id,
        entityName: entity.entity_name,
        groupId: entity.group_id,
        serviceDescription: invoice.service_description,
        taxableAmount: numberOrZero(invoice.taxable_amount),
        gstRate: numberOrZero(invoice.gst_rate),
        gstAmount: numberOrZero(invoice.gst_amount),
        amount: numberOrZero(invoice.total_amount),
        dueDate: invoice.due_date,
        status: invoice.status,
        sacCode: invoice.sac_code,
        clientUtrNumber: invoice.client_utr_number || undefined,
        clientPaymentMode: invoice.client_payment_mode || undefined,
        clientPaymentDate: invoice.client_payment_date || undefined,
        clientPayerNote: invoice.client_payer_note || undefined,
      };
    });

    return NextResponse.json({ success: true, data: { clients, groups, tasks, documents, invoices, dscTokens: [], notices: [], auditTrail: [], payToReleaseConfigs: [] } }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Client records are temporarily unavailable." }, { status: 503 });
  }
}
