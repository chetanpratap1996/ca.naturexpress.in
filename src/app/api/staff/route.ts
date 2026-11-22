import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
import { StaffMember, CompetencyTier, StaffRole, StaffSpecialization } from "@/lib/types";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { hashSecret, normalizePhone10 } from "@/lib/auth/enterpriseAuth";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const db = ensureDatabase();
    const staffList = db.staff || [];
    const tasks = db.tasks || [];

    // Calculate real-time active open tasks per staff
    const enrichedStaff = staffList.map((member) => {
      const openTasks = tasks.filter(
        (t) =>
          t.status !== "FILED_AND_COMPLETED" &&
          (t.assignedTo === member.fullName ||
            (t.assignedTo && t.assignedTo.includes(member.fullName.split(" ")[0])))
      );

      const completedThisMonth = tasks.filter(
        (t) =>
          t.status === "FILED_AND_COMPLETED" &&
          (t.assignedTo === member.fullName ||
            (t.assignedTo && t.assignedTo.includes(member.fullName.split(" ")[0])))
      );

      return {
        ...member,
        activeOpenTasksCount: openTasks.length,
        completedTasksThisMonth: completedThisMonth.length,
        capacityUtilizationPct: Math.min(
          100,
          Math.round((openTasks.length / (member.maxDailyTaskCapacity || 10)) * 100)
        ),
      };
    });

    return NextResponse.json({ success: true, staff: enrichedStaff });
  } catch (error: any) {
    console.error("GET /api/staff error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
    const { fullName, email, phone, role, competencyTier, specializations, maxDailyTaskCapacity, icaiRegistrationNo } = body;

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json({ success: false, error: "Full Name is required." }, { status: 400 });
    }

    const cleanPhone = normalizePhone10(phone || "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      return NextResponse.json({ success: false, error: "A valid 10-digit mobile number is required." }, { status: 400 });
    }

    const db = ensureDatabase();
    if (!db.staff) db.staff = [];

    // Check duplicate phone or email
    const duplicate = db.staff.find(
      (s) =>
        normalizePhone10(s.phone) === cleanPhone ||
        (s.email && email && s.email.toLowerCase() === email.trim().toLowerCase())
    );

    if (duplicate) {
      return NextResponse.json(
        { success: false, error: `A staff member already exists with phone +91 ${cleanPhone} or email.` },
        { status: 409 }
      );
    }

    const defaultPin = cleanPhone.slice(-4);
    const { hash, salt } = hashSecret(defaultPin);

    const newStaff: StaffMember = {
      id: `STF-${Date.now().toString().slice(-6)}`,
      firmId: "FRM-024310C",
      fullName: fullName.trim(),
      email: (email || `${fullName.toLowerCase().replace(/[^a-z0-9]/g, "")}@brainsandtaxes.com`).trim(),
      phone: `+91 ${cleanPhone}`,
      icaiRegistrationNo: icaiRegistrationNo ? icaiRegistrationNo.trim() : undefined,
      role: (role as StaffRole) || "ARTICLE_TRAINEE",
      competencyTier: (Number(competencyTier) as CompetencyTier) || 2,
      specializations: Array.isArray(specializations) && specializations.length > 0 ? specializations : ["GST", "INCOME_TAX"],
      maxDailyTaskCapacity: Number(maxDailyTaskCapacity) || (Number(competencyTier) === 1 ? 8 : Number(competencyTier) === 2 ? 12 : 16),
      status: "ACTIVE",
      pinHash: hash,
      pinSalt: salt,
      tempPin: defaultPin,
      joinedDate: new Date().toISOString().split("T")[0],
      activeOpenTasksCount: 0,
      completedTasksThisMonth: 0,
      averageVelocityMinutes: 60,
    };

    db.staff.push(newStaff);
    await saveDatabase(db);

    await logAuditEvent(
      auth.userName || "Managing Partner",
      "PARTNER",
      "Staff Registry",
      "ADD_STAFF",
      `Added new staff member ${newStaff.fullName} (${newStaff.role}, Tier ${newStaff.competencyTier}) with default PIN: ${defaultPin}.`,
      "SYSTEM"
    );

    return NextResponse.json({ success: true, staff: newStaff });
  } catch (error: any) {
    console.error("POST /api/staff error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
    const { id, fullName, role, competencyTier, specializations, maxDailyTaskCapacity, status, phone, email, icaiRegistrationNo, tempPin } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Staff ID is required." }, { status: 400 });
    }

    const db = ensureDatabase();
    if (!db.staff) db.staff = [];

    const index = db.staff.findIndex((s) => s.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: "Staff member not found." }, { status: 404 });
    }

    const existing = db.staff[index];

    if (fullName) existing.fullName = fullName.trim();
    if (role) existing.role = role as StaffRole;
    if (competencyTier) existing.competencyTier = Number(competencyTier) as CompetencyTier;
    if (Array.isArray(specializations)) existing.specializations = specializations;
    if (maxDailyTaskCapacity) existing.maxDailyTaskCapacity = Number(maxDailyTaskCapacity);
    if (status) existing.status = status;
    if (email) existing.email = email.trim();
    if (icaiRegistrationNo !== undefined) existing.icaiRegistrationNo = icaiRegistrationNo.trim();
    if (phone) {
      const cleanPhone = normalizePhone10(phone);
      if (cleanPhone.length === 10) existing.phone = `+91 ${cleanPhone}`;
    }
    if (tempPin && tempPin.length === 4) {
      existing.tempPin = tempPin;
      const { hash, salt } = hashSecret(tempPin);
      existing.pinHash = hash;
      existing.pinSalt = salt;
    }

    db.staff[index] = existing;
    await saveDatabase(db);

    return NextResponse.json({ success: true, staff: existing });
  } catch (error: any) {
    console.error("PUT /api/staff error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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

    const db = ensureDatabase();
    if (!db.staff) db.staff = [];

    const index = db.staff.findIndex((s) => s.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: "Staff member not found." }, { status: 404 });
    }

    // Set to DEACTIVATED rather than hard delete so historical audit trail remains intact
    db.staff[index].status = "DEACTIVATED";
    await saveDatabase(db);

    return NextResponse.json({ success: true, message: `Staff member ${db.staff[index].fullName} has been deactivated.` });
  } catch (error: any) {
    console.error("DELETE /api/staff error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
