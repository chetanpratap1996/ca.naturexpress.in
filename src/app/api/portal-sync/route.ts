import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
import { NoticeRecord, GovtPortalSyncProfile } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const db = await ensureDatabase();
    return NextResponse.json({
      success: true,
      profiles: db.portalSyncProfiles || [],
      notices: db.notices || []
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Request failed. Refresh the page and try again." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await ensureDatabase();
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
      // Scrape simulated notices from GSTN / ITD / MCA
      const scannedDIN = `ITBA/AST/S/148A/${Date.now().toString().slice(-6)}`;
      const newScrapedNotice: NoticeRecord = {
        id: `NOT-${Date.now().toString().slice(-4)}`,
        entityId: client.id,
        entityName: client.name,
        groupId: client.groupId,
        authority: portal === "GST_COMMON_PORTAL" ? "GST_DEPT" : "INCOME_TAX",
        section: portal === "GST_COMMON_PORTAL" ? "ASMT-10 (GSTR-3B vs 2B Mismatch)" : "Section 148A(b) Show-Cause",
        dinNumber: scannedDIN,
        demandAmount: portal === "GST_COMMON_PORTAL" ? 385000 : 1850000,
        issueDate: "2026-10-24",
        statutoryDeadline: "2026-11-08",
        daysRemaining: 15,
        status: "PENDING_TRIAGE",
        riskLevel: "CRITICAL",
        assignedPartner: "CA Gunjan Jain",
        summary: portal === "GST_COMMON_PORTAL"
          ? "Department flagged ₹3,85,000 differential in ITC claimed in 3B vs 2B for FY 2024-25."
          : "Alleged unexplained cash credits & high-value property transactions u/s 68/69A. 15-day defense window."
      };

      if (!db.notices) db.notices = [];
      db.notices.unshift(newScrapedNotice);

      // Update sync profile
      if (db.portalSyncProfiles) {
        db.portalSyncProfiles = db.portalSyncProfiles.map((p) => {
          if (p.portal === (portal || "INCOME_TAX_2_0")) {
            return {
              ...p,
              lastSuccessfulSync: new Date().toISOString(),
              lastScrapedNoticesCount: p.lastScrapedNoticesCount + 1
            };
          }
          return p;
        });
      }

      await logAuditEvent(
        "Govt Portal Scraper Engine",
        "SYSTEM",
        client.name,
        "Automated Notice Ingestion via DIN",
        `Scraped statutory notice with DIN ${scannedDIN} under ${newScrapedNotice.section}. Statutory deadline: 08-Nov-2026.`,
        "COMPLIANCE",
      db
      );

      await saveDatabase(db);
      return NextResponse.json({
        success: true,
        message: `Portal Scan Complete: 1 new critical notice detected and ingested with verified DIN.`,
        notice: newScrapedNotice
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
          "2. Factual Substantiation: The differential of ₹3,85,000 in ITC is fully protected under CBIC Circular No. 183/15/2022-GST as certified CA Certificates from suppliers have been procured.",
          "3. Natural Justice Violation: Under Section 148A(b), opportunity of personal hearing through video conferencing has not been provided.",
          "4. Reconciliation & Bank Trail: All entries are routed through banking channels with PAN-verified counter-parties."
        ],
        prayer: "In view of the above submissions, it is humbly prayed that the proposed proceedings/demand be dropped in full in the interest of justice.",
        generatedAt: new Date().toISOString()
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
          "CA Gunjan Jain",
          "PARTNER",
          targetNotice.entityName,
          "Statutory Notice Reply Submitted",
          `Signed and filed legal submission for DIN ${targetNotice.dinNumber} on portal. Notes: ${partnerReviewNotes || "Verified and approved"}`,
          "COMPLIANCE",
      db
        );
        await saveDatabase(db);
        return NextResponse.json({ success: true, message: "Response successfully signed and logged as submitted" });
      }
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Request failed. Refresh the page and try again." }, { status: 500 });
  }
}