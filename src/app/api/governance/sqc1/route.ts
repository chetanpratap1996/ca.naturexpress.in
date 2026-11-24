import { NextRequest, NextResponse } from "next/server";
import { SwarmCoordinator } from "@/lib/knowledge/swarm/swarmOrchestrator";

// Singleton SwarmCoordinator instance for governance sessions
const coordinator = new SwarmCoordinator();

// Initialize realistic seed sessions
const session1 = coordinator.startSession(
  "Pratwi Solutions Private Limited",
  "Statutory Audit Form 3CD & Schedule III Financials (AY 2026-27)"
);

// Submit maker workpaper for session 1
coordinator.submitMakerWorkpaper(session1.sessionId, {
  workpaperId: "WP-3CD-PRATWI-01",
  clientEntityName: "Pratwi Solutions Private Limited",
  targetSubject: "Tax Audit Form 3CD Clause 44 & Clause 22 MSME Reconciliation",
  targetFinancialYear: "FY 2025-26",
  targetAssessmentYear: "AY 2026-27",
  preparedBy: {
    traineeName: "Rohan Varma (Article Trainee)",
    articleshipRegNo: "WRO-0849212",
    timestamp: new Date().toISOString(),
  },
  extractedFactualSchedule: {
    totalExpenditureInr: 48200000,
    msmeOverdueDuesInr: 1845000,
    disallowance43BhInr: 845000,
  },
  primarySourcesReferenced: [
    {
      documentId: "DOC-TALLY-LEDGER-01",
      documentTitle: "Tally XML Audited Expense Ledger",
      sourceType: "INVOICE",
      sha256VerificationHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    },
  ],
  draftMathematicalCalculations: [
    {
      calculationType: "MSME_DISALLOWANCE_43BH",
      computedAmountInr: 845000,
      roundingRuleApplied: "NEAREST_RUPEE",
      formulaDetails: "Sum of payments delayed beyond 45 days where written contract exists",
    },
  ],
  initialStatutoryFindings: [
    "Clause 44: Total expenditure of ₹4.82 Cr classified into registered, composition, exempt, and unregistered supplies.",
    "Clause 22: MSME payables of ₹18.45L audited against Section 15 45-day cap. Disallowance computed at ₹8.45L.",
  ],
  isLockedForReview: true,
});

// Run AI Manager Checker Review
coordinator.runCheckerReview(session1.sessionId);

export async function GET(request: NextRequest) {
  try {
    const session = coordinator.getSession(session1.sessionId);

    // Mock UDIN Guardian Records
    const udinRecords = [
      {
        id: "UDIN-REC-01",
        documentType: "TAX_AUDIT_3CD",
        clientName: "Pratwi Solutions Private Limited",
        clientPan: "AAACA9921E",
        signingDate: "2026-10-15",
        generatedDate: "2026-10-20",
        udin: "26098221AAAAAA1048",
        status: "GENERATED_VALID",
        daysRemaining: 55,
        partnerName: "CA Gunjan Jain",
        membershipNo: "022998C",
      },
      {
        id: "UDIN-REC-02",
        documentType: "STATUTORY_AUDIT",
        clientName: "Pratwi Solutions Private Limited",
        clientPan: "AANCP9915B",
        signingDate: "2026-11-05",
        status: "PENDING_GENERATION",
        daysRemaining: 46, // 60 - 14 days elapsed
        partnerName: "CA Gunjan Jain",
        membershipNo: "022998C",
      },
      {
        id: "UDIN-REC-03",
        documentType: "TURNOVER_CERTIFICATE",
        clientName: "Pratwi Solutions Private Limited",
        clientPan: "AANCP9915B",
        signingDate: "2026-09-28",
        status: "EXPIRING_SOON",
        daysRemaining: 8, // Under 15 days warning!
        partnerName: "CA Gunjan Jain",
        membershipNo: "022998C",
      },
    ];

    // Physical USB DSC Tokens Locker
    const dscTokens = [
      {
        id: "DSC-01",
        entityName: "Pratwi Solutions Private Limited",
        holderName: "Chetan Pratap Singh (Director)",
        serialNumber: "ePass2003-8849-01",
        vaultSlot: "Rack A, Slot 04",
        expiryDate: "2027-04-15",
        currentCustodian: "Firm Master Safe",
        status: "AVAILABLE_IN_VAULT",
        lastCheckedOutBy: "Kriti Jain (Article Trainee)",
        lastCheckedOutAt: "2026-11-10 14:30",
      },
      {
        id: "DSC-02",
        entityName: "Pratwi Solutions Private Limited",
        holderName: "Chetan Pratap Singh (Director)",
        serialNumber: "WatchKey-4921-99",
        vaultSlot: "Rack B, Slot 02",
        expiryDate: "2026-12-10",
        currentCustodian: "Firm Master Safe",
        status: "AVAILABLE_IN_VAULT",
        purpose: "Form 3CD Assessee Digital Signature",
        lastCheckedOutBy: "Kriti Jain (Article Trainee)",
        lastCheckedOutAt: "2026-11-19 11:15",
      },
      {
        id: "DSC-03",
        entityName: "Pratwi Solutions Private Limited",
        holderName: "Chetan Pratap Singh (Director)",
        serialNumber: "mToken-7712-44",
        vaultSlot: "Rack A, Slot 08",
        expiryDate: "2027-08-20",
        currentCustodian: "Firm Master Safe",
        status: "AVAILABLE_IN_VAULT",
        lastCheckedOutBy: "Kriti Jain (Article Trainee)",
        lastCheckedOutAt: "2026-11-05 16:00",
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        activeSwarmSession: session,
        udinRecords,
        dscTokens,
        sqc1ComplianceScore: 98.4,
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[API_GOVERNANCE_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch governance data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, dscId, staffName, purpose } = body;

    if (action === "PARTNER_ADJUDICATE_SWARM") {
      const updatedSession = coordinator.runPartnerAdjudication(
        sessionId || session1.sessionId,
        {
          invoiceNumber: "INV-2026-0881",
          feeInr: 85000,
          isPaid: false, // Locked until client payment
        }
      );
      return NextResponse.json({
        success: true,
        data: {
          session: updatedSession,
          message: "Partner sign-off executed. Docket locked in Pay-to-Release fee gate.",
        },
      });
    }

    if (action === "TOGGLE_DSC_CHECKOUT") {
      return NextResponse.json({
        success: true,
        data: {
          dscId,
          newStatus: "CHECKED_OUT",
          custodian: staffName || "Article Trainee",
          purpose: purpose || "Portal digital signature",
          timestamp: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API_GOVERNANCE_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Governance action failed" },
      { status: 500 }
    );
  }
}
