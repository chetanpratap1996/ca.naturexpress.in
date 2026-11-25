/**
 * TallyPrime Live XML Server Connector (localhost:9000)
 * Pulls Purchase & Sales vouchers directly from running TallyPrime Gateway XML Server.
 */

import { parseTallyPurchaseXml } from "@/lib/parsers/gstr2bParser";
import { BooksPurchaseInvoice } from "@/lib/gst/recoMatcher";
import { OutwardSalesInvoice } from "@/lib/gst/gstr1Engine";

export function buildTallyVoucherRequestXml(params: {
  companyName?: string;
  fromDateYYYYMMDD: string;
  toDateYYYYMMDD: string;
  voucherType: "Purchase" | "Sales";
}) {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>GstVoucherCollection</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        ${params.companyName ? `<SVCURRENTCOMPANY>${params.companyName.replace(/&/g, "&amp;")}</SVCURRENTCOMPANY>` : ""}
        <SVFROMDATE>${params.fromDateYYYYMMDD}</SVFROMDATE>
        <SVTODATE>${params.toDateYYYYMMDD}</SVTODATE>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="GstVoucherCollection">
            <TYPE>Vouchers : VoucherType</TYPE>
            <CHILDOF>${params.voucherType}</CHILDOF>
            <BELONGSTO>Yes</BELONGSTO>
            <FETCH>DATE,VOUCHERTYPENAME,VOUCHERNUMBER,REFERENCE,REFERENCEDATE,PARTYLEDGERNAME,PARTYGSTIN,ALLLEDGERENTRIES.LIST</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

export async function pullPurchaseVouchersFromTallyPrime(params: {
  tallyUrl?: string;
  companyName?: string;
  fromDateYYYYMMDD: string;
  toDateYYYYMMDD: string;
}): Promise<{ ok: boolean; invoices: BooksPurchaseInvoice[]; error?: string }> {
  const url = params.tallyUrl || "http://localhost:9000";
  const xmlBody = buildTallyVoucherRequestXml({
    companyName: params.companyName,
    fromDateYYYYMMDD: params.fromDateYYYYMMDD,
    toDateYYYYMMDD: params.toDateYYYYMMDD,
    voucherType: "Purchase",
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/xml" },
      body: xmlBody,
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      return { ok: false, invoices: [], error: `Tally returned HTTP ${res.status}` };
    }
    const text = await res.text();
    const parsed = parseTallyPurchaseXml(text);
    return { ok: parsed.success, invoices: parsed.invoices, error: parsed.errors[0] };
  } catch (err: any) {
    return {
      ok: false,
      invoices: [],
      error: `TallyPrime XML Server not reachable at ${url} (${err?.message || "Enable Tally Gateway Port 9000 & CORS, or export Tally XML/Excel manually"}).`,
    };
  }
}

export async function pullSalesVouchersFromTallyPrime(params: {
  tallyUrl?: string;
  companyName?: string;
  fromDateYYYYMMDD: string;
  toDateYYYYMMDD: string;
  supplierStateCode: string;
}): Promise<{ ok: boolean; invoices: OutwardSalesInvoice[]; error?: string }> {
  const url = params.tallyUrl || "http://localhost:9000";
  const xmlBody = buildTallyVoucherRequestXml({
    companyName: params.companyName,
    fromDateYYYYMMDD: params.fromDateYYYYMMDD,
    toDateYYYYMMDD: params.toDateYYYYMMDD,
    voucherType: "Sales",
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/xml" },
      body: xmlBody,
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      return { ok: false, invoices: [], error: `Tally returned HTTP ${res.status}` };
    }
    const text = await res.text();
    const parsed = parseTallyPurchaseXml(text.replace(/<VOUCHERTYPENAME>Sales<\/VOUCHERTYPENAME>/gi, "<VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>"));
    const sales: OutwardSalesInvoice[] = parsed.invoices.map((b, i) => ({
      id: `tally-s-${i + 1}`,
      invoiceNumber: b.invoiceNumber,
      invoiceDate: b.invoiceDate,
      docType: b.voucherType === "CREDIT_NOTE" ? "CRN" : b.voucherType === "DEBIT_NOTE" ? "DBN" : "INV",
      recipientGstin: b.vendorGstin || undefined,
      recipientName: b.vendorName,
      placeOfSupply: (b.vendorGstin || "").slice(0, 2) || params.supplierStateCode,
      reverseCharge: false,
      taxRate: b.taxableValue > 0 ? Math.round((b.totalTax / b.taxableValue) * 100) : 0,
      taxableValue: b.taxableValue,
      igst: b.igst,
      cgst: b.cgst,
      sgst: b.sgst,
      cess: b.cess || 0,
      totalTax: b.totalTax,
      totalInvoiceValue: b.totalInvoiceValue,
      hsnCode: b.hsnCode,
      status: "ACTIVE",
    }));
    return { ok: sales.length > 0, invoices: sales };
  } catch (err: any) {
    return {
      ok: false,
      invoices: [],
      error: `TallyPrime XML Server not reachable at ${url} (${err?.message || "Connection failed"}).`,
    };
  }
}
