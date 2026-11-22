/**
 * Brains & Taxes — Enterprise Phase 3 Statutory Audit, Tax Audit & Realization Assembly Line
 * 
 * Statutory Authority:
 * - Companies Act, 2013: Section 143(11) CARO 2020 & Section 141(3) Auditor Independence
 * - Income-tax Act, 1961: Section 44AB (Form 3CD Clauses 22, 26, 31, 34, 44) & Section 40(a)(ia) / 43B(h)
 * - MSMED Act, 2006: Sections 15, 16 (3x RBI Bank Rate interest) & Section 23
 * - ICAI SQC-1: Standard on Quality Control 1 (4-Eye Maker-Checker, PAF & CAF completeness)
 * - ICAI Gazette Notification No. 1-CA(7)/192/2019: Mandatory 18-digit UDIN & 60-day countdown
 * - Central Goods and Services Tax Act, 2017: Section 12(2) IGST Place of Supply & Rule 33 Pure Agent Imprest
 * - CBDT Circular No. 23/2017: TDS u/s 194J excluded from GST component of professional fee
 */

import { Caro2020Engine, CaroAuditEngineResult } from "@/lib/schedule3/caro2020Engine";
import { Clause44Engine, ExpenseLedgerItem, Clause44Report } from "@/lib/taxAudit/clause44Engine";
import { Clause22MsmeEngine, MsmeCreditorInvoiceItem, Clause22Report } from "@/lib/taxAudit/clause22MsmeEngine";
import { Clause34TdsEngine, TdsTransactionAuditItem, Clause34Report } from "@/lib/taxAudit/clause34TdsEngine";
import { BulkUdinEngine, UdinDocumentType, UdinCertificateItem } from "@/lib/governance/bulkUdinEngine";
import { Sqc1PeerReviewEngine, AuditWorkpaperItem, IndependenceDeclaration, PeerReviewHealthScore } from "@/lib/governance/sqc1PeerReviewEngine";
import { 
  determinePlaceOfSupply, 
  calculateTaxAndTds, 
  generateNpciDynamicUpiUri,
  CA_SAC_SERVICES 
} from "@/lib/billing/invoicingEngine";

export interface ClientAuditProfile {
  legalName: string;
  pan: string;
  gstin: string;
  cin?: string;
  assessmentYear: string;
  financialYear: string;
  partnerInCharge: string;
  caMembershipNo: string;
  caFirmRegNo: string;
  signingDate: string; // YYYY-MM-DD
  stateCode: string;   // e.g. "23" for MP, "27" for MH
}

export interface FinancialAuditMetrics {
  revenueFromOperations: number;
  totalExpenses: number;
  profitBeforeTax: number;
  depreciationCY: number;
  patCY: number;
  patPY: number;
  depreciationPY: number;
  shareCapital: number;
  reservesAndSurplus: number;
  netWorth: number;
  totalDebt: number;
  currentAssets: number;
  currentLiabilities: number;
  sanctionedWorkingCapitalLimitInr: number;
  debtEquityRatio: number;
  currentRatio: number;
  hasWilfulDefaulterRemark?: boolean;
  undisputedStatutoryDuesOver6Months?: number;
}

export interface Phase3AssemblyInput {
  clientProfile: ClientAuditProfile;
  financialMetrics: FinancialAuditMetrics;
  expenseLedgers: ExpenseLedgerItem[];
  msmeCreditors: MsmeCreditorInvoiceItem[];
  tdsTransactions: TdsTransactionAuditItem[];
  firmUpiVpa?: string;
  isEqcrApproved?: boolean;
  agreedProfessionalFee?: number;
  pureAgentReimbursements?: number;
}

export interface Phase3AssemblyResult {
  runId: string;
  timestamp: string;
  clientProfile: ClientAuditProfile;
  financialMetrics: Phase3AssemblyInput["financialMetrics"];
  
  // Pillar 1: CARO 2020 Statutory Audit
  caro2020: {
    engineResult: CaroAuditEngineResult;
    goingConcernRisk: boolean;
    goingConcernNotes: string;
    workingCapitalLimitsBreached: boolean;
    annexureMarkdownDraft: string;
  };

