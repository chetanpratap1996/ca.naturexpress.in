import { NextRequest, NextResponse } from "next/server";
import { parseBankStatementPdfBuffer, parseBankStatementCsv } from "@/lib/parsers/bankStatementParser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const password = (formData.get("password") as string) || undefined;
    const clientPan = (formData.get("clientPan") as string) || undefined;
    const clientDob = (formData.get("clientDob") as string) || undefined;
    const accountNumber = (formData.get("accountNumber") as string) || undefined;
    const fallbackBalStr = formData.get("fallbackOpeningBal") as string | null;
    const fallbackOpeningBalance = fallbackBalStr ? parseFloat(fallbackBalStr) : 1000000;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No bank statement file uploaded." },
        { status: 400 }
      );
    }

    const fileName = file.name || "bank_statement.pdf";
    const isPdf = fileName.toLowerCase().endsWith(".pdf") || file.type.includes("pdf");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let result;

    if (isPdf) {
      result = await parseBankStatementPdfBuffer(buffer, {
        password,
        clientPan,
        clientDob,
        accountNumber,
        fallbackOpeningBalance
      });
    } else {
      const text = buffer.toString("utf-8");
      result = parseBankStatementCsv(text, {
        clientPan,
        clientDob,
        accountNumber,
        fallbackOpeningBalance
      });
    }

    if (result.requiresPassword) {
      return NextResponse.json({
        success: false,
        requiresPassword: true,
        error: result.passwordError || "The bank statement is password-protected. Please provide the statement password."
      }, { status: 401 });
    }

    if (!result.success && result.errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: result.errors.join("; "),
        warnings: result.warnings
      }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      bankName: result.bankName,
      bankKey: result.bankKey,
      accountNumber: result.accountNumber,
      ifsc: result.ifsc,
      openingBalance: result.openingBalance,
      closingBalance: result.closingBalance,
      totalDeposits: result.totalDeposits,
      totalWithdrawals: result.totalWithdrawals,
      transactions: result.transactions,
      brsReport: result.brsReport,
      warnings: result.warnings
    });
  } catch (err: any) {
    console.error("[BankStatementParserAPI] Error:", err);
    return NextResponse.json(
      { success: false, error: `Failed to process bank statement: ${err.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
