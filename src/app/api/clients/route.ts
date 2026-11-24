import { NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { getPostgresPool } from "@/lib/server/postgres";
import { ClientEntity } from "@/lib/types";
import { isValidPan, isValidGstin } from "@/lib/utils";
import { generateStatutoryTasksForClient } from "@/lib/statutoryTasks";
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

          // Auto-generate statutory compliance obligations for new client
          if (!db.tasks) db.tasks = [];
          const hasExistingTasks = db.tasks.some(
            (t) => t.entityId === clientRecord.id || t.entityName.toLowerCase() === clientRecord.name.toLowerCase()
          );
          if (!hasExistingTasks) {
            const clientTasks = generateStatutoryTasksForClient(clientRecord);
            db.tasks.push(...clientTasks);
          }

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

      // Direct PostgreSQL Superuser Sync for Batch Import
      try {
        const pool = getPostgresPool();
        const firmRes = await pool.query("SELECT id FROM firms LIMIT 1");
        const firmId = firmRes.rows[0]?.id;
        if (firmId && inserted.length > 0) {
          for (const item of inserted) {
            await pool.query(
              `INSERT INTO client_entities (
                 firm_id, entity_name, type, pan, gstin, cin, turnover_cr, incorporation_year,
                 primary_contact_name, primary_contact_phone, primary_contact_email, primary_contact_designation
               ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
               ON CONFLICT (pan) DO UPDATE SET
                 entity_name = EXCLUDED.entity_name,
                 gstin = EXCLUDED.gstin,
                 cin = EXCLUDED.cin,
                 turnover_cr = EXCLUDED.turnover_cr,
                 primary_contact_name = EXCLUDED.primary_contact_name,
                 primary_contact_phone = EXCLUDED.primary_contact_phone,
                 primary_contact_email = EXCLUDED.primary_contact_email`,
              [
                firmId, item.name, item.type, item.pan, item.gstin || null, item.cin || null, item.turnoverCr, item.incorporationYear,
                item.primaryContact?.name, item.primaryContact?.phone, item.primaryContact?.email, item.primaryContact?.designation
              ]
            );
          }
        }
      } catch (pgErr) {
        console.warn("Postgres batch client sync warning:", pgErr);
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
      tradeName: body.tradeName?.trim() || undefined,
      type: body.type || "PVT_LTD",
      pan,
      gstin: body.gstin?.trim().toUpperCase() || undefined,
      cin: body.cin?.trim().toUpperCase() || undefined,
      tan: body.tan?.trim().toUpperCase() || undefined,
      turnoverCr: parseFloat(body.turnoverCr) || 5.0,
      digitalTxnPct: body.digitalTxnPct !== undefined ? parseFloat(body.digitalTxnPct) : 96.0,
      incorporationYear: parseInt(body.incorporationYear) || 2024,
      penaltyRiskAccrued: body.penaltyRiskAccrued || 0,
      partnerInCharge: body.partnerInCharge || "CA Gunjan Jain",
      assignedArticle: body.assignedArticle || "Kriti Jain (Article)",
      primaryContact: {
        name: body.primaryContact?.name?.trim() || "Promoter",
        phone: body.primaryContact?.phone?.trim() || "+91 98000 00000",
        email: body.primaryContact?.email?.trim() || "accounts@client.com",
        designation: body.primaryContact?.designation || "Director / Authorized Signatory",
      },
      gstinRecords: body.gstinRecords || [],
      directors: body.directors || [],
      tanRecords: body.tanRecords || [],
      bankAccounts: body.bankAccounts || [],
      dscVault: body.dscVault || [],
      complianceBaselines: body.complianceBaselines || [],
      gstHistory: body.gstHistory || [],
      healthScore: body.healthScore !== undefined ? body.healthScore : 98,
      registeredAddress: body.registeredAddress || undefined,
      authorizedCapitalCr: body.authorizedCapitalCr || undefined,
      paidUpCapitalCr: body.paidUpCapitalCr || undefined,
    };

    // 1. Persist directly to Supabase PostgreSQL Cloud (Direct Superuser Connection)
    try {
      const pool = getPostgresPool();
      const firmRes = await pool.query("SELECT id FROM firms LIMIT 1");
      const firmId = firmRes.rows[0]?.id;

      if (firmId) {
        let targetGroupId: string | null = null;

        if (body.groupId) {
          const gById = await pool.query("SELECT id FROM client_groups WHERE id = $1 LIMIT 1", [body.groupId]);
          if (gById.rows[0]?.id) targetGroupId = gById.rows[0].id;
        }

        if (!targetGroupId && groupName) {
          const gByName = await pool.query(
            "SELECT id FROM client_groups WHERE firm_id = $1 AND LOWER(group_name) = LOWER($2) LIMIT 1",
            [firmId, groupName]
          );
          if (gByName.rows[0]?.id) targetGroupId = gByName.rows[0].id;
        }

        if (!targetGroupId) {
          const insertedGroup = await pool.query(
            `INSERT INTO client_groups (
               firm_id, group_name, promoter_name, promoter_phone, promoter_email, unbilled_wip_total, overdue_fees_total
             ) VALUES ($1, $2, $3, $4, $5, 0, 0) RETURNING id`,
            [firmId, groupName, newClient.primaryContact.name, newClient.primaryContact.phone, newClient.primaryContact.email]
          );
          if (insertedGroup.rows[0]?.id) targetGroupId = insertedGroup.rows[0].id;
        }

        const insertedClient = await pool.query(
          `INSERT INTO client_entities (
             firm_id, group_id, entity_name, type, pan, gstin, cin, turnover_cr,
             incorporation_year, primary_contact_name, primary_contact_phone, primary_contact_email, primary_contact_designation
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (pan) DO UPDATE SET
             entity_name = EXCLUDED.entity_name,
             gstin = EXCLUDED.gstin,
             cin = EXCLUDED.cin,
             turnover_cr = EXCLUDED.turnover_cr,
             primary_contact_name = EXCLUDED.primary_contact_name,
             primary_contact_phone = EXCLUDED.primary_contact_phone,
             primary_contact_email = EXCLUDED.primary_contact_email,
             primary_contact_designation = EXCLUDED.primary_contact_designation
           RETURNING id`,
          [
            firmId,
            targetGroupId,
            newClient.name,
            newClient.type,
            newClient.pan,
            newClient.gstin || null,
            newClient.cin || null,
            newClient.turnoverCr,
            newClient.incorporationYear,
            newClient.primaryContact.name,
            newClient.primaryContact.phone,
            newClient.primaryContact.email,
            newClient.primaryContact.designation,
          ]
        );

        if (insertedClient.rows[0]?.id) {
          newClient.id = insertedClient.rows[0].id;
          if (targetGroupId) newClient.groupId = targetGroupId;
        }
      }
    } catch (pgError) {
      console.warn("Postgres single client onboarding warning:", pgError);
    }

    // 2. Persist to local JSON DB
    db.clients.unshift(newClient);

    // Auto-generate statutory compliance obligations for new client
    if (!db.tasks) db.tasks = [];
    const hasExistingTasks = db.tasks.some(
      (t) => t.entityId === newClient.id || t.entityName.toLowerCase() === newClient.name.toLowerCase()
    );
    if (!hasExistingTasks) {
      const clientTasks = generateStatutoryTasksForClient(newClient);
      db.tasks.push(...clientTasks);

      // Persist generated statutory tasks to Supabase PostgreSQL
      try {
        const pool = getPostgresPool();
        const firmRes = await pool.query("SELECT id FROM firms LIMIT 1");
        const firmId = firmRes.rows[0]?.id;
        if (firmId && newClient.id) {
          for (const t of clientTasks) {
            await pool.query(
              `INSERT INTO compliance_tasks (
                 firm_id, entity_id, category, title, period, due_date, status, priority, penalty_risk, accruing_daily_penalty
               ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
               ON CONFLICT DO NOTHING`,
              [
                firmId,
                newClient.id,
                t.category,
                t.title,
                t.period,
                t.dueDate,
                t.status,
                t.priority,
                t.penaltyRisk,
                t.accruingDailyPenalty,
              ]
            ).catch(() => {});
          }
        }
      } catch (taskErr) {
        console.warn("Postgres statutory tasks insert warning:", taskErr);
      }
    }

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

    // Direct PostgreSQL update
    try {
      const pool = getPostgresPool();
      await pool.query(
        `UPDATE client_entities SET
           entity_name = $1, type = $2, pan = $3, gstin = $4, turnover_cr = $5,
           primary_contact_name = $6, primary_contact_phone = $7, primary_contact_email = $8
         WHERE id::text = $9 OR pan = $3`,
        [
          updated.name, updated.type, updated.pan, updated.gstin || null, updated.turnoverCr,
          updated.primaryContact.name, updated.primaryContact.phone, updated.primaryContact.email,
          clientId
        ]
      );
    } catch (pgErr) {
      console.warn("Postgres client patch warning:", pgErr);
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

    // Direct PostgreSQL delete
    try {
      const pool = getPostgresPool();
      await pool.query("DELETE FROM compliance_tasks WHERE entity_id::text = $1", [clientId]);
      await pool.query("DELETE FROM client_entities WHERE id::text = $1 OR pan = $2", [clientId, removed.pan]);
    } catch (pgErr) {
      console.warn("Postgres client delete warning:", pgErr);
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
