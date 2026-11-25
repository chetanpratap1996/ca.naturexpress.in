import { NextRequest, NextResponse } from "next/server";
import { enforceApiRole } from "@/lib/auth/serverAuth";
import { DualRegimeOptimizer, ItrIncomeParameters } from "@/lib/itr/dualRegimeOptimizer";

export async function POST(req: NextRequest) {
  const { errorResponse } = await enforceApiRole(req, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse) return errorResponse;
  try {
    const body = await req.json();
    const params: ItrIncomeParameters = body;

    const result = DualRegimeOptimizer.optimize(params);

    return NextResponse.json({
      success: true,
      message: "Pre-filing bridge payload generated successfully for CompuTax / Winman",
      data: result.computaxPayload
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate CompuTax bridge payload" },
      { status: 500 }
    );
  }
}
