import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { LeadStore } from "@/lib/intelligence/store/leadStore";

import { authenticateServerRequest } from "@/lib/auth/serverAuth";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), ".data");
const CONSULTATIONS_FILE = path.join(DATA_DIR, "consultations.json");

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readConsultations(): any[] {
  try {
    ensureDirectoryExists();
    if (fs.existsSync(CONSULTATIONS_FILE)) {
      const data = fs.readFileSync(CONSULTATIONS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Could not read consultations file:", e);
  }
  return [];
}

function writeConsultations(list: any[]) {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(CONSULTATIONS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not write consultations file:", e);
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json(
        { success: false, error: "Firm staff authorization required." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }
    const consultations = readConsultations();
    return NextResponse.json({
      success: true,
      count: consultations.length,
      consultations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch consultations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const clientName = body.name?.trim() || "Prospective Client";
    const phone = body.phone?.trim() || "";
    const email = body.email?.trim() || "";
    const companyName = body.companyName?.trim() || "Corporate Entity";
    const service = body.service || "Corporate Statutory & Tax Audit";
    const meetingType = body.meetingType || "in-person";
    const preferredDate = body.preferredDate || "";
    const preferredTime = body.preferredTime || "11:30 AM";
    const gstin = body.gstin?.trim()?.toUpperCase() || undefined;
    const notes = body.notes?.trim() || "";
    const estimatedExposure = body.estimatedExposure || undefined;
    const riskScore = body.riskScore || undefined;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Contact phone number is strictly required." },
        { status: 400 }
      );
    }

    const consultationId = `BT-CONSULT-${Date.now().toString(36).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const consultationRecord = {
      id: consultationId,
      timestamp,
      clientName,
      companyName,
      gstin,
      phone,
      email,
      service,
      meetingType,
      preferredDate: preferredDate || "Earliest Available",
      preferredTime,
      notes,
      estimatedExposure,
      riskScore,
      status: "NEW_CONFIRMED",
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      source: "https://ca.naturexpress.in/brainsandtaxes",
    };

    // 1. Persist directly to dedicated consultations ledger file
    try {
      const existing = readConsultations();
      existing.unshift(consultationRecord);
      writeConsultations(existing);
    } catch (fsErr) {
      console.warn("Notice: Consultations JSON write error:", fsErr);
    }

    // 2. Persist to Practice Growth Intelligence LeadStore
    try {
      await LeadStore.upsertLead({
        id: `lead_${consultationId}`,
        firmId: "gpa_brainsandtaxes",
        gstin: gstin,
        legalName: companyName,
        tradeName: companyName,
        companyType: "PVT_LTD",
        incorporationDate: new Date().toISOString().split("T")[0],
        authorizedCapitalInr: 5000000,
        paidUpCapitalInr: 2500000,
        state: "Madhya Pradesh",
        stateCode: "MP",
        rocJurisdiction: "ROC Gwalior",
        city: "Indore",
        pincode: "452001",
        registeredAddress: "Address on MCA / GSTN Record",
        phone: phone,
        email: email,
        directors: [{ din: "00000000", name: clientName, designation: "Director", appointmentDate: "2020-01-01" }],
        chargesRegistered: [],
        proof: {
          registrySource: "MANUAL_IMPORT",
          verifiedAt: timestamp,
          accuracyScore: 1000,
          sourceUrl: "https://ca.naturexpress.in/brainsandtaxes",
          rawHash: `consult_${Date.now()}`,
          evidenceSummary: "Self-initiated consultation booking from Brains & Taxes landing page.",
        },
        painPoints: [
          {
            id: `pain_${Date.now()}`,
            ruleCode: "CONSULTATION_REQUEST",
            serviceTrack: "SME_RETAINER_VCFO",
            severity: "HIGH",
            title: `Landing Page Appointment: ${service}`,
            legalBasis: "Client Self-Initiated Consultation",
            daysRemaining: 2,
            statutoryDeadline: preferredDate || "2026-03-31",
            penaltyInr: riskScore ? Number(riskScore) : 0,
            commercialImpact: "Statutory notice or audit deadline requiring partner review.",
            actionPlan: "Conduct initial diagnostic conference with Managing Partner CA Gunjan Jain."
          }
        ],
        totalPenaltyExposureInr: riskScore ? Number(riskScore) : 0,
        highestSeverity: "HIGH",
        primaryTrack: "SME_RETAINER_VCFO",
        stage: "DISCOVERED",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    } catch (storeErr) {
      console.warn("Notice: LeadStore write note:", storeErr);
    }

    return NextResponse.json({
      success: true,
      consultationId,
      message: "Consultation request successfully logged with Brains & Taxes executive desk.",
      appointmentDetails: consultationRecord,
    });
  } catch (error: any) {
    console.error("Consultation booking error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process consultation request" },
      { status: 500 }
    );
  }
}
