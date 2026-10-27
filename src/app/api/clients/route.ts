import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { ensureDatabase, logAuditEvent, saveDatabase } from "@/lib/server/db";
import { ClientEntity, EntityType } from "@/lib/types";

const ENTITY_TYPES: EntityType[] = ["PVT_LTD", "PUBLIC_LTD", "LLP", "PARTNERSHIP", "PROPRIETORSHIP", "INDIVIDUAL_HNI", "TRUST_NGO"];

export async function GET() {
  try {
    const db = await ensureDatabase();
    return NextResponse.json({ success: true, clients: db.clients, groups: db.groups });
  } catch {
    return NextResponse.json({ success: false, error: "Firm data is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = await ensureDatabase();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const pan = typeof body.pan === "string" ? body.pan.trim().toUpperCase() : "";
    if (!name || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      return NextResponse.json({ success: false, error: "Enter a legal entity name and a valid PAN." }, { status: 400 });
    }
    if (db.clients.some((client) => client.pan.toUpperCase() === pan)) {
      return NextResponse.json({ success: false, error: "An entity with this PAN already exists in this firm." }, { status: 409 });
    }

    const type = ENTITY_TYPES.includes(body.type) ? body.type : null;
    const turnoverCr = body.turnoverCr === undefined || body.turnoverCr === "" ? NaN : Number(body.turnoverCr);
    const incorporationYear = body.incorporationYear === undefined || body.incorporationYear === "" ? NaN : Number(body.incorporationYear);
    if (!type || !Number.isFinite(turnoverCr) || turnoverCr < 0 || !Number.isInteger(incorporationYear) || incorporationYear < 1800 || incorporationYear > new Date().getFullYear()) {
      return NextResponse.json({ success: false, error: "Choose an entity type and enter its turnover and valid incorporation year." }, { status: 400 });
    }

    const groupName = typeof body.groupName === "string" && body.groupName.trim() ? body.groupName.trim() : `${name} Group`;
    const requestedGroupId = typeof body.groupId === "string" ? body.groupId : "";
    const existingGroup = requestedGroupId ? db.groups.find((group) => group.id === requestedGroupId) : undefined;
    if (requestedGroupId && !existingGroup) {
      return NextResponse.json({ success: false, error: "Selected business group was not found." }, { status: 404 });
    }

    const contact = body.primaryContact || {};
    const contactName = typeof contact.name === "string" ? contact.name.trim() : "";
    const contactPhone = typeof contact.phone === "string" ? contact.phone.trim() : "";
    const contactEmail = typeof contact.email === "string" ? contact.email.trim().toLowerCase() : "";
    if (!contactName || (!contactPhone && !contactEmail)) {
      return NextResponse.json({ success: false, error: "Enter a primary contact name and at least one phone number or email address." }, { status: 400 });
    }
    const phoneDigits = contactPhone.replace(/\D/g, "");
    if ((contactPhone && (phoneDigits.length < 10 || phoneDigits.length > 15)) || (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))) {
      return NextResponse.json({ success: false, error: "Enter a valid contact phone number or email address." }, { status: 400 });
    }
    if (body.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(String(body.gstin).trim().toUpperCase())) {
      return NextResponse.json({ success: false, error: "Enter a valid 15-character GSTIN or leave the field blank." }, { status: 400 });
    }
    const clientId = randomUUID();
    const groupId = existingGroup?.id || randomUUID();
    const entity: ClientEntity = {
      id: clientId,
      groupId,
      groupName: existingGroup?.name || groupName,
      name,
      type,
      pan,
      gstin: typeof body.gstin === "string" && body.gstin.trim() ? body.gstin.trim().toUpperCase() : undefined,
      cin: typeof body.cin === "string" && body.cin.trim() ? body.cin.trim().toUpperCase() : undefined,
      turnoverCr,
      incorporationYear,
      penaltyRiskAccrued: 0,
      partnerInCharge: "",
      assignedArticle: "",
      primaryContact: {
        name: contactName,
        phone: contactPhone,
        email: contactEmail,
        designation: typeof contact.designation === "string" ? contact.designation.trim() : "",
      },
    };

    db.clients.unshift(entity);
    if (existingGroup) {
      existingGroup.totalEntities += 1;
      existingGroup.totalTurnoverCr += turnoverCr;
      existingGroup.entityIds.push(clientId);
    } else {
      db.groups.push({
        id: groupId,
        name: groupName,
        promoterName: entity.primaryContact.name,
        promoterPhone: entity.primaryContact.phone,
        promoterEmail: entity.primaryContact.email,
        totalEntities: 1,
        totalTurnoverCr: turnoverCr,
        unbilledWipTotal: 0,
        overdueFeesTotal: 0,
        entityIds: [clientId],
      });
    }
    db.firmMetrics.totalClients = db.clients.length;
    db.firmMetrics.activeEntities = db.clients.length;

    await logAuditEvent(
      "Firm user",
      "PARTNER",
      entity.name,
      "Client Master Onboarded",
      `Onboarded ${entity.type} entity ${entity.name} (PAN: ${pan.slice(0, 5)}*****).`,
      "SYSTEM",
      db
    );
    await saveDatabase(db);
    return NextResponse.json({ success: true, client: entity }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Client could not be saved. Refresh the page and try again." }, { status: 503 });
  }
}
