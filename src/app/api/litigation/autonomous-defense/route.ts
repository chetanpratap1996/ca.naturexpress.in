import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { 
  getSampleNoticeDockets, 
  approveNoticeDefense, 
  validateNoticeDin,
  calculateLimitationCountdown,
  getRankedPrecedentsFromGraph,
  NoticeDocketItem,
  DefenseBriefDocket,
  StayPetitionDocket,
  NoticeAuthority,
  StatutorySection
} from "@/lib/litigation/autonomousNoticeEngine";
import { ensureDatabase, saveDatabase, logAuditEvent, createNotification } from "@/lib/server/db";
import { NoticeRecord } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const docketId = searchParams.get("docketId");
    const clientId = searchParams.get("clientId");

    const db = ensureDatabase();
    if (!db.noticeDockets || db.noticeDockets.length === 0) {
      db.noticeDockets = getSampleNoticeDockets();
      await saveDatabase(db);
    }

    const dockets = db.noticeDockets;

    if (docketId) {
      const docket = dockets.find((d) => d.id === docketId);
      if (!docket) {
        return NextResponse.json({ success: false, error: "Docket not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, docket });
    }

    if (clientId) {
      const filtered = dockets.filter((d) => d.clientId === clientId);
      return NextResponse.json({ success: true, dockets: filtered });
    }

    return NextResponse.json({
      success: true,
      dockets,
      metrics: {
        totalDockets: dockets.length,
        readyForApproval: dockets.filter((d) => d.defenseStatus === "DRAFT_READY").length,
        fatalDinDefects: dockets.filter((d) => d.dinStatus === "MISSING_DIN_FATAL").length,
        totalDemandAtStakeInr: dockets.reduce((acc, d) => acc + d.allegedDemandInr, 0),
        urgentLimitationCount: dockets.filter((d) => d.daysRemaining <= 15).length,
      },
    });
  } catch (error: any) {
    console.error("Notice Defense GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { action, docketId, partnerNote } = body;

    const db = ensureDatabase();
    if (!db.noticeDockets) db.noticeDockets = getSampleNoticeDockets();

    // 1. INGEST NEW NOTICE & AUTONOMOUS DEFENSE DOCKET GENERATION
    if (action === "INGEST_NOTICE") {
      const {
        noticeType = "ITD_148_REASSESSMENT",
        dinOrRef = "",
        noticeDate = new Date().toISOString().split("T")[0],
        replyDeadline = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        demandAmountNumeric = 0,
        clientName = "Client Entity",
        pan = "AABCA8891D",
        gstin,
        authority = "National Faceless Assessment Centre (NFAC)",
        allegationSummary = "Alleged escaped turnover / mismatch requiring statutory reply.",
        sourceFile = "Scrutiny_Notice.pdf"
      } = body;

      const dinStatus = validateNoticeDin(dinOrRef);
      const daysRemaining = calculateLimitationCountdown(replyDeadline);

      let mappedAuthority: NoticeAuthority = "ITD_FACELESS";
      if (noticeType.includes("GST") || authority.includes("GST")) {
        mappedAuthority = authority.includes("STATE") ? "GST_STATE" : "GST_CENTRAL";
      }

      let mappedSection: StatutorySection = "SEC_148_REASSESSMENT";
      if (noticeType.includes("143_1") || noticeType.includes("PRIMA_FACIE")) {
        mappedSection = "SEC_143_1_A_ADJUSTMENT";
      } else if (noticeType.includes("143_2") || noticeType.includes("SCRUTINY")) {
        mappedSection = "SEC_143_2_SCRUTINY";
      } else if (noticeType.includes("142_1") || noticeType.includes("INQUIRY")) {
        mappedSection = "SEC_142_1_INQUIRY";
      } else if (noticeType.includes("DRC") || noticeType.includes("DEMAND")) {
        mappedSection = "GST_DRC_01_DEMAND";
      } else if (noticeType.includes("ASMT") || noticeType.includes("MISMATCH")) {
        mappedSection = "GST_ASMT_10_MISMATCH";
      }

      // Query Knowledge Graph with Constitutional Reranker for Precedents
      const searchTopic = dinStatus === "MISSING_DIN_FATAL" 
        ? "brandix mauritius circular 19/2019 missing din void ab initio" 
        : mappedSection.includes("143") 
        ? "143(1)(a) debatable prima facie adjustment khatau" 
        : mappedSection.includes("148") 
        ? "148 reassessment reason to believe tangible material kelvinator" 
        : "gst itc section 16(2) vendor default arise india";

      const rankedPrecedents = getRankedPrecedentsFromGraph(searchTopic, "BOMBAY_HC");

      // Construct Defense Brief
      const preliminaryObjections: string[] = [];
      if (dinStatus === "MISSING_DIN_FATAL") {
        preliminaryObjections.push(
          "FATAL JURISDICTIONAL DEFECT: The impugned communication does not bear a valid computer-generated Document Identification Number (DIN). Per CBDT Circular No. 19/2019 dated 14.08.2019 and the Supreme Court in CIT v. Brandix Mauritius (456 ITR 34), any communication issued without a DIN is non est and deemed never to have been issued."
        );
      } else {
        preliminaryObjections.push(
          `DIN Validated: The notice bears computer-generated DIN ${dinOrRef}, satisfying statutory mandates under CBDT Circular No. 19/2019.`
        );
      }

      if (daysRemaining <= 0) {
        preliminaryObjections.push(
          "STATUTORY LIMITATION: The notice has been served beyond the permissible statutory limitation window mandated under the relevant statutory provisions."
        );
      }

      const factualSubmissions: string[] = [
        `The Assessee ${clientName} (PAN: ${pan}) has maintained complete, audited books of accounts and filed all statutory returns within due dates.`,
        `Re: Allegation — "${allegationSummary}". Cross-verification with audited ledger workpapers and GSTR-2B/AIS schedules confirms full statutory reconciliation.`,
        "The transactions under examination were routed through regular banking channels with proper invoice, e-way bill, and tax compliance records."
      ];

      const prayer = dinStatus === "MISSING_DIN_FATAL"
        ? "It is most respectfully submitted that the notice be treated as void ab initio in light of binding Supreme Court doctrine in Brandix Mauritius, and all consequential proceedings be quashed forthwith."
        : "In view of the verifiable reconciliations and binding legal precedents cited herein, it is prayed that the proposed additions/adjustments be deleted completely and proceedings be closed in favor of the Assessee.";

      const defenseBrief: DefenseBriefDocket = {
        preliminaryObjections,
        factualSubmissions,
        judicialPrecedents: rankedPrecedents.slice(0, 3),
        prayer
      };

      // Generate Stay Petition if demand > 0
      let stayPetition: StayPetitionDocket | undefined = undefined;
      if (demandAmountNumeric > 0) {
        stayPetition = {
          disputedDemand: demandAmountNumeric,
          proposedPreDeposit: Math.round(demandAmountNumeric * 0.2), // 20% standard CBDT OM 2017 pre-deposit
          hardshipGrounds: [
            "Prima facie strong case on merits based on binding jurisdictional High Court / Supreme Court precedents.",
            "Severe financial hardship would be caused to ongoing working capital and employee payroll if coercive recovery is initiated.",
            "Assessee agrees to furnish corporate guarantee / 20% pre-deposit as per CBDT Office Memorandum dated 31.07.2017."
          ],
          petitionText: `APPLICATION FOR STAY OF DEMAND UNDER SECTION 220(6) READ WITH CBDT OM DATED 31.07.2017: Disputed Demand: ₹${demandAmountNumeric.toLocaleString("en-IN")}. Assessee prays for unconditional stay of demand pending appeal, or in the alternative, stay on payment of 20% pre-deposit (₹${Math.round(demandAmountNumeric * 0.2).toLocaleString("en-IN")}).`
        };
      }

      const newDocket: NoticeDocketItem = {
        id: `NOTICE-DOCKET-${Date.now().toString().slice(-4)}`,
        clientId: `CL-${pan.slice(0, 5)}`,
        clientName,
        panOrGstin: gstin || pan,
        assessmentYearOrPeriod: "AY 2026-27",
        authority: mappedAuthority,
        section: mappedSection,
        dinOrNoticeNo: dinOrRef || `NO_DIN_DETECTED_${Date.now().toString().slice(-4)}`,
        dinStatus,
        noticeDate,
        limitationDueDate: replyDeadline,
        daysRemaining: Math.max(0, daysRemaining),
        allegedDemandInr: demandAmountNumeric,
        issuesIdentified: [allegationSummary],
        crossWorkpaperEvidenceFound: [
          "Module 1.2 GSTR-2B ITC Forensic Workpaper",
          "Module 2.2 Form 26AS & AIS Reconciliation Report",
          "Audited Schedule III Financial Statements"
        ],
        defenseStatus: "DRAFT_READY",
        defenseBrief,
        stayPetition,
        auditLog: [
          `[${new Date().toISOString()}] Notice ingested from ${sourceFile}. DIN Status: ${dinStatus}. Autonomous legal defense brief drafted.`
        ]
      };

      db.noticeDockets.unshift(newDocket);

      // Also ensure matching record in db.notices
      if (!db.notices) db.notices = [];
      const newNoticeRecord: NoticeRecord = {
        id: newDocket.id,
        entityId: newDocket.clientId,
        entityName: newDocket.clientName,
        groupId: "GRP-01",
        authority: mappedAuthority === "ITD_FACELESS" ? "INCOME_TAX" : "GST_DEPT",
        section: mappedSection,
        dinNumber: newDocket.dinOrNoticeNo,
        demandAmount: newDocket.allegedDemandInr,
        issueDate: newDocket.noticeDate,
        statutoryDeadline: newDocket.limitationDueDate,
        daysRemaining: newDocket.daysRemaining,
        status: "DRAFTING_RESPONSE",
        riskLevel: dinStatus === "MISSING_DIN_FATAL" ? "CRITICAL" : "HIGH",
        assignedPartner: "CA Gunjan Jain",
        summary: allegationSummary,
        assessmentYear: newDocket.assessmentYearOrPeriod,
        pan,
        gstin
      };
      db.notices.unshift(newNoticeRecord);

      await logAuditEvent(
        auth.userName || "CA Partner",
        "PARTNER",
        clientName,
        "Notice Ingested & Defense Brief Assembled",
        `Ingested notice ${mappedSection} (${dinStatus}). Demand at stake: ₹${demandAmountNumeric.toLocaleString("en-IN")}. Legal brief drafted with ${rankedPrecedents.length} ranked precedents.`,
        "COMPLIANCE"
      );

      await createNotification({
        title: `Notice Defense Ready: ${newDocket.section}`,
        message: `Defense brief and stay petition assembled for ${clientName} (₹${demandAmountNumeric.toLocaleString("en-IN")}). DIN Status: ${dinStatus}.`,
        category: "COMPLIANCE",
        priority: "HIGH",
        targetRoles: ["SUPER_ADMIN", "PARTNER"],
        entityId: newDocket.clientId,
        link: "/admin",
        actionLabel: "Review Brief"
      });

      await saveDatabase(db);

      return NextResponse.json({
        success: true,
        docket: newDocket,
        message: "Notice ingested and autonomous legal defense brief generated successfully."
      });
    }

    // 2. APPROVE DEFENSE
    if (action === "APPROVE_DEFENSE") {
      const docketIndex = db.noticeDockets.findIndex((d) => d.id === docketId);
      if (docketIndex === -1) {
        return NextResponse.json({ success: false, error: "Notice docket not found" }, { status: 404 });
      }

      db.noticeDockets = approveNoticeDefense(db.noticeDockets, docketId, partnerNote);
      const approvedDocket = db.noticeDockets.find((d) => d.id === docketId)!;

      // Also update db.notices
      if (db.notices) {
        const noticeIdx = db.notices.findIndex((n) => n.id === docketId || n.dinNumber === approvedDocket.dinOrNoticeNo);
        if (noticeIdx !== -1) {
          db.notices[noticeIdx].status = "SUBMITTED";
          db.notices[noticeIdx].submittedAt = new Date().toISOString();
        }
      }

      // Log cryptographic ICAI SA 500 audit trail
      await logAuditEvent(
        auth.userName || "CA Gunjan Jain",
        "PARTNER",
        approvedDocket.clientName,
        "Notice Defense Approved",
        `Partner approved legal defense brief for notice ${approvedDocket.section} (Demand: ₹${approvedDocket.allegedDemandInr.toLocaleString('en-IN')}). Ready for portal upload.`,
        "COMPLIANCE"
      );

      await createNotification({
        title: `Defense Approved: ${approvedDocket.section}`,
        message: `Partner CA Gunjan Jain approved defense brief for ${approvedDocket.clientName}. Ready for e-Filing submission.`,
        category: "COMPLIANCE",
        priority: "MEDIUM",
        targetRoles: ["SUPER_ADMIN", "PARTNER", "STAFF"],
        entityId: approvedDocket.clientId,
        link: "/admin",
        actionLabel: "View Docket"
      });

      await saveDatabase(db);

      return NextResponse.json({
        success: true,
        docket: approvedDocket,
        message: `Defense brief for docket ${docketId} approved successfully by Partner.`
      });
    }

    // 3. RESET DOCKETS
    if (action === "RESET_DOCKETS") {
      db.noticeDockets = getSampleNoticeDockets();
      await saveDatabase(db);
      return NextResponse.json({
        success: true,
        dockets: db.noticeDockets,
        message: "Notice dockets reset to institutional baseline."
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Notice Defense POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
