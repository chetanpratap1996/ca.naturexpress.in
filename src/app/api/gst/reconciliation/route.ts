import { NextRequest, NextResponse } from "next/server";
import { RecoMatcher, Gstr2bInvoice, BooksPurchaseInvoice } from "@/lib/gst/recoMatcher";
import { ItcClassifier } from "@/lib/gst/itcClassifier";
import { ensureDatabase, saveDatabase, ClientGstReconciliationItem } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientGstin = searchParams.get("clientGstin") || "23AANCP9915B1Z9";
    const taxPeriod = searchParams.get("taxPeriod") || "September 2026";
    const tolerance = parseFloat(searchParams.get("tolerance") || "5.0");

    // Standard baseline fixtures for reconciliation demonstration
    const sample2b: Gstr2bInvoice[] = [
      {
        id: "2b-1",
        vendorGstin: "27AAACT2727Q1ZW",
        vendorTradeName: "Tata Steel Limited",
        invoiceNumber: "TSL/2026/0491",
        invoiceDate: "2026-09-14",
        invoiceType: "R",
        placeOfSupply: "27-Maharashtra",
        reverseCharge: false,
        taxableValue: 480000,
        igst: 86400,
        cgst: 0,
        sgst: 0,
        totalTax: 86400,
        totalInvoiceValue: 566400,
        gstr1FilingDate: "2026-10-10",
        gstr1Period: "092026",
        gstr3bFilingStatus: "FILED",
        itcAvailable: true
      },
      {
        id: "2b-2",
        vendorGstin: "27AABCM1888G1ZQ",
        vendorTradeName: "Mahindra & Mahindra Financial Services",
        invoiceNumber: "MMFSL/MUM/8821",
        invoiceDate: "2026-09-18",
        invoiceType: "R",
        placeOfSupply: "27-Maharashtra",
        reverseCharge: false,
        taxableValue: 1250000,
        igst: 350000,
        cgst: 0,
        sgst: 0,
        totalTax: 350000,
        totalInvoiceValue: 1600000,
        gstr1FilingDate: "2026-10-09",
        gstr1Period: "092026",
        gstr3bFilingStatus: "FILED",
        itcAvailable: true
      },
      {
        id: "2b-3",
        vendorGstin: "23AAGCR4421L1ZB",
        vendorTradeName: "Radisson Blu Hospitality LLP",
        invoiceNumber: "RBL/IND/773",
        invoiceDate: "2026-09-22",
        invoiceType: "R",
        placeOfSupply: "23-Madhya Pradesh",
        reverseCharge: false,
        taxableValue: 65000,
        igst: 0,
        cgst: 1625,
        sgst: 1625,
        totalTax: 3250,
        totalInvoiceValue: 68250,
        gstr1FilingDate: "2026-10-11",
        gstr1Period: "092026",
        gstr3bFilingStatus: "FILED",
        itcAvailable: true
      },
      {
        id: "2b-4",
        vendorGstin: "29AABCC9941H1Z4",
        vendorTradeName: "Cloudbyte Technologies Pvt Ltd",
        invoiceNumber: "CBT/2026/089",
        invoiceDate: "2026-09-25",
        invoiceType: "R",
        placeOfSupply: "29-Karnataka",
        reverseCharge: false,
        taxableValue: 180000,
        igst: 32400,
        cgst: 0,
        sgst: 0,
        totalTax: 32400,
        totalInvoiceValue: 212400,
        gstr1FilingDate: "2026-10-08",
        gstr1Period: "092026",
        gstr3bFilingStatus: "FILED",
        itcAvailable: true
      },
      {
        id: "2b-5",
        vendorGstin: "29AAACD1029F1Z1",
        vendorTradeName: "Dell India Private Limited",
        invoiceNumber: "DEL/2026/99120",
        invoiceDate: "2026-09-28",
        invoiceType: "R",
        placeOfSupply: "29-Karnataka",
        reverseCharge: false,
        taxableValue: 360000,
        igst: 64800,
        cgst: 0,
        sgst: 0,
        totalTax: 64800,
        totalInvoiceValue: 424800,
        gstr1FilingDate: "2026-10-10",
        gstr1Period: "092026",
        gstr3bFilingStatus: "FILED",
        itcAvailable: true
      },
      {
        id: "2b-6",
        vendorGstin: "06AAACJ5512E1Z2",
        vendorTradeName: "Jindal Infra Projects Pvt Ltd",
        invoiceNumber: "JIP/HR/1044",
        invoiceDate: "2025-11-20",
        invoiceType: "R",
        placeOfSupply: "06-Haryana",
        reverseCharge: false,
        taxableValue: 560000,
        igst: 100800,
        cgst: 0,
        sgst: 0,
        totalTax: 100800,
        totalInvoiceValue: 660800,
        gstr1FilingDate: "2026-10-10",
        gstr1Period: "092026",
        gstr3bFilingStatus: "NOT_FILED",
        itcAvailable: true
      }
    ];

    const sampleBooks: BooksPurchaseInvoice[] = [
      {
        id: "bk-1",
        voucherNumber: "PUR-2026-011",
        vendorGstin: "27AAACT2727Q1ZW",
        vendorName: "Tata Steel Limited",
        invoiceNumber: "TSL/2026/0491",
        invoiceDate: "2026-09-14",
        taxableValue: 480000,
        igst: 86400,
        cgst: 0,
        sgst: 0,
        totalTax: 86400,
        totalInvoiceValue: 566400,
        hsnCode: "7208",
        itemDescription: "Hot rolled flat steel coils for fabrication",
        paymentStatus: "PAID"
      },
      {
        id: "bk-2",
        voucherNumber: "PUR-2026-012",
        vendorGstin: "27AABCM1888G1ZQ",
        vendorName: "Mahindra & Mahindra Financial Services",
        invoiceNumber: "MMFSL/MUM/8821",
        invoiceDate: "2026-09-18",
        taxableValue: 1250000,
        igst: 350000,
        cgst: 0,
        sgst: 0,
        totalTax: 350000,
        totalInvoiceValue: 1600000,
        hsnCode: "8703",
        itemDescription: "Mahindra XUV700 company staff car",
        paymentStatus: "PAID"
      },
      {
        id: "bk-3",
        voucherNumber: "PUR-2026-013",
        vendorGstin: "23AAGCR4421L1ZB",
        vendorName: "Radisson Blu Hospitality LLP",
        invoiceNumber: "RBL/IND/773",
        invoiceDate: "2026-09-22",
        taxableValue: 65000,
        igst: 0,
        cgst: 1625,
        sgst: 1625,
        totalTax: 3250,
        totalInvoiceValue: 68250,
        hsnCode: "9963",
        itemDescription: "Annual general meeting dinner buffet catering",
        paymentStatus: "PAID"
      },
      {
        id: "bk-4",
        voucherNumber: "PUR-2026-014",
        vendorGstin: "29AABCC9941H1Z4",
        vendorName: "Cloudbyte Technologies Pvt Ltd",
        invoiceNumber: "89", // Fuzzy variation of CBT/2026/089
        invoiceDate: "2026-09-25",
        taxableValue: 180000,
        igst: 32400,
        cgst: 0,
        sgst: 0,
        totalTax: 32400,
        totalInvoiceValue: 212400,
        hsnCode: "9983",
        itemDescription: "Cloud hosting and server infrastructure maintenance",
        paymentStatus: "PAID"
      },
      {
        id: "bk-5",
        voucherNumber: "PUR-2026-015",
        vendorGstin: "24AADCA1192M1ZN",
        vendorName: "Apex Industrial Logistics",
        invoiceNumber: "AIL/GJ/4402",
        invoiceDate: "2026-09-02",
        taxableValue: 240000,
        igst: 43200,
        cgst: 0,
        sgst: 0,
        totalTax: 43200,
        totalInvoiceValue: 283200,
        hsnCode: "9965",
        itemDescription: "Goods transport agency freight charges",
        paymentStatus: "UNPAID",
        daysOutstanding: 28
      },
      {
        id: "bk-6",
        voucherNumber: "PUR-2026-016",
        vendorGstin: "06AAACJ5512E1Z2",
        vendorName: "Jindal Infra Projects Pvt Ltd",
        invoiceNumber: "JIP/HR/1044",
        invoiceDate: "2025-11-20",
        taxableValue: 560000,
        igst: 100800,
        cgst: 0,
        sgst: 0,
        totalTax: 100800,
        totalInvoiceValue: 660800,
        hsnCode: "9954",
        itemDescription: "Warehouse structural civil works",
        paymentStatus: "UNPAID",
        daysOutstanding: 310
      }
    ];

    const report = RecoMatcher.reconcile({
      taxPeriod,
      clientGstin,
      gstr2bInvoices: sample2b,
      booksInvoices: sampleBooks,
      toleranceInr: tolerance
    });

    // Run Section 17(5) classifier on each record
    for (const record of report.records) {
      const cls = ItcClassifier.classify({
        hsnOrSacCode: record.hsnCode,
        itemDescription: record.itemDescription,
        vendorTradeName: record.vendorName
      });
      if (cls.isBlocked) {
        record.section17_5Blocked = true;
        record.blockedCategory = cls.categoryTitle;
        record.statutoryAuditTrail = `${record.statutoryAuditTrail} [BLOCKED CREDIT: ${cls.reason}]`;
        record.recommendedAction = cls.auditRecommendation;
        report.summary.ineligibleSec17_5Itc += (record.gstr2bTotalTax || record.booksTotalTax);
      }
    }

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to execute GSTR-2B reconciliation"
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taxPeriod, clientGstin, gstr2bInvoices, booksInvoices, toleranceInr } = body;

    if (!taxPeriod || !clientGstin || !Array.isArray(gstr2bInvoices) || !Array.isArray(booksInvoices)) {
      return NextResponse.json({
        success: false,
        error: "Missing mandatory fields: taxPeriod, clientGstin, gstr2bInvoices, booksInvoices"
      }, { status: 400 });
    }

    const report = RecoMatcher.reconcile({
      taxPeriod,
      clientGstin,
      gstr2bInvoices,
      booksInvoices,
      toleranceInr: toleranceInr || 5.0
    });

    // Run Section 17(5) classifier on each record
    for (const record of report.records) {
      const cls = ItcClassifier.classify({
        hsnOrSacCode: record.hsnCode,
        itemDescription: record.itemDescription,
        vendorTradeName: record.vendorName
      });
      if (cls.isBlocked) {
        record.section17_5Blocked = true;
        record.blockedCategory = cls.categoryTitle;
        record.statutoryAuditTrail = `${record.statutoryAuditTrail} [BLOCKED CREDIT: ${cls.reason}]`;
        record.recommendedAction = cls.auditRecommendation;
        report.summary.ineligibleSec17_5Itc += (record.gstr2bTotalTax || record.booksTotalTax);
      }
    }

    // Persist real reconciliation state into Database
    try {
      const db = ensureDatabase();
      if (!db.clientGstReconciliations) db.clientGstReconciliations = [];

      const client = db.clients.find(c => c.gstin?.toUpperCase() === clientGstin.toUpperCase());
      const clientId = client?.id || `CLI-${clientGstin}`;

      const item: ClientGstReconciliationItem = {
        id: `reco-${clientGstin}-${Date.now()}`,
        clientId,
        clientGstin,
        period: taxPeriod,
        updatedAt: new Date().toISOString(),
        invoicesAudited: report.summary.totalRecords,
        totalTaxableInr: gstr2bInvoices.reduce((acc: number, i: any) => acc + (i.taxableValue || 0), 0),
        totalTaxInr: report.summary.total2bItc,
        missingItcInr: report.summary.provisionalMissing2bItc || 0,
        eligibleItcInr: report.summary.matchedEligibleItc,
        ineligible17_5ItcInr: report.summary.ineligibleSec17_5Itc,
        rule37aRiskCount: report.records.filter(r => r.rule37aRisk).length,
        vendorNoticeCount: report.records.filter(r => r.matchStatus === "MISSING_IN_2B").length,
        gstr2bInvoices,
        booksInvoices
      };

      const existingIdx = db.clientGstReconciliations.findIndex(
        r => r.clientGstin.toUpperCase() === clientGstin.toUpperCase() && r.period === taxPeriod
      );
      if (existingIdx !== -1) {
        db.clientGstReconciliations[existingIdx] = item;
      } else {
        db.clientGstReconciliations.push(item);
      }
      await saveDatabase(db);
    } catch (saveErr) {
      console.warn("Could not persist GST reconciliation to DB:", saveErr);
    }

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to process GSTR-2B reconciliation request"
    }, { status: 500 });
  }
}
