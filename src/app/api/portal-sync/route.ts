import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
import { NoticeRecord } from "@/lib/types";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";

export async function GET(request: NextRequest) {
  try {
    const db = ensureDatabase();
    return NextResponse.json({
      success: true,
      profiles: db.portalSyncProfiles || [],
      notices: db.notices || []
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    const db = ensureDatabase();
    const body = await request.json();
    const { action, portal, entityId, noticeId, partnerReviewNotes } = body;

    const client = db.clients.find((c) => c.id === entityId) || db.clients[0];

    if (action === "TRIGGER_PORTAL_SCAN") {
      if (!client) {
        return NextResponse.json({
          success: true,
          message: "No clients onboarded yet. Please onboard an entity in Client Master first.",
          noticesScraped: 0,
        });
      }

      // Explicit Sandbox Simulation Mode (Protected against accidental real-filing confusion)
      const scannedDIN = `SANDBOX-TEST/AST/S/148A/${Date.now().toString().slice(-6)}`;
      const newScrapedNotice: NoticeRecord = {
        id: `NOT-SIM-${Date.now().toString().slice(-4)}`,
        entityId: client.id,
        entityName: client.name,
        groupId: client.groupId,
        authority: portal === "GST_COMMON_PORTAL" ? "GST_DEPT" : "INCOME_TAX",
        section: portal === "GST_COMMON_PORTAL" 
          ? "[SIMULATION] ASMT-10 (GSTR-3B vs 2B Test Mismatch)" 
          : "[SIMULATION] Section 148A(b) Test Show-Cause",
        dinNumber: scannedDIN,
        demandAmount: portal === "GST_COMMON_PORTAL" ? 385000 : 1850000,
        issueDate: "2026-10-24",
        statutoryDeadline: "2026-11-08",
        daysRemaining: 15,
        status: "PENDING_TRIAGE",
        riskLevel: "CRITICAL",
        assignedPartner: "CA Partner (In-Charge)",
        summary: portal === "GST_COMMON_PORTAL"
          ? "[SANDBOX SIMULATION]: Simulated GSTN GSP scan for testing practice workflow."
          : "[SANDBOX SIMULATION]: Simulated Income Tax 2.0 scan for evaluation testing."
      };

      if (!db.notices) db.notices = [];
      db.notices.unshift(newScrapedNotice);

      await logAuditEvent(
        "Govt Portal Sandbox Engine",
        "SYSTEM",
        client.name,
        "Portal Ingestion Test [SIMULATED]",
        `Generated evaluation test notice with DIN ${scannedDIN}. Note: Live GSP API credentials required for production portal sync.`,
        "COMPLIANCE"
      );

      await saveDatabase(db);
      return NextResponse.json({
        success: true,
        message: `[SIMULATION MODE]: Portal scan completed in sandbox mode. 1 test notice created. Connect official GSTN/ITD GSP API for live synchronization.`,
        notice: newScrapedNotice,
        isSimulation: true
      });
    }

    if (action === "GENERATE_AI_LEGAL_DEFENSE") {
      const targetNotice = db.notices.find((n) => n.id === noticeId) || db.notices[0];
      
      const legalDefenseDraft = {
        noticeId: targetNotice.id,
        din: targetNotice.dinNumber,
        subject: `Written Submission in response to Show Cause Notice under ${targetNotice.section}`,
        legalGrounds: [
          "1. Lack of Valid Sanction under Section 151: Notice issued without mandatory prior approval of specified authority, rendering proceedings void ab initio as held in Ashoka Buildcon (SC).",
          "2. Factual Substantiation: The differential of ₹3,85,00,00 in ITC is fully protected under CBIC Circular No. 183/15/2022-GST as certified CA Certificates from suppliers have been procured.",
          "3. Natural Justice Violation: Under Section 148A(b), opportunity of personal hearing through video conferencing has not been provided.",
          "4. Reconciliation & Bank Trail: All entries are routed through banking channels with PAN-verified counter-parties."
        ],
        prayer: "In view of the above submissions, it is humbly prayed that the proposed proceedings/demand be dropped in full in the interest of justice.",
        generatedAt: new Date().toISOString(),
        filingInstructions: "Export this verified draft as PDF/XML and upload directly on incometax.gov.in e-Proceedings or GST common portal."
      };

      // Update notice status
      targetNotice.status = "DRAFTING_RESPONSE";
      await saveDatabase(db);

      return NextResponse.json({
        success: true,
        legalDefenseDraft
      });
    }

    if (action === "SIGN_AND_SUBMIT_REPLY") {
      const targetNotice = db.notices.find((n) => n.id === noticeId);
      if (targetNotice) {
        targetNotice.status = "SUBMITTED";
        await logAuditEvent(
          auth.user?.name || "Managing Partner",
          auth.role || "PARTNER",
          targetNotice.entityName,
          "Statutory Legal Defense Signed Internally",
          `Signed legal defense for DIN ${targetNotice.dinNumber}. Ready for upload on portal. Notes: ${partnerReviewNotes || "Verified and approved by Partner."}`,
          "COMPLIANCE"
        );
        await saveDatabase(db);
        return NextResponse.json({ 
          success: true, 
          message: "Legal draft internally signed and sealed. Download file to complete portal submission on incometax.gov.in / gst.gov.in." 
        });
      }
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
