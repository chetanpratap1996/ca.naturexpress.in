import { NextRequest, NextResponse } from "next/server";
import { StaffMember, CompetencyTier, StaffRole } from "@/lib/types";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { hashSecret, normalizePhone10 } from "@/lib/auth/enterpriseAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid, appendPgAuditLog, listWorkspaceRecords, upsertWorkspaceRecord } from "@/lib/server/pgHelpers";
import crypto from "crypto";

function sanitizeStaffMember(m: StaffMember): Omit<StaffMember, "pinHash" | "pinSalt" | "tempPin"> {
  const { pinHash: _h, pinSalt: _s, tempPin: _t, ...safe } = m as any;
  return safe;
}

function mapDbRoleToStaffRole(dbRole: string): StaffRole {
  if (dbRole === "PARTNER" || dbRole === "SUPER_ADMIN") return "MANAGING_PARTNER";
  if (dbRole === "PAID_CA_MANAGER") return "PAID_CHARTERED_ACCOUNTANT";
  return "ARTICLE_TRAINEE";
}

function mapStaffRoleToDbRole(staffRole: StaffRole): string {
  if (staffRole === "MANAGING_PARTNER") return "PARTNER";
  if (staffRole === "PAID_CHARTERED_ACCOUNTANT") return "PAID_CA_MANAGER";
  return "ARTICLE_TRAINEE";
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json(
        { success: false, error: "Firm staff authentication required." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();

    const [{ rows: userRows }, { rows: taskRows }, metaRecords] = await Promise.all([
      pool.query(
        `SELECT id, firm_id, email, phone, full_name, role, membership_number, articleship_reg_no, is_active, created_at
         FROM public.users
         WHERE firm_id = $1 AND role IN ('SUPER_ADMIN', 'PARTNER', 'PAID_CA_MANAGER', 'ARTICLE_TRAINEE')
         ORDER BY created_at ASC`,
        [firmId]
      ),
      pool.query(
        `SELECT id, status, assigned_to_id FROM public.compliance_tasks WHERE firm_id = $1`,
        [firmId]
      ),
      listWorkspaceRecords<Partial<StaffMember>>(firmId, "STAFF_PROFILE"),
    ]);

    const metaByUserId = new Map<string, Partial<StaffMember>>();
    for (const rec of metaRecords) {
      if (rec.payload?.id) metaByUserId.set(rec.payload.id, rec.payload);
    }

    const enrichedStaff = userRows.map((u: any) => {
      const meta = metaByUserId.get(u.id) || {};
      const openTasks = taskRows.filter((t: any) => t.status !== "FILED_AND_COMPLETED" && t.assigned_to_id === u.id);
      const completedTasks = taskRows.filter((t: any) => t.status === "FILED_AND_COMPLETED" && t.assigned_to_id === u.id);
      const staffRole = mapDbRoleToStaffRole(u.role);
      const maxCap = Number(meta.maxDailyTaskCapacity) || (staffRole === "MANAGING_PARTNER" ? 16 : 12);

      const member: StaffMember = {
        id: u.id,
        firmId: u.firm_id,
        fullName: u.full_name,
        email: u.email,
        phone: u.phone || "",
        icaiRegistrationNo: u.membership_number || u.articleship_reg_no || undefined,
        role: staffRole,
        competencyTier: (meta.competencyTier as CompetencyTier) || (staffRole === "MANAGING_PARTNER" ? 3 : 2),
        specializations: meta.specializations || ["GST", "INCOME_TAX"],
        allowedTools: meta.allowedTools || (staffRole === "MANAGING_PARTNER" ? ["tasks", "gst", "tax-audit", "notices-udin", "billing-wip", "client-master"] : ["tasks", "gst"]),
        maxDailyTaskCapacity: maxCap,
        status: u.is_active ? "ACTIVE" : "DEACTIVATED",
        joinedDate: u.created_at ? new Date(u.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        activeOpenTasksCount: openTasks.length,
        completedTasksThisMonth: completedTasks.length,
        averageVelocityMinutes: meta.averageVelocityMinutes || 60,
      };

      return {
        ...sanitizeStaffMember(member),
        capacityUtilizationPct: Math.min(100, Math.round((openTasks.length / maxCap) * 100)),
      };
    });

    return NextResponse.json({ success: true, staff: enrichedStaff });
  } catch (error: any) {
    console.error("GET /api/staff error:", error);
    return NextResponse.json({ success: false, error: "Failed to load staff directory." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json(
        { success: false, error: "Managing Partner privileges required to add staff." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const body = await req.json();
    const { fullName, email, phone, role, competencyTier, specializations, maxDailyTaskCapacity, icaiRegistrationNo, allowedTools, password } = body;

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json({ success: false, error: "Full Name is required." }, { status: 400 });
    }

    const cleanPhone = normalizePhone10(phone || "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      return NextResponse.json({ success: false, error: "A valid 10-digit mobile number is required." }, { status: 400 });
    }

    const cleanEmail = (typeof email === "string" && email.trim())
      ? email.trim().toLowerCase()
      : `${fullName.toLowerCase().replace(/[^a-z0-9]/g, "")}.${cleanPhone.slice(-4)}@brainsandtaxes.com`;

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();

    const dup = await pool.query(
      `SELECT id FROM public.users
       WHERE LOWER(email) = $1 OR RIGHT(REGEXP_REPLACE(COALESCE(phone, ''), '\\D', '', 'g'), 10) = $2
       LIMIT 1`,
      [cleanEmail, cleanPhone]
    );
    if (dup.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: `A staff member already exists with phone +91 ${cleanPhone} or email ${cleanEmail}.` },
        { status: 409 }
      );
    }

    // Generate cryptographically random initial password unless Partner supplies one (>=8 chars)
    const initialSecret =
      typeof password === "string" && password.trim().length >= 8
        ? password.trim()
        : crypto.randomBytes(6).toString("base64url");
    const { hash, salt } = hashSecret(initialSecret);

    const staffRole: StaffRole = (role as StaffRole) || "ARTICLE_TRAINEE";
    const dbRole = mapStaffRoleToDbRole(staffRole);
    const membershipNo = staffRole === "MANAGING_PARTNER" ? icaiRegistrationNo?.trim() || null : null;
    const articleshipNo = staffRole !== "MANAGING_PARTNER" ? icaiRegistrationNo?.trim() || null : null;

    const inserted = await pool.query(
      `INSERT INTO public.users (
        firm_id, email, phone, full_name, role, membership_number, articleship_reg_no, password_hash, password_salt, is_active
      ) VALUES ($1, $2, $3, $4, $5::user_role, $6, $7, $8, $9, TRUE)
      RETURNING id, created_at`,
      [firmId, cleanEmail, `+91 ${cleanPhone}`, fullName.trim(), dbRole, membershipNo, articleshipNo, hash, salt]
    );

    const newUserId = inserted.rows[0].id;
    const tier = (Number(competencyTier) as CompetencyTier) || 2;
    const tools = Array.isArray(allowedTools) && allowedTools.length > 0 ? allowedTools : ["tasks", "gst"];
    const specs = Array.isArray(specializations) && specializations.length > 0 ? specializations : ["GST", "INCOME_TAX"];
    const capacity = Number(maxDailyTaskCapacity) || (tier === 1 ? 8 : tier === 2 ? 12 : 16);

    const newStaff: StaffMember = {
      id: newUserId,
      firmId,
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: `+91 ${cleanPhone}`,
      icaiRegistrationNo: icaiRegistrationNo ? icaiRegistrationNo.trim() : undefined,
      role: staffRole,
      competencyTier: tier,
      specializations: specs,
      allowedTools: tools,
      maxDailyTaskCapacity: capacity,
      status: "ACTIVE",
      joinedDate: new Date(inserted.rows[0].created_at).toISOString().split("T")[0],
      activeOpenTasksCount: 0,
      completedTasksThisMonth: 0,
      averageVelocityMinutes: 60,
    };

    await upsertWorkspaceRecord({
      firmId,
      recordType: "STAFF_PROFILE",
      matchKey: "id",
      matchValue: newUserId,
      payload: newStaff,
    });

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Managing Partner",
      actorRole: "PARTNER",
      entityName: "Staff Registry",
      action: "ADD_STAFF",
      details: `Added team member ${newStaff.fullName} (${newStaff.role}, Tier ${newStaff.competencyTier}).`,
      category: "SYSTEM",
    });

    return NextResponse.json({
      success: true,
      staff: newStaff,
      initialCredentialNote: "Provisioned with hashed password; share initial credential securely out-of-band.",
    });
  } catch (error: any) {
    console.error("POST /api/staff error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to add staff." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json(
        { success: false, error: "Managing Partner privileges required to update staff." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const body = await req.json();
    const { id, fullName, role, competencyTier, specializations, maxDailyTaskCapacity, status, phone, email, icaiRegistrationNo, password, allowedTools } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Staff ID is required." }, { status: 400 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const existingRes = await pool.query(
      "SELECT * FROM public.users WHERE id::text = $1 AND firm_id = $2 LIMIT 1",
      [id, firmId]
    );
    if (existingRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Staff member not found." }, { status: 404 });
    }

    const existing = existingRes.rows[0];
    const cleanPhone = phone ? normalizePhone10(phone) : normalizePhone10(existing.phone || "");
    const updatedName = fullName ? String(fullName).trim() : existing.full_name;
    const updatedEmail = email ? String(email).trim().toLowerCase() : existing.email;
    const updatedStaffRole: StaffRole = role ? (role as StaffRole) : mapDbRoleToStaffRole(existing.role);
    const updatedDbRole = mapStaffRoleToDbRole(updatedStaffRole);
    const updatedActive = status ? status !== "DEACTIVATED" : existing.is_active;

    let nextHash = existing.password_hash;
    let nextSalt = existing.password_salt;
    if (typeof password === "string" && password.trim().length >= 8) {
      const hashed = hashSecret(password.trim());
      nextHash = hashed.hash;
      nextSalt = hashed.salt;
    }

    await pool.query(
      `UPDATE public.users
       SET full_name = $1, email = $2, phone = $3, role = $4::user_role, is_active = $5,
           membership_number = COALESCE($6, membership_number),
           articleship_reg_no = COALESCE($7, articleship_reg_no),
           password_hash = $8, password_salt = $9, temp_password = NULL
       WHERE id = $10 AND firm_id = $11`,
      [
        updatedName,
        updatedEmail,
        cleanPhone.length === 10 ? `+91 ${cleanPhone}` : existing.phone,
        updatedDbRole,
        updatedActive,
        updatedStaffRole === "MANAGING_PARTNER" ? icaiRegistrationNo?.trim() || null : null,
        updatedStaffRole !== "MANAGING_PARTNER" ? icaiRegistrationNo?.trim() || null : null,
        nextHash,
        nextSalt,
        id,
        firmId,
      ]
    );

    const existingMeta = (await listWorkspaceRecords<Partial<StaffMember>>(firmId, "STAFF_PROFILE")).find(
      (r) => r.payload?.id === id
    )?.payload;

    const updatedStaff: StaffMember = {
      id,
      firmId,
      fullName: updatedName,
      email: updatedEmail,
      phone: cleanPhone.length === 10 ? `+91 ${cleanPhone}` : existing.phone,
      icaiRegistrationNo: icaiRegistrationNo !== undefined ? String(icaiRegistrationNo).trim() : existingMeta?.icaiRegistrationNo,
      role: updatedStaffRole,
      competencyTier: competencyTier ? (Number(competencyTier) as CompetencyTier) : existingMeta?.competencyTier || 2,
      specializations: Array.isArray(specializations) ? specializations : existingMeta?.specializations || ["GST", "INCOME_TAX"],
      allowedTools: Array.isArray(allowedTools) ? allowedTools : existingMeta?.allowedTools || ["tasks", "gst"],
      maxDailyTaskCapacity: maxDailyTaskCapacity ? Number(maxDailyTaskCapacity) : existingMeta?.maxDailyTaskCapacity || 12,
      status: updatedActive ? "ACTIVE" : "DEACTIVATED",
      joinedDate: existing.created_at ? new Date(existing.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      activeOpenTasksCount: 0,
      completedTasksThisMonth: 0,
      averageVelocityMinutes: 60,
    };

    await upsertWorkspaceRecord({
      firmId,
      recordType: "STAFF_PROFILE",
      matchKey: "id",
      matchValue: id,
      payload: updatedStaff,
    });

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Managing Partner",
      actorRole: "PARTNER",
      entityName: "Staff Registry",
      action: "UPDATE_STAFF",
      details: `Updated staff profile for ${updatedStaff.fullName} (Status: ${updatedStaff.status}).`,
      category: "SYSTEM",
    });

    return NextResponse.json({ success: true, staff: updatedStaff });
  } catch (error: any) {
    console.error("PUT /api/staff error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update staff." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json(
        { success: false, error: "Managing Partner privileges required to deactivate staff." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Staff ID is required." }, { status: 400 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const res = await pool.query(
      "UPDATE public.users SET is_active = FALSE WHERE id::text = $1 AND firm_id = $2 RETURNING full_name",
      [id, firmId]
    );
    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Staff member not found." }, { status: 404 });
    }

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Managing Partner",
      actorRole: "PARTNER",
      entityName: "Staff Registry",
      action: "DEACTIVATE_STAFF",
      details: `Deactivated staff account ${res.rows[0].full_name}.`,
      category: "SECURITY",
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("DELETE /api/staff error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to deactivate staff." }, { status: 500 });
  }
}
