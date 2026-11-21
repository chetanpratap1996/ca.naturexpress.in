import { NextRequest, NextResponse } from "next/server";
import { DualRegimeOptimizer, ItrIncomeParameters } from "@/lib/itr/dualRegimeOptimizer";
import { ensureDatabase, saveDatabase, logAuditEvent, createNotification, ClientItrComputationItem } from "@/lib/server/db";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const db = ensureDatabase();

    // Query 1: List all saved computations
    if (searchParams.get("all") === "true" || searchParams.get("list") === "true") {
      const computations = db.clientItrComputations || [];
      return NextResponse.json({
        success: true,
        computations,
        count: computations.length,
        totalTaxSavingsInr: computations.reduce((acc, c) => acc + (c.taxSavingsInr || 0), 0),
        form10IeaPendingCount: computations.filter((c) => c.form10IeaStatus === "REQUIRED_PENDING").length
      });
    }

    // Query 2: Get saved computation by clientId or pan
    const clientId = searchParams.get("clientId");
    const pan = searchParams.get("pan");
    if (clientId || pan) {
      const computations = db.clientItrComputations || [];
      const match = computations.find(
        (c) => (clientId && c.clientId === clientId) || (pan && c.pan.toUpperCase() === pan.toUpperCase())
      );
      if (match) {
        return NextResponse.json({
          success: true,
          savedComputation: match
        });
      }
    }

    // Query 3: On-the-fly calculation with query parameters
    const salary = Number(searchParams.get("salary") || "1250000");
    const sec80C = Number(searchParams.get("sec80C") || "150000");
    const sec80D = Number(searchParams.get("sec80D") || "25000");
    const homeLoan = Number(searchParams.get("homeLoan") || "150000");

    const defaultParams: ItrIncomeParameters = {
      taxpayerName: "Rajesh Sharma",
      pan: "ABFPS1234E",
      category: "INDIVIDUAL",
      assessmentYear: "AY 2026-27",
      salaryGross: salary,
      salaryExemptions: 0,
      professionalTax: 2500,
      annualRentReceived: 0,
      municipalTaxesPaid: 0,
      homeLoanInterestSelfOccupied: homeLoan,
      hasPgbpIncome: false,
      isPresumptive: false,
      presumptiveScheme: "44ADA",
      businessTurnover: 0,
      regularBusinessProfit: 0,
      stcg111A: 0,
      ltcg112A: 0,
      otherLtcg112: 0,
      savingsInterest: 18000,
      fdInterestAndDividends: 32000,
      familyPension: 0,
      sec80C,
      sec80D_Self: sec80D,
      sec80D_ParentsSenior: 50000,
      sec80D_Checkup: 5000,
      sec80CCD_1B: 50000,
      sec80CCD_2_Employer: 0,
      sec80E_EduLoan: 0,
      sec80G_Donations: 0,
      sec80JJAA: 0,
      tdsPaid: 65000,
      advanceTaxPaid: 0,
      tcsPaid: 0
    };

    const result = DualRegimeOptimizer.optimize(defaultParams);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute ITR optimization" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    const body = await req.json();
    const action = body.action || "OPTIMIZE";
    const params: ItrIncomeParameters = body.params || body;

    if (!params.taxpayerName || !params.pan) {
      return NextResponse.json(
        { success: false, error: "Taxpayer Name and PAN are required." },
        { status: 400 }
      );
    }

    const result = DualRegimeOptimizer.optimize(params);

    // Form 10-IEA compliance evaluation:
    // Under Section 115BAC(6), an assessee having income from business or profession (PGBP)
    // opting out of Section 115BAC must furnish Form 10-IEA on or before the due date under Sec 139(1).
    const chosenRegime = body.selectedRegime || result.recommendedRegime;
    const form10IeaRequired = Boolean(params.hasPgbpIncome && chosenRegime === "OLD_REGIME");

    if (action === "SAVE_COMPUTATION") {
      const db = ensureDatabase();
      if (!db.clientItrComputations) db.clientItrComputations = [];

      const targetClientId = body.clientId || "CLI-01";
      const existingIdx = db.clientItrComputations.findIndex(
        (c) => c.pan.toUpperCase() === params.pan.toUpperCase() && c.assessmentYear === (params.assessmentYear || "AY 2026-27")
      );

      const computationItem: ClientItrComputationItem = {
        id: existingIdx !== -1 ? db.clientItrComputations[existingIdx].id : `ITR-COMP-${params.pan}-${Date.now().toString().slice(-4)}`,
        clientId: targetClientId,
        clientName: params.taxpayerName,
        pan: params.pan.toUpperCase(),
        assessmentYear: params.assessmentYear || "AY 2026-27",
        updatedAt: new Date().toISOString(),
        category: params.category || "INDIVIDUAL",
        recommendedRegime: result.recommendedRegime,
        taxSavingsInr: result.taxSavingsRupees,
        totalIncomeOldInr: result.oldRegime.grossTotalIncome,
        totalTaxOldInr: result.oldRegime.totalTaxPayable,
        totalIncomeNewInr: result.newRegime.grossTotalIncome,
        totalTaxNewInr: result.newRegime.totalTaxPayable,
        form10IeaRequired,
        form10IeaStatus: form10IeaRequired ? (body.form10IeaStatus || "REQUIRED_PENDING") : "NOT_APPLICABLE",
        computaxPayload: result
      };

      if (existingIdx !== -1) {
        db.clientItrComputations[existingIdx] = computationItem;
      } else {
        db.clientItrComputations.unshift(computationItem);
      }

      await logAuditEvent(
        auth.userName || "CA Gunjan Jain",
        "PARTNER",
        params.taxpayerName,
        "ITR Dual-Regime Computation Locked",
        `Locked computation for AY ${params.assessmentYear || "AY 2026-27"} (PAN: ${params.pan}). Recommended: ${result.recommendedRegime} (Savings: ₹${result.taxSavingsRupees.toLocaleString("en-IN")}). Form 10-IEA Required: ${form10IeaRequired}.`,
        "COMPLIANCE"
      );

      if (form10IeaRequired) {
        await createNotification({
          title: `Form 10-IEA Mandatory: ${params.taxpayerName}`,
          message: `Client has PGBP income and opted for Old Regime. Form 10-IEA must be filed before Section 139(1) due date to avoid invalidation of deductions.`,
          category: "COMPLIANCE",
          priority: "HIGH",
          targetRoles: ["SUPER_ADMIN", "PARTNER"],
          entityId: targetClientId,
          link: "/admin",
          actionLabel: "View Form 10-IEA"
        });
      }

      await saveDatabase(db);

      return NextResponse.json({
        success: true,
        data: result,
        form10IeaRequired,
        computation: computationItem,
        message: "Dual-regime ITR computation locked and saved to practice database."
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
      form10IeaRequired
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process ITR optimization" },
      { status: 500 }
    );
  }
}
