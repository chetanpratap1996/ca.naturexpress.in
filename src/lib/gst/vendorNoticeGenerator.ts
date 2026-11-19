/**
 * Brains & Taxes — Statutory Vendor Notice & Defaulting Communication Generator
 * 
 * Statutory Authority:
 * - Section 16(2)(aa) of CGST Act, 2017: Invoice furnishing requirement in GSTR-1 / IFF
 * - Section 16(2)(c) of CGST Act, 2017: Actual payment of tax to government treasury
 * - Rule 37A of CGST Rules, 2017: Reversal of ITC for supplier non-furnishing of GSTR-3B
 * - Section 50(1) of CGST Act: 18% per annum statutory interest risk
 */

export interface PendingInvoiceItem {
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalTax: number;
  totalInvoiceValue: number;
  reason: "NOT_IN_GSTR_2B" | "TAX_MISMATCH" | "GSTR_3B_UNFILED";
  discrepancyDetails?: string;
}

export interface VendorNoticeParams {
  buyerEntityName: string;
  buyerGstin: string;
  vendorTradeName: string;
  vendorGstin: string;
  vendorContactPhone?: string;
  vendorContactEmail?: string;
  caFirmName?: string;
  taxPeriod: string; // e.g. "September 2026"
  invoices: PendingInvoiceItem[];
  paymentWithholdingDaysLimit?: number; // e.g. 7 days
}

export interface GeneratedNotice {
  noticeRef: string;
  generatedDate: string;
  vendorTradeName: string;
  vendorGstin: string;
  totalTaxAtRiskInr: number;
  totalInvoicesCount: number;
  whatsappMessageText: string;
  whatsappUrl: string;
  emailSubject: string;
  emailBodyHtml: string;
  emailBodyPlainText: string;
  legalSummary: string;
}

