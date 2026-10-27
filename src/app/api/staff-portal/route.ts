import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

const STAFF_ROLES = ["PAID_CA_MANAGER", "ARTICLE_TRAINEE"];
const numberOrZero = (value: unknown) => Number(value || 0);

/** Firm staff read only normalized rows protected by explicit entity RLS. */
export async function GET() {
  try {
    const supabase = createClient(await cookies());
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id,firm_id,role,is_active,full_name")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (profileError) return NextResponse.json({ success: false, error: "Workspace access could not be verified." }, { status: 503 });
    if (!profile?.is_active || !profile.firm_id || !STAFF_ROLES.includes(profile.role)) {
      return NextResponse.json({ success: false, error: "Active firm staff access is required." }, { status: 403 });
    }

    const [entityResult, taskResult, documentResult] = await Promise.all([
      supabase.from("client_entities").select(`
        id,firm_id,group_id,entity_name,type,pan,gstin,cin,tan,turnover_cr,incorporation_year,
        client_groups(id,group_name)
      `).eq("firm_id", profile.firm_id).order("entity_name").limit(500),
      supabase.from("compliance_tasks").select(`
        id,firm_id,entity_id,category,title,period,due_date,status,missing_docs_list,assigned_to_name,reviewed_by_name,arn_number,filing_date
      `).eq("firm_id", profile.firm_id).order("due_date", { ascending: true }).limit(1000),
      supabase.from("documents").select(`
        id,firm_id,entity_id,task_id,category,file_name,file_size_bytes,storage_path,mime_type,financial_year,
        review_status,created_at
      `).eq("firm_id", profile.firm_id).order("created_at", { ascending: false }).limit(1000),
    ]);
    const queryError = entityResult.error || taskResult.error || documentResult.error;
    if (queryError) return NextResponse.json({ success: false, error: "Assigned work records are temporarily unavailable." }, { status: 503 });

    const entities = entityResult.data || [];
    const entityById = new Map(entities.map((entity: any) => [entity.id, entity]));
    const clients = entities.map((entity: any) => {
      const group = Array.isArray(entity.client_groups) ? entity.client_groups[0] : entity.client_groups;
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
        incorporationYear: numberOrZero(entity.incorporation_year),
      };
    });
    const entityNameById = new Map(clients.map((entity: any) => [entity.id, entity.name]));
    const entityGroupById = new Map(clients.map((entity: any) => [entity.id, entity.groupId]));
    const tasks = (taskResult.data || []).filter((task: any) => entityById.has(task.entity_id)).map((task: any) => ({
      id: task.id,
      entityId: task.entity_id,
      entityName: entityNameById.get(task.entity_id) || "Assigned entity",
      groupId: entityGroupById.get(task.entity_id) || "",
      category: task.category,
      title: task.title,
      period: task.period,
      dueDate: task.due_date,
      status: task.status,
      assignedTo: task.assigned_to_name || "",
      reviewedBy: task.reviewed_by_name || "",
      missingDocumentsList: Array.isArray(task.missing_docs_list) ? task.missing_docs_list : [],
      arnNumber: task.arn_number || undefined,
      filingDate: task.filing_date || undefined,
    }));
    const documents = (documentResult.data || []).filter((document: any) => entityById.has(document.entity_id)).map((document: any) => ({
      id: document.id,
      entityId: document.entity_id,
      entityName: entityNameById.get(document.entity_id) || "Assigned entity",
      category: document.category,
      fileName: document.file_name,
      sizeBytes: numberOrZero(document.file_size_bytes),
      mimeType: document.mime_type || undefined,
      uploadedAt: document.created_at,
      financialYear: document.financial_year,
      taskId: document.task_id || undefined,
      reviewStatus: document.review_status,
    }));

    return NextResponse.json({ success: true, data: { clients, tasks, documents } }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Assigned work records are temporarily unavailable." }, { status: 503 });
  }
}
