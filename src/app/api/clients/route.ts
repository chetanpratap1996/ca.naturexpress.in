import { NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ClientEntity } from "@/lib/types";
import crypto from "crypto";

export async function GET() {
  const db = ensureDatabase();
  return NextResponse.json({ success: true, clients: db.clients, groups: db.groups });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = ensureDatabase();

    // ─── BATCH IMPORT FOR 100+ CLIENT CSV UPLOADS ───
    if (Array.isArray(body.batch) && body.batch.length > 0) {
      const inserted: ClientEntity[] = [];
      let skippedCount = 0;

      for (let i = 0; i < body.batch.length; i++) {
        const item = body.batch[i];
        const entityName = (item.name || "").trim();
        const pan = (item.pan || "").trim().toUpperCase();
        if (!entityName || !pan) {
          skippedCount++;
          continue;
        }

        // Avoid duplicate PANs in database
        const existingIdx = db.clients.findIndex((c) => c.pan.toUpperCase() === pan);
        const contactName = item.primaryContact?.name?.trim() || "Promoter";
        const contactPhone = item.primaryContact?.phone?.trim() || "+91 98000 00000";
        const contactEmail = item.primaryContact?.email?.trim() || "accounts@client.com";
        const designation = item.primaryContact?.designation || "Director / Authorized Signatory";
        const turnover = parseFloat(item.turnoverCr) || 5.0;

        const clientId = item.id || `CLI-${crypto.randomUUID().slice(0, 8)}`;
        const groupId = item.groupId || `GRP-${crypto.randomUUID().slice(0, 8)}`;
        const groupName = item.groupName || `${entityName} Group`;

        const clientRecord: ClientEntity = {
          id: clientId,
          groupId,
          groupName,
          name: entityName,
          type: item.type || "PVT_LTD",
          pan,
          gstin: item.gstin?.trim().toUpperCase() || undefined,
          cin: item.cin?.trim().toUpperCase() || undefined,
          turnoverCr: turnover,
          incorporationYear: parseInt(item.incorporationYear) || 2024,
          penaltyRiskAccrued: 0,
          partnerInCharge: item.partnerInCharge || "CA Gunjan Jain",
          assignedArticle: item.assignedArticle || "Kriti Jain (Article)",
          primaryContact: {
            name: contactName,
            phone: contactPhone,
            email: contactEmail,
            designation,
          },
        };

        if (existingIdx >= 0) {
          // Update existing
          db.clients[existingIdx] = { ...db.clients[existingIdx], ...clientRecord };
          inserted.push(db.clients[existingIdx]);
        } else {
          // Insert new
          db.clients.unshift(clientRecord);
          inserted.push(clientRecord);

          // Manage promoter group
          const grp = db.groups.find((g) => g.id === groupId);
          if (grp) {
            grp.totalEntities = (grp.totalEntities || 0) + 1;
            grp.totalTurnoverCr = (grp.totalTurnoverCr || 0) + turnover;
            if (!grp.entityIds) grp.entityIds = [];
            if (!grp.entityIds.includes(clientId)) grp.entityIds.push(clientId);
          } else {
            db.groups.push({
              id: groupId,
              name: groupName,
              promoterName: contactName,
              promoterPhone: contactPhone,
              promoterEmail: contactEmail,
              totalEntities: 1,
              totalTurnoverCr: turnover,
              unbilledWipTotal: 0,
              overdueFeesTotal: 0,
              entityIds: [clientId],
            });
          }
        }
      }

      db.firmMetrics.totalClients = db.clients.length;
      db.firmMetrics.activeEntities = db.clients.length;
      await saveDatabase(db);

      await logAuditEvent(
        body.actorName || "CA Gunjan Jain",
        "PARTNER",
        `${inserted.length} Clients`,
        "Bulk CSV Client Master Ingested",
        `Successfully onboarded ${inserted.length} client entities via high-throughput CSV pipeline (${skippedCount} skipped).`,
        "SYSTEM"
      );

      return NextResponse.json({
        success: true,
        count: inserted.length,
        skipped: skippedCount,
        clients: db.clients,
      });
    }

    // ─── SINGLE CLIENT ONBOARDING ───
    const entityName = body.name?.trim();
    const pan = body.pan?.trim().toUpperCase();
    if (!entityName || !pan) {
      return NextResponse.json(
        { success: false, error: "Legal Entity Name and PAN are required." },
        { status: 400 }
      );
    }

    const clientId = `CLI-${crypto.randomUUID().slice(0, 8)}`;
    const groupId = body.groupId || `GRP-${crypto.randomUUID().slice(0, 8)}`;
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
          let targetGroupId: string | null = null;

          // Check if explicit group ID was provided
          if (body.groupId) {
            const { data: gById } = await supabase
              .from("client_groups")
              .select("id")
              .eq("id", body.groupId)
              .maybeSingle();
            if (gById?.id) targetGroupId = gById.id;
          }

          // Otherwise find by group name within this firm
          if (!targetGroupId && groupName) {
            const { data: gByName } = await supabase
              .from("client_groups")
              .select("id")
              .eq("firm_id", firmId)
              .ilike("group_name", groupName)
              .maybeSingle();
            if (gByName?.id) targetGroupId = gByName.id;
          }

          // If still no matching group, create a dedicated new group
          if (!targetGroupId) {
            const { data: insertedGroup, error: grpErr } = await supabase
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

            if (!grpErr && insertedGroup?.id) {
              targetGroupId = insertedGroup.id;
            }
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
    const hasGroup = db.groups.some((g) => g.id === newClient.groupId);
    if (!hasGroup) {
      db.groups.push({
        id: newClient.groupId,
        name: newClient.groupName || groupName,
        promoterName: newClient.primaryContact.name,
        promoterPhone: newClient.primaryContact.phone,
        promoterEmail: newClient.primaryContact.email,
        totalEntities: 1,
        totalTurnoverCr: newClient.turnoverCr,
        unbilledWipTotal: 0,
        overdueFeesTotal: 0,
        entityIds: [newClient.id],
      });
    } else {
      const g = db.groups.find((g) => g.id === newClient.groupId);
      if (g) {
        g.totalEntities = (g.totalEntities || 0) + 1;
        g.totalTurnoverCr = (g.totalTurnoverCr || 0) + newClient.turnoverCr;
        if (!g.entityIds) g.entityIds = [];
        if (!g.entityIds.includes(newClient.id)) g.entityIds.push(newClient.id);
      }
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
