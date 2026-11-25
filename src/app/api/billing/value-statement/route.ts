import { NextRequest, NextResponse } from "next/server";
import {
  computeValueDeliveredSummary,
  generateWhatsAppValueCard,
  ClientValueDeliveredSummary,
} from "@/lib/billing/valueDeliveredEngine";
import { generateNpciDynamicUpiUri, generateNpciUpiDeepLinks, generateUpiQrDataUrl } from "@/lib/billing/npciUpiEngine";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid } from "@/lib/server/pgHelpers";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const { searchParams } = new URL(req.url);
    const clientId = auth.role === "CLIENT" ? auth.clientEntityId || null : searchParams.get("clientId");

    if (auth.role === "CLIENT" && !clientId) {
      return NextResponse.json({ success: false, error: "Client entity scope required." }, { status: 403 });
    }

    const [{ rows: firmRows }, { rows: clientRows }, { rows: invRows }] = await Promise.all([
      pool.query("SELECT firm_name, firm_upi_vpa FROM public.firms WHERE id = $1 LIMIT 1", [firmId]),
      clientId
        ? pool.query("SELECT * FROM public.client_entities WHERE firm_id = $1 AND id::text = $2", [firmId, clientId])
        : pool.query("SELECT * FROM public.client_entities WHERE firm_id = $1", [firmId]),
      clientId
        ? pool.query("SELECT * FROM public.invoices WHERE firm_id = $1 AND entity_id::text = $2", [firmId, clientId])
        : pool.query("SELECT * FROM public.invoices WHERE firm_id = $1", [firmId]),
    ]);

    const firm = firmRows[0];
    const firmVpa = firm?.firm_upi_vpa || DEFAULT_FIRM_BRANDING.firmUpiVpa;
    const merchantName = firm?.firm_name || DEFAULT_FIRM_BRANDING.firmName;

    const summaries: ClientValueDeliveredSummary[] = clientRows.map((client: any) => {
      const clientInvoice = invRows.find((i: any) => i.entity_id === client.id && i.status !== "PAID") || invRows.find((i: any) => i.entity_id === client.id);
      const fee = Number(clientInvoice?.total_amount || 5000);
      const pureAgent = Math.round(fee * 0.4);
      return computeValueDeliveredSummary({
        clientId: client.id,
        clientName: client.entity_name,
        clientPan: client.pan,
        clientGstin: client.gstin || undefined,
        clientPhone: client.primary_contact_phone || undefined,
        billingPeriod: "Current Period",
        invoiceNo: clientInvoice?.invoice_no || `BT/2026-27/${String(client.id).slice(-4).toUpperCase()}`,
        invoiceDate: clientInvoice?.due_date
          ? new Date(clientInvoice.due_date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        pureAgentGovtFeesInr: pureAgent,
        caProfessionalFeeInr: fee,
        benefits: [
          {
            id: `BEN-${client.id}-01`,
            category: "ITC_RECONCILED",
            title: "Input Tax Credit 2B Matching & Ineligible Credit Shield",
            description: "Purchase ledger audit against portal GSTR-2B under Section 16(2).",
            statutoryReference: "Section 16(2) CGST Act & Rule 88D",
            financialBenefitInr: Math.round(fee * 12),
            badgeLabel: "ITC Protected",
          },
          {
            id: `BEN-${client.id}-02`,
            category: "PENALTY_SAVED",
            title: "Statutory Deadline Protection",
            description: "Compliance tracking prior to statutory cutoffs under CGST & Income-tax Act.",
            statutoryReference: "Section 47 CGST & Section 234E Income Tax",
            financialBenefitInr: 5000,
            badgeLabel: "Penalties Saved",
          },
        ],
      });
    });

    const enrichedSummaries = await Promise.all(
      summaries.map(async (item) => {
        const upiLinks = generateNpciUpiDeepLinks({
          firmVpa,
          merchantName,
          amount: item.netTotalPayableInr,
          invoiceNo: item.invoiceNo,
          clientName: item.clientName,
        });
        const qrDataUrl = await generateUpiQrDataUrl(upiLinks.universalUri, { width: 240 });
        const whatsAppCopy = generateWhatsAppValueCard(item, upiLinks, merchantName);
        return { ...item, firmVpa, merchantName, upiLinks, qrDataUrl, whatsAppCopy };
      })
    );

    return NextResponse.json({
      success: true,
      count: enrichedSummaries.length,
      firmVpa,
      merchantName,
      summaries: enrichedSummaries,
    });
  } catch (err: any) {
    console.error("GET /api/billing/value-statement error:", err);
    return NextResponse.json({ success: false, error: "Failed to load value statements." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json(
        { success: false, error: "Firm staff authorization required." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const body = await req.json();
    const { firmVpa, merchantName, amount, invoiceNo, clientName } = body;
    const upiUri = generateNpciDynamicUpiUri({
      vpa: firmVpa || DEFAULT_FIRM_BRANDING.firmUpiVpa,
      payeeName: merchantName || DEFAULT_FIRM_BRANDING.firmName,
      amount: Number(amount) || 0,
      invoiceNo: invoiceNo || "INV-2026",
      note: `Fee ${clientName || "Client"}`,
    });
    const qrDataUrl = await generateUpiQrDataUrl(upiUri, { width: 280 });
    return NextResponse.json({ success: true, upiUri, qrDataUrl });
  } catch (err: any) {
    console.error("POST /api/billing/value-statement error:", err);
    return NextResponse.json({ success: false, error: "Failed to generate value statement QR." }, { status: 500 });
  }
}