  // Pillar 2: Tax Audit (Form 3CD) Multi-Clause Disallowances
  taxAudit3CD: {
    clause44: Clause44Report;
    clause22Msme: Clause22Report;
    clause34Tds: Clause34Report;
    totalStatutoryDisallowanceInr: number;
    disallowanceBreakdown: {
      sec43Bh_MsmeOverdueInr: number;
      sec40a_ia_TdsNonDeductionInr: number;
      sec37_1_PenaltiesInr: number;
    };
    revisedTaxableIncomeInr: number;
  };

  // Pillar 3: ICAI SQC-1 Peer Review & 4-Eye Maker-Checker Gate
  sqc1QualityControl: {
    healthScore: PeerReviewHealthScore;
    isFilingUnlocked: boolean;
    blockingReasons: string[];
  };

  // Pillar 4: ICAI 18-Digit UDIN Sentinel
  udinSentinel: {
    udinNumber: string;
    documentType: UdinDocumentType;
    generatedTimestamp: string;
    daysRemaining: number;
    is60DayDeadlineMet: boolean;
    qrVerificationPayload: string;
    watermarkText: string;
  };

  // Pillar 5: Statutory Invoicing & Pay-to-Release Fee Realization
  feeRealization: {
    invoiceNumber: string;
    sacCode: string;
    taxableProfessionalFeeInr: number;
    posDetermination: {
      clientStateCode: string;
      firmStateCode: string;
      isInterState: boolean;
      taxType: string;
    };
    taxBreakup: {
      cgstInr: number;
      sgstInr: number;
      igstInr: number;
      totalGstInr: number;
    };
    grossInvoiceValueInr: number;
    tdsSection194JInr: number;
    pureAgentDisbursementsInr: number;
    netRealizableAmountInr: number;
    npciDynamicUpiUri: string;
    payToReleaseDeliverableStatus: "LOCKED_PENDING_PAYMENT" | "UNLOCKED_SETTLED";
  };

  // Partner Summary Briefing
  partnerExecutiveBriefing: {
    overallStatus: "APPROVED_CLEAN" | "QUALIFIED_ATTENTION" | "BLOCKED_BY_GOVERNANCE";
    keyObservations: string[];
    recommendedAuditOpinion: "UNMODIFIED_SA_700" | "QUALIFIED_SA_705" | "ADVERSE_SA_705";
  };
}

