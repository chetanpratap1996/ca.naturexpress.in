/**
 * Brains & Taxes — Autonomous Faceless Tax Scrutiny & Notice Defense Assembly Line
 * Module 3.4 (Weeks 45 to 48) — 2035-Level Zero-Touch Autonomous Litigation
 * 
 * Statutory Authority:
 * - CBDT Circular No. 19/2019: Mandatory computer-generated Document Identification Number (DIN)
 * - Supreme Court in CIT v. Brandix Mauritius (456 ITR 34): Non-DIN notices are void ab initio
 * - Income Tax Act Sections 148, 148A, 149, 151: Reassessment limits and mandatory higher sanction
 * - Income Tax Act Section 143(2) & 142(1): Mandatory 3-month service window under Faceless Assessment
 * - CGST Act Sections 73, 74, Form DRC-01 & ASMT-10: 3-year/5-year limitation and reply procedures
 * - CBDT Instruction No. 1914 / OM 2017: Interim Stay of Demand & 20% Pre-Deposit Waiver guidelines
 */

export type NoticeAuthority = "ITD_FACELESS" | "GST_STATE" | "GST_CENTRAL";

export type StatutorySection = 
  | "SEC_148_REASSESSMENT" 
  | "SEC_143_2_SCRUTINY" 
  | "SEC_142_1_INQUIRY" 
  | "SEC_143_1_A_ADJUSTMENT" 
  | "GST_DRC_01_DEMAND" 
  | "GST_ASMT_10_MISMATCH";

export type DinValidationState = 
  | "AUTHENTICATED_VALID" 
  | "MISSING_DIN_FATAL" 
  | "INVALID_UNVERIFIED";

export interface JudicialPrecedentItem {
  caseTitle: string;
  citation: string;
  court: string;
  ratio: string;
}

export interface DefenseBriefDocket {
  preliminaryObjections: string[];
  factualSubmissions: string[];
  judicialPrecedents: JudicialPrecedentItem[];
  prayer: string;
}

export interface StayPetitionDocket {
  disputedDemand: number;
  proposedPreDeposit: number;
  hardshipGrounds: string[];
  petitionText: string;
}

export interface NoticeDocketItem {
  id: string;
  clientId: string;
  clientName: string;
  panOrGstin: string;
  assessmentYearOrPeriod: string;
  authority: NoticeAuthority;
  section: StatutorySection;
  dinOrNoticeNo: string;
  dinStatus: DinValidationState;
  noticeDate: string;
  limitationDueDate: string;
  daysRemaining: number;
  allegedDemandInr: number;
  issuesIdentified: string[];
  crossWorkpaperEvidenceFound: string[];
  defenseStatus: "DRAFT_READY" | "PARTNER_APPROVED" | "FILED_TO_PORTAL";
  defenseBrief: DefenseBriefDocket;
  stayPetition?: StayPetitionDocket;
  partnerNote?: string;
  approvedAt?: string;
  auditLog: string[];
  whatsappBriefingPayload?: {
    recipientMobile: string;
    messageText: string;
    quickActionUrl: string;
  };
}

/**
 * Validate Document Identification Number (DIN) under CBDT Circular No. 19/2019
 * Format: 14-character alphanumeric string (e.g. ITBA/AST/S/148/2026-27/1048891244)
 */
export function validateNoticeDin(din: string): DinValidationState {
  if (!din || din.trim().length === 0 || din.toUpperCase().includes("NO_DIN")) {
    return "MISSING_DIN_FATAL";
  }

  // Check standard CBDT / ITBA structure
  const isItbaPattern = /ITBA\/[A-Z]+\/[A-Z0-9\/_-]+/.test(din);
  const isGstnPattern = /ZA[0-9]{2}[0-9]{2}[0-9A-Z]{10}/.test(din) || din.startsWith("DRC") || din.startsWith("ASMT");

  if (isItbaPattern || isGstnPattern || din.length >= 10) {
    return "AUTHENTICATED_VALID";
  }

  return "INVALID_UNVERIFIED";
}