export class VendorNoticeGenerator {
  /**
   * Generates formatted WhatsApp and Email notices citing Section 16(2)(aa) & Rule 37A
   */
  public static generateNotice(params: VendorNoticeParams): GeneratedNotice {
    const noticeRef = `NOTC/GST/${params.buyerGstin.substring(2, 7)}/${Date.now().toString().slice(-6)}`;
    const limitDays = params.paymentWithholdingDaysLimit || 7;
    const firmName = params.caFirmName || "Chartered Accountants";

    let totalTax = 0;
    let totalTaxable = 0;
    for (const inv of params.invoices) {
      totalTax += inv.totalTax;
      totalTaxable += inv.taxableValue;
    }

    const formattedTax = totalTax.toLocaleString("en-IN", { maximumFractionDigits: 2 });
    const formattedTaxable = totalTaxable.toLocaleString("en-IN", { maximumFractionDigits: 2 });

    // 1. WhatsApp Message Text (Markdown with emojis and bolding)
    const waLines: string[] = [
      `⚠️ *STATUTORY GST NOTICE: PENDING GSTR-1 / 3B UPLOAD*`,
      `*Ref:* ${noticeRef} | *Date:* ${new Date().toLocaleDateString("en-IN")}`,
      ``,
      `To,`,
      `*${params.vendorTradeName}* (GSTIN: ${params.vendorGstin})`,
      ``,
      `Dear Finance Team,`,
      `During the GSTR-2B statutory reconciliation for our mutual client *${params.buyerEntityName}* (GSTIN: ${params.buyerGstin}) for *${params.taxPeriod}*, the following invoice(s) are missing or non-compliant on the GST Portal:`,
      ``
    ];

    params.invoices.forEach((inv, idx) => {
      waLines.push(
        `*${idx + 1}. Inv:* ${inv.invoiceNumber} | *Date:* ${inv.invoiceDate}`,
        `   Taxable: ₹${inv.taxableValue.toLocaleString("en-IN")} | GST: *₹${inv.totalTax.toLocaleString("en-IN")}*`,
        `   Status: ${inv.reason === "NOT_IN_GSTR_2B" ? "❌ Missing in GSTR-2B (GSTR-1 not uploaded)" : inv.reason === "GSTR_3B_UNFILED" ? "⚠️ Rule 37A Alert: GSTR-3B unfiled" : "⚠️ Value/Tax mismatch"}`
      );
    });

    waLines.push(
      ``,
      `📊 *Total Tax Credit at Risk:* ₹${formattedTax} (Taxable: ₹${formattedTaxable})`,
      ``,
      `⚖️ *LEGAL NOTICE UNDER SECTION 16(2)(aa) & RULE 37A OF CGST ACT:*`,
      `As per statutory amendments under Section 16(2)(aa), input tax credit is legally unavailable to the recipient unless uploaded in your GSTR-1/IFF and furnished to the government.`,
      ``,
      `🚨 *ACTION REQUIRED WITHIN ${limitDays} DAYS:*`,
      `1. Please upload/rectify the above invoice(s) in your immediate GSTR-1 / IFF filing.`,
      `2. Ensure GSTR-3B tax payment is furnished to avoid Rule 37A credit reversal.`,
      `3. In absence of portal reflection within ${limitDays} days, we have instructed our accounts department to *withhold the GST amount of ₹${formattedTax}* from upcoming payment releases or issue a debit note.`,
      ``,
      `Issued on behalf of Accounts & Taxation,`,
      `*${params.buyerEntityName}*`,
      `Audited via ${firmName}`
    );

    const waText = waLines.join("\n");
    const cleanPhone = (params.vendorContactPhone || "").replace(/[^0-9]/g, "");
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`
      : `https://wa.me/?text=${encodeURIComponent(waText)}`;

    // 2. Email Subject & Body
    const emailSubject = `URGENT: Statutory Requisition to Upload Invoice(s) in GSTR-1 for ${params.buyerEntityName} (GST Exposure: ₹${formattedTax})`;

    const emailBodyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; color: #1e293b; line-height: 1.5; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 20px 24px; color: #ffffff;">
          <h2 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 700; color: #f8fafc;">STATUTORY REQUISITION UNDER SECTION 16(2)(aa) & RULE 37A</h2>
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">Notice Ref: ${noticeRef} | Date: ${new Date().toLocaleDateString("en-IN")}</p>
        </div>
        
        <div style="padding: 24px;">
          <p style="margin: 0 0 16px 0; font-size: 14px;"><strong>To,</strong><br/>
          <strong>Finance & Accounts Department</strong><br/>
          ${params.vendorTradeName}<br/>
          GSTIN: <code>${params.vendorGstin}</code></p>

          <p style="margin: 0 0 16px 0; font-size: 14px;"><strong>Subject:</strong> Non-reflection of tax invoices in GSTR-2B of <strong>${params.buyerEntityName}</strong> (GSTIN: <code>${params.buyerGstin}</code>) for <strong>${params.taxPeriod}</strong>.</p>

          <p style="margin: 0 0 16px 0; font-size: 13px; color: #475569;">Dear Vendor / Associate,</p>
          <p style="margin: 0 0 16px 0; font-size: 13px; color: #475569;">During our monthly statutory compliance audit for <strong>${params.taxPeriod}</strong>, it was observed that the following purchase transactions booked in our accounting system do not appear in our auto-populated GSTR-2B statement on the GST Portal:</p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align: left;">
                <th style="padding: 10px; border: 1px solid #cbd5e1;">#</th>
                <th style="padding: 10px; border: 1px solid #cbd5e1;">Invoice No</th>
                <th style="padding: 10px; border: 1px solid #cbd5e1;">Date</th>
                <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Taxable (₹)</th>
                <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">GST (₹)</th>
                <th style="padding: 10px; border: 1px solid #cbd5e1;">Discrepancy</th>
              </tr>
            </thead>
            <tbody>
              ${params.invoices.map((inv, idx) => `
                <tr>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${idx + 1}</td>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: 600;">${inv.invoiceNumber}</td>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${inv.invoiceDate}</td>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right;">${inv.taxableValue.toLocaleString("en-IN")}</td>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #b91c1c;">${inv.totalTax.toLocaleString("en-IN")}</td>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #64748b;">${inv.reason === "NOT_IN_GSTR_2B" ? "Omitted in GSTR-1" : inv.reason === "GSTR_3B_UNFILED" ? "GSTR-3B Default (Rule 37A)" : "Value Mismatch"}</td>
                </tr>
              `).join("")}
              <tr style="background-color: #f8fafc; font-weight: 700;">
                <td colspan="3" style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Total Exposure:</td>
                <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">₹${formattedTaxable}</td>
                <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; color: #b91c1c;">₹${formattedTax}</td>
                <td style="padding: 10px; border: 1px solid #cbd5e1;"></td>
              </tr>
            </tbody>
          </table>

          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px; margin-bottom: 20px; font-size: 13px; color: #991b1b;">
            <strong>STATUTORY MANDATE:</strong> Under <strong>Section 16(2)(aa)</strong> of the Central Goods and Services Tax Act, 2017, input tax credit cannot be availed by our client unless the supplier accurately reports the invoice in Form GSTR-1 and the same is communicated to the recipient in Form GSTR-2B. Furthermore, under <strong>Rule 37A</strong>, failure to file GSTR-3B results in mandatory credit reversal with statutory interest under Section 50.
          </div>

          <p style="margin: 0 0 16px 0; font-size: 13px; color: #334155;">
            <strong>Requested Action:</strong> Please ensure that these invoice(s) are uploaded in your upcoming GSTR-1 filing (or amended via IFF) and the corresponding GSTR-3B tax is discharged within <strong>${limitDays} calendar days</strong>.<br/><br/>
            <em>Kindly note that if these invoices are not reflected in our GSTR-2B within the specified time, our finance division will be constrained to <strong>withhold the GST component of ₹${formattedTax}</strong> against future supplier disbursements or raise debit notes accordingly.</em>
          </p>

          <p style="margin: 24px 0 0 0; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            Yours sincerely,<br/>
            <strong>Accounts & Taxation Division</strong><br/>
            ${params.buyerEntityName}<br/>
            <em>Verified via ${firmName} Practice OS</em>
          </p>
        </div>
      </div>
    `;

    return {
      noticeRef,
      generatedDate: new Date().toISOString(),
      vendorTradeName: params.vendorTradeName,
      vendorGstin: params.vendorGstin,
      totalTaxAtRiskInr: totalTax,
      totalInvoicesCount: params.invoices.length,
      whatsappMessageText: waText,
      whatsappUrl: waUrl,
      emailSubject,
      emailBodyHtml,
      emailBodyPlainText: waText,
      legalSummary: `Statutory notice prepared for ${params.vendorTradeName} (${params.invoices.length} invoices, Tax: INR ${formattedTax}). Action timeline: ${limitDays} days.`
    };
  }
}
