import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid, appendPgAuditLog } from "@/lib/server/pgHelpers";
import {
  ensureBillingSchema,
  getIndianFyFromDate,
  allocateNextDocumentNumber,
} from "@/lib/server/billingSchema";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

function escapeXml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json({ success: false, error: "Staff authorization required." }, { status: 403 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    await ensureBillingSchema(pool);

    const type = request.nextUrl.searchParams.get("type") || "gstr1";
    const fy = request.nextUrl.searchParams.get("fy") || getIndianFyFromDate();

    const { rows: invRows } = await pool.query(
      `SELECT i.*, ce.entity_name, ce.gstin, ce.pan
       FROM public.invoices i
       JOIN public.client_entities ce ON ce.id = i.entity_id
       WHERE i.firm_id = $1 AND i.financial_year = $2
         AND COALESCE(i.document_type, 'TAX_INVOICE') IN ('TAX_INVOICE', 'CREDIT_NOTE')
       ORDER BY i.created_at ASC`,
      [firmId, fy]
    );

    if (type === "gstr1") {
      const b2b: any[] = [];
      const b2cs: any[] = [];
      const cdnr: any[] = [];
      const hsnMap = new Map<string, { sac: string; txval: number; iamt: number; camt: number; samt: number }>();

      for (const inv of invRows) {
        const txval = Number(inv.taxable_amount || 0);
        const gst = Number(inv.gst_amount || 0);
        const total = Number(inv.total_amount || 0);
        const isInter = Boolean(inv.is_inter_state);
        const iamt = isInter ? gst : 0;
        const camt = isInter ? 0 : Math.round(gst / 2);
        const samt = isInter ? 0 : gst - camt;
        const sac = inv.sac_code || "998231";

        const curHsn = hsnMap.get(sac) || { sac, txval: 0, iamt: 0, camt: 0, samt: 0 };
        curHsn.txval += txval;
        curHsn.iamt += iamt;
        curHsn.camt += camt;
        curHsn.samt += samt;
        hsnMap.set(sac, curHsn);

        if (inv.document_type === "CREDIT_NOTE" && inv.gstin) {
          cdnr.push({
            ctin: inv.gstin,
            nt_num: inv.invoice_no,
            nt_dt: new Date(inv.created_at).toISOString().split("T")[0],
            ntty: "C",
            val: total,
            txval,
            iamt,
            camt,
            samt,
          });
        } else if (inv.gstin) {
          b2b.push({
            ctin: inv.gstin,
            cname: inv.entity_name,
            inum: inv.invoice_no,
            idt: new Date(inv.created_at).toISOString().split("T")[0],
            val: total,
            pos: inv.gstin.slice(0, 2),
            txval,
            rt: 18,
            iamt,
            camt,
            samt,
          });
        } else {
          b2cs.push({
            sply_ty: isInter ? "INTER" : "INTRA",
            pos: DEFAULT_FIRM_BRANDING.gstin?.slice(0, 2) || "27",
            rt: 18,
            txval,
            iamt,
            camt,
            samt,
          });
        }
      }

      const payload = {
        gstin: DEFAULT_FIRM_BRANDING.gstin || "27AAACF2299R1ZG",
        fp: fy,
        b2b,
        b2cs,
        cdnr,
        hsn: { data: Array.from(hsnMap.values()) },
      };

      return new NextResponse(JSON.stringify(payload, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="GSTR1_Firm_Outward_${fy}.json"`,
        },
      });
    }

    // TallyPrime 3-Voucher XML (Sales + Receipt + TDS 194J Journal)
    const { rows: allocRows } = await pool.query(
      `SELECT pa.*, ce.entity_name, i.invoice_no
       FROM public.payment_allocations pa
       JOIN public.client_entities ce ON ce.id = pa.entity_id
       LEFT JOIN public.invoices i ON i.id = pa.invoice_id
       WHERE pa.firm_id = $1 AND pa.status = 'APPLIED'
       ORDER BY pa.allocation_date ASC`,
      [firmId]
    );

    const messages: string[] = [];
    for (const inv of invRows) {
      const dt = new Date(inv.created_at || Date.now()).toISOString().split("T")[0].replace(/-/g, "");
      const vType = inv.document_type === "CREDIT_NOTE" ? "Credit Note" : "Sales";
      const party = escapeXml(inv.entity_name);
      const nar = escapeXml(`${inv.service_description} (SAC ${inv.sac_code || "998231"})`);
      messages.push(
        `<TALLYMESSAGE xmlns:UDF="TallyUDF"><VOUCHER VCHTYPE="${vType}" ACTION="Create"><DATE>${dt}</DATE><VOUCHERNUMBER>${escapeXml(inv.invoice_no)}</VOUCHERNUMBER><PARTYLEDGERNAME>${party}</PARTYLEDGERNAME><NARRATION>${nar}</NARRATION><ALLLEDGERENTRIES.LIST><LEDGERNAME>${party}</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-${inv.total_amount}</AMOUNT></ALLLEDGERENTRIES.LIST><ALLLEDGERENTRIES.LIST><LEDGERNAME>Professional Fees (SAC 9982)</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${inv.taxable_amount}</AMOUNT></ALLLEDGERENTRIES.LIST><ALLLEDGERENTRIES.LIST><LEDGERNAME>Output GST @ 18%</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${inv.gst_amount}</AMOUNT></ALLLEDGERENTRIES.LIST></VOUCHER></TALLYMESSAGE>`
      );
    }

    for (const al of allocRows) {
      const dt = new Date(al.allocation_date || Date.now()).toISOString().split("T")[0].replace(/-/g, "");
      const party = escapeXml(al.entity_name);
      const cash = Number(al.cash_amount || 0);
      const tds = Number(al.tds_amount || 0);
      if (cash > 0) {
        messages.push(
          `<TALLYMESSAGE xmlns:UDF="TallyUDF"><VOUCHER VCHTYPE="Receipt" ACTION="Create"><DATE>${dt}</DATE><VOUCHERNUMBER>${escapeXml(al.receipt_ref)}</VOUCHERNUMBER><PARTYLEDGERNAME>${party}</PARTYLEDGERNAME><NARRATION>Fee receipt agst ${escapeXml(al.invoice_no || "")}</NARRATION><ALLLEDGERENTRIES.LIST><LEDGERNAME>${party}</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${cash}</AMOUNT></ALLLEDGERENTRIES.LIST><ALLLEDGERENTRIES.LIST><LEDGERNAME>Firm Bank Account</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-${cash}</AMOUNT></ALLLEDGERENTRIES.LIST></VOUCHER></TALLYMESSAGE>`
        );
      }
      if (tds > 0) {
        messages.push(
          `<TALLYMESSAGE xmlns:UDF="TallyUDF"><VOUCHER VCHTYPE="Journal" ACTION="Create"><DATE>${dt}</DATE><VOUCHERNUMBER>${escapeXml(al.receipt_ref)}-TDS</VOUCHERNUMBER><NARRATION>TDS u/s 194J deducted by ${party}</NARRATION><ALLLEDGERENTRIES.LIST><LEDGERNAME>TDS Receivable (AY ${fy})</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-${tds}</AMOUNT></ALLLEDGERENTRIES.LIST><ALLLEDGERENTRIES.LIST><LEDGERNAME>${party}</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${tds}</AMOUNT></ALLLEDGERENTRIES.LIST></VOUCHER></TALLYMESSAGE>`
        );
      }
    }

    const xml = `<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC><REQUESTDATA>${messages.join("\n")}</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml;charset=utf-8",
        "Content-Disposition": `attachment; filename="TallyPrime_3Voucher_Billing_${fy}.xml"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/billing/exports error:", error);
    return NextResponse.json({ success: false, error: "Export failed." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json({ success: false, error: "Partner authorization required." }, { status: 403 });
    }
    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    await ensureBillingSchema(pool);

    const { rows: inputRows } = await request.json();
    if (!Array.isArray(inputRows) || inputRows.length === 0) {
      return NextResponse.json({ success: false, error: "Array of import rows required." }, { status: 400 });
    }

    const { rows: entities } = await pool.query(
      "SELECT id, entity_name, pan, gstin FROM public.client_entities WHERE firm_id = $1",
      [firmId]
    );
    const byPan = new Map(entities.map((e: any) => [String(e.pan || "").toUpperCase(), e]));
    const byName = new Map(entities.map((e: any) => [String(e.entity_name || "").toLowerCase().trim(), e]));

    let imported = 0;
    let skipped = 0;

    for (const r of inputRows.slice(0, 500)) {
      const pan = String(r.pan || "").toUpperCase().trim();
      const name = String(r.clientName || r.entityName || "").toLowerCase().trim();
      const matched = (pan && byPan.get(pan)) || (name && byName.get(name));
      const amount = Number(r.amount || 0);
      if (!matched || !Number.isFinite(amount) || amount <= 0) {
        skipped++;
        continue;
      }

      const fy = r.financialYear || getIndianFyFromDate(r.dueDate);
      const invoiceNo = r.invoiceNo || (await allocateNextDocumentNumber(pool, firmId, "TAX_INVOICE", fy));
      const taxable = Number(r.taxableAmount) || Math.round(amount / 1.18);
      const gst = amount - taxable;
      const dueDate = r.dueDate || new Date().toISOString().split("T")[0];
      const status = r.status === "PAID" ? "PAID" : "PENDING";

      await pool.query(
        `INSERT INTO public.invoices (
          firm_id, entity_id, invoice_no, service_description, sac_code,
          taxable_amount, gst_rate, gst_amount, total_amount, paid_amount, due_date, status, financial_year
        ) VALUES ($1, $2, $3, $4, $5, $6, 18, $7, $8, $9, $10::date, $11::invoice_status, $12)`,
        [
          firmId,
          matched.id,
          invoiceNo,
          r.serviceDescription || "Opening Receivable / Migrated Invoice",
          r.sacCode || "998231",
          taxable,
          gst,
          amount,
          status === "PAID" ? amount : 0,
          dueDate,
          status,
          fy,
        ]
      );
      imported++;
    }

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Partner",
      actorRole: "PARTNER",
      entityName: `${imported} Imported Invoices`,
      action: "Bulk Receivables Import",
      details: `Imported ${imported} historical/opening invoice(s) (${skipped} skipped).`,
      category: "INVOICE",
    });

    return NextResponse.json({ success: true, imported, skipped });
  } catch (error: any) {
    console.error("POST /api/billing/exports error:", error);
    return NextResponse.json({ success: false, error: "Import failed." }, { status: 500 });
  }
}
