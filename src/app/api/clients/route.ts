import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ClientEntity } from "@/lib/types";
import crypto from "crypto";
import { authenticateServerRequest, createRequestSupabaseClient, writeServerAuditLog } from "@/lib/auth/serverAuth";

export async function GET(request: NextRequest) {
  const auth = await authenticateServerRequest(request);
  if (!auth.isAuthenticated || !auth.user) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }

  // Production reads go through the caller's verified Supabase session and RLS policies.
  if (process.env.NODE_ENV === "production") {
    const client = createRequestSupabaseClient(request);
    if (!client || !auth.firmId) {
      return NextResponse.json({ success: false, error: "Durable firm database is not configured." }, { status: 503 });
    }
    const [{ data: rows, error: entityError }, { data: groupRows, error: groupError }] = await Promise.all([
      client.from("client_entities").select("id, group_id, entity_name, type, pan, gstin, cin, tan, turnover_cr, incorporation_year, penalty_risk_accrued, firm_id").eq("firm_id", auth.firmId),
      client.from("client_groups").select("id, group_name, promoter_name, promoter_phone, promoter_email, unbilled_wip_total, overdue_fees_total, firm_id").eq("firm_id", auth.firmId),
    ]);
    if (entityError || groupError) {
      return NextResponse.json({ success: false, error: "Unable to load the firm client registry." }, { status: 503 });
    }
    const mappedGroups = (groupRows || []).map((group: any) => {
      const entities = (rows || []).filter((row: any) => row.group_id === group.id);
      return {
        id: group.id,
        name: group.group_name,
        promoterName: group.promoter_name,
        promoterPhone: group.promoter_phone,
        promoterEmail: group.promoter_email,
        totalEntities: entities.length,
        totalTurnoverCr: entities.reduce((sum: number, entity: any) => sum + Number(entity.turnover_cr || 0), 0),
        unbilledWipTotal: auth.role === "CLIENT" ? 0 : Number(group.unbilled_wip_total || 0),
        overdueFeesTotal: auth.role === "CLIENT" ? 0 : Number(group.overdue_fees_total || 0),
        entityIds: entities.map((entity: any) => entity.id),
      };
    });
    const mappedClients: ClientEntity[] = (rows || []).map((entity: any) => {
      const group = mappedGroups.find((item) => item.id === entity.group_id);
      return {
        id: entity.id,
        groupId: entity.group_id,
        groupName: group?.name || "Client Group",
        name: entity.entity_name,
        type: entity.type,
        pan: entity.pan,
        gstin: entity.gstin || undefined,
        cin: entity.cin || undefined,
        tan: entity.tan || undefined,
        turnoverCr: Number(entity.turnover_cr || 0),
        incorporationYear: entity.incorporation_year || 2024,
        penaltyRiskAccrued: Number(entity.penalty_risk_accrued || 0),
        partnerInCharge: "Assigned Partner",
        assignedArticle: "Assigned Staff",
        primaryContact: {
          name: group?.promoterName || "Authorized Signatory",
          phone: group?.promoterPhone || "",
          email: group?.promoterEmail || "",
          designation: "Authorized Signatory",
        },
      };
    });
    return NextResponse.json({ success: true, clients: mappedClients, groups: mappedGroups });
  }

  const db = ensureDatabase();
  if (auth.role === "CLIENT") {
    const clients = db.clients.filter((client) => auth.clientEntityId
      ? client.id === auth.clientEntityId
      : client.groupId === auth.clientGroupId);
    const groupIds = new Set(clients.map((client) => client.groupId));
    return NextResponse.json({ success: true, clients, groups: db.groups.filter((group) => groupIds.has(group.id)) });
  }
  return NextResponse.json({ success: true, clients: db.clients, groups: db.groups });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const auth = await authenticateServerRequest(req as NextRequest);
    if (!auth.isAuthenticated || auth.role !== "PARTNER" || !auth.firmId) {
      return NextResponse.json({ success: false, error: "Partner access required." }, { status: 403 });
    }

    if (process.env.NODE_ENV === "production") {
      const client = createRequestSupabaseClient(req as NextRequest);
      if (!client) return NextResponse.json({ success: false, error: "Supabase is not configured." }, { status: 503 });
      const inputs = Array.isArray(body.batch) ? body.batch : [body];
      const created: any[] = [];
      let skipped = 0;
      for (const item of inputs) {
        const entityName = String(item.name || "").trim();
        const pan = String(item.pan || "").trim().toUpperCase();
        if (!entityName || !pan) { skipped++; continue; }
        let groupId = item.groupId;
        if (groupId) {
          const { data: existingGroup } = await client.from("client_groups").select("id").eq("id", groupId).eq("firm_id", auth.firmId).maybeSingle();
          if (!existingGroup) return NextResponse.json({ success: false, error: "The selected client group is not in this firm." }, { status: 403 });
        } else {
          const { data: insertedGroup, error: groupInsertError } = await client.from("client_groups").insert({
            firm_id: auth.firmId,
            group_name: String(item.groupName || `${entityName} Group`),
            promoter_name: String(item.primaryContact?.name || "Authorized Signatory"),
            promoter_phone: String(item.primaryContact?.phone || ""),
            promoter_email: String(item.primaryContact?.email || ""),
          }).select("id").single();
          if (groupInsertError || !insertedGroup) {
            return NextResponse.json({ success: false, error: "Could not create the client group. Check that the firm profile is fully configured." }, { status: 400 });
          }
          groupId = insertedGroup.id;
        }
        const { data: insertedEntity, error: entityInsertError } = await client.from("client_entities").insert({
          firm_id: auth.firmId,
          group_id: groupId,
          entity_name: entityName,
          type: item.type || "PVT_LTD",
          pan,
          gstin: item.gstin ? String(item.gstin).trim().toUpperCase() : null,
          cin: item.cin ? String(item.cin).trim().toUpperCase() : null,
          tan: item.tan ? String(item.tan).trim().toUpperCase() : null,
          turnover_cr: Number(item.turnoverCr || 0),
          incorporation_year: Number(item.incorporationYear || 2024),
        }).select("id, group_id, entity_name, type, pan, gstin, cin, tan, turnover_cr, incorporation_year, penalty_risk_accrued").single();
        if (entityInsertError || !insertedEntity) {
          return NextResponse.json({ success: false, error: "Could not save the legal entity. No local-file fallback was attempted." }, { status: 400 });
        }
        const contact = item.primaryContact || {};
        created.push({
          id: insertedEntity.id, groupId: insertedEntity.group_id, groupName: String(item.groupName || `${entityName} Group`),
          name: insertedEntity.entity_name, type: insertedEntity.type, pan: insertedEntity.pan,
          gstin: insertedEntity.gstin || undefined, cin: insertedEntity.cin || undefined, tan: insertedEntity.tan || undefined,
          turnoverCr: Number(insertedEntity.turnover_cr || 0), incorporationYear: insertedEntity.incorporation_year,
          penaltyRiskAccrued: Number(insertedEntity.penalty_risk_accrued || 0), partnerInCharge: "Assigned Partner", assignedArticle: "Assigned Staff",
          primaryContact: { name: contact.name || "Authorized Signatory", phone: contact.phone || "", email: contact.email || "", designation: contact.designation || "Authorized Signatory" },
        });
        const audit = await writeServerAuditLog(req as NextRequest, auth, {
          entityId: insertedEntity.id, entityName, action: "Client Entity Onboarded", details: `Created entity profile ${entityName}.`, category: "SYSTEM",
        });
        if (audit.error) console.error("Audit log write failed for client onboarding.");
      }
      return NextResponse.json({ success: true, count: created.length, skipped, clients: created, client: created[0] });
    }

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
