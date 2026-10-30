import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ----------------------------------------------------------------------------
// STATUTORY REGULATORY VALIDATORS & COMPUTATION ENGINES (ICAI, GST, INCOME TAX)
// ----------------------------------------------------------------------------

export const VALID_PAN_ENTITY_TYPES = new Set([
  "C", // Company
  "P", // Person / Individual
  "H", // HUF
  "F", // Firm / LLP
  "A", // Association of Persons (AOP)
  "T", // Trust
  "B", // Body of Individuals (BOI)
  "L", // Local Authority
  "J", // Artificial Juridical Person
  "G", // Government Agency
  "K", // Krishak (Farmer / Other)
]);

/**
 * Validates Indian Permanent Account Number (PAN)
 * Format: 5 Alphabets + 4 Digits + 1 Alphabet (e.g. AAACA1294F)
 * 4th character must denote legal constitution
 */
export function isValidPan(pan?: string): boolean {
  if (!pan) return false;
  const clean = pan.trim().toUpperCase();
  if (clean.length !== 10) return false;
  const regex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  if (!regex.test(clean)) return false;
  const entityChar = clean.charAt(3);
  return VALID_PAN_ENTITY_TYPES.has(entityChar);
}

/**
 * Validates Indian Goods & Services Tax Identification Number (GSTIN)
 * Format: 2-digit State Code + 10-char PAN + 1 Entity Code + 'Z' + 1 Checksum Char
 */
export function isValidGstin(gstin?: string): boolean {
  if (!gstin) return false;
  const clean = gstin.trim().toUpperCase();
  if (clean.length !== 15) return false;
  
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!regex.test(clean)) return false;

  // Validate state code (01 to 38 or special codes 97, 99)
  const stateCode = parseInt(clean.substring(0, 2), 10);
  const isValidState = (stateCode >= 1 && stateCode <= 38) || stateCode === 97 || stateCode === 99;
  if (!isValidState) return false;

  // Validate embedded PAN
  const embeddedPan = clean.substring(2, 12);
  return isValidPan(embeddedPan);
}

/**
 * Strict ICAI UDIN Validator according to ICAI UDIN Directorate Mandates
 * Format: YY (Filing Year) + MRN (6 Digits) + 10 Alphanumeric Hash (Total 18 characters)
 */
export function validateIcaUdin(udin?: string): { isValid: boolean; reason?: string } {
  if (!udin) return { isValid: false, reason: "UDIN is required." };
  const clean = udin.trim().toUpperCase();
  
  if (clean.length !== 18) {
    return { isValid: false, reason: `UDIN must be exactly 18 characters long (currently ${clean.length}).` };
  }

  // 1. Year prefix (digits 0-1)
  const yearPrefix = clean.substring(0, 2);
  const currentYear2Digit = new Date().getFullYear() % 100;
  const yearNum = parseInt(yearPrefix, 10);
  if (isNaN(yearNum) || yearNum < 19 || yearNum > currentYear2Digit + 1) {
    return { isValid: false, reason: `Invalid UDIN year prefix '${yearPrefix}'. Must reflect financial verification year.` };
  }

  // 2. Member Registration Number (MRN) (digits 2-7, 6 digits)
  const mrn = clean.substring(2, 8);
  if (!/^\d{6}$/.test(mrn)) {
    return { isValid: false, reason: `Chars 3-8 of UDIN must be the 6-digit ICAI Membership Registration Number (MRN).` };
  }

  // 3. Unique Security Suffix (10 alphanumeric characters)
  const suffix = clean.substring(8);
  if (!/^[A-Z0-9]{10}$/.test(suffix)) {
    return { isValid: false, reason: `Last 10 characters must be alphanumeric document hash.` };
  }

  return { isValid: true };
}

/**
 * Section 16 MSMED Act Statutory Interest Calculator
 * Mandates compound interest with monthly rests at 3x the RBI Bank Rate (current bank rate: 6.5%, effective rate: 19.5% p.a.)
 */
export function calculateSection16MsmeInterest(
  principalAmount: number,
  overdueDays: number,
  rbiBankRate = 6.5
): {
  interestAmount: number;
  totalPayable: number;
  applicableAnnualRatePercent: number;
} {
  if (overdueDays <= 0 || principalAmount <= 0) {
    return { interestAmount: 0, totalPayable: principalAmount, applicableAnnualRatePercent: rbiBankRate * 3 };
  }

  const annualRate = (rbiBankRate * 3) / 100; // e.g. 19.5%
  const monthlyRate = annualRate / 12;
  const months = overdueDays / 30;

  // Compound Interest Formula with Monthly Rests: A = P * (1 + r)^n
  const totalPayable = principalAmount * Math.pow(1 + monthlyRate, months);
  const interestAmount = Math.max(0, Math.round(totalPayable - principalAmount));

  return {
    interestAmount,
    totalPayable: Math.round(totalPayable),
    applicableAnnualRatePercent: rbiBankRate * 3,
  };
}