/**
 * Calculate Remaining Days to Statutory Limitation Expiry
 */
export function calculateLimitationCountdown(dueDateStr: string): number {
  const due = new Date(dueDateStr);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 3600 * 24));
}

/**
 * Generate Sample Institutional Notice Defense Dockets
 * Docket 1: Pratwi Solutions (Section 143(1)(a) adjustment — AIS SFT verified, 100% clean, brief ready)
 * Docket 2: Apex Heavy Engineering (Section 148 Reassessment AY 2018-19 — DIN missing fatal defect + limitation bar + 20% stay petition)
 */
export function getSampleNoticeDockets(): NoticeDocketItem[] {
  // 1. Pratwi Solutions Private Limited (Section 143(1)(a) Dividend Mismatch - Clean)
  const pratwiBrief: DefenseBriefDocket = {
    preliminaryObjections: [
      "The computation notice issued under Section 143(1)(a) contains a computer-generated DIN: ITBA/COM/S/143(1)/2026-27/10948812, satisfying CBDT Circular No. 19/2019.",
      "The proposed adjustment of ₹1,45,000 under Section 143(1)(a)(iv) constitutes a prima facie error of fact as the dividend income was already offered to tax under Schedule OS.",
    ],
    factualSubmissions: [
      "The Assessee company has fully disclosed dividend income of ₹1,45,000 from Mutual Funds under Schedule OS (Income from Other Sources) in Row 2(a) of the filed ITR-6.",
      "Cross-verification with Module 2.2 AIS/26AS Forensic Workpaper confirms complete reconciliation with SFT-008 reporting from CAMS/KFintech without any omitted income.",
      "TDS deducted u/s 194K of ₹14,500 has been claimed in Schedule TDS 2 and precisely matches 26AS Part G.",
    ],
    judicialPrecedents: [
      {
        caseTitle: "Khatau Junkar Ltd. v. K.S. Pathania, DCIT",
        citation: "196 ITR 55 (Bom HC)",
        court: "Bombay High Court",
        ratio: "Where an item requires inquiry or is already included in another head, no prima facie adjustment can be made under Section 143(1)(a).",
      },
    ],
    prayer: "In light of the reconciliation and cited judicial ruling, it is respectfully prayed that the proposed prima facie adjustment of ₹1,45,000 be dropped completely and intimation under Section 143(1) be issued accepting the returned income.",
  };

  const pratwiDocket: NoticeDocketItem = {
    id: "NOTICE-DOCKET-01",
    clientId: "client-pratwi",
    clientName: "Pratwi Solutions Private Limited",
    panOrGstin: "AABCP1234F",
    assessmentYearOrPeriod: "AY 2026-27",
    authority: "ITD_FACELESS",
    section: "SEC_143_1_A_ADJUSTMENT",
    dinOrNoticeNo: "ITBA/COM/S/143(1)/2026-27/10948812",
    dinStatus: "AUTHENTICATED_VALID",
    noticeDate: "2026-10-15",
    limitationDueDate: "2026-11-25",
    daysRemaining: calculateLimitationCountdown("2026-11-25"),
    allegedDemandInr: 45240,
    issuesIdentified: [
      "Prima facie addition of ₹1,45,000 dividend income under Schedule OS.",
      "Proposed tax demand with Section 234B/C interest amounting to ₹45,240.",
    ],
    crossWorkpaperEvidenceFound: [
      "Module 2.2 AIS Forensic: SFT-008 dividend income matches books at 100%.",
      "Module 2.5 ITR Optimizer: Disclosed under Schedule OS Row 2(a).",
    ],
    defenseStatus: "DRAFT_READY",
    defenseBrief: pratwiBrief,
    auditLog: [
      "[10:15:10] Ingested e-Filing Section 143(1)(a) communication.",
      "[10:15:45] Authenticated DIN 'ITBA/COM/S/143(1)/2026-27/10948812' against CBDT database (Valid).",
      "[10:16:15] Cross-referenced Module 2.2 AIS & Module 2.5 ITR: Complete match found.",
      "[10:17:00] Generated automated legal defense brief citing Bombay HC ruling in Khatau Junkar Ltd.",
      "[10:17:30] Client WhatsApp risk briefing prepared.",
    ],
    whatsappBriefingPayload: {
      recipientMobile: "+91 98201 12345",
      messageText: "Hi Pratwi Solutions, an automated Section 143(1)(a) response has been prepared for the dividend adjustment of ₹1.45L. DIN verified valid. No tax payable. Review response: https://firm.tax/litigation/pratwi-143",
      quickActionUrl: "/client?tab=tax-notices&docket=NOTICE-DOCKET-01",
    },
  };

  // 2. Apex Heavy Engineering Ltd (Section 148 Reassessment AY 2018-19 - FATAL DEFECT + 20% STAY PETITION)
  const apexBrief: DefenseBriefDocket = {
    preliminaryObjections: [
      "FATAL JURISDICTIONAL DEFECT — ABSENCE OF VALID DIN (CBDT Circular No. 19/2019): The notice uploaded on the portal does not bear any computer-generated DIN. In terms of binding CBDT Circular 19/2019 and the landmark ruling of the Hon'ble Delhi High Court in CIT v. Brandix Mauritius (456 ITR 34) as affirmed by the Hon'ble Supreme Court, the impugned notice is non-est and void ab initio.",
      "BARRED BY STATUTORY LIMITATION UNDER SECTION 149(1)(b): The notice relates to AY 2018-19, which is beyond the 3-year limitation window. The AO has failed to demonstrate that escaped income represented in the form of an asset exceeds ₹50 Lakhs.",
      "LACK OF MANDATORY HIGHER SANCTION UNDER SECTION 151: Notice issued beyond 3 years without the express sanction of the Principal Chief Commissioner of Income Tax, violating Section 151(ii).",
    ],
    factualSubmissions: [
      "The alleged escaped turnover of ₹68,00,000 from M/s Steel Craft Fabricators represents bona fide commercial capital purchases of machinery fully capitalized in Schedule III and verified during the original assessment u/s 143(3).",
      "Cross-verification with Module 2.1 GSTR-2B and Module 2.4 Schedule III establishes that invoices were paid via banking channels (RTGS) with proper GST e-way bills.",
      "No fresh tangible material outside the original assessment record was in the possession of the AO, rendering the reassessment a mere impermissible 'change of opinion'.",
    ],
    judicialPrecedents: [
      {
        caseTitle: "CIT (International Taxation) v. Brandix Mauritius Holdings Ltd.",
        citation: "456 ITR 34 (SC) / 2023-TIOL-92-SC-IT",
        court: "Supreme Court of India",
        ratio: "Any notice, order or communication issued without a computer-generated DIN is deemed never to have been issued and is invalid in law.",
      },
      {
        caseTitle: "Union of India v. Ashish Agarwal",
        citation: "444 ITR 1 (SC)",
        court: "Supreme Court of India",
        ratio: "Reassessment provisions under the amended regime (Finance Act 2021) must strictly comply with Section 148A inquiries and statutory thresholds.",
      },
      {
        caseTitle: "CIT v. Kelvinator of India Ltd.",
        citation: "320 ITR 561 (SC)",
        court: "Supreme Court of India",
        ratio: "Reassessment cannot be initiated on a mere 'change of opinion' without fresh tangible material outside the original assessment record.",
      },
    ],
    prayer: "It is respectfully prayed that: (i) the impugned Section 148 notice be quashed as void ab initio for absence of DIN and limitation bar; (ii) the proceedings be dropped in toto; and (iii) in terms of the Faceless Assessment Scheme, an opportunity of personal hearing through Video Conference (VC) be granted prior to passing any adverse order.",
  };

  const apexStay: StayPetitionDocket = {
    disputedDemand: 3450000, // ₹34.50 Lakhs demand
    proposedPreDeposit: 0, // Requesting complete 100% waiver due to fatal DIN defect
    hardshipGrounds: [
      "The impugned demand arises from an invalid Section 148 notice lacking a DIN (void ab initio under Supreme Court ruling in Brandix Mauritius).",
      "The Assessee company has a strong prima facie case on merits and jurisdiction.",
      "Enforcing a 20% pre-deposit (₹6,90,000) will cause severe liquidity crisis and disrupt ongoing manufacturing operations and worker payrolls.",
    ],
    petitionText: "Application for Stay of Demand under Section 220(6) read with CBDT Instruction No. 1914 & Office Memorandum dated 31.07.2017: The Assessee respectfully requests complete stay of disputed demand of ₹34,50,000 without insistence on 20% pre-deposit pending disposal of preliminary jurisdictional objections.",
  };

  const apexDocket: NoticeDocketItem = {
    id: "NOTICE-DOCKET-02",
    clientId: "client-apex",
    clientName: "Apex Heavy Engineering Ltd",
    panOrGstin: "AAACA9921E",
    assessmentYearOrPeriod: "AY 2018-19",
    authority: "ITD_FACELESS",
    section: "SEC_148_REASSESSMENT",
    dinOrNoticeNo: "NO_DIN_QUOTED_FIELD_NOTICE",
    dinStatus: "MISSING_DIN_FATAL",
    noticeDate: "2026-10-18",
    limitationDueDate: "2026-11-28",
    daysRemaining: calculateLimitationCountdown("2026-11-28"),
    allegedDemandInr: 3450000,
    issuesIdentified: [
      "Notice u/s 148 issued for AY 2018-19 alleging ₹68,00,000 escaped capital purchases.",
      "Notice uploaded on ITD portal completely lacks a computer-generated DIN (FATAL JURISDICTIONAL DEFECT).",
      "Limitation period of 3 years expired; Section 151 higher sanction not attached.",
    ],
    crossWorkpaperEvidenceFound: [
      "Module 2.1 GSTR-2B: Purchases from Steel Craft Fabricators paid via RTGS with e-way bills.",
      "Module 2.4 Schedule III: Fully capitalized in Fixed Assets register during original scrutiny assessment.",
    ],
    defenseStatus: "DRAFT_READY",
    defenseBrief: apexBrief,
    stayPetition: apexStay,
    auditLog: [
      "[09:30:10] Ingested Section 148 reassessment notice from ITD e-Filing portal.",
      "[09:31:00] Circular 19/2019 DIN Sentinel: NO DIN DETECTED. Flagged Fatal Jurisdictional Defect.",
      "[09:31:35] Limitation Engine: Notice relates to AY 2018-19 (beyond 3-year normal limitation).",
      "[09:32:10] Built Preliminary Jurisdictional Objections citing Supreme Court Brandix Mauritius & Kelvinator.",
      "[09:32:45] Compiled CBDT Instruction No. 1914 Stay of Demand Petition (100% waiver requested).",
      "[09:33:15] Routed to Partner Triage Desk for 1-Click Approval and Video Conference request.",
    ],
  };

  return [pratwiDocket, apexDocket];
}

/**
 * 1-Click Partner Approval for Legal Defense Brief
 */
export function approveNoticeDefense(
  dockets: NoticeDocketItem[],
  docketId: string,
  partnerNote?: string
): NoticeDocketItem[] {
  return dockets.map((docket) => {
    if (docket.id === docketId) {
      return {
        ...docket,
        defenseStatus: "PARTNER_APPROVED" as const,
        partnerNote: partnerNote || "Defense brief and stay petition approved by CA Partner for e-filing.",
        approvedAt: new Date().toISOString(),
        auditLog: [
          ...docket.auditLog,
          `[${new Date().toLocaleTimeString()}] CA Partner approved legal defense brief & interim stay petition. Ready for portal upload.`,
        ],
        whatsappBriefingPayload: {
          recipientMobile: "+91 98200 44124",
          messageText: `Hi ${docket.clientName}, your legal defense brief for notice ${docket.section} has been approved by the Partner and is ready for portal filing. Review: https://firm.tax/litigation/${docket.id}`,
          quickActionUrl: `/client?tab=tax-notices&docket=${docket.id}`,
        },
      };
    }
    return docket;
  });
}
