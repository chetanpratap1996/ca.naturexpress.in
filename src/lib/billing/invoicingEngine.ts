/**
 * Brains & Taxes — Invoicing & Revenue Engine
 * 1000% Accuracy Standard under CGST Act, IGST Act, and Income Tax Act, 1961
 *
 * Implements:
 * 1. Place of Supply determination u/s 12(2) of IGST Act (CGST 9% + SGST 9% vs IGST 18%)
 * 2. SAC Code 9982 (Legal and Accounting Services) Statutory Taxonomy
 * 3. Section 194J TDS Precision (CBDT Circular 23/2017: TDS deducted strictly on taxable base, NOT on GST)
 * 4. MSMED Act, 2006 Section 15 & 16 Compound Interest Engine (3x RBI Bank Rate with monthly rests)
 * 5. NPCI UPI v2.0 Dynamic QR URI Generator
 */

export interface CaServiceSacItem {
  sacCode: string;
  category: string;
  name: string;
  description: string;
  suggestedFeeRange: { min: number; max: number };
  defaultGstRate: number; // 18%
  defaultTdsRate: 10 | 2; // 10% for professional fees, 2% for technical services
}

export const CA_SAC_SERVICES: CaServiceSacItem[] = [
  {
    sacCode: "998221",
    category: "AUDIT_ASSURANCE",
    name: "Statutory & Tax Audit (Sec 44AB / Companies Act)",
    description: "Statutory audit of financial statements, Form 3CD, and CARO 2020 reporting",
    suggestedFeeRange: { min: 45000, max: 250000 },
    defaultGstRate: 18,
    defaultTdsRate: 10,
  },
  {
    sacCode: "998222",
    category: "ACCOUNTING_BOOKKEEPING",
    name: "Accounting, Tally Vouchers & MIS Retainership",
    description: "Monthly ledger maintenance, BRS, payroll vouchers, and periodic MIS reports",
    suggestedFeeRange: { min: 15000, max: 80000 },
    defaultGstRate: 18,
    defaultTdsRate: 10,
  },
  {
    sacCode: "998231",
    category: "TAX_COMPLIANCE",
    name: "Direct Tax & GST Compliance (ITR & GSTR-1/3B)",
    description: "Preparation and filing of monthly GSTR-1, GSTR-3B, and annual Income Tax Returns",
    suggestedFeeRange: { min: 10000, max: 75000 },
    defaultGstRate: 18,
    defaultTdsRate: 10,
  },
  {
    sacCode: "998232",
    category: "TAX_ADVISORY",
    name: "Corporate Tax Advisory & 115BAC Restructuring",
    description: "Corporate restructuring, capital gains optimization, and dual-regime tax planning",
    suggestedFeeRange: { min: 25000, max: 150000 },
    defaultGstRate: 18,
    defaultTdsRate: 10,
  },
  {
    sacCode: "998233",
    category: "LITIGATION_REPRESENTATION",
    name: "Representation before Tax Authorities (CIT(A) / ITAT / GST)",
    description: "Drafting appeals, stay petitions, and appearance before Appellate Authorities and tribunals",
    suggestedFeeRange: { min: 35000, max: 300000 },
    defaultGstRate: 18,
    defaultTdsRate: 10,
  },
  {
    sacCode: "998234",
    category: "TRANSFER_PRICING",
    name: "Transfer Pricing Study & Form 3CEB Certification",
    description: "Benchmarking cross-border transactions, TP documentation, and Form 3CEB filing",
    suggestedFeeRange: { min: 50000, max: 350000 },
    defaultGstRate: 18,
    defaultTdsRate: 10,
  },
  {
    sacCode: "998235",
    category: "ROC_MCA",
    name: "MCA-21 Company Secretarial & Annual ROC Filings",
    description: "Annual ROC returns (AOC-4, MGT-7), DIR-3 KYC, and company secretarial compliance",
    suggestedFeeRange: { min: 15000, max: 90000 },
    defaultGstRate: 18,
    defaultTdsRate: 10,
  },
];

export interface PlaceOfSupplyResult {
  firmStateCode: string;
  clientStateCode: string;
  isInterState: boolean;
  taxType: "INTRA_STATE" | "INTER_STATE";
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  explanation: string;
}

/**
 * Determine Place of Supply u/s 12(2) of IGST Act, 2017
 * Default CA Firm Location: Maharashtra (State Code 27)
 */
export function determinePlaceOfSupply(
  clientGstin?: string,
  firmGstin: string = "27AAACF2299R1ZG"
): PlaceOfSupplyResult {
  const firmStateCode = firmGstin.substring(0, 2) || "27";
  const clientStateCode = (clientGstin && clientGstin.length >= 2)
    ? clientGstin.substring(0, 2)
    : firmStateCode; // Default to intra-state if unregistered client in local jurisdiction

  const isInterState = firmStateCode !== clientStateCode;

  if (isInterState) {
    return {
      firmStateCode,
      clientStateCode,
      isInterState: true,
      taxType: "INTER_STATE",
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 18,
      explanation: `Inter-State Supply u/s 7 of IGST Act (Supplier State: ${firmStateCode} -> Place of Supply: ${clientStateCode}). IGST @ 18% applicable.`
    };
  }

  return {
    firmStateCode,
    clientStateCode,
    isInterState: false,
    taxType: "INTRA_STATE",
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 0,
    explanation: `Intra-State Supply u/s 8 of CGST Act (Supplier and Recipient in State ${firmStateCode}). CGST @ 9% + SGST @ 9% applicable.`
  };
}

