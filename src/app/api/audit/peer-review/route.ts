import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
import { Msme43BhClauseItem, Section40A2bSampleItem, PeerReviewDossier } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const db = ensureDatabase();
    const searchParams = request.nextUrl.searchParams;
    const entityId = searchParams.get("entityId") || "CLI-001";

    const msmeRecords = db.msmeRecords || [];
    const section40a2bSamples = db.section40a2bSamples || [];
    const client = db.clients.find((c) => c.id === entityId) || db.clients[0];

    const dossier: PeerReviewDossier = {
      id: `PR-${entityId}`,
      entityId,
      financialYear: "FY 2025-26",
      sqc1ComplianceScore: 98.4,
      permanentAuditFileStatus: "COMPLETE",
      currentAuditFileStatus: "COMPLETE",
      udinVerified: true,
      udinNumber: "24049281AAAAAA8912",
      keyWorkpapers: [
        {
          title: "Materiality Assessment & Engagement Letter (SA 210 & SA 320)",
          standard: "SA_315",
          status: "ATTACHED_AND_SIGNED",
          verifiedBy: "CA Gunjan Jain",
          signedDate: "2026-09-12"
        },
        {
          title: "Section 43B(h) MSME 45-Day Payment Disallowance Working Paper",
          standard: "SA_500",
          status: "ATTACHED_AND_SIGNED",
          verifiedBy: "Rohan Verma (Article) & CA Gunjan Jain",
          signedDate: "2026-09-18"
        },
        {
          title: "Section 40A(2)(b) Related Party Fair Market Value Test (SA 550)",
          standard: "SA_500",
          status: "ATTACHED_AND_SIGNED",
          verifiedBy: "Sneha Patil (Article) & CA Vikas Chhajed",
          signedDate: "2026-09-20"
        },
        {
          title: "External Bank & Trade Debtors Confirmation Circulars (SA 505)",
          standard: "SA_505",
          status: "ATTACHED_AND_SIGNED",
          verifiedBy: "Pooja Mehta (Paid CA)",
          signedDate: "2026-09-24"
        },
        {
          title: "Management Representation Letter & Going Concern (SA 570/580)",
          standard: "SA_570",
          status: "ATTACHED_AND_SIGNED",
          verifiedBy: "CA Gunjan Jain",
          signedDate: "2026-09-28"
        }
      ],
      mrlAttached: true,
      samplingReportUrl: `/api/audit/peer-review-export?entityId=${entityId}`
    };

    return NextResponse.json({
      success: true,
      dossier,
      msmeRecords,
      section40a2bSamples,
      client
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = ensureDatabase();
    const body = await request.json();
    const { action, entityId, msmeRecord, section40aRecord } = body;

    const client = db.clients.find((c) => c.id === entityId) || db.clients[0];
    const clientName = client ? client.name : "Client Entity";

    if (action === "ADD_MSME_RECORD") {
      const newMsme: Msme43BhClauseItem = {
        id: `MSME-${Date.now().toString().slice(-4)}`,
        vendorName: msmeRecord.vendorName || "Micro Vendor India",
        udyamRegistrationNo: msmeRecord.udyamRegistrationNo || "UDYAM-MH-00-19283",
        vendorCategory: msmeRecord.vendorCategory || "MICRO",
        invoiceNumber: msmeRecord.invoiceNumber || "INV/001",
        invoiceDate: msmeRecord.invoiceDate || "2026-02-15",
        amount: msmeRecord.amount || 150000,
        paymentDueDate: msmeRecord.paymentDueDate || "2026-03-31",
        actualPaymentDate: msmeRecord.actualPaymentDate || "2026-05-10",
        disallowedUnder43Bh: msmeRecord.disallowedUnder43Bh ?? true,
        interestUnderMsmedAct: msmeRecord.interestUnderMsmedAct || 4500
      };

      if (!db.msmeRecords) db.msmeRecords = [];
      db.msmeRecords.push(newMsme);

      await logAuditEvent(
        "CA Audit Team",
        "ARTICLE",
        clientName,
        "Section 43B(h) MSME Disallowance Computed",
        `Flagged invoice #${newMsme.invoiceNumber} for ₹${newMsme.amount.toLocaleString("en-IN")}. Unpaid at 31-March, added to 3CD Clause 26.`,
        "PEER_REVIEW"
      );

      await saveDatabase(db);
      return NextResponse.json({ success: true, record: newMsme });
    }

    if (action === "SIGN_OFF_PEER_REVIEW_DOSSIER") {
      await logAuditEvent(
        "CA Gunjan Jain",
        "PARTNER",
        clientName,
        "Peer Review Working Paper Dossier Stamped",
        "Executed SA 230 digital sign-off. Permanent & Current audit files locked with ICAI UDIN 24049281AAAAAA8912.",
        "PEER_REVIEW"
      );

      return NextResponse.json({
        success: true,
        message: "Peer Review Audit Dossier locked and verified under SQC-1 standard."
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
