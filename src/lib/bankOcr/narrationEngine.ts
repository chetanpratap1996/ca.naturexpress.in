/**
 * Brains & Taxes — Indian Banking Narration Dissection & Ledger Mapping Engine
 * 1000% deterministic regex parsing of Indian bank transaction narrations
 * with statutory tax split (GST / TDS / Advance Tax / EPFO) and double-entry mapping.
 * Incorporates Canonical Merchant Normalization (inspired by india2actual) & ICAI Standard Chart of Accounts.
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
  TDS_PAYABLE_194H: "TDS Payable (Sec 194H - Commission)",
  TDS_PAYABLE_194Q: "TDS Payable (Sec 194Q - Goods Purchase)",
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
  TRAVEL_CONVEYANCE: "Travel, Hotel & Conveyance Expenses",
  COMMUNICATION_UTILITIES: "Telephone, Internet & Utility Expenses",
  FUEL_VEHICLE_RUNNING: "Vehicle Fuel & Running Expenses",
  PAYMENT_GATEWAY_CHARGES: "Payment Gateway Processing Fees",

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

interface CanonicalMerchantRule {
  patterns: string[];
  canonicalName: string;
  ledger: string;
  category: DissectedNarration["category"];
  voucherType?: "Payment" | "Receipt" | "Contra";
  confidence: number;
  gstSplitEligible?: boolean;
}

/**
 * High-precision Canonical Merchant Mapping Rules for Indian Corporate Banking
 */
