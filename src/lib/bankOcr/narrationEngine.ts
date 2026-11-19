/**
 * Brains & Taxes — Indian Banking Narration Dissection & Ledger Mapping Engine
 * 1000% deterministic regex parsing of Indian bank transaction narrations
 * with statutory tax split (GST / TDS / Advance Tax / EPFO) and double-entry mapping.
 */

export type TransactionMode = 
  | "UPI"
  | "NEFT"
  | "RTGS"
  | "IMPS"
  | "ACH"
  | "CHEQUE"
  | "TAX_GOVT"
  | "BANK_CHARGES"
  | "SALARY"
  | "CARD_POS"
  | "INTEREST"
  | "CONTRA"
  | "OTHER";

export interface DissectedNarration {
  rawNarration: string;
  mode: TransactionMode;
  cleanCounterparty: string;
  referenceNo: string;
  vpa?: string;
  taxDetails?: {
    type: "GST" | "INCOME_TAX_ADVANCE" | "TDS_281" | "EPFO_ESIC" | "MCA21";
    challanNo?: string;
    bsrCode?: string;
    cpin?: string;
    gstin?: string;
    section?: string;
  };
  suggestedLedger: string;
  suggestedVoucherType: "Payment" | "Receipt" | "Contra";
  category: "Statutory" | "Opex" | "Revenue" | "Payroll" | "Banking" | "Contra" | "Suspense";
  confidence: number;
  matchedRule: string;
  gstSplitEligible?: boolean;
}

/**
 * Standard Indian Chart of Accounts (ICAI Standard Layout)
 */
export const STATUTORY_CHART_OF_ACCOUNTS = {
  // Duties & Taxes
  GST_CASH_LEDGER: "GST Liability (Electronic Cash Ledger)",
  GST_INPUT_CGST: "Input CGST Ledger",
  GST_INPUT_SGST: "Input SGST Ledger",
  GST_INPUT_IGST: "Input IGST Ledger",
  TDS_PAYABLE_194J: "TDS Payable (Sec 194J - Professional)",
  TDS_PAYABLE_194C: "TDS Payable (Sec 194C - Contractors)",
  TDS_PAYABLE_194I: "TDS Payable (Sec 194I - Rent)",
  TDS_PAYABLE_192: "TDS Payable (Sec 192 - Salaries)",
  ADVANCE_TAX_PAID: "Advance Income Tax Paid (A.Y. 2027-28)",
  EPFO_ESIC_PAYABLE: "Provident Fund & ESIC Statutory Payable",
  MCA_ROC_FEES: "ROC Filing Fees & Stamp Duty",

  // Operations & Expenses
  SALARIES_PAYABLE: "Salaries & Wages Payable",
  AUDIT_FEES_PAYABLE: "Audit & Professional Fees Payable",
  LEGAL_PROFESSIONAL: "Legal & Professional Charges",
  CLOUD_SOFTWARE: "Cloud Infrastructure & Software Expenses",
  RENT_EXPENSE: "Commercial Rent Expense",
  OFFICE_EXPENSES: "Office & Administrative Expenses",
  FACTORY_POWER: "Factory Power & Fuel",
  RAW_MATERIAL: "Raw Material Purchases",
  INSURANCE_EXPENSE: "Insurance Premium Expense",
  STAFF_WELFARE: "Staff Welfare & Refreshment Expenses",

  // Banking & Financial
  BANK_CHARGES: "Bank Charges & Processing Fees",
  INTEREST_ON_LOAN: "Interest on Term Loan / Cash Credit",
  LOAN_EMI_CLEARING: "Loan Principal & EMI Clearing Account",
  INTEREST_INCOME: "Interest on Bank Savings / Term Deposit",

  // Revenue & Trade
  SALES_REVENUE: "Domestic Sales Revenue",
  CONSULTANCY_REVENUE: "Professional Consultancy Fees",
  SUNDRY_DEBTORS: "Sundry Debtors Ledger (Trade Receivables)",
  SUNDRY_CREDITORS: "Sundry Creditors Ledger (Trade Payables)",
  POS_COLLECTIONS: "Daily POS & Merchant Card Collections",

  // Contra & Capital
  CASH_IN_HAND: "Cash-in-Hand",
  DIRECTOR_CURRENT_AC: "Director Current Account (Sec 185 Compliant)",
  SUSPENSE_UNIDENTIFIED: "Suspense Account (Pending Client Voucher)"
};