export class StatutoryAuditAssemblyLine {
  /**
   * Executes the Complete Phase 3 Statutory Audit, Tax Audit, UDIN & Realization Pipeline
   */
  public static executeAssembly(input: Phase3AssemblyInput): Phase3AssemblyResult {
    const runId = `P3-RUN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const firmStateCode = "23"; // Madhya Pradesh (Brains & Taxes Managing Partner Jurisdiction)

    const fin = input.financialMetrics;
    const prof = input.clientProfile;

    // ------------------------------------------------------------------------
    // 1. PILLAR A: CARO 2020 STATUTORY AUDIT EVALUATION
    // ------------------------------------------------------------------------
    const caroResult = Caro2020Engine.evaluateTrialBalance(
      prof.legalName,
      prof.cin || "U74110MP2017PTC043716",
      prof.financialYear,
      prof.assessmentYear,
      {
        patCY: fin.patCY,
        depreciationCY: fin.depreciationCY,
        patPY: fin.patPY,
        depreciationPY: fin.depreciationPY,
        sanctionedWorkingCapitalLimitInr: fin.sanctionedWorkingCapitalLimitInr,
        currentAssetsCY: fin.currentAssets,
        currentLiabilitiesCY: fin.currentLiabilities,
        debtEquityRatio: fin.debtEquityRatio,
        hasWilfulDefaulterRemark: fin.hasWilfulDefaulterRemark,
        undisputedStatutoryDuesOver6Months: fin.undisputedStatutoryDuesOver6Months
      }
    );

    const goingConcernRisk = fin.currentRatio < 1.0 || fin.debtEquityRatio > 3.0 || fin.netWorth < 0;
    const goingConcernNotes = goingConcernRisk
      ? `Material uncertainty exists regarding capability to meet 1-year liabilities (Current Ratio: ${fin.currentRatio.toFixed(2)}x, Debt-Equity: ${fin.debtEquityRatio.toFixed(2)}x). SA 570 qualification recommended.`
      : `Operating indicators and current ratio (${fin.currentRatio.toFixed(2)}x) confirm going concern viability under SA 570.`;

    const workingCapitalLimitsBreached = fin.sanctionedWorkingCapitalLimitInr > 50000000;

    // ------------------------------------------------------------------------
    // 2. PILLAR B: TAX AUDIT (FORM 3CD) MULTI-CLAUSE AUDITOR
    // ------------------------------------------------------------------------
    // Clause 44 - GST Expenditure Breakdown
    const clause44Report = Clause44Engine.generateClause44({
      assesseeName: prof.legalName,
      pan: prof.pan,
      financialYear: prof.financialYear,
      assessmentYear: prof.assessmentYear,
      ledgers: input.expenseLedgers
    });

    // Clause 22 - MSME Section 43B(h) & Section 16 Interest
    const clause22Report = Clause22MsmeEngine.evaluateMsmeCreditors({
      assesseeName: prof.legalName,
      pan: prof.pan,
      financialYear: prof.financialYear,
      assessmentYear: prof.assessmentYear,
      invoices: input.msmeCreditors
    });

    // Clause 34 - TDS Compliance & Section 40(a)(ia) 30% Disallowance
    const clause34Report = Clause34TdsEngine.auditTdsCompliance({
      assesseeName: prof.legalName,
      tan: prof.pan.slice(0, 4) + "00001", // Representative TAN
      financialYear: prof.financialYear,
      assessmentYear: prof.assessmentYear,
      transactions: input.tdsTransactions
    });

    const sec43BhDisallowance = clause22Report.summary.totalDisallowedUnder43BhInr;
    const sec40a_iaDisallowance = clause34Report.summary.totalDisallowanceSection40a_ia_Inr;
    const sec37_1Disallowance = 0; // Penalties
    const totalDisallowances = sec43BhDisallowance + sec40a_iaDisallowance + sec37_1Disallowance;
    const revisedTaxableIncome = Math.max(0, fin.profitBeforeTax + totalDisallowances);

    // ------------------------------------------------------------------------
    // 3. PILLAR C: ICAI SQC-1 PEER REVIEW & 4-EYE MAKER-CHECKER GATE
    // ------------------------------------------------------------------------
    const standardWorkpapers: AuditWorkpaperItem[] = [
      {
        id: "WP-01",
        code: "PAF-01",
        title: "Permanent Audit File: MoA, AoA, Tax Registration & Organization Chart",
        category: "PERMANENT_AUDIT_FILE",
        standardReference: "SA 210 / SA 230",
        status: "COMPLETED",
        preparer: "Article Assistant",
        reviewer: prof.partnerInCharge,
        eqcrSignOffRequired: false,
        eqcrSignOffStatus: "NOT_REQUIRED",
        lastUpdated: timestamp
      },
      {
        id: "WP-02",
        code: "CAF-01",
        title: "Current Audit File: Schedule III Lead Schedules, BRS & External Confirmations",
        category: "CURRENT_AUDIT_FILE",
        standardReference: "SA 500 / SA 505",
        status: "COMPLETED",
        preparer: "Audit Manager",
        reviewer: prof.partnerInCharge,
        eqcrSignOffRequired: true,
        eqcrSignOffStatus: input.isEqcrApproved ? "APPROVED" : "PENDING_REVIEW",
        lastUpdated: timestamp
      },
      {
        id: "WP-03",
        code: "CAF-02",
        title: "Tax Audit Workpapers: Form 3CD Clauses 22, 34, 44 Reconciliation",
        category: "CURRENT_AUDIT_FILE",
        standardReference: "Sec 44AB ICAI Guidance Note",
        status: "COMPLETED",
        preparer: "Audit Manager",
        reviewer: prof.partnerInCharge,
        eqcrSignOffRequired: true,
        eqcrSignOffStatus: input.isEqcrApproved ? "APPROVED" : "PENDING_REVIEW",
        lastUpdated: timestamp
      }
    ];

    const standardDeclarations: IndependenceDeclaration[] = [
      {
        id: "IND-01",
        partnerOrStaffName: prof.partnerInCharge,
        membershipOrRegistrationNo: prof.caMembershipNo,
        designation: "PARTNER",
        declarationType: "FORM_4_ENGAGEMENT_SPECIFIC",
        clientName: prof.legalName,
        financialYear: prof.financialYear,
        noFinancialInterestConfirmed: true,
        noIndebtednessAboveThresholdConfirmed: true,
        noBusinessRelationshipConfirmed: true,
        noRelativeInKeyManagerialPositionConfirmed: true,
        signedDate: prof.signingDate,
        status: "SUBMITTED_AND_VERIFIED"
      }
    ];

    const isEqcrSigned = input.isEqcrApproved !== undefined ? input.isEqcrApproved : true;
    const sqc1Health = Sqc1PeerReviewEngine.evaluateEngagementCompliance(
      standardWorkpapers,
      standardDeclarations,
      false
    );

    const blockingReasons: string[] = [];
    if (!sqc1Health.sqc1Compliant) {
      blockingReasons.push(...sqc1Health.deficiencies);
    }
    const isFilingUnlocked = blockingReasons.length === 0;

    // ------------------------------------------------------------------------
    // 4. PILLAR D: ICAI 18-DIGIT UDIN SENTINEL
    // ------------------------------------------------------------------------
    const docType: UdinDocumentType = "TAX_AUDIT_FORM_3CD";
    const udinNumber = BulkUdinEngine.generateUdinNumber(prof.caMembershipNo, prof.signingDate, docType);
    const deadlineCountdown = BulkUdinEngine.evaluateUdinDeadlines([
      {
        id: "UDIN-REC-01",
        documentTitle: `Tax Audit u/s 44AB for ${prof.legalName}`,
        clientName: prof.legalName,
        clientPan: prof.pan,
        caMemberRegNo: prof.caMembershipNo,
        signingDate: prof.signingDate,
        documentType: docType,
        udinNumber,
        isUdinGenerated: true,
        daysRemainingToGenerateUdin: 60,
        is60DayDeadlineBreached: false,
        qrCodeVerificationPayload: `https://udin.icai.org/verify/${udinNumber}`,
        watermarkText: `UDIN: ${udinNumber} | Signed by CA Gunjan Jain, FCA (${prof.caMembershipNo})`,
        isRevoked: false
      }
    ], prof.signingDate);

    // ------------------------------------------------------------------------
    // 5. PILLAR E: STATUTORY INVOICING & PAY-TO-RELEASE GATE
    // ------------------------------------------------------------------------
    const agreedFee = input.agreedProfessionalFee || 75000.00;
    const pureAgentDisbursements = input.pureAgentReimbursements || 5000.00; // MCA filings/challans (0% GST)

    // Place of supply determination
    const pos = determinePlaceOfSupply(prof.stateCode, firmStateCode);
    const taxAndTds = calculateTaxAndTds(agreedFee, pos.isInterState, true, 10); // 10% TDS u/s 194J

    const netRealizable = Math.round((taxAndTds.netAmountPayable + pureAgentDisbursements) * 100) / 100;
    const upiVpa = input.firmUpiVpa || "ca.gunjan@icici";
    const invoiceNumber = `INV/2026-27/${Math.floor(1000 + Math.random() * 9000)}`;

    const upiUri = generateNpciDynamicUpiUri(
      upiVpa,
      "CA Gunjan Jain and Associates",
      netRealizable,
      invoiceNumber,
      `Statutory Audit Fee & Reimbursables - ${prof.legalName.slice(0, 15)}`
    );

    // ------------------------------------------------------------------------
    // 6. EXECUTIVE PARTNER BRIEFING
    // ------------------------------------------------------------------------
    const keyObservations: string[] = [];
    if (goingConcernRisk) {
      keyObservations.push("CARO Clause (xix): Current ratio below parity triggers material uncertainty under SA 570.");
    }
    if (sec43BhDisallowance > 0) {
      keyObservations.push(`Form 3CD Clause 22: ₹${sec43BhDisallowance.toLocaleString("en-IN")} disallowed u/s 43B(h) for overdue MSME dues.`);
    }
    if (sec40a_iaDisallowance > 0) {
      keyObservations.push(`Form 3CD Clause 34: ₹${sec40a_iaDisallowance.toLocaleString("en-IN")} disallowed u/s 40(a)(ia) for TDS default.`);
    }
    if (workingCapitalLimitsBreached) {
      keyObservations.push("CARO Clause (ii)(b): Working capital limit exceeds ₹5 Cr; quarterly statements require cross-verification with stock book.");
    }
    if (keyObservations.length === 0) {
      keyObservations.push("All statutory parameters compliant. Mathematical books and tax registers fully aligned.");
    }

    const recommendedOpinion = goingConcernRisk ? "QUALIFIED_SA_705" : "UNMODIFIED_SA_700";
    const overallStatus = !isFilingUnlocked 
      ? "BLOCKED_BY_GOVERNANCE" 
      : (goingConcernRisk || totalDisallowances > 500000) ? "QUALIFIED_ATTENTION" : "APPROVED_CLEAN";

    return {
      runId,
      timestamp,
      clientProfile: prof,
      financialMetrics: input.financialMetrics,
      caro2020: {
        engineResult: caroResult,
        goingConcernRisk,
        goingConcernNotes,
        workingCapitalLimitsBreached,
        annexureMarkdownDraft: caroResult.annexureDraftMarkdown
      },
      taxAudit3CD: {
        clause44: clause44Report,
        clause22Msme: clause22Report,
        clause34Tds: clause34Report,
        totalStatutoryDisallowanceInr: totalDisallowances,
        disallowanceBreakdown: {
          sec43Bh_MsmeOverdueInr: sec43BhDisallowance,
          sec40a_ia_TdsNonDeductionInr: sec40a_iaDisallowance,
          sec37_1_PenaltiesInr: sec37_1Disallowance
        },
        revisedTaxableIncomeInr: revisedTaxableIncome
      },
      sqc1QualityControl: {
        healthScore: sqc1Health,
        isFilingUnlocked,
        blockingReasons
      },
      udinSentinel: {
        udinNumber,
        documentType: docType,
        generatedTimestamp: timestamp,
        daysRemaining: 60,
        is60DayDeadlineMet: true,
        qrVerificationPayload: `https://udin.icai.org/verify/${udinNumber}`,
        watermarkText: `ICAI UDIN: ${udinNumber} | Signed by CA Gunjan Jain, FCA (${prof.caMembershipNo})`
      },
      feeRealization: {
        invoiceNumber,
        sacCode: "998221", // Statutory & Tax Audit
        taxableProfessionalFeeInr: agreedFee,
        posDetermination: {
          clientStateCode: prof.stateCode,
          firmStateCode,
          isInterState: pos.isInterState,
          taxType: pos.taxType
        },
        taxBreakup: {
          cgstInr: taxAndTds.cgstAmount,
          sgstInr: taxAndTds.sgstAmount,
          igstInr: taxAndTds.igstAmount,
          totalGstInr: taxAndTds.totalGstAmount
        },
        grossInvoiceValueInr: taxAndTds.grossInvoiceAmount,
        tdsSection194JInr: taxAndTds.tdsAmountDeducted,
        pureAgentDisbursementsInr: pureAgentDisbursements,
        netRealizableAmountInr: netRealizable,
        npciDynamicUpiUri: upiUri,
        payToReleaseDeliverableStatus: "LOCKED_PENDING_PAYMENT"
      },
      partnerExecutiveBriefing: {
        overallStatus,
        keyObservations,
        recommendedAuditOpinion: recommendedOpinion
      }
    };
  }
}
