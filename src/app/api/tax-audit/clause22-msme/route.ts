import { NextRequest, NextResponse } from "next/server";
import { Clause22MsmeEngine, MsmeCreditorInvoiceItem } from "@/lib/taxAudit/clause22MsmeEngine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pan = searchParams.get("pan") || "AABCA8891D";
    const assesseeName = searchParams.get("name") || "Apex AutoTech Private Limited";
    const fy = searchParams.get("fy") || "FY 2025-26";
    const ay = searchParams.get("ay") || "AY 2026-27";

    const sampleInvoices: MsmeCreditorInvoiceItem[] = [
      {
        id: "msme-1",
        vendorName: "ABC Corrugated Packaging LLP",
        vendorPan: "AANFA1120K",
        udyamRegistrationNo: "UDYAM-MP-08-0012941",
        enterpriseCategory: "MICRO",
        hasWrittenAgreement: true,
        nicCode: "1702",
        invoiceNumber: "ABC/25-26/0491",
        invoiceDate: "2026-01-14",
        deliveryOrAcceptanceDate: "2026-01-16",
        invoiceAmountInr: 230000,
        paymentStatus: "UNPAID_BEYOND_DUE_DATE_AT_YEAR_END"
      },
      {
        id: "msme-2",
        vendorName: "Precision CNC Toolings Pvt Ltd",
        vendorPan: "AABCP4412H",
        udyamRegistrationNo: "UDYAM-MH-12-0044910",
        enterpriseCategory: "SMALL",
        hasWrittenAgreement: false, // 15 days window
        nicCode: "2593",
        invoiceNumber: "PCT/2026/881",
        invoiceDate: "2026-02-10",
        deliveryOrAcceptanceDate: "2026-02-12",
        invoiceAmountInr: 185000,
        paymentStatus: "PAID_AFTER_DUE_DATE_WITHIN_FY",
        actualPaymentDate: "2026-03-24" // 40 days delay
      },
      {
        id: "msme-3",
        vendorName: "Shree Ganesh Industrial Hardware (Trader)",
        vendorPan: "AAHFS9912M",
        udyamRegistrationNo: "UDYAM-MP-08-0099412",
        enterpriseCategory: "TRADER_EXCLUDED",
        hasWrittenAgreement: true,
        nicCode: "4659", // Retail/Wholesale trader
        invoiceNumber: "SGH/0921",
        invoiceDate: "2026-01-20",
        deliveryOrAcceptanceDate: "2026-01-22",
        invoiceAmountInr: 340000,
        paymentStatus: "UNPAID_BEYOND_DUE_DATE_AT_YEAR_END"
      },
      {
        id: "msme-4",
        vendorName: "Kalyani Forgings & Castings Ltd",
        vendorPan: "AAACK9910D",
        udyamRegistrationNo: "UDYAM-MH-12-0088120",
        enterpriseCategory: "MEDIUM",
        hasWrittenAgreement: true,
        nicCode: "2410",
        invoiceNumber: "KFC/MUM/1102",
        invoiceDate: "2026-01-10",
        deliveryOrAcceptanceDate: "2026-01-12",
        invoiceAmountInr: 1200000,
        paymentStatus: "UNPAID_BEYOND_DUE_DATE_AT_YEAR_END"
      }
    ];

    const report = Clause22MsmeEngine.evaluateMsmeCreditors({
      assesseeName,
      pan,
      financialYear: fy,
      assessmentYear: ay,
      invoices: sampleInvoices
    });

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to process Clause 22 MSME report"
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assesseeName, pan, financialYear, assessmentYear, invoices, rbiBankRatePcnt } = body;

    if (!pan || !Array.isArray(invoices)) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: pan, invoices"
      }, { status: 400 });
    }

    const report = Clause22MsmeEngine.evaluateMsmeCreditors({
      assesseeName: assesseeName || "Assessee",
      pan,
      financialYear: financialYear || "FY 2025-26",
      assessmentYear: assessmentYear || "AY 2026-27",
      invoices,
      rbiBankRatePcnt: rbiBankRatePcnt || 6.75
    });

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to evaluate MSME creditor invoices"
    }, { status: 500 });
  }
}
