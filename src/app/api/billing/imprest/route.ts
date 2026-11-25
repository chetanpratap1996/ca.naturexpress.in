import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import {
  ImprestTransactionItem,
  calculateClientImprestSummary,
  generateRule33PureAgentCertificate,
} from "@/lib/billing/pureAgentImprest";
import { getPostgresPool } from "@/lib/server/postgres";
import {
  resolveFirmUuid,
  appendPgAuditLog,
  listWorkspaceRecords,
  upsertWorkspaceRecord,
} from "@/lib/server/pgHelpers";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const { searchParams } = new URL(request.url);
    const requestedEntityId = searchParams.get("entityId");
    const certFormat = searchParams.get("certificate") === "true";

    const effectiveEntityId = auth.role === "CLIENT" ? auth.clientEntityId || null : requestedEntityId;
    if (auth.role === "CLIENT" && requestedEntityId && auth.clientEntityId && requestedEntityId !== auth.clientEntityId) {
      return NextResponse.json({ success: false, error: "Forbidden for requested entity." }, { status: 403 });
    }

    const [{ rows: firmRows }, { rows: entRows }, txnRecs] = await Promise.all([
      pool.query("SELECT firm_name, gstin FROM public.firms WHERE id = $1 LIMIT 1", [firmId]),
      effectiveEntityId && UUID_REGEX.test(effectiveEntityId)
        ? pool.query("SELECT id, entity_name, pan FROM public.client_entities WHERE firm_id = $1 AND id = $2", [firmId, effectiveEntityId])
        : pool.query("SELECT id, entity_name, pan FROM public.client_entities WHERE firm_id = $1", [firmId]),
      listWorkspaceRecords<ImprestTransactionItem>(firmId, "IMPREST_TRANSACTION", effectiveEntityId),
    ]);

    const transactions = txnRecs.map((r) => r.payload);
    const firm = firmRows[0];

    if (effectiveEntityId) {
      const client = entRows.find((c: any) => c.id === effectiveEntityId);
      const clientName = client?.entity_name || "Client Entity";
      const clientPan = client?.pan || "";
      const summary = calculateClientImprestSummary(effectiveEntityId, clientName, transactions);
      const clientTxns = transactions.filter((t) => t.entityId === effectiveEntityId);

      if (certFormat) {
        const certificateText = generateRule33PureAgentCertificate(
          clientName,
          clientPan,
          summary,
          firm?.firm_name || DEFAULT_FIRM_BRANDING.firmName,
          firm?.gstin || DEFAULT_FIRM_BRANDING.gstin || ""
        );
        return NextResponse.json({ success: true, certificateText, summary });
      }

      return NextResponse.json({
        success: true,
        entityId: effectiveEntityId,
        clientName,
        summary,
        transactions: clientTxns,
      });
    }

    let totalAdvancesAll = 0;
    let totalDisbursedAll = 0;
    let totalRefundedAll = 0;
    const clientSummaries: Record<string, ReturnType<typeof calculateClientImprestSummary>> = {};

    for (const c of entRows) {
      const sum = calculateClientImprestSummary(c.id, c.entity_name, transactions);
      clientSummaries[c.id] = sum;
      totalAdvancesAll += sum.totalAdvancesReceived;
      totalDisbursedAll += sum.totalDisbursedToGovt;
      totalRefundedAll += sum.totalRefunded;
    }

    return NextResponse.json({
      success: true,
      metrics: {
        totalAdvancesReceived: totalAdvancesAll,
        totalDisbursedToGovt: totalDisbursedAll,
        totalRefunded: totalRefundedAll,
        netEscrowBalance: totalAdvancesAll - totalDisbursedAll - totalRefundedAll,
        deficitClientsCount: Object.values(clientSummaries).filter((s) => s.isDeficit).length,
        totalClientsWithImprest: Object.keys(clientSummaries).length,
      },
      clientSummaries,
      transactions,
    });
  } catch (error: any) {
    console.error("Failed to fetch imprest ledger:", error);
    return NextResponse.json({ success: false, error: "Failed to load imprest ledger." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json(
        { success: false, error: "Only CA Firm Staff can record statutory disbursements." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const body = await request.json();

    if (!body.entityId || !UUID_REGEX.test(String(body.entityId)) || !body.amount || !body.transactionType) {
      return NextResponse.json(
        { success: false, error: "Valid entityId, amount, and transactionType are required." },
        { status: 400 }
      );
    }

    const entRes = await pool.query(
      "SELECT id, entity_name, pan FROM public.client_entities WHERE id = $1 AND firm_id = $2 LIMIT 1",
      [body.entityId, firmId]
    );
    if (entRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Client entity not found." }, { status: 404 });
    }
    const client = entRes.rows[0];

    const newTransaction: ImprestTransactionItem = {
      id: `IMP-${Date.now().toString().slice(-6)}`,
      entityId: client.id,
      entityName: client.entity_name,
      clientPan: client.pan,
      transactionType: body.transactionType,
      category: body.category || "GENERAL_GOVT_CHALLAN",
      amount: Math.abs(Number(body.amount)),
      date: body.date || new Date().toISOString().split("T")[0],
      description:
        body.description ||
        (body.transactionType === "ADVANCE_RECEIVED"
          ? "Statutory Imprest Advance Received"
          : "Statutory Government Disbursement"),
      govtPortalRef: body.govtPortalRef,
      challanNumber: body.challanNumber,
      bsrCode: body.bsrCode,
      paymentMode: body.paymentMode || "NET_BANKING_FIRM_ESCROW",
      status: "CONFIRMED",
      articlePreparedBy: auth.userName || "Firm Staff",
      partnerApprovedBy: auth.role === "PARTNER" ? auth.userName || DEFAULT_FIRM_BRANDING.managingPartner : DEFAULT_FIRM_BRANDING.managingPartner,
      pureAgentRule33Compliant: true,
    };

    await upsertWorkspaceRecord({
      firmId,
      entityId: client.id,
      recordType: "IMPREST_TRANSACTION",
      matchKey: "id",
      matchValue: newTransaction.id,
      payload: newTransaction,
    });

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Firm Staff",
      actorRole: auth.role || "ARTICLE",
      entityId: client.id,
      entityName: client.entity_name,
      action: body.transactionType === "ADVANCE_RECEIVED" ? "IMPREST_ADVANCE_DEPOSIT" : "STATUTORY_GOVT_DISBURSEMENT",
      details: `Rule 33 Pure Agent ${body.transactionType}: ₹${newTransaction.amount.toLocaleString("en-IN")} [${newTransaction.category}]`,
      category: "PAY_RELEASE",
    });

    const existingTxns = await listWorkspaceRecords<ImprestTransactionItem>(firmId, "IMPREST_TRANSACTION", client.id);
    const updatedSummary = calculateClientImprestSummary(
      client.id,
      client.entity_name,
      existingTxns.map((r) => r.payload)
    );

    return NextResponse.json({
      success: true,
      transaction: newTransaction,
      summary: updatedSummary,
    });
  } catch (error: any) {
    console.error("Failed to save imprest transaction:", error);
    return NextResponse.json({ success: false, error: "Failed to save imprest transaction." }, { status: 500 });
  }
}
