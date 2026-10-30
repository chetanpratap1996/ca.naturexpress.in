import { NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ClientEntity } from "@/lib/types";
import { isValidPan, isValidGstin } from "@/lib/utils";
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
          db.clients[existingIdx] = { ...db.clients[existingIdx], ...clientRecord };
          inserted.push(db.clients[existingIdx]);
        } else {
          db.clients.unshift(clientRecord);
          inserted.push(clientRecord);

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

      // Bi-Directional Supabase Sync for Batch Import
      if (isSupabaseConfigured() && inserted.length > 0) {
        try {
          const { data: firms } = await supabase.from("firms").select("id").limit(1);
          const firmId = firms?.[0]?.id;
          if (firmId) {
            for (const item of inserted) {
              await supabase.from("client_entities").upsert({
                firm_id: firmId,
                entity_name: item.name,
                type: item.type,
                pan: item.pan,
                gstin: item.gstin || null,
                cin: item.cin || null,
                turnover_cr: item.turnoverCr,
                incorporation_year: item.incorporationYear,
                primary_contact_name: item.primaryContact?.name,
                primary_contact_phone: item.primaryContact?.phone,
                primary_contact_email: item.primaryContact?.email,
                primary_contact_designation: item.primaryContact?.designation,
              }, { onConflict: "pan" });
            }
          }
        } catch (sbErr) {
          console.warn("Supabase batch client sync warning:", sbErr);
        }
      }

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

    if (!isValidPan(pan)) {
      return NextResponse.json(
        { success: false, error: `Invalid Indian PAN format '${pan}'. Expected 5 alphabets + 4 digits + 1 alphabet.` },
        { status: 400 }
      );
    }

    if (body.gstin && !isValidGstin(body.gstin)) {
      return NextResponse.json(
        { success: false, error: `Invalid 15-digit GSTIN format '${body.gstin}'. Please check state code and checksum.` },
        { status: 400 }
      );
    }

    const clientId = body.id || `CLI-${crypto.randomUUID().slice(0, 8)}`;
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

          if (body.groupId) {
            const { data: gById } = await supabase
              .from("client_groups")
              .select("id")
              .eq("id", body.groupId)
              .maybeSingle();
            if (gById?.id) targetGroupId = gById.id;
          }

          if (!targetGroupId && groupName) {
            const { data: gByName } = await supabase
              .from("client_groups")
              .select("id")
              .eq("firm_id", firmId)
              .ilike("group_name", groupName)
              .maybeSingle();
            if (gByName?.id) targetGroupId = gByName.id;
          }

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

            if (insertedGroup) targetGroupId = insertedGroup.id;
          }

          const { data: insertedClient, error: clientErr } = await supabase
            .from("client_entities")
            .insert({
              firm_id: firmId,
              group_id: targetGroupId,
              entity_name: newClient.name,
              type: newClient.type,
              pan: newClient.pan,
              gstin: newClient.gstin || null,
              cin: newClient.cin || null,
              turnover_cr: newClient.turnoverCr,
              incorporation_year: newClient.incorporationYear,
              primary_contact_name: newClient.primaryContact.name,
              primary_contact_phone: newClient.primaryContact.phone,
              primary_contact_email: newClient.primaryContact.email,
              primary_contact_designation: newClient.primaryContact.designation,
            })
            .select("id")
            .single();

          if (insertedClient?.id) {
            newClient.id = insertedClient.id;
            if (targetGroupId) newClient.groupId = targetGroupId;
          }
        }
      } catch (sbError) {
        console.warn("Supabase single client onboarding error (continuing with atomic local fallback):", sbError);
      }
    }

    // 2. Persist to local JSON DB
    db.clients.unshift(newClient);

    const groupIndex = db.groups.findIndex((g) => g.id === newClient.groupId);
    if (groupIndex !== -1) {
      db.groups[groupIndex].totalEntities += 1;
      db.groups[groupIndex].totalTurnoverCr += newClient.turnoverCr;
      if (!db.groups[groupIndex].entityIds.includes(newClient.id)) {
        db.groups[groupIndex].entityIds.push(newClient.id);
      }
    } else {
      db.groups.push({
        id: newClient.groupId,
        name: newClient.groupName,
        promoterName: newClient.primaryContact.name,
        promoterPhone: newClient.primaryContact.phone,
        promoterEmail: newClient.primaryContact.email,
        totalEntities: 1,
        totalTurnoverCr: newClient.turnoverCr,
        unbilledWipTotal: 0,
        overdueFeesTotal: 0,
        entityIds: [newClient.id],
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

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const db = ensureDatabase();
    const clientId = body.id;
    if (!clientId) {
      return NextResponse.json({ success: false, error: "Client ID required" }, { status: 400 });
    }

    const idx = db.clients.findIndex((c) => c.id === clientId);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    const existing = db.clients[idx];
    const updated: ClientEntity = {
      ...existing,
      ...body,
      primaryContact: {
        ...existing.primaryContact,
        ...(body.primaryContact || {}),
      },
    };

    db.clients[idx] = updated;
    await saveDatabase(db);

    // Bi-Directional Supabase update
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("client_entities")
          .update({
            entity_name: updated.name,
            type: updated.type,
            pan: updated.pan,
            gstin: updated.gstin || null,
            turnover_cr: updated.turnoverCr,
            primary_contact_name: updated.primaryContact.name,
            primary_contact_phone: updated.primaryContact.phone,
            primary_contact_email: updated.primaryContact.email,
          })
          .or(`id.eq.${clientId},pan.eq.${updated.pan}`);
      } catch (sbErr) {
        console.warn("Supabase client patch warning:", sbErr);
      }
    }

    await logAuditEvent(
      body.actorName || "CA Gunjan Jain",
      "PARTNER",
      updated.name,
      "Client Master Updated",
      `Updated profile & contact details for ${updated.name} (PAN: ${updated.pan}).`,
      "SYSTEM"
    );

    return NextResponse.json({ success: true, client: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("id");
    if (!clientId) {
      return NextResponse.json({ success: false, error: "Client ID required" }, { status: 400 });
    }

    const db = ensureDatabase();
    const idx = db.clients.findIndex((c) => c.id === clientId);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    const removed = db.clients.splice(idx, 1)[0];
    db.firmMetrics.totalClients = db.clients.length;
    db.firmMetrics.activeEntities = db.clients.length;
    await saveDatabase(db);

    // Bi-Directional Supabase delete
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("client_entities")
          .delete()
          .or(`id.eq.${clientId},pan.eq.${removed.pan}`);
      } catch (sbErr) {
        console.warn("Supabase client delete warning:", sbErr);
      }
    }

    await logAuditEvent(
      "CA Gunjan Jain",
      "PARTNER",
      removed.name,
      "Client Archived / Removed",
      `Removed client entity ${removed.name} (PAN: ${removed.pan}) from active practice directory.`,
      "SYSTEM"
    );

    return NextResponse.json({ success: true, removedId: clientId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
