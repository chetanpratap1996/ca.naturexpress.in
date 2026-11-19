import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent, createNotification } from "@/lib/server/db";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { 
  ImprestTransactionItem, 
  DEFAULT_IMPREST_TRANSACTIONS,
  calculateClientImprestSummary,
  generateRule33PureAgentCertificate
} from "@/lib/billing/pureAgentImprest";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const db = ensureDatabase();
    const transactions = db.imprestTransactions || DEFAULT_IMPREST_TRANSACTIONS;
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get("entityId");
    const certFormat = searchParams.get("certificate") === "true";

    // If client logged in, force entityId
    const effectiveEntityId = auth.role === "CLIENT" && auth.clientEntityId ? auth.clientEntityId : entityId;

    if (effectiveEntityId) {
      const client = db.clients.find((c) => c.id === effectiveEntityId);
      const clientName = client?.name || "Client Entity";
      const clientPan = client?.pan || "AABCA8891D";
      const summary = calculateClientImprestSummary(effectiveEntityId, clientName, transactions);
      const clientTxns = transactions.filter((t) => t.entityId === effectiveEntityId);

      if (certFormat) {
        const certificateText = generateRule33PureAgentCertificate(
          clientName,
          clientPan,
          summary,
          db.firmMetrics.name || "GPA & Co., Chartered Accountants",
          (db.firmMetrics as any).gstin || "27AAACF2299R1ZG"
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

    // Practice-wide Imprest Summary
    let totalAdvancesAll = 0;
    let totalDisbursedAll = 0;
    let totalRefundedAll = 0;
    const clientSummaries: Record<string, ReturnType<typeof calculateClientImprestSummary>> = {};

    db.clients.forEach((c) => {
      const sum = calculateClientImprestSummary(c.id, c.name, transactions);
      clientSummaries[c.id] = sum;
      totalAdvancesAll += sum.totalAdvancesReceived;
      totalDisbursedAll += sum.totalDisbursedToGovt;
      totalRefundedAll += sum.totalRefunded;
    });

    const netEscrowBalanceAll = totalAdvancesAll - totalDisbursedAll - totalRefundedAll;
    const deficitCount = Object.values(clientSummaries).filter((s) => s.isDeficit).length;

    return NextResponse.json({
      success: true,
      metrics: {
        totalAdvancesReceived: totalAdvancesAll,
        totalDisbursedToGovt: totalDisbursedAll,
        totalRefunded: totalRefundedAll,
        netEscrowBalance: netEscrowBalanceAll,
        deficitClientsCount: deficitCount,
        totalClientsWithImprest: Object.keys(clientSummaries).length,
      },
      clientSummaries,
      transactions,
    });
  } catch (error: any) {
    console.error("Failed to fetch imprest ledger:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || (auth.role !== "PARTNER" && auth.role !== "ARTICLE")) {
      return NextResponse.json({ success: false, error: "Only CA Firm Staff can record statutory disbursements" }, { status: 403 });
    }

    const body = await request.json();
    const db = ensureDatabase();

    if (!body.entityId || !body.amount || !body.transactionType) {
      return NextResponse.json({ success: false, error: "Missing required fields: entityId, amount, transactionType" }, { status: 400 });
    }

    const matchedClient = db.clients.find((c) => c.id === body.entityId);
    const clientName = matchedClient?.name || body.entityName || "Client Entity";
    const clientPan = matchedClient?.pan || "AABCA8891D";

    const newTransaction: ImprestTransactionItem = {
      id: `IMP-${Date.now().toString().slice(-6)}`,
      entityId: body.entityId,
      entityName: clientName,
      clientPan,
      transactionType: body.transactionType,
      category: body.category || "GENERAL_GOVT_CHALLAN",
      amount: Math.abs(Number(body.amount)),
      date: body.date || new Date().toISOString().split("T")[0],
      description: body.description || (body.transactionType === "ADVANCE_RECEIVED" ? "Statutory Imprest Advance Received" : "Statutory Government Disbursement"),
      govtPortalRef: body.govtPortalRef,
      challanNumber: body.challanNumber,
      bsrCode: body.bsrCode,
      paymentMode: body.paymentMode || "NET_BANKING_FIRM_ESCROW",
      status: "CONFIRMED",
      articlePreparedBy: auth.userName || "Staff Assistant",
      partnerApprovedBy: auth.role === "PARTNER" ? (auth.userName || "Managing Partner") : "CA Gautam Joshi (Partner)",
      pureAgentRule33Compliant: true,
    };

    db.imprestTransactions = [newTransaction, ...(db.imprestTransactions || DEFAULT_IMPREST_TRANSACTIONS)];

    // Log statutory audit trail under ICAI SA 500
    await logAuditEvent(
      auth.userName || "CA Staff",
      auth.role as any,
      clientName,
      body.transactionType === "ADVANCE_RECEIVED" ? "IMPREST_ADVANCE_DEPOSIT" : "STATUTORY_GOVT_DISBURSEMENT",
      `Rule 33 Pure Agent ${body.transactionType}: ₹${newTransaction.amount.toLocaleString("en-IN")} [${newTransaction.category}] Ref: ${newTransaction.govtPortalRef || newTransaction.challanNumber || "Bank Transfer"}`,
      "PAY_RELEASE"
    );

    // Notify partner/billing desk if balance enters deficit
    const updatedSummary = calculateClientImprestSummary(body.entityId, clientName, db.imprestTransactions);
    if (updatedSummary.isDeficit) {
      await createNotification({
        title: `Imprest Deficit Alert: ${clientName}`,
        message: `Statutory disbursement of ₹${newTransaction.amount.toLocaleString("en-IN")} caused an escrow deficit of ₹${Math.abs(updatedSummary.currentAvailableBalance).toLocaleString("en-IN")}. Send WhatsApp top-up requisition.`,
        category: "BILLING",
        priority: "HIGH",
        entityId: body.entityId,
      });
    }

    await saveDatabase(db);

    return NextResponse.json({
      success: true,
      transaction: newTransaction,
      summary: updatedSummary,
    });
  } catch (error: any) {
    console.error("Failed to save imprest transaction:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