const CANONICAL_MERCHANT_RULES: CanonicalMerchantRule[] = [
  // 1. Food, Meals & Staff Refreshments -> Staff Welfare
  {
    patterns: ["SWIGGY", "ZOMATO", "CHAAYOS", "STARBUCKS", "CAFE COFFEE DAY", "CCD", "EATCLUB", "DOMINOS", "MCDONALD", "HALDIRAM", "REBEL FOODS", "BEHROUZ", "FAASOS", "CHAI POINT", "BURGER KING"],
    canonicalName: "Staff Welfare & Food Vendor",
    ledger: STATUTORY_CHART_OF_ACCOUNTS.STAFF_WELFARE,
    category: "Opex",
    confidence: 96
  },
  // 2. Cloud Infrastructure, Developer Tools & SaaS
  {
    patterns: ["AWS", "AMAZON WEB SERVICES", "GOOGLE CLOUD", "GSUITE", "GOOGLE WORKSPACE", "MICROSOFT AZURE", "AZURE", "GITHUB", "DIGITALOCEAN", "CLOUDFLARE", "ZOOM COMMUNICATIONS", "ZOOM.US", "SLACK", "NOTION", "OPENAI", "CANVA", "ATLASSIAN", "ZOHO", "VERCEL", "HEROKU", "GODADDY", "NAMECHEAP"],
    canonicalName: "Cloud Infrastructure & SaaS",
    ledger: STATUTORY_CHART_OF_ACCOUNTS.CLOUD_SOFTWARE,
    category: "Opex",
    confidence: 98
  },
  // 3. Travel, Ride Hailing & Conveyance
  {
    patterns: ["UBER", "OLA CABS", "RAPIDO", "MAKEMYTRIP", "MMT", "YATRA", "IRCTC", "INDIAN RAILWAYS", "INDIGO", "INTERGLOBE", "AIR INDIA", "VISTARA", "AKASA", "SPICEJET", "FASTAG", "IHMCL", "NETC FASTAG"],
    canonicalName: "Corporate Travel & Conveyance",
    ledger: STATUTORY_CHART_OF_ACCOUNTS.TRAVEL_CONVEYANCE,
    category: "Opex",
    confidence: 95
  },
  // 4. Telecom, Internet & Utilities
  {
    patterns: ["AIRTEL", "BHARTI AIRTEL", "JIO", "RELIANCE JIO", "VODAFONE", "VI POSTPAID", "MTNL", "BSNL", "ACT FIBERNET", "HATHWAY", "TATA TELESERVICES", "BESCOM", "TATA POWER", "ADANI ELECTRICITY", "TORRENT POWER", "MAHANAGAR GAS", "IGL", "INDDRAPRASTHA GAS"],
    canonicalName: "Telecom & Utility Provider",
    ledger: STATUTORY_CHART_OF_ACCOUNTS.COMMUNICATION_UTILITIES,
    category: "Opex",
    confidence: 96
  },
  // 5. Office Supplies, Groceries & E-Commerce Purchases
  {
    patterns: ["AMAZON INDIA", "AMAZON.IN", "FLIPKART", "BLINKIT", "ZEPTO", "BIGBASKET", "BB DAILY", "DUNZO", "INSTAMART", "STAPLES", "OFFICE1"],
    canonicalName: "Office Supplies & Consumables",
    ledger: STATUTORY_CHART_OF_ACCOUNTS.OFFICE_EXPENSES,
    category: "Opex",
    confidence: 92
  },
  // 6. Fuel & Vehicle Running
  {
    patterns: ["INDIAN OIL", "IOCL", "BHARAT PETROLEUM", "BPCL", "HINDUSTAN PETROLEUM", "HPCL", "SHELL PETROL", "NAYARA ENERGY", "PETROL PUMP", "CNG STATION"],
    canonicalName: "Vehicle Fuel & Station",
    ledger: STATUTORY_CHART_OF_ACCOUNTS.FUEL_VEHICLE_RUNNING,
    category: "Opex",
    confidence: 97
  },
  // 7. Payment Aggregators & POS Collections
  {
    patterns: ["RAZORPAY", "PINELABS", "PINE LABS", "PAYTM", "ONE97", "PHONEPE MERCHANT", "BHARATPE", "CASHFREE", "BILLDESK", "CCAVENUE", "PAYU", "INSTAMOJO"],
    canonicalName: "Merchant POS & Payment Gateway",
    ledger: STATUTORY_CHART_OF_ACCOUNTS.POS_COLLECTIONS,
    category: "Revenue",
    confidence: 97
  },
  // 8. NBFC & Commercial Loans / Equipment Finance
  {
    patterns: ["BAJAJ FINANCE", "BAJAJ FINSERV", "HDFC LTD", "TATA CAPITAL", "CHOLAMANDALAM", "L&T FINANCE", "ADITYA BIRLA FINANCE", "MUTHOOT FINANCE", "HERO FINCORP", "SHRIRAM FINANCE", "FULLERTON", "PIRAMAL CAPITAL"],
    canonicalName: "NBFC / Term Loan EMI",
    ledger: STATUTORY_CHART_OF_ACCOUNTS.LOAN_EMI_CLEARING,
    category: "Opex",
    confidence: 96
  },
  // 9. Corporate Insurance Policies
  {
    patterns: ["LIC", "LIFE INSURANCE", "HDFC LIFE", "ICICI PRUDENTIAL", "SBI LIFE", "MAX LIFE", "STAR HEALTH", "CARE HEALTH", "HDFC ERGO", "ICICI LOMBARD", "NEW INDIA ASSURANCE", "UNITED INDIA INSURANCE", "ORIENTAL INSURANCE", "BAJAJ ALLIANZ"],
    canonicalName: "Statutory & General Insurance",
    ledger: STATUTORY_CHART_OF_ACCOUNTS.INSURANCE_EXPENSE,
    category: "Opex",
    confidence: 97
  },
  // 10. Audit, Accounting & Professional Fees
  {
    patterns: ["GPA & CO", "CHARTERED ACCOUNTANTS", "ICAI", "LEGAL ADVOCATE", "COMPANY SECRETARY", "TAX CONSULTANT"],
    canonicalName: "Statutory Audit & Professional Fees",
    ledger: STATUTORY_CHART_OF_ACCOUNTS.AUDIT_FEES_PAYABLE,
    category: "Opex",
    confidence: 98
  }
];

/**
 * Dissect a raw Indian bank narration into structured counterparties and statutory tags
 */
