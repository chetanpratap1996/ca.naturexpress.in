/**
 * GOVERNMENT TAX NOTICE DECRYPTION & INTELLIGENT PARSER
 * Auto-Unlocks Encrypted Department PDFs using Client Master Credentials
 * 
 * Standard CBDT/ITD Encryption Formula:
 * - Lowercase PAN + Date of Birth / Incorporation (DDMMYYYY)
 * - e.g. "aabca8891d15082020"
 */

import { PDFParse } from "pdf-parse";
import { identifyNoticeSection, StatutoryNoticeDefinition } from "./statutoryLegalEngine";

export interface DecryptionResult {
  isPdf: boolean;
  isEncrypted: boolean;
  isUnlocked: boolean;
  usedPassword?: string;
  extractedText: string;
  error?: string;
}

export interface ParsedNoticeMetadata {
  dinOrRef: string;
  noticeSectionKey: string;
  noticeDefinition: StatutoryNoticeDefinition;
  department: "INCOME_TAX" | "GST" | "TDS" | "MCA";
  clientPan?: string;
  clientGstin?: string;
  clientName?: string;
  noticeDate: string;
  replyDeadline: string;
  daysRemaining: number;
  demandAmount: string;
  demandAmountNumeric: number;
  issuingAuthority: string;
  assessmentYearOrPeriod: string;
  allegationSummary: string;
}

export function generatePasswordCandidates(clientCredentials?: {
  pan?: string;
  incorporationYear?: number | string;
  dobOrDoi?: string;
  dob?: string;
  customPassword?: string;
}): string[] {
  const pan = (clientCredentials?.pan || "").trim();
  const candidates: string[] = [];

  // If user provided an explicit custom password, try that first
  if (clientCredentials?.customPassword) {
    candidates.push(clientCredentials.customPassword.trim());
  }

  // Generate standard CBDT candidate passwords
  if (pan) {
    const panLower = pan.toLowerCase();
    const panUpper = pan.toUpperCase();
    const rawDob = (clientCredentials?.dobOrDoi || clientCredentials?.dob || "").replace(/[^0-9]/g, "");

    if (rawDob && rawDob.length === 8) {
      candidates.push(`${panLower}${rawDob}`);
      candidates.push(`${panUpper}${rawDob}`);
      candidates.push(rawDob);
    }

    if (clientCredentials?.incorporationYear) {
      const year = clientCredentials.incorporationYear.toString();
      // Common incorporation formats (e.g. 0101YYYY, 3103YYYY, YYYY)
      candidates.push(`${panLower}0101${year}`);
      candidates.push(`${panLower}3103${year}`);
      candidates.push(`${panLower}${year}`);
      candidates.push(`${panUpper}${year}`);
    }

    // Naked PAN fallback
    candidates.push(panLower);
    candidates.push(panUpper);
  }

  return candidates;
}

/**
 * Attempts to extract text from a PDF buffer, trying automatic password candidates if encrypted
 */
export async function decryptAndExtractNoticePdf(
  pdfBuffer: Buffer,
  clientCredentials?: {
    pan?: string;
    incorporationYear?: number;
    dobOrDoi?: string; // e.g. "15-08-2020" or "15082020" or "2020"
    customPassword?: string;
  }
): Promise<DecryptionResult> {
  const candidates = generatePasswordCandidates(clientCredentials);

  // 1. First attempt unencrypted
  try {
    const parser = new PDFParse({ data: pdfBuffer });
    const textResult = await parser.getText();
    const fullText = typeof textResult === "string" ? textResult : (textResult as any)?.text || "";
    if (fullText && fullText.trim().length > 0) {
      return {
        isPdf: true,
        isEncrypted: false,
        isUnlocked: true,
        extractedText: fullText
      };
    }
  } catch (err: any) {
    const isPwError = 
      err.name === "PasswordException" || 
      (err.message && (err.message.includes("password") || err.message.includes("encrypted")));

    if (!isPwError) {
      // General parse error
      return {
        isPdf: true,
        isEncrypted: false,
        isUnlocked: false,
        extractedText: "",
        error: `Corrupt or unsupported PDF: ${err.message}`
      };
    }
  }

  // 2. Attempt Candidate Passwords
  for (const pwd of candidates) {
    try {
      const parser = new PDFParse({ data: pdfBuffer, password: pwd });
      const textResult = await parser.getText();
      const fullText = typeof textResult === "string" ? textResult : (textResult as any)?.text || "";
      if (fullText && fullText.trim().length > 0) {
        return {
          isPdf: true,
          isEncrypted: true,
          isUnlocked: true,
          usedPassword: pwd,
          extractedText: fullText
        };
      }
    } catch {
      // Continue trying next candidate
    }
  }

  // Password needed but none matched
  return {
    isPdf: true,
    isEncrypted: true,
    isUnlocked: false,
    extractedText: "",
    error: "This document is password-protected by the Income Tax Department. Please provide the 8-character password (usually PAN + Date of Birth / Incorporation in DDMMYYYY format)."
  };
}

