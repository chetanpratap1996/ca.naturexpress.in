import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase } from "@/lib/server/db";
import { 
  SAMPLE_VALUE_SUMMARIES, 
  computeValueDeliveredSummary, 
  generateWhatsAppValueCard,
  ClientValueDeliveredSummary
} from "@/lib/billing/valueDeliveredEngine";
import { generateNpciUpiDeepLinks, generateUpiQrDataUrl } from "@/lib/billing/npciUpiEngine";

export async function GET(req: NextRequest) {
  try {
    const db = ensureDatabase();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const firmVpa = db.firmMetrics?.firmUpiVpa || "ca.gunjan@icici";
    const merchantName = db.firmMetrics?.name || "GPA & Co., Chartered Accountants";

    let summaries = SAMPLE_VALUE_SUMMARIES;

    if (clientId) {
      summaries = summaries.filter((s) => s.clientId === clientId);
    }

    // Enrich each summary with dynamic NPCI UPI links and offline QR code
    const enrichedSummaries = await Promise.all(
      summaries.map(async (item) => {
        const upiLinks = generateNpciUpiDeepLinks({
          firmVpa,
          merchantName,
          amount: item.netTotalPayableInr,
          invoiceNo: item.invoiceNo,
          clientName: item.clientName
        });

        const qrDataUrl = await generateUpiQrDataUrl(upiLinks.universalUri, { width: 240 });
        const whatsAppCopy = generateWhatsAppValueCard(item, upiLinks, merchantName);

        return {
          ...item,
          firmVpa,
          merchantName,
          upiLinks,
          qrDataUrl,
          whatsAppCopy
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: enrichedSummaries.length,
      firmVpa,
      merchantName,
      summaries: enrichedSummaries
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to load value statements: ${err.message || String(err)}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = ensureDatabase();
    const body = await req.json();

    const firmVpa = body.firmVpa || db.firmMetrics?.firmUpiVpa || "ca.gunjan@icici";
    const merchantName = body.merchantName || db.firmMetrics?.name || "GPA & Co., Chartered Accountants";

    const summary = computeValueDeliveredSummary({
      clientId: body.clientId || `CLI-${Date.now()}`,
      clientName: body.clientName || "Valued Client",
      clientPan: body.clientPan || "AABCA8891D",
      clientGstin: body.clientGstin,
      clientPhone: body.clientPhone,
      billingPeriod: body.billingPeriod || "Current Month",
      invoiceNo: body.invoiceNo || `INV/${Date.now().toString().slice(-6)}`,
      invoiceDate: body.invoiceDate || new Date().toISOString().split("T")[0],
      pureAgentGovtFeesInr: Number(body.pureAgentGovtFeesInr || 0),
      caProfessionalFeeInr: Number(body.caProfessionalFeeInr || 3500),
      benefits: body.benefits || []
    });

    const upiLinks = generateNpciUpiDeepLinks({
      firmVpa,
      merchantName,
      amount: summary.netTotalPayableInr,
      invoiceNo: summary.invoiceNo,
      clientName: summary.clientName
    });

    const qrDataUrl = await generateUpiQrDataUrl(upiLinks.universalUri, { width: 260 });
    const whatsAppCopy = generateWhatsAppValueCard(summary, upiLinks, merchantName);

    return NextResponse.json({
      success: true,
      summary: {
        ...summary,
        firmVpa,
        merchantName,
        upiLinks,
        qrDataUrl,
        whatsAppCopy
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to generate value statement: ${err.message || String(err)}` },
      { status: 500 }
    );
  }
}
