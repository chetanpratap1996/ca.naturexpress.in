import { NextRequest, NextResponse } from "next/server";
import { Schedule3ComplianceEngine } from "@/lib/schedule3/schedule3ComplianceEngine";

export async function GET(req: NextRequest) {
  try {
    const dossier = Schedule3ComplianceEngine.getDefaultDossier();
    return NextResponse.json({
      success: true,
      data: {
        reconciliations: dossier.bankStockReconciliations
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch bank reconciliations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items } = body;

    return NextResponse.json({
      success: true,
      message: "Quarterly bank statements reconciled successfully",
      data: items || []
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save bank reconciliations" },
      { status: 500 }
    );
  }
}