export interface TaxAndTdsCalculation {
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
  grossInvoiceAmount: number;
  tdsApplicable: boolean;
  tdsSection: "194J(1)" | "194J(1)(ba)" | "NONE";
  tdsRate: number; // e.g. 10 or 2
  tdsAmountDeducted: number; // Strictly computed on taxable value per CBDT Cir 23/2017
  netAmountPayable: number; // Gross Invoice Amount - TDS Amount
}

/**
 * Computes GST and TDS under Section 194J with 1000% statutory precision.
 * Note: CBDT Circular No. 23/2017 dated 19.07.2017 mandates that where the GST on services
 * has been indicated separately in the invoice, no TDS is deducted on that GST component.
 */
export function calculateTaxAndTds(
  taxableAmount: number,
  isInterState: boolean,
  applyTds: boolean = true,
  tdsRate: 10 | 2 = 10
): TaxAndTdsCalculation {
  const roundedTaxable = Math.round(taxableAmount);

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isInterState) {
    igstAmount = Math.round((roundedTaxable * 18) / 100);
  } else {
    cgstAmount = Math.round((roundedTaxable * 9) / 100);
    sgstAmount = Math.round((roundedTaxable * 9) / 100);
  }

  const totalGstAmount = cgstAmount + sgstAmount + igstAmount;
  const grossInvoiceAmount = roundedTaxable + totalGstAmount;

  let tdsAmountDeducted = 0;
  if (applyTds) {
    // CBDT Circular 23/2017: TDS is strictly deducted on the taxable component
    tdsAmountDeducted = Math.round((roundedTaxable * tdsRate) / 100);
  }

  const netAmountPayable = grossInvoiceAmount - tdsAmountDeducted;

  return {
    taxableAmount: roundedTaxable,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalGstAmount,
    grossInvoiceAmount,
    tdsApplicable: applyTds,
    tdsSection: applyTds ? (tdsRate === 10 ? "194J(1)" : "194J(1)(ba)") : "NONE",
    tdsRate: applyTds ? tdsRate : 0,
    tdsAmountDeducted,
    netAmountPayable,
  };
}

export interface MsmeInterestResult {
  isOverdue: boolean;
  daysOverdue: number;
  gracePeriodDays: number; // 45 days if written contract, 15 days otherwise
  rbiBankRateAnnual: number; // Standard 6.75%
  statutoryMultiplier: number; // 3x
  effectiveAnnualRate: number; // e.g. 20.25%
  interestPayableCompounded: number;
  totalClaimableAmount: number;
  statutoryNoticeCopy: string;
}

/**
 * Computes compound interest under Section 16 of the MSMED Act, 2006.
 * "Section 16: The buyer shall be liable to pay compound interest with monthly rests
 * at three times of the bank rate notified by the RBI from the appointed day."
 */
export function calculateMsmeCompoundInterest(
  invoiceAmount: number,
  invoiceDate: string,
  graceDays: number = 45,
  asOfDate: string = new Date().toISOString().split("T")[0],
  rbiBankRate: number = 6.75
): MsmeInterestResult {
  const invDate = new Date(invoiceDate).getTime();
  const checkDate = new Date(asOfDate).getTime();
  const diffDays = Math.floor((checkDate - invDate) / (1000 * 60 * 60 * 24));
  const daysOverdue = Math.max(0, diffDays - graceDays);

  const effectiveAnnualRate = rbiBankRate * 3; // 3x RBI Bank Rate
  const monthlyRate = effectiveAnnualRate / 100 / 12;

  let interest = 0;
  if (daysOverdue > 0) {
    const monthsOverdue = daysOverdue / 30;
    // Compound interest with monthly rests: A = P * (1 + r)^n - P
    interest = Math.round(invoiceAmount * Math.pow(1 + monthlyRate, monthsOverdue) - invoiceAmount);
  }

  const totalClaimable = invoiceAmount + interest;

  const notice = daysOverdue > 0
    ? `STATUTORY NOTICE UNDER SECTION 16 OF MSMED ACT, 2006: Invoice has exceeded the statutory limit of ${graceDays} days by ${daysOverdue} days. Statutory compound interest with monthly rests @ ${effectiveAnnualRate.toFixed(2)}% p.a. (3x RBI Bank Rate of ${rbiBankRate}%) amounting to ₹${interest.toLocaleString("en-IN")} is legally accrued and payable.`
    : `Invoice within statutory ${graceDays}-day payment window under Section 15 of MSMED Act, 2006.`;

  return {
    isOverdue: daysOverdue > 0,
    daysOverdue,
    gracePeriodDays: graceDays,
    rbiBankRateAnnual: rbiBankRate,
    statutoryMultiplier: 3,
    effectiveAnnualRate,
    interestPayableCompounded: interest,
    totalClaimableAmount: totalClaimable,
    statutoryNoticeCopy: notice,
  };
}

/**
 * Generates NPCI-compliant dynamic UPI URI v2.0
 * Standard: upi://pay?pa=<vpa>&pn=<merchant>&am=<amount>&cu=INR&tn=<note>
 */
export function generateNpciDynamicUpiUri(
  firmVpa: string,
  merchantName: string,
  amount: number,
  invoiceNo: string,
  clientName?: string
): string {
  const vpa = encodeURIComponent(firmVpa.trim());
  const merchant = encodeURIComponent(merchantName.trim());
  const am = amount.toFixed(2);
  const note = encodeURIComponent(`Fee Settlement ${invoiceNo} ${clientName ? "-" + clientName.substring(0, 15) : ""}`);

  return `upi://pay?pa=${vpa}&pn=${merchant}&am=${am}&cu=INR&tn=${note}`;
}