/**
 * Dissect a raw Indian bank narration into structured counterparties and statutory tags
 */
export function dissectNarration(narration: string, isWithdrawal: boolean): DissectedNarration {
  const norm = narration.toUpperCase().trim();

  // 1. STATUTORY: GST PAYMENT
  if (norm.includes("GST PMT") || norm.includes("CPIN") || norm.includes("GSTN") || norm.includes("PMT-06") || norm.includes("PMT06")) {
    const cpinMatch = norm.match(/CPIN\s*([0-9A-Z]+)/);
    const gstinMatch = norm.match(/([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})/);
    return {
      rawNarration: narration,
      mode: "TAX_GOVT",
      cleanCounterparty: "Goods & Services Tax Network (GSTN)",
      referenceNo: cpinMatch ? cpinMatch[1] : (norm.match(/[A-Z0-9]{8,15}/)?.[0] || "GST-PMT"),
      taxDetails: {
        type: "GST",
        cpin: cpinMatch ? cpinMatch[1] : undefined,
        gstin: gstinMatch ? gstinMatch[1] : undefined
      },
      suggestedLedger: STATUTORY_CHART_OF_ACCOUNTS.GST_CASH_LEDGER,
      suggestedVoucherType: "Payment",
      category: "Statutory",
      confidence: 99,
      matchedRule: "GST Portal Challan"
    };
  }

  // 2. STATUTORY: DIRECT TAX ADVANCE TAX (ITNS 280)
  if (norm.includes("ITNS 280") || norm.includes("ITNS280") || (norm.includes("ADV TAX") && isWithdrawal) || norm.includes("SELF ASSESS")) {
    const bsrMatch = norm.match(/BSR\s*([0-9]{7})/);
    const chlnMatch = norm.match(/CHLN\s*([0-9]+)/);
    return {
      rawNarration: narration,
      mode: "TAX_GOVT",
      cleanCounterparty: "Income Tax Department (CBDT)",
      referenceNo: chlnMatch ? chlnMatch[1] : "ITNS-280",
      taxDetails: {
        type: "INCOME_TAX_ADVANCE",
        bsrCode: bsrMatch ? bsrMatch[1] : undefined,
        challanNo: chlnMatch ? chlnMatch[1] : undefined
      },
      suggestedLedger: STATUTORY_CHART_OF_ACCOUNTS.ADVANCE_TAX_PAID,
      suggestedVoucherType: "Payment",
      category: "Statutory",
      confidence: 98,
      matchedRule: "ITNS 280 Advance Tax"
    };
  }

  // 3. STATUTORY: TDS PAYMENT (ITNS 281)
  if (norm.includes("ITNS 281") || norm.includes("ITNS281") || norm.includes("TDS CHLN") || norm.includes("TDS PYMT")) {
    let section = "194J";
    let ledger = STATUTORY_CHART_OF_ACCOUNTS.TDS_PAYABLE_194J;
    if (norm.includes("194C")) { section = "194C"; ledger = STATUTORY_CHART_OF_ACCOUNTS.TDS_PAYABLE_194C; }
    else if (norm.includes("194I")) { section = "194I"; ledger = STATUTORY_CHART_OF_ACCOUNTS.TDS_PAYABLE_194I; }
    else if (norm.includes("192")) { section = "192"; ledger = STATUTORY_CHART_OF_ACCOUNTS.TDS_PAYABLE_192; }

    return {
      rawNarration: narration,
      mode: "TAX_GOVT",
      cleanCounterparty: `TDS u/s ${section} (CBDT)`,
      referenceNo: norm.match(/[0-9]{5,10}/)?.[0] || "TDS-281",
      taxDetails: {
        type: "TDS_281",
        section
      },
      suggestedLedger: ledger,
      suggestedVoucherType: "Payment",
      category: "Statutory",
      confidence: 97,
      matchedRule: `TDS Sec ${section} Challan`
    };
  }

  // 4. STATUTORY: EPFO / ESIC
  if (norm.includes("EPFO") || norm.includes("PF ECR") || norm.includes("ESIC") || norm.includes("TRRN")) {
    const trrn = norm.match(/TRRN\s*([0-9]+)/)?.[1] || norm.match(/[0-9]{10,14}/)?.[0] || "EPFO-PMT";
    return {
      rawNarration: narration,
      mode: "TAX_GOVT",
      cleanCounterparty: "Employees Provident Fund Organisation (EPFO)",
      referenceNo: trrn,
      taxDetails: { type: "EPFO_ESIC", challanNo: trrn },
      suggestedLedger: STATUTORY_CHART_OF_ACCOUNTS.EPFO_ESIC_PAYABLE,
      suggestedVoucherType: "Payment",
      category: "Statutory",
      confidence: 99,
      matchedRule: "EPFO / ESIC Challan"
    };
  }

  // 5. STATUTORY: MCA21 / ROC
  if (norm.includes("MCA21") || norm.includes("ROC FEE") || norm.includes("MINISTRY OF CORPORATE")) {
    return {
      rawNarration: narration,
      mode: "TAX_GOVT",
      cleanCounterparty: "Ministry of Corporate Affairs (MCA)",
      referenceNo: norm.match(/SRN\s*([A-Z0-9]+)/)?.[1] || "MCA-SRN",
      taxDetails: { type: "MCA21" },
      suggestedLedger: STATUTORY_CHART_OF_ACCOUNTS.MCA_ROC_FEES,
      suggestedVoucherType: "Payment",
      category: "Statutory",
      confidence: 98,
      matchedRule: "MCA21 Filing Fees"
    };
  }

  // 6. BANK CHARGES & INTEREST
  if (norm.includes("CHRG") || norm.includes("FEE") || norm.includes("SMS CHRG") || norm.includes("CONSOL CHRG") || norm.includes("CARD AMC")) {
    return {
      rawNarration: narration,
      mode: "BANK_CHARGES",
      cleanCounterparty: "Bank Services & Processing Charges",
      referenceNo: norm.match(/[0-9]{4,8}/)?.[0] || "CHRG",
      suggestedLedger: STATUTORY_CHART_OF_ACCOUNTS.BANK_CHARGES,
      suggestedVoucherType: "Payment",
      category: "Banking",
      confidence: 96,
      matchedRule: "Bank Charges",
      gstSplitEligible: true
    };
  }

  // 7. INTEREST CREDITED (RECEIPT)
  if (!isWithdrawal && (norm.includes("INT PD") || norm.includes("INTEREST CR") || norm.includes("SB INT") || norm.includes("FD INT"))) {
    return {
      rawNarration: narration,
      mode: "INTEREST",
      cleanCounterparty: "Bank Interest Income",
      referenceNo: "INT-CREDIT",
      suggestedLedger: STATUTORY_CHART_OF_ACCOUNTS.INTEREST_INCOME,
      suggestedVoucherType: "Receipt",
      category: "Revenue",
      confidence: 99,
      matchedRule: "Bank Interest Credit"
    };
  }

  // 8. SALARY BATCH TRANSFERS
  if (norm.includes("SALARY") || norm.includes("SAL TRF") || norm.includes("CMS SAL") || norm.includes("PAYROLL")) {
    return {
      rawNarration: narration,
      mode: "SALARY",
      cleanCounterparty: "Staff Payroll Processing",
      referenceNo: norm.match(/CMS[A-Z0-9-]+/)?.[0] || "SALARY-CMS",
      suggestedLedger: STATUTORY_CHART_OF_ACCOUNTS.SALARIES_PAYABLE,
      suggestedVoucherType: "Payment",
      category: "Payroll",
      confidence: 100,
      matchedRule: "Corporate Payroll CMS"
    };
  }

  // 9. CONTRA: CASH WITHDRAWAL / DEPOSIT
  if (norm.includes("CASH WDL") || norm.includes("ATM WDL") || norm.includes("SELF CHQ") || norm.includes("CASH DEP") || norm.includes("BY CASH")) {
    return {
      rawNarration: narration,
      mode: "CONTRA",
      cleanCounterparty: "Cash-in-Hand",
      referenceNo: norm.match(/[0-9]{6}/)?.[0] || "CONTRA",
      suggestedLedger: STATUTORY_CHART_OF_ACCOUNTS.CASH_IN_HAND,
      suggestedVoucherType: "Contra",
      category: "Contra",
      confidence: 99,
      matchedRule: "Cash Contra Transfer"
    };
  }

  // 10. UPI TRANSACTIONS
  if (norm.startsWith("UPI") || norm.includes("/UPI/") || norm.includes("UPI/")) {
    const parts = narration.split("/");
    const utr = parts.find(p => /^[0-9]{12}$/.test(p.trim())) || norm.match(/[0-9]{12}/)?.[0] || "UPI-REF";
    const vpa = parts.find(p => p.includes("@"))?.trim();
    let counterparty = parts[2]?.trim() || parts[1]?.trim() || "UPI Counterparty";

    if (counterparty.length < 3 && parts[3]) counterparty = parts[3].trim();

    // Contextual matching for known SaaS & merchant counterparties
    let ledger = isWithdrawal ? STATUTORY_CHART_OF_ACCOUNTS.OFFICE_EXPENSES : STATUTORY_CHART_OF_ACCOUNTS.POS_COLLECTIONS;
    let confidence = 82;
    let category: DissectedNarration["category"] = isWithdrawal ? "Opex" : "Revenue";

    if (norm.includes("AMAZON") || norm.includes("AWS")) {
      ledger = STATUTORY_CHART_OF_ACCOUNTS.CLOUD_SOFTWARE;
      confidence = 96;
    } else if (norm.includes("SWIGGY") || norm.includes("ZOMATO") || norm.includes("CHAAYOS")) {
      ledger = STATUTORY_CHART_OF_ACCOUNTS.STAFF_WELFARE;
      confidence = 94;
    } else if (norm.includes("PINELABS") || norm.includes("PAYTM") || norm.includes("RAZORPAY")) {
      ledger = STATUTORY_CHART_OF_ACCOUNTS.POS_COLLECTIONS;
      confidence = 97;
      category = "Revenue";
    }

    return {
      rawNarration: narration,
      mode: "UPI",
      cleanCounterparty: counterparty,
      referenceNo: utr,
      vpa,
      suggestedLedger: ledger,
      suggestedVoucherType: isWithdrawal ? "Payment" : "Receipt",
      category,
      confidence,
      matchedRule: "UPI Transfer Extractor"
    };
  }

  // 11. NEFT / RTGS TRANSACTIONS
  if (norm.includes("NEFT") || norm.includes("RTGS")) {
    const isNeft = norm.includes("NEFT");
    const parts = narration.split(/[/\-]/);
    const utr = parts.find(p => /^[A-Z0-9]{12,22}$/.test(p.trim())) || norm.match(/[A-Z0-9]{12,22}/)?.[0] || (isNeft ? "NEFT-UTR" : "RTGS-UTR");
    
    // Pick longest alphabetical chunk as beneficiary
    let beneficiary = "";
    for (const part of parts) {
      const clean = part.replace(/[^A-Za-z\s]/g, "").trim();
      if (clean.length > beneficiary.length && !["NEFT", "RTGS", "MUMBAI", "DELHI", "BENEFICIARY", "PAYMENT", "TRANSFER"].includes(clean.toUpperCase())) {
        beneficiary = clean;
      }
    }
    if (!beneficiary) beneficiary = "Commercial Counterparty";

    return {
      rawNarration: narration,
      mode: isNeft ? "NEFT" : "RTGS",
      cleanCounterparty: beneficiary,
      referenceNo: utr,
      suggestedLedger: isWithdrawal ? STATUTORY_CHART_OF_ACCOUNTS.SUNDRY_CREDITORS : STATUTORY_CHART_OF_ACCOUNTS.SUNDRY_DEBTORS,
      suggestedVoucherType: isWithdrawal ? "Payment" : "Receipt",
      category: isWithdrawal ? "Opex" : "Revenue",
      confidence: 88,
      matchedRule: `${isNeft ? "NEFT" : "RTGS"} Protocol`
    };
  }

  // 12. IMPS TRANSACTIONS
  if (norm.includes("IMPS")) {
    const rrn = norm.match(/[0-9]{12}/)?.[0] || norm.match(/[0-9]{6,10}/)?.[0] || "IMPS-REF";
    const parts = narration.split("/");
    const beneficiary = parts.find(p => p.length > 3 && !p.includes("IMPS") && !p.includes("P2A") && !p.includes("P2M"))?.trim() || "IMPS Beneficiary";

    return {
      rawNarration: narration,
      mode: "IMPS",
      cleanCounterparty: beneficiary,
      referenceNo: rrn,
      suggestedLedger: isWithdrawal ? STATUTORY_CHART_OF_ACCOUNTS.SUNDRY_CREDITORS : STATUTORY_CHART_OF_ACCOUNTS.SUNDRY_DEBTORS,
      suggestedVoucherType: isWithdrawal ? "Payment" : "Receipt",
      category: isWithdrawal ? "Opex" : "Revenue",
      confidence: 85,
      matchedRule: "IMPS Immediate Payment"
    };
  }

  // 13. ACH / NACH MANDATES
  if (norm.includes("ACH") || norm.includes("NACH")) {
    let cleanBeneficiary = "ACH Mandate";
    let ledger = STATUTORY_CHART_OF_ACCOUNTS.OFFICE_EXPENSES;
    let confidence = 86;

    if (norm.includes("FINANCE") || norm.includes("LOAN") || norm.includes("CAPITAL") || norm.includes("BAJAJ")) {
      cleanBeneficiary = "NBFC / Loan Mandate";
      ledger = STATUTORY_CHART_OF_ACCOUNTS.LOAN_EMI_CLEARING;
      confidence = 94;
    } else if (norm.includes("INSURANCE") || norm.includes("ERGO") || norm.includes("LIC") || norm.includes("STAR HEALTH")) {
      cleanBeneficiary = "Insurance Mandate";
      ledger = STATUTORY_CHART_OF_ACCOUNTS.INSURANCE_EXPENSE;
      confidence = 95;
    }

    return {
      rawNarration: narration,
      mode: "ACH",
      cleanCounterparty: cleanBeneficiary,
      referenceNo: norm.match(/[0-9]{6,12}/)?.[0] || "ACH-REF",
      suggestedLedger: ledger,
      suggestedVoucherType: "Payment",
      category: "Opex",
      confidence,
      matchedRule: "ACH Auto-Debit"
    };
  }

  // 14. DEFAULT SUSPENSE (FALLBACK)
  return {
    rawNarration: narration,
    mode: "OTHER",
    cleanCounterparty: narration.slice(0, 30),
    referenceNo: norm.match(/[0-9A-Z]{6,14}/)?.[0] || "REF-UNMAPPED",
    suggestedLedger: STATUTORY_CHART_OF_ACCOUNTS.SUSPENSE_UNIDENTIFIED,
    suggestedVoucherType: isWithdrawal ? "Payment" : "Receipt",
    category: "Suspense",
    confidence: 45,
    matchedRule: "Unrecognized Bank Narration"
  };
}
