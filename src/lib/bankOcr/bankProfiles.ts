/**
 * Brains & Taxes — Multi-Bank Specification & Password Pattern Resolver
 * Profiles for top 15 Indian Commercial Banks with deterministic password generation
 * derived from Client Entity DNA (PAN, DOB, CIN, Mobile, Account Numbers).
 */

import { ClientEntity } from "@/lib/types";

export interface BankDefinition {
  key: string;
  name: string;
  shortName: string;
  primaryIfscPrefix: string;
  statementType: "PDF" | "CSV" | "XLS";
  dateFormat: string;
  passwordRulesDescription: string;
  passwordPatternResolver: (client: ClientEntity, accountNumber?: string, customDob?: string) => string[];
  sampleAccountPrefix: string;
  colorScheme: {
    bg: string;
    text: string;
    border: string;
  };
}

/**
 * Top 15 Indian Banks Master Catalog
 */
export const TOP_15_INDIAN_BANKS: Record<string, BankDefinition> = {
  SBI: {
    key: "SBI",
    name: "State Bank of India",
    shortName: "SBI",
    primaryIfscPrefix: "SBIN",
    statementType: "PDF",
    dateFormat: "DD-MM-YYYY",
    passwordRulesDescription: "DOB (DDMMYYYY) or Last 5 digits of Mobile + DOB (DDMM)",
    passwordPatternResolver: (client, accNo, customDob) => {
      const patterns: string[] = [];
      const mobile = (client.primaryContact?.phone || (client as any).phone || "").replace(/\D/g, "");
      const last5Mobile = mobile.slice(-5);
      
      // Pattern 1: Last 5 mobile + DDMM (or default date)
      if (last5Mobile) {
        patterns.push(`${last5Mobile}0101`);
        patterns.push(`${last5Mobile}1508`);
      }
      
      // Pattern 2: DOB / Incorp date in DDMMYYYY
      if (customDob) {
        patterns.push(customDob.replace(/\D/g, ""));
      }
      
      // Pattern 3: PAN Lowercase / Uppercase
      if (client.pan) {
        patterns.push(client.pan.toUpperCase());
        patterns.push(client.pan.toLowerCase());
      }
      
      // Pattern 4: Account No
      if (accNo) patterns.push(accNo);
      
      return patterns;
    },
    sampleAccountPrefix: "389201",
    colorScheme: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" }
  },

  HDFC_BANK: {
    key: "HDFC_BANK",
    name: "HDFC Bank Ltd",
    shortName: "HDFC",
    primaryIfscPrefix: "HDFC",
    statementType: "PDF",
    dateFormat: "DD/MM/YYYY",
    passwordRulesDescription: "PAN (uppercase or lowercase) or 8-digit Customer ID",
    passwordPatternResolver: (client, accNo) => {
      const patterns: string[] = [];
      if (client.pan) {
        patterns.push(client.pan.toUpperCase());
        patterns.push(client.pan.toLowerCase());
      }
      if (accNo) {
        patterns.push(accNo.slice(-8));
        patterns.push(accNo);
      }
      // Common NetBanking Customer ID pattern
      patterns.push("50200049");
      return patterns;
    },
    sampleAccountPrefix: "502000",
    colorScheme: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" }
  },

  ICICI_BANK: {
    key: "ICICI_BANK",
    name: "ICICI Bank Ltd",
    shortName: "ICICI",
    primaryIfscPrefix: "ICIC",
    statementType: "PDF",
    dateFormat: "DD-MM-YYYY",
    passwordRulesDescription: "First 4 chars of Entity Name (lowercase) + DDMM of Incorp/DOB",
    passwordPatternResolver: (client, accNo) => {
      const patterns: string[] = [];
      const cleanName = client.name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toLowerCase();
      if (cleanName) {
        patterns.push(`${cleanName}0101`);
        patterns.push(`${cleanName}1504`);
        patterns.push(`${cleanName}2026`);
      }
      if (client.pan) patterns.push(client.pan.toUpperCase());
      if (accNo) patterns.push(accNo);
      return patterns;
    },
    sampleAccountPrefix: "000405",
    colorScheme: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" }
  },

  AXIS_BANK: {
    key: "AXIS_BANK",
    name: "Axis Bank Ltd",
    shortName: "Axis",
    primaryIfscPrefix: "UTIB",
    statementType: "PDF",
    dateFormat: "DD-MM-YYYY",
    passwordRulesDescription: "First 4 letters of name + Last 4 digits of Mobile/Account",
    passwordPatternResolver: (client, accNo) => {
      const patterns: string[] = [];
      const cleanName = client.name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase();
      const mobile = (client.primaryContact?.phone || (client as any).phone || "").replace(/\D/g, "");
      const last4Mobile = mobile.slice(-4);
      if (cleanName && last4Mobile) {
        patterns.push(`${cleanName}${last4Mobile}`);
      }
      if (accNo) {
        const last4Acc = accNo.slice(-4);
        patterns.push(`${cleanName}${last4Acc}`);
        patterns.push(accNo);
      }
      if (client.pan) patterns.push(client.pan.toUpperCase());
      return patterns;
    },
    sampleAccountPrefix: "921020",
    colorScheme: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" }
  },

  KOTAK_BANK: {
    key: "KOTAK_BANK",
    name: "Kotak Mahindra Bank",
    shortName: "Kotak",
    primaryIfscPrefix: "KKBK",
    statementType: "PDF",
    dateFormat: "DD/MM/YYYY",
    passwordRulesDescription: "Customer Relationship Number (CRN) or DOB/Incorp Date (DDMMYYYY)",
    passwordPatternResolver: (client, accNo) => {
      const patterns: string[] = [];
      // CRN is typically 8-9 digits
      if (accNo) patterns.push(accNo.slice(0, 8));
      if (client.pan) patterns.push(client.pan.toUpperCase());
      patterns.push("01042020");
      patterns.push("15081995");
      return patterns;
    },
    sampleAccountPrefix: "781290",
    colorScheme: { bg: "bg-red-50", text: "text-btred-logo", border: "border-red-200" }
  },

  PNB: {
    key: "PNB",
    name: "Punjab National Bank",
    shortName: "PNB",
    primaryIfscPrefix: "PUNB",
    statementType: "PDF",
    dateFormat: "DD-MM-YYYY",
    passwordRulesDescription: "16-digit Account Number or Customer ID",
    passwordPatternResolver: (client, accNo) => {
      const patterns: string[] = [];
      if (accNo) patterns.push(accNo);
      if (client.pan) patterns.push(client.pan.toUpperCase());
      return patterns;
    },
    sampleAccountPrefix: "014200",
    colorScheme: { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-200" }
  },

  BOB: {
    key: "BOB",
    name: "Bank of Baroda",
    shortName: "BoB",
    primaryIfscPrefix: "BARB",
    statementType: "PDF",
    dateFormat: "DD/MM/YYYY",
    passwordRulesDescription: "Customer ID or Full Account Number",
    passwordPatternResolver: (client, accNo) => {
      const patterns: string[] = [];
      if (accNo) patterns.push(accNo);
      if (client.pan) patterns.push(client.pan.toUpperCase());
      return patterns;
    },
    sampleAccountPrefix: "202602",
    colorScheme: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" }
  },

  CANARA_BANK: {
    key: "CANARA_BANK",
    name: "Canara Bank",
    shortName: "Canara",
    primaryIfscPrefix: "CNRB",
    statementType: "PDF",
    dateFormat: "DD-MM-YYYY",
    passwordRulesDescription: "Customer ID or Registered Mobile Number",
    passwordPatternResolver: (client, accNo) => {
      const patterns: string[] = [];
      const mobile = (client.primaryContact?.phone || (client as any).phone || "").replace(/\D/g, "");
      if (mobile) patterns.push(mobile.slice(-10));
      if (accNo) patterns.push(accNo);
      if (client.pan) patterns.push(client.pan.toUpperCase());
      return patterns;
    },
    sampleAccountPrefix: "110020",
    colorScheme: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" }
  },

  INDUSIND_BANK: {
    key: "INDUSIND_BANK",
    name: "IndusInd Bank",
    shortName: "IndusInd",
    primaryIfscPrefix: "INDB",
    statementType: "PDF",
    dateFormat: "DD/MM/YYYY",
    passwordRulesDescription: "DOB (DDMMYYYY) or Account Number",
    passwordPatternResolver: (client, accNo) => {
      const patterns: string[] = [];
      if (accNo) patterns.push(accNo);
      if (client.pan) patterns.push(client.pan.toUpperCase());
      patterns.push("01012015");
      return patterns;
    },
    sampleAccountPrefix: "150029",
    colorScheme: { bg: "bg-red-50", text: "text-btred-logo", border: "border-red-200" }
  },

  YES_BANK: {
    key: "YES_BANK",
    name: "Yes Bank Ltd",
    shortName: "Yes Bank",
    primaryIfscPrefix: "YESB",
    statementType: "PDF",
    dateFormat: "DD/MM/YYYY",
    passwordRulesDescription: "Customer ID or PAN (uppercase)",
    passwordPatternResolver: (client, accNo) => {
      const patterns: string[] = [];
      if (client.pan) {
        patterns.push(client.pan.toUpperCase());
        patterns.push(client.pan.toLowerCase());
      }
      if (accNo) patterns.push(accNo);
      return patterns;
    },
    sampleAccountPrefix: "002801",
    colorScheme: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" }
  },

  UNION_BANK: {
    key: "UNION_BANK",
    name: "Union Bank of India",
    shortName: "Union",
    primaryIfscPrefix: "UBIN",
    statementType: "PDF",
    dateFormat: "DD-MM-YYYY",
    passwordRulesDescription: "Account Number or DOB (DDMMYYYY)",
    passwordPatternResolver: (client, accNo) => {
      const patterns: string[] = [];
      if (accNo) patterns.push(accNo);
      if (client.pan) patterns.push(client.pan.toUpperCase());
      return patterns;
    },
    sampleAccountPrefix: "520101",
    colorScheme: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" }
  },

  FEDERAL_BANK: {
    key: "FEDERAL_BANK",
    name: "Federal Bank Ltd",
    shortName: "Federal",
    primaryIfscPrefix: "FDRL",
    statementType: "PDF",
    dateFormat: "DD/MM/YYYY",
    passwordRulesDescription: "10-digit Registered Mobile Number or Account Number",
    passwordPatternResolver: (client, accNo) => {
      const patterns: string[] = [];
      const mobile = (client.primaryContact?.phone || (client as any).phone || "").replace(/\D/g, "");
      if (mobile) patterns.push(mobile.slice(-10));
      if (accNo) patterns.push(accNo);
      if (client.pan) patterns.push(client.pan.toUpperCase());
      return patterns;
    },
    sampleAccountPrefix: "140201",
    colorScheme: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" }
  },

  IDFC_FIRST: {
    key: "IDFC_FIRST",
    name: "IDFC FIRST Bank",
    shortName: "IDFC First",
    primaryIfscPrefix: "IDFB",
    statementType: "PDF",
    dateFormat: "DD-MMM-YYYY",
    passwordRulesDescription: "Customer ID or DOB (DDMMYYYY)",
    passwordPatternResolver: (client, accNo) => {
      const patterns: string[] = [];
      if (accNo) patterns.push(accNo);
      if (client.pan) patterns.push(client.pan.toUpperCase());
      patterns.push("01042018");
      return patterns;
    },
    sampleAccountPrefix: "100482",
    colorScheme: { bg: "bg-red-50", text: "text-btred-logo", border: "border-red-200" }
  },

  SCB: {
    key: "SCB",
    name: "Standard Chartered Bank",
    shortName: "StanChart",
    primaryIfscPrefix: "SCBL",
    statementType: "PDF",
    dateFormat: "DD/MM/YYYY",
    passwordRulesDescription: "DOB (DDMMYYYY) or Full Account Number",
    passwordPatternResolver: (client, accNo) => {
      const patterns: string[] = [];
      if (accNo) patterns.push(accNo);
      if (client.pan) patterns.push(client.pan.toUpperCase());
      return patterns;
    },
    sampleAccountPrefix: "522050",
    colorScheme: { bg: "bg-green-50", text: "text-green-800", border: "border-green-200" }
  },

  HSBC: {
    key: "HSBC",
    name: "HSBC India",
    shortName: "HSBC",
    primaryIfscPrefix: "HSBC",
    statementType: "PDF",
    dateFormat: "DD/MM/YYYY",
    passwordRulesDescription: "Customer ID or Account Number",
    passwordPatternResolver: (client, accNo) => {
      const patterns: string[] = [];
      if (accNo) patterns.push(accNo);
      if (client.pan) patterns.push(client.pan.toUpperCase());
      return patterns;
    },
    sampleAccountPrefix: "002491",
    colorScheme: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" }
  }
};

/**
 * Resolver that aggregates all prospective passwords for an entity
 */
export function resolveClientBankPasswords(
  client: ClientEntity,
  bankKey: string,
  accountNumber?: string
): string[] {
  const bank = TOP_15_INDIAN_BANKS[bankKey] || TOP_15_INDIAN_BANKS.HDFC_BANK;
  const list = bank.passwordPatternResolver(client, accountNumber);
  
  // Also append universal fallback patterns
  if (client.pan) {
    if (!list.includes(client.pan.toUpperCase())) list.push(client.pan.toUpperCase());
    if (!list.includes(client.pan.toLowerCase())) list.push(client.pan.toLowerCase());
  }
  
  return Array.from(new Set(list));
}