/**
 * Intelligent Structural Extractor:
 * Parses DIN, statutory sections, dates, authorities, and demand amounts from raw notice text
 */
export function extractStatutoryNoticeMetadata(
  text: string,
  fileName: string = "Notice.pdf"
): ParsedNoticeMetadata {
  const definition = identifyNoticeSection(text);
  const upper = text.toUpperCase();

  // 1. DIN or Notice Reference Number
  let dinOrRef = "NOT_SPECIFIED";
  const itbaMatch = text.match(/ITBA\/[A-Za-z0-9/_.-]+(?:\([0-9]+\))?/i);
  const gstMatch = text.match(/ZA[0-9]{2}[0-9]{2}[0-9A-Z]{10}/i) || text.match(/(DRC|ASMT)-[0-9A-Za-z/_-]+/i);
  const cbicMatch = text.match(/CBIC\/[A-Za-z0-9/_.-]+(?:\([0-9]+\))?/i);

  if (itbaMatch) dinOrRef = itbaMatch[0];
  else if (gstMatch) dinOrRef = gstMatch[0];
  else if (cbicMatch) dinOrRef = cbicMatch[0];
  else {
    // Look for generic Ref No
    const refMatch = text.match(/(?:Reference No|Notice No|DIN|Ref No)[\s.:]+([A-Za-z0-9/_.-]+(?:\([0-9]+\))?)/i);
    if (refMatch) dinOrRef = refMatch[1].trim();
  }

  // 2. PAN and GSTIN
  const gstinMatch = text.match(/[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}/);
  const panMatch = text.match(/[A-Z]{5}[0-9]{4}[A-Z]{1}/);

  // 3. Demand Amount
  let demandAmount = "Nil / Under Scrutiny";
  let demandNumeric = 0;
  const demandMatch = text.match(/(?:demand|discrepancy|tax payable|escaped income|amount of|difference of)[\s:]*(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (demandMatch) {
    const rawVal = demandMatch[1].replace(/,/g, "");
    demandNumeric = parseFloat(rawVal) || 0;
    if (demandNumeric > 0) {
      demandAmount = `₹${demandNumeric.toLocaleString("en-IN")}`;
    }
  }

  // 4. Dates & Deadline
  const today = new Date();
  const noticeDate = today.toISOString().split("T")[0];
  const deadlineDate = new Date(today.getTime() + definition.statutoryTimeLimitDays * 24 * 60 * 60 * 1000);
  const replyDeadline = deadlineDate.toISOString().split("T")[0];

  // 5. Assessment Year or Period
  let period = "FY 2024-25";
  const ayMatch = text.match(/AY[\s:-]*([0-9]{4}-[0-9]{2,4})/i) || text.match(/(?:Assessment Year|A\.Y\.)[\s:-]*([0-9]{4}-[0-9]{2,4})/i);
  const fyMatch = text.match(/FY[\s:-]*([0-9]{4}-[0-9]{2,4})/i) || text.match(/(?:Financial Year|F\.Y\.)[\s:-]*([0-9]{4}-[0-9]{2,4})/i);
  if (ayMatch) period = `AY ${ayMatch[1]}`;
  else if (fyMatch) period = `FY ${fyMatch[1]}`;

  // 6. Allegation Summary
  let allegationSummary = `Statutory examination initiated under ${definition.sectionCode} regarding potential tax discrepancy or return verification.`;
  if (definition.id === "GST_ASMT_10_MISMATCH") {
    allegationSummary = `Excess ITC claimed in Form GSTR-3B compared to auto-populated Form GSTR-2B under Section 16(2)(aa). Demand/Difference: ${demandAmount}.`;
  } else if (definition.id === "GST_DRC_01B_LIABILITY") {
    allegationSummary = `Tax liability declared in GSTR-1 exceeds liability paid in GSTR-3B under Rule 88C. Discrepancy: ${demandAmount}.`;
  } else if (definition.id === "GST_DRC_01C_ITC") {
    allegationSummary = `Input Tax Credit claimed in GSTR-3B exceeds GSTR-2B under Rule 88D. Discrepancy: ${demandAmount}.`;
  } else if (definition.id === "ITD_148_REASSESSMENT") {
    allegationSummary = `High-value financial transactions or information flagged on Insight Portal alleged to have escaped assessment. Amount: ${demandAmount}.`;
  } else if (definition.id === "ITD_143_1_A_PRIMA_FACIE") {
    allegationSummary = `Proposed prima facie adjustment due to variance between gross receipts in AIS / Form 26AS vs ITR Revenue. Variance: ${demandAmount}.`;
  }

  return {
    dinOrRef,
    noticeSectionKey: definition.id,
    noticeDefinition: definition,
    department: definition.department,
    clientPan: panMatch ? panMatch[0] : undefined,
    clientGstin: gstinMatch ? gstinMatch[0] : undefined,
    noticeDate,
    replyDeadline,
    daysRemaining: definition.statutoryTimeLimitDays,
    demandAmount,
    demandAmountNumeric: demandNumeric,
    issuingAuthority: definition.issuingAuthorityLabel,
    assessmentYearOrPeriod: period,
    allegationSummary
  };
}
