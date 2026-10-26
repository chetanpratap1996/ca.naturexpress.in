import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
import { ParsedBankStatement, BankTransactionItem } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const db = ensureDatabase();
    const searchParams = request.nextUrl.searchParams;
    const entityId = searchParams.get("entityId");

    const statements = entityId 
      ? (db.parsedStatements || []).filter((s) => s.entityId === entityId)
      : (db.parsedStatements || []);

    const vaults = entityId
      ? (db.passwordVaults || []).filter((v) => v.entityId === entityId)
      : (db.passwordVaults || []);

    return NextResponse.json({
      success: true,
      statements,
      vaults
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = ensureDatabase();
    const body = await request.json();
    const { action, entityId, fileName, customPassword, statementData } = body;

    const client = db.clients.find((c) => c.id === entityId) || db.clients[0];
    const clientName = client ? client.name : (entityId || "Client Entity");

    if (action === "TEST_DECRYPT_AND_PARSE") {
      // Simulate real bank PDF decryption using Client Password Vault
      const vault = (db.passwordVaults || []).find((v) => v.entityId === entityId);
      const usedPassword = customPassword || vault?.pdfPasswordPattern || client?.pan || "AAACA1294F";

      // Create new parsed statement record with realistic Indian banking transactions
      const newParsed: ParsedBankStatement = statementData || {
        id: `STMT-${Date.now().toString().slice(-6)}`,
        entityId: entityId || db.clients[0]?.id || "CLI-001",
        bankName: vault?.bankName || "State Bank of India (Current A/c *8192)",
        statementPeriod: "01-Oct-2026 to 24-Oct-2026",
        openingBalance: 2450000,
        closingBalance: 4120800,
        totalDeposits: 5200000,
        totalWithdrawals: 3529200,
        transactionCount: 6,
        parsedAt: new Date().toISOString(),
        passwordBypassed: true,
        sourceFile: fileName || "WhatsApp_Statement_Oct2026.pdf",
        transactions: [
          {
            id: `TXN-${Date.now()}-1`,
            date: "02-Oct-2026",
            description: "RTGS_INWARD_TATA_CONSULTING_INV_102",
            refNo: "RTGS9201948",
            withdrawal: 0,
            deposit: 2200000,
            balance: 4650000,
            aiSuggestedCategory: "SALES_RECEIPT",
            confidenceScore: 0.99,
            verified: true
          },
          {
            id: `TXN-${Date.now()}-2`,
            date: "06-Oct-2026",
            description: "CHALLAN_281_TDS_SEPTEMBER_TAX_DEPOSIT",
            refNo: "OLTAS849102",
            withdrawal: 185000,
            deposit: 0,
            balance: 4465000,
            aiSuggestedCategory: "GST_CHALLAN",
            confidenceScore: 0.98,
            verified: true
          },
          {
            id: `TXN-${Date.now()}-3`,
            date: "14-Oct-2026",
            description: "NEFT_OUT_ACC_CEMENT_SUPPLIERS",
            refNo: "NEFT110294",
            withdrawal: 1250000,
            deposit: 0,
            balance: 3215000,
            aiSuggestedCategory: "VENDOR_PAYMENT",
            confidenceScore: 0.96,
            verified: true
          },
          {
            id: `TXN-${Date.now()}-4`,
            date: "19-Oct-2026",
            description: "GST_CASH_PMT06_SEPTEMBER_GSTR3B",
            refNo: "CPIN4401928",
            withdrawal: 1420000,
            deposit: 0,
            balance: 1795000,
            aiSuggestedCategory: "GST_CHALLAN",
            confidenceScore: 0.99,
            verified: true
          },
          {
            id: `TXN-${Date.now()}-5`,
            date: "22-Oct-2026",
            description: "DIRECTOR_SALARY_OCT_ADVANCE",
            refNo: "CMS390192",
            withdrawal: 300000,
            deposit: 0,
            balance: 1495000,
            aiSuggestedCategory: "DIRECTOR_REMUNERATION",
            confidenceScore: 0.95,
            verified: true
          },
          {
            id: `TXN-${Date.now()}-6`,
            date: "24-Oct-2026",
            description: "RTGS_INWARD_LARSEN_TOUBRO_PROJECT_RETENTION",
            refNo: "RTGS889102",
            withdrawal: 0,
            deposit: 3000000,
            balance: 4495000,
            aiSuggestedCategory: "SALES_RECEIPT",
            confidenceScore: 0.98,
            verified: true
          }
        ]
      };

      if (!db.parsedStatements) db.parsedStatements = [];
      db.parsedStatements.unshift(newParsed);

      // Auto-update any matching bank statement task to IN_PREPARATION
      if (db.tasks) {
        db.tasks = db.tasks.map((t) => {
          if (t.entityId === entityId && t.status === "DOCUMENTS_AWAITED") {
            return {
              ...t,
              status: "IN_PREPARATION",
              missingDocumentsCount: Math.max(0, t.missingDocumentsCount - 1),
              missingDocumentsList: (t.missingDocumentsList || []).filter((d) => !d.toLowerCase().includes("bank"))
            };
          }
          return t;
        });
      }

      await logAuditEvent(
        "WhatsApp AI Engine",
        "SYSTEM",
        clientName,
        "Auto-Decrypted Bank Statement",
        `Parsed ${newParsed.transactions.length} transactions from ${newParsed.sourceFile}. Password bypassed using vault pattern (${usedPassword}).`,
        "WHATSAPP"
      );

      await saveDatabase(db);
      return NextResponse.json({
        success: true,
        message: "Bank statement successfully unlocked and parsed into tax categories",
        statement: newParsed
      });
    }

    if (action === "ADD_PASSWORD_VAULT_RULE") {
      const { bankName, accountNumberMasked, pdfPasswordPattern, notes } = body;
      const newVault = {
        id: `VAULT-${Date.now().toString().slice(-4)}`,
        entityId: entityId || db.clients[0]?.id || "CLI-001",
        bankName: bankName || "HDFC Bank",
        accountNumberMasked: accountNumberMasked || "XXXX-XXXX-0000",
        pdfPasswordPattern: pdfPasswordPattern || "PAN uppercase",
        lastDecryptionSuccess: true,
        notes: notes || "Pattern recorded by firm article"
      };

      if (!db.passwordVaults) db.passwordVaults = [];
      db.passwordVaults.push(newVault);

      await logAuditEvent(
        "CA Article",
        "ARTICLE",
        clientName,
        "Registered Client PDF Password Pattern",
        `Added decryption pattern for ${newVault.bankName} (${newVault.accountNumberMasked})`,
        "DOCUMENT"
      );

      await saveDatabase(db);
      return NextResponse.json({ success: true, vault: newVault });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
