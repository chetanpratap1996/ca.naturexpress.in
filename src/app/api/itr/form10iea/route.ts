import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hasPgbp = searchParams.get("hasPgbp") === "true";
    const selectedRegime = searchParams.get("regime") || "NEW_115BAC";

    const isRequired = hasPgbp && selectedRegime === "OLD_REGIME";

    return NextResponse.json({
      success: true,
      data: {
        formNumber: "Form 10-IEA",
        statutorySection: "Section 115BAC(6) of Income Tax Act, 1961",
        isRequired,
        dueDate: hasPgbp ? "31st October 2026 (Audit) / 31st July 2026 (Non-Audit)" : "N/A",
        onceInLifetimeSwitchNotice: "Assessees with income from business or profession can opt out of the new tax regime once and re-enter once in their lifetime.",
        statutoryDeclaration: isRequired 
          ? "Form 10-IEA must be e-filed under Digital Signature Certificate (DSC) or Electronic Verification Code (EVC) on or before the due date specified under Section 139(1)."
          : "Form 10-IEA is not required as the client is either opting for default Section 115BAC or has no PGBP income."
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to evaluate Form 10-IEA requirements" },
      { status: 500 }
    );
  }
}