export function dissectNarration(narration: string, isWithdrawal: boolean): DissectedNarration {
  const norm = (narration || "").toUpperCase().trim();

  // 1. STATUTORY: GST PAYMENT (PMT-06 / CPIN / Electronic Cash Ledger)
  if (
    norm.includes("GST PMT") || 
    norm.includes("CPIN") || 
    norm.includes("GSTN") || 
    norm.includes("PMT-06") || 
    norm.includes("PMT06") || 
    norm.includes("GST CASH LEDGER")
  ) {
    const cpinMatch = norm.match(/CPIN\s*([0-9A-Z]+)/) || norm.match(/CPIN[:\-\s]*([0-9]{14})/);
    const gstinMatch = norm.match(/([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})/);
    const refNo = cpinMatch ? cpinMatch[1] : (norm.match(/[A-Z0-9]{8,16}/)?.[0] || "GST-PMT");

    return {
      rawNarration: narration,
      mode: "TAX_GOVT",
      cleanCounterparty: "Goods & Services Tax Network (GSTN)",
      referenceNo: refNo,
      taxDetails: {
        type: "GST",
        cpin: cpinMatch ? cpinMatch[1] : undefined,
        gstin: gstinMatch ? gstinMatch[1] : undefined
      },
      suggestedLedger: STATUTORY_CHART_OF_ACCOUNTS.GST_CASH_LEDGER,
      suggestedVoucherType: "Payment",
      category: "Statutory",
      confidence: 99,
      matchedRule: "GST Portal Challan (PMT-06)"
    };
  }

  // 2. STATUTORY: DIRECT TAX ADVANCE TAX (ITNS 280)
  if (
    norm.includes("ITNS 280") || 
    norm.includes("ITNS280") || 
    (norm.includes("ADV TAX") && isWithdrawal) || 
    norm.includes("SELF ASSESS") ||
    norm.includes("CHALLAN 280")
  ) {
    const bsrMatch = norm.match(/BSR[:\s\-]*([0-9]{7})/);
    const chlnMatch = norm.match(/CHLN[:\s\-]*([0-9]+)/) || norm.match(/CHALLAN[:\s\-]*([0-9]+)/);
    return {
      rawNarration: narration,
      mode: "TAX_GOVT",
      cleanCounterparty: "Income Tax Department (CBDT)",
      referenceNo: chlnMatch ? chlnMatch[1] : (bsrMatch ? bsrMatch[1] : "ITNS-280"),
      taxDetails: {
        type: "INCOME_TAX_ADVANCE",
        bsrCode: bsrMatch ? bsrMatch[1] : undefined,
        challanNo: chlnMatch ? chlnMatch[1] : undefined
      },
      suggestedLedger: STATUTORY_CHART_OF_ACCOUNTS.ADVANCE_TAX_PAID,
      suggestedVoucherType: "Payment",
      category: "Statutory",
      confidence: 98,
      matchedRule: "ITNS 280 Advance Tax Challan"
    };
  }

  // 3. STATUTORY: TDS PAYMENT (ITNS 281)
  if (
    norm.includes("ITNS 281") || 
    norm.includes("ITNS281") || 
    norm.includes("TDS CHLN") || 
    norm.includes("TDS PYMT") || 
    norm.includes("CHALLAN 281")
  ) {
    let section = "194J";
    let ledger = STATUTORY_CHART_OF_ACCOUNTS.TDS_PAYABLE_194J;
    if (norm.includes("194C")) { section = "194C"; ledger = STATUTORY_CHART_OF_ACCOUNTS.TDS_PAYABLE_194C; }
    else if (norm.includes("194I")) { section = "194I"; ledger = STATUTORY_CHART_OF_ACCOUNTS.TDS_PAYABLE_194I; }
    else if (norm.includes("194H")) { section = "194H"; ledger = STATUTORY_CHART_OF_ACCOUNTS.TDS_PAYABLE_194H; }
    else if (norm.includes("194Q")) { section = "194Q"; ledger = STATUTORY_CHART_OF_ACCOUNTS.TDS_PAYABLE_194Q; }
    else if (norm.includes("192")) { section = "192"; ledger = STATUTORY_CHART_OF_ACCOUNTS.TDS_PAYABLE_192; }

    const bsrMatch = norm.match(/BSR[:\s\-]*([0-9]{7})/);
    const chlnMatch = norm.match(/CHLN[:\s\-]*([0-9]+)/);

    return {
      rawNarration: narration,
      mode: "TAX_GOVT",
      cleanCounterparty: `TDS u/s ${section} (CBDT)`,
      referenceNo: chlnMatch ? chlnMatch[1] : (bsrMatch ? bsrMatch[1] : "TDS-281"),
      taxDetails: {
        type: "TDS_281",
        section,
        bsrCode: bsrMatch ? bsrMatch[1] : undefined,
        challanNo: chlnMatch ? chlnMatch[1] : undefined
      },
      suggestedLedger: ledger,
      suggestedVoucherType: "Payment",
      category: "Statutory",
      confidence: 97,
      matchedRule: `TDS Sec ${section} Challan 281`
    };
  }

  // 4. STATUTORY: EPFO / ESIC
  if (norm.includes("EPFO") || norm.includes("PF ECR") || norm.includes("ESIC") || norm.includes("TRRN")) {
    const trrnMatch = norm.match(/TRRN[:\s\-]*([0-9]+)/);
    const trrn = trrnMatch ? trrnMatch[1] : (norm.match(/[0-9]{10,14}/)?.[0] || "EPFO-PMT");
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
      matchedRule: "EPFO / ESIC Monthly ECR Challan"
    };
  }

  // 5. STATUTORY: MCA21 / ROC
  if (norm.includes("MCA21") || norm.includes("ROC FEE") || norm.includes("MINISTRY OF CORPORATE")) {
    const srnMatch = norm.match(/SRN[:\s\-]*([A-Z0-9]+)/);
    return {
      rawNarration: narration,
      mode: "TAX_GOVT",
      cleanCounterparty: "Ministry of Corporate Affairs (MCA)",
      referenceNo: srnMatch ? srnMatch[1] : "MCA-SRN",
      taxDetails: { type: "MCA21" },
      suggestedLedger: STATUTORY_CHART_OF_ACCOUNTS.MCA_ROC_FEES,
      suggestedVoucherType: "Payment",
      category: "Statutory",
      confidence: 98,
      matchedRule: "MCA21 Corporate Statutory Filing"
    };
  }

  // 6. BANK CHARGES, FOLIO CHARGES & ANNUAL FEES (GST Split Eligible)
  if (
    norm.includes("CHRG") || 
    norm.includes("CHARGE") || 
    norm.includes("FEE") || 
    norm.includes("SMS CHRG") || 
    norm.includes("CONSOL CHRG") || 
    norm.includes("CARD AMC") ||
    norm.includes("CHEQUE RET") ||
    norm.includes("FOLIO CHG")
  ) {
    return {
      rawNarration: narration,
      mode: "BANK_CHARGES",
      cleanCounterparty: "Bank Processing & Maintenance Charges",
      referenceNo: norm.match(/[0-9]{4,10}/)?.[0] || "BNK-CHRG",
      suggestedLedger: STATUTORY_CHART_OF_ACCOUNTS.BANK_CHARGES,
      suggestedVoucherType: "Payment",
      category: "Banking",
      confidence: 97,
      matchedRule: "Bank Statutory Charges (18% GST Split Eligible)",
      gstSplitEligible: true
    };
  }

  // 7. INTEREST CREDITED (RECEIPT)
  if (!isWithdrawal && (norm.includes("INT PD") || norm.includes("INTEREST CR") || norm.includes("SB INT") || norm.includes("FD INT") || norm.includes("TERM DEP INT"))) {
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
      referenceNo: norm.match(/CMS[A-Z0-9-]+/)?.[0] || norm.match(/[0-9]{6,12}/)?.[0] || "SALARY-CMS",
      suggestedLedger: STATUTORY_CHART_OF_ACCOUNTS.SALARIES_PAYABLE,
      suggestedVoucherType: "Payment",
      category: "Payroll",
      confidence: 100,
      matchedRule: "Corporate Payroll CMS Transfer"
    };
  }

  // 9. CONTRA: CASH WITHDRAWAL / DEPOSIT
  if (norm.includes("CASH WDL") || norm.includes("ATM WDL") || norm.includes("SELF CHQ") || norm.includes("CASH DEP") || norm.includes("BY CASH")) {
    return {
      rawNarration: narration,
      mode: "CONTRA",
      cleanCounterparty: "Cash-in-Hand",
      referenceNo: norm.match(/[0-9]{6}/)?.[0] || "CONTRA-CASH",
      suggestedLedger: STATUTORY_CHART_OF_ACCOUNTS.CASH_IN_HAND,
      suggestedVoucherType: "Contra",
      category: "Contra",
      confidence: 99,
      matchedRule: "Cash Contra Transfer"
    };
  }

  // CHECK CANONICAL MERCHANTS
  for (const rule of CANONICAL_MERCHANT_RULES) {
    if (rule.patterns.some(p => norm.includes(p))) {
      let mode: TransactionMode = "OTHER";
      if (norm.includes("UPI")) mode = "UPI";
      else if (norm.includes("NEFT")) mode = "NEFT";
      else if (norm.includes("RTGS")) mode = "RTGS";
      else if (norm.includes("IMPS")) mode = "IMPS";
      else if (norm.includes("POS") || norm.includes("CARD")) mode = "CARD_POS";
      else if (norm.includes("ACH") || norm.includes("NACH")) mode = "ACH";

      const refMatch = norm.match(/[0-9]{10,22}/)?.[0] || norm.match(/[A-Z0-9]{8,16}/)?.[0] || "REF-MERCHANT";

      return {
        rawNarration: narration,
        mode,
        cleanCounterparty: rule.canonicalName,
        referenceNo: refMatch,
        suggestedLedger: rule.ledger,
        suggestedVoucherType: rule.voucherType || (isWithdrawal ? "Payment" : "Receipt"),
        category: rule.category,
        confidence: rule.confidence,
        matchedRule: `Canonical Merchant: ${rule.canonicalName}`,
        gstSplitEligible: rule.gstSplitEligible
      };
    }
  }

  // 10. UPI TRANSACTIONS (High-Precision Disassembly)
  if (norm.startsWith("UPI") || norm.includes("/UPI/") || norm.includes("UPI/")) {
    const parts = narration.split(/[\/\-]/);
    
    // Look for 12-digit RRN / UTR
    const utr = parts.find(p => /^[0-9]{12}$/.test(p.trim())) || norm.match(/[0-9]{12}/)?.[0] || "UPI-REF";
    const vpa = parts.find(p => p.includes("@"))?.trim();
    
    // Extract payee/payer name
    let counterparty = "";
    for (const p of parts) {
      const clean = p.replace(/[^A-Za-z0-9\s]/g, "").trim();
      if (
        clean.length > 2 && 
        !/^[0-9]+$/.test(clean) && 
        !["UPI", "DR", "CR", "HDFC", "ICICI", "SBIN", "YESB", "AXIS", "KKBK", "BARB", "PUNB"].includes(clean.toUpperCase())
      ) {
        counterparty = clean;
        break;
      }
    }
    if (!counterparty) counterparty = isWithdrawal ? "UPI Beneficiary" : "UPI Remitter";

    return {
      rawNarration: narration,
      mode: "UPI",
      cleanCounterparty: counterparty,
      referenceNo: utr,
      vpa,
      suggestedLedger: isWithdrawal ? STATUTORY_CHART_OF_ACCOUNTS.OFFICE_EXPENSES : STATUTORY_CHART_OF_ACCOUNTS.POS_COLLECTIONS,
      suggestedVoucherType: isWithdrawal ? "Payment" : "Receipt",
      category: isWithdrawal ? "Opex" : "Revenue",
      confidence: 86,
      matchedRule: "UPI Protocol Disassembler"
    };
  }

  // 11. NEFT / RTGS TRANSACTIONS
  if (norm.includes("NEFT") || norm.includes("RTGS")) {
    const isNeft = norm.includes("NEFT");
    const parts = narration.split(/[\/\-]/);
    const utr = parts.find(p => /^[A-Z0-9]{12,22}$/.test(p.trim())) || norm.match(/[A-Z0-9]{12,22}/)?.[0] || (isNeft ? "NEFT-UTR" : "RTGS-UTR");
    
    let beneficiary = "";
    for (const part of parts) {
      const clean = part.replace(/[^A-Za-z0-9\s]/g, "").trim();
      if (
        clean.length > beneficiary.length && 
        !["NEFT", "RTGS", "MUMBAI", "DELHI", "BENEFICIARY", "PAYMENT", "TRANSFER", "CR", "DR", "INWARD", "OUTWARD"].includes(clean.toUpperCase()) &&
        !/^[0-9]+$/.test(clean)
      ) {
        beneficiary = clean;
      }
    }
    if (!beneficiary) beneficiary = isWithdrawal ? "Trade Supplier (Sundry Creditor)" : "Trade Client (Sundry Debtor)";

    return {
      rawNarration: narration,
      mode: isNeft ? "NEFT" : "RTGS",
      cleanCounterparty: beneficiary,
      referenceNo: utr,
      suggestedLedger: isWithdrawal ? STATUTORY_CHART_OF_ACCOUNTS.SUNDRY_CREDITORS : STATUTORY_CHART_OF_ACCOUNTS.SUNDRY_DEBTORS,
      suggestedVoucherType: isWithdrawal ? "Payment" : "Receipt",
      category: isWithdrawal ? "Opex" : "Revenue",
      confidence: 89,
      matchedRule: `${isNeft ? "NEFT" : "RTGS"} Corporate Settlement Protocol`
    };
  }

  // 12. IMPS TRANSACTIONS
  if (norm.includes("IMPS")) {
    const rrn = norm.match(/[0-9]{12}/)?.[0] || norm.match(/[0-9]{6,10}/)?.[0] || "IMPS-REF";
    const parts = narration.split(/[\/\-]/);
    const beneficiary = parts.find(p => 
      p.length > 3 && 
      !p.includes("IMPS") && 
      !p.includes("P2A") && 
      !p.includes("P2M") &&
      !/^[0-9]+$/.test(p.trim())
    )?.trim() || "IMPS Counterparty";

    return {
      rawNarration: narration,
      mode: "IMPS",
      cleanCounterparty: beneficiary,
      referenceNo: rrn,
      suggestedLedger: isWithdrawal ? STATUTORY_CHART_OF_ACCOUNTS.SUNDRY_CREDITORS : STATUTORY_CHART_OF_ACCOUNTS.SUNDRY_DEBTORS,
      suggestedVoucherType: isWithdrawal ? "Payment" : "Receipt",
      category: isWithdrawal ? "Opex" : "Revenue",
      confidence: 87,
      matchedRule: "IMPS Immediate Payment Settlement"
    };
  }

  // 13. ACH / NACH MANDATES
  if (norm.includes("ACH") || norm.includes("NACH")) {
    let cleanBeneficiary = "ACH Mandate";
    let ledger = STATUTORY_CHART_OF_ACCOUNTS.OFFICE_EXPENSES;
    let confidence = 88;

    if (norm.includes("FINANCE") || norm.includes("LOAN") || norm.includes("CAPITAL") || norm.includes("BAJAJ")) {
      cleanBeneficiary = "NBFC Loan Mandate";
      ledger = STATUTORY_CHART_OF_ACCOUNTS.LOAN_EMI_CLEARING;
      confidence = 95;
    } else if (norm.includes("INSURANCE") || norm.includes("ERGO") || norm.includes("LIC") || norm.includes("STAR HEALTH")) {
      cleanBeneficiary = "Insurance Mandate";
      ledger = STATUTORY_CHART_OF_ACCOUNTS.INSURANCE_EXPENSE;
      confidence = 96;
    }

    return {
      rawNarration: narration,
      mode: "ACH",
      cleanCounterparty: cleanBeneficiary,
      referenceNo: norm.match(/[0-9]{6,16}/)?.[0] || "ACH-REF",
      suggestedLedger: ledger,
      suggestedVoucherType: "Payment",
      category: "Opex",
      confidence,
      matchedRule: "ACH / NACH Recurring Auto-Debit"
    };
  }

  // 14. CHEQUE CLEARINGS
  if (norm.includes("CHQ") || norm.includes("CHEQUE") || norm.includes("CLG")) {
    const chqNo = norm.match(/[0-9]{6}/)?.[0] || "CHQ-REF";
    return {
      rawNarration: narration,
      mode: "CHEQUE",
      cleanCounterparty: isWithdrawal ? "Cheque Issued (Payable)" : "Cheque Deposited (Receivable)",
      referenceNo: chqNo,
      suggestedLedger: isWithdrawal ? STATUTORY_CHART_OF_ACCOUNTS.SUNDRY_CREDITORS : STATUTORY_CHART_OF_ACCOUNTS.SUNDRY_DEBTORS,
      suggestedVoucherType: isWithdrawal ? "Payment" : "Receipt",
      category: isWithdrawal ? "Opex" : "Revenue",
      confidence: 84,
      matchedRule: "CTS-2010 Cheque Clearing Protocol"
    };
  }

  // 15. DEFAULT SUSPENSE (FALLBACK)
  return {
    rawNarration: narration,
    mode: "OTHER",
    cleanCounterparty: narration.slice(0, 35),
    referenceNo: norm.match(/[0-9A-Z]{6,14}/)?.[0] || "REF-UNMAPPED",
    suggestedLedger: STATUTORY_CHART_OF_ACCOUNTS.SUSPENSE_UNIDENTIFIED,
    suggestedVoucherType: isWithdrawal ? "Payment" : "Receipt",
    category: "Suspense",
    confidence: 45,
    matchedRule: "Unrecognized Bank Narration"
  };
}
