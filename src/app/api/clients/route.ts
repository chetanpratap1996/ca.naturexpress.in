import { NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ClientEntity } from "@/lib/types";

export async function GET() {
  const db = ensureDatabase();
  return NextResponse.json({ success: true, clients: db.clients, groups: db.groups });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = ensureDatabase();

    const entityName = body.name?.trim();
    const pan = body.pan?.trim().toUpperCase();
    if (!entityName || !pan) {
      return NextResponse.json(
        { success: false, error: "Legal Entity Name and PAN are required." },
        { status: 400 }
      );
    }

    const clientId = `CLI-${Date.now().toString().slice(-4)}`;
    const groupId = body.groupId || `GRP-${Date.now().toString().slice(-4)}`;
    const groupName = body.groupName || `${entityName} Group`;

    const newClient: ClientEntity = {
      id: clientId,
      groupId,
      groupName,
      name: entityName,
      type: body.type || "PVT_LTD",
      pan,
      gstin: body.gstin?.trim().toUpperCase() || undefined,
      cin: body.cin?.trim().toUpperCase() || undefined,
      turnoverCr: parseFloat(body.turnoverCr) || 5.0,
      incorporationYear: parseInt(body.incorporationYear) || 2024,
      penaltyRiskAccrued: 0,
      partnerInCharge: body.partnerInCharge || "CA Gunjan Jain",
      assignedArticle: body.assignedArticle || "Kriti Jain (Article)",
      primaryContact: {
        name: body.primaryContact?.name?.trim() || "Promoter",
        phone: body.primaryContact?.phone?.trim() || "+91 98000 00000",
        email: body.primaryContact?.email?.trim() || "accounts@client.com",
        designation: body.primaryContact?.designation || "Director / Authorized Signatory",
      },
    };

    // 1. Persist to Supabase PostgreSQL Cloud if connected
    if (isSupabaseConfigured()) {
      try {
        const { data: firms } = await supabase.from("firms").select("id").limit(1);
        const firmId = firms?.[0]?.id;

        if (firmId) {
          // Ensure client group exists
          const { data: existingGroup } = await supabase
            .from("client_groups")
            .select("id")
            .eq("firm_id", firmId)
            .limit(1);

          let targetGroupId = existingGroup?.[0]?.id;
          if (!targetGroupId) {
            const { data: insertedGroup } = await supabase
              .from("client_groups")
              .insert({
                firm_id: firmId,
                group_name: groupName,
                promoter_name: newClient.primaryContact.name,
                promoter_phone: newClient.primaryContact.phone,
                promoter_email: newClient.primaryContact.email,
                unbilled_wip_total: 0,
                overdue_fees_total: 0,
              })
              .select("id")
              .single();
            targetGroupId = insertedGroup?.id;
          }

          if (targetGroupId) {
            const { data: insertedEntity, error: insErr } = await supabase.from("client_entities").insert({
              firm_id: firmId,
              group_id: targetGroupId,
              entity_name: newClient.name,
              type: newClient.type,
              pan: newClient.pan,
              gstin: newClient.gstin || null,
              cin: newClient.cin || null,
              turnover_cr: newClient.turnoverCr,
              incorporation_year: newClient.incorporationYear,
              penalty_risk_accrued: 0,
            }).select("id").single();

            if (insertedEntity?.id) {
              newClient.id = insertedEntity.id;
              newClient.groupId = targetGroupId;
            }
            if (insErr) {
              console.error("Supabase insert client_entities error:", insErr);
            }
          }
        }
      } catch (sbErr) {
        console.warn("Supabase insertion warning (synced locally):", sbErr);
      }
    }

    // 2. Persist to local database & audit log
    db.clients.unshift(newClient);
    
    // Check if group already in db.groups
    const hasGroup = db.groups.some((g) => g.id === groupId);
    if (!hasGroup) {
      db.groups.push({
        id: groupId,
        name: groupName,
        promoterName: newClient.primaryContact.name,
        promoterPhone: newClient.primaryContact.phone,
        promoterEmail: newClient.primaryContact.email,
        totalEntities: 1,
        totalTurnoverCr: newClient.turnoverCr,
        unbilledWipTotal: 0,
        overdueFeesTotal: 0,
        entityIds: [clientId],
      });
    }

    db.firmMetrics.totalClients = db.clients.length;
    db.firmMetrics.activeEntities = db.clients.length;

    await saveDatabase(db);

    await logAuditEvent(
      body.actorName || "CA Gunjan Jain",
      "PARTNER",
      newClient.name,
      "Client Master Onboarded",
      `Onboarded ${newClient.type} entity ${newClient.name} (PAN: ${newClient.pan}) into practice registry.`,
      "SYSTEM"
    );

    return NextResponse.json({ success: true, client: newClient });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
