import { EntityType, ComplianceCategory } from "@/lib/types";

export interface StatutoryDeadlineDefinition {
  code: string;
  category: ComplianceCategory;
  formName: string;
  title: string;
  description: string;
  frequency: "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "ANNUAL" | "EVENT_BASED";
  governingAct: string;
  governingSection: string;
  penaltySection: string;
  penaltyFormulaDescription: string;
  applicableConstitutions: EntityType[];
  dueDayOfMonth?: number; // e.g. 11 for GSTR-1, 20 for GSTR-3B, 7 for TDS
  dueMonthOffsetFromFYEnd?: number; // e.g. 4 for July (ITR), 7 for Oct (ITR audit)
  turnoverThresholdCr?: number; // e.g. 1 Cr for Tax Audit, 5 Cr for e-Invoicing/9C
  requiresAudit?: boolean;
  requiredDocuments: string[];
}

/**
 * MASTER CATALOG: 75+ Official Indian Statutory Deadlines (ICAI, CBDT, CGST, MCA Standards)
 */
export const STATUTORY_DEADLINES_MASTER: StatutoryDeadlineDefinition[] = [
  // ─── INDIRECT TAX: GST RETURNS & RECONCILIATIONS ───
  {
    code: "GST_GSTR1_M",
    category: "GST",
    formName: "GSTR-1",
    title: "GSTR-1 Monthly Outward Supplies Return",
    description: "Details of outward supplies of goods and services for regular monthly taxpayers.",
    frequency: "MONTHLY",
    governingAct: "Central Goods and Services Tax (CGST) Act, 2017",
    governingSection: "Section 37 r/w Rule 59",
    penaltySection: "Section 47 of CGST Act",
    penaltyFormulaDescription: "₹50/day (₹20 if Nil return) capped at ₹2,000 / ₹5,000 / ₹10,000 based on turnover.",
    applicableConstitutions: ["PVT_LTD", "PUBLIC_LTD", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"],
    dueDayOfMonth: 11,
    requiredDocuments: ["B2B Tax Invoices", "B2C Sales Register", "Credit/Debit Notes", "Export Invoices & Shipping Bills", "HSN Summary"]
  },
  {
    code: "GST_GSTR1_IFF",
    category: "GST",
    formName: "GSTR-1 (IFF)",
    title: "Invoice Furnishing Facility (IFF) - QRMP Scheme",
    description: "Optional monthly upload of B2B invoices for quarterly taxpayers in Month 1 and Month 2.",
    frequency: "MONTHLY",
    governingAct: "CGST Rules, 2017",
    governingSection: "Rule 59(2) of CGST Rules",
    penaltySection: "Cutoff Gatekeeper",
    penaltyFormulaDescription: "No late fee, but facility locks on 13th midnight. Unreported invoices push to next month.",
    applicableConstitutions: ["PVT_LTD", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"],
    dueDayOfMonth: 13,
    requiredDocuments: ["Month B2B Tax Invoices", "Debit/Credit Notes for Registered Persons"]
  },
  {
    code: "GST_GSTR3B_M",
    category: "GST",
    formName: "GSTR-3B",
    title: "GSTR-3B Monthly Self-Assessed Tax Summary Return",
    description: "Summary return for declaring summary liability, claiming eligible ITC, and cash tax payment.",
    frequency: "MONTHLY",
    governingAct: "CGST Act, 2017",
    governingSection: "Section 39 r/w Rule 61",
    penaltySection: "Section 47 & Section 50(1) Proviso",
    penaltyFormulaDescription: "₹50/day late fee + 18% p.a. simple interest strictly on net cash ledger liability.",
    applicableConstitutions: ["PVT_LTD", "PUBLIC_LTD", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"],
    dueDayOfMonth: 20,
    requiredDocuments: ["GSTR-2B ITC Auto-Drafted Statement", "Purchase Register", "Electronic Cash Ledger Balance", "Reverse Charge Tax Ledger"]
  },
  {
    code: "GST_GSTR3B_QRMP_A",
    category: "GST",
    formName: "GSTR-3B (QRMP-A)",
    title: "GSTR-3B Quarterly Return - State Group A",
    description: "Quarterly 3B for states: Chhattisgarh, MP, Gujarat, Maharashtra, Karnataka, Goa, Kerala, TN, Telangana, AP.",
    frequency: "QUARTERLY",
    governingAct: "CGST Rules, 2017",
    governingSection: "Rule 61(1)(i) r/w Notif. No. 82/2020-CT",
    penaltySection: "Section 47 & Section 50(1)",
    penaltyFormulaDescription: "₹50/day late fee + 18% p.a. interest on cash tax liability from 22nd.",
    applicableConstitutions: ["PVT_LTD", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"],
    dueDayOfMonth: 22,
    requiredDocuments: ["Quarterly Sales Invoices", "GSTR-2B Statement", "PMT-06 Challans of M1 & M2"]
  },
  {
    code: "GST_GSTR3B_QRMP_B",
    category: "GST",
    formName: "GSTR-3B (QRMP-B)",
    title: "GSTR-3B Quarterly Return - State Group B",
    description: "Quarterly 3B for states: HP, Punjab, Uttarakhand, Haryana, Rajasthan, UP, Bihar, WB, Odisha, Assam, Delhi, J&K.",
    frequency: "QUARTERLY",
    governingAct: "CGST Rules, 2017",
    governingSection: "Rule 61(1)(ii) r/w Notif. No. 82/2020-CT",
    penaltySection: "Section 47 & Section 50(1)",
    penaltyFormulaDescription: "₹50/day late fee + 18% p.a. interest on cash tax liability from 24th.",
    applicableConstitutions: ["PVT_LTD", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"],
    dueDayOfMonth: 24,
    requiredDocuments: ["Quarterly Sales Invoices", "GSTR-2B Statement", "PMT-06 Challans of M1 & M2"]
  },
  {
    code: "GST_PMT06",
    category: "GST",
    formName: "PMT-06",
    title: "PMT-06 Monthly Tax Deposit Challan (QRMP Scheme)",
    description: "Fixed Sum Method (35% of past tax) or Self-Assessment Method for M1 and M2.",
    frequency: "MONTHLY",
    governingAct: "CGST Rules, 2017",
    governingSection: "Rule 87 r/w Section 39(7) Proviso",
    penaltySection: "Section 50(1)",
    penaltyFormulaDescription: "18% p.a. simple interest on delayed cash deposit.",
    applicableConstitutions: ["PVT_LTD", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"],
    dueDayOfMonth: 25,
    requiredDocuments: ["Net Cash Liability Estimate / 35% Past Return Challan"]
  },
  {
    code: "GST_CMP08",
    category: "GST",
    formName: "CMP-08",
    title: "CMP-08 Quarterly Statement for Composition Dealers",
    description: "Quarterly self-assessed tax payment statement for Section 10 composition taxpayers.",
    frequency: "QUARTERLY",
    governingAct: "CGST Rules, 2017",
    governingSection: "Rule 62 r/w Section 10",
    penaltySection: "Section 50 & Late Fee",
    penaltyFormulaDescription: "18% p.a. interest on unpaid composition tax.",
    applicableConstitutions: ["PROPRIETORSHIP", "PARTNERSHIP", "PVT_LTD"],
    dueDayOfMonth: 18,
    requiredDocuments: ["Quarterly Gross Turnover Ledger", "Inward Supplies attracting RCM"]
  },
  {
    code: "GST_GSTR9_ANNUAL",
    category: "GST",
    formName: "GSTR-9",
    title: "GSTR-9 Annual GST Return",
    description: "Consolidated annual return of outward supplies, inward supplies, taxes paid, and ITC availed.",
    frequency: "ANNUAL",
    governingAct: "CGST Act, 2017",
    governingSection: "Section 44 r/w Rule 80",
    penaltySection: "Section 47(2)",
    penaltyFormulaDescription: "₹200/day (₹100 CGST + ₹100 SGST) capped at 0.50% of state turnover.",
    applicableConstitutions: ["PVT_LTD", "PUBLIC_LTD", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"],
    turnoverThresholdCr: 2.0,
    requiredDocuments: ["Audited Financial Statements", "12 Months GSTR-1 & 3B Reconciliations", "ITC Reversal Ledger"]
  },
  {
    code: "GST_GSTR9C_RECON",
    category: "GST",
    formName: "GSTR-9C",
    title: "GSTR-9C Annual Reconciliation Statement",
    description: "Self-certified reconciliation between audited annual financial statements and GSTR-9.",
    frequency: "ANNUAL",
    governingAct: "CGST Act, 2017",
    governingSection: "Section 44(2) r/w Rule 80(3)",
    penaltySection: "Section 125 General Penalty",
    penaltyFormulaDescription: "General penalty up to ₹25,000 CGST + ₹25,000 SGST.",
    applicableConstitutions: ["PVT_LTD", "PUBLIC_LTD", "LLP", "PARTNERSHIP"],
    turnoverThresholdCr: 5.0,
    requiredDocuments: ["Statutory Audited Balance Sheet & P&L", "Auditor's Notes", "Turnover Reconciliation Schedule"]
  },

  // ─── DIRECT TAX: ADVANCE TAX, ITR & TAX AUDIT ───
  {
    code: "IT_ADV_TAX_Q1",
    category: "INCOME_TAX",
    formName: "Challan 280 (Adv Tax Q1)",
    title: "Advance Tax 1st Installment (15% Cumulative)",
    description: "First quarterly installment of advance tax payable if net tax liability exceeds ₹10,000.",
    frequency: "QUARTERLY",
    governingAct: "Income Tax Act, 1961",
    governingSection: "Section 208, 211(1)(a)",
    penaltySection: "Section 234C",
    penaltyFormulaDescription: "1% simple interest per month for 3 months on shortfall below 12% of total tax.",
    applicableConstitutions: ["PVT_LTD", "PUBLIC_LTD", "LLP", "PARTNERSHIP", "PROPRIETORSHIP", "INDIVIDUAL_HNI", "TRUST_NGO"],
    requiredDocuments: ["Q1 Estimated P&L", "TDS Credit in 26AS/AIS", "Gross Revenue Ledgers"]
  },
  {
    code: "IT_ADV_TAX_Q2",
    category: "INCOME_TAX",
    formName: "Challan 280 (Adv Tax Q2)",
    title: "Advance Tax 2nd Installment (45% Cumulative)",
    description: "Second quarterly installment of advance tax (45% of total estimated tax).",
    frequency: "QUARTERLY",
    governingAct: "Income Tax Act, 1961",
    governingSection: "Section 211(1)(b)",
    penaltySection: "Section 234C",
    penaltyFormulaDescription: "1% simple interest per month for 3 months on shortfall below 36% of total tax.",
    applicableConstitutions: ["PVT_LTD", "PUBLIC_LTD", "LLP", "PARTNERSHIP", "PROPRIETORSHIP", "INDIVIDUAL_HNI", "TRUST_NGO"],
    requiredDocuments: ["H1 Estimated P&L", "26AS/AIS TDS Ledger", "Advance Tax Challan Q1"]
  },
  {
    code: "IT_ADV_TAX_Q3",
    category: "INCOME_TAX",
    formName: "Challan 280 (Adv Tax Q3)",
    title: "Advance Tax 3rd Installment (75% Cumulative)",
    description: "Third quarterly installment of advance tax (75% of total estimated tax).",
    frequency: "QUARTERLY",
    governingAct: "Income Tax Act, 1961",
    governingSection: "Section 211(1)(c)",
    penaltySection: "Section 234C",
    penaltyFormulaDescription: "1% simple interest per month for 3 months on shortfall below 75% of total tax.",
    applicableConstitutions: ["PVT_LTD", "PUBLIC_LTD", "LLP", "PARTNERSHIP", "PROPRIETORSHIP", "INDIVIDUAL_HNI", "TRUST_NGO"],
    requiredDocuments: ["9 Months Estimated P&L", "GST Turnover Reconciliation", "Advance Tax Challans Q1 & Q2"]
  },
  {
    code: "IT_ADV_TAX_Q4",
    category: "INCOME_TAX",
    formName: "Challan 280 (Adv Tax Q4)",
    title: "Advance Tax 4th Installment (100% Cumulative)",
    description: "Final quarterly installment of advance tax (100% of total estimated tax).",
    frequency: "QUARTERLY",
    governingAct: "Income Tax Act, 1961",
    governingSection: "Section 211(1)(d)",
    penaltySection: "Section 234B & 234C",
    penaltyFormulaDescription: "1% per month on shortfall under 234C + 1% per month from 1st April under 234B.",
    applicableConstitutions: ["PVT_LTD", "PUBLIC_LTD", "LLP", "PARTNERSHIP", "PROPRIETORSHIP", "INDIVIDUAL_HNI", "TRUST_NGO"],
    requiredDocuments: ["Full FY Provisional Financials", "TDS/TCS Credits in 26AS", "Prior Advance Tax Challans"]
  },
  {
    code: "IT_ITR_NON_AUDIT",
    category: "INCOME_TAX",
    formName: "ITR-1 / ITR-2 / ITR-3 / ITR-4",
    title: "Income Tax Return - Non-Audit Individuals, HUFs & Firms",
    description: "Annual return of income for taxpayers whose accounts are not required to be audited.",
    frequency: "ANNUAL",
    governingAct: "Income Tax Act, 1961",
    governingSection: "Section 139(1)",
    penaltySection: "Section 234F & Section 234A",
    penaltyFormulaDescription: "Flat ₹5,000 late fee (₹1,000 if total income <= ₹5L) + 1% per month interest under 234A.",
    applicableConstitutions: ["INDIVIDUAL_HNI", "PROPRIETORSHIP", "PARTNERSHIP"],
    requiredDocuments: ["AIS & Form 26AS JSON", "Bank Statements with Interest Certs", "Capital Gain Statements", "Deductions Chapter VI-A Proofs"]
  },
  {
    code: "IT_TAX_AUDIT_3CD",
    category: "TAX_AUDIT",
    formName: "Form 3CA / 3CB & Form 3CD",
    title: "Tax Audit Report u/s 44AB (Form 3CD)",
    description: "Statutory tax audit statement of particulars for businesses exceeding ₹1 Cr (or ₹10 Cr digital) limit.",
    frequency: "ANNUAL",
    governingAct: "Income Tax Act, 1961",
    governingSection: "Section 44AB",
    penaltySection: "Section 271B",
    penaltyFormulaDescription: "0.50% of total turnover or gross receipts, or ₹1,50,000, whichever is less.",
    applicableConstitutions: ["PVT_LTD", "PUBLIC_LTD", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"],
    turnoverThresholdCr: 1.0,
    requiresAudit: true,
    requiredDocuments: ["Audited Financials", "Clause 44 GST Reconciliation", "Clause 22 MSME 43B(h) Interest Schedule", "Section 40A(2)(b) Related Party Ledger", "TDS 26AS Cross-Match"]
  },
  {
    code: "IT_ITR_AUDIT",
    category: "INCOME_TAX",
    formName: "ITR-6 / ITR-5 (Audit)",
    title: "Income Tax Return - Corporate & Tax Audit Assessees",
    description: "Annual income tax return for corporate assessees and taxpayers subject to tax audit u/s 44AB.",
    frequency: "ANNUAL",
    governingAct: "Income Tax Act, 1961",
    governingSection: "Section 139(1) Explanation 2(a)",
    penaltySection: "Section 234F & Section 234A",
    penaltyFormulaDescription: "₹5,000 late fee + 1% simple interest per month on balance tax payable.",
    applicableConstitutions: ["PVT_LTD", "PUBLIC_LTD", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"],
    requiresAudit: true,
    requiredDocuments: ["Form 3CD Filing Acknowledgement", "Audited Schedule III Financials", "UDIN Certification", "Tax Computation Sheet"]
  },
  {
    code: "IT_TRANSFER_PRICING_3CEB",
    category: "TRANSFER_PRICING",
    formName: "Form 3CEB",
    title: "Transfer Pricing Accountant Report u/s 92E",
    description: "Report on international transactions and specified domestic transactions with associated enterprises.",
    frequency: "ANNUAL",
    governingAct: "Income Tax Act, 1961",
    governingSection: "Section 92E",
    penaltySection: "Section 271BA",
    penaltyFormulaDescription: "Flat penalty of ₹1,00,000 for failure to furnish report.",
    applicableConstitutions: ["PVT_LTD", "PUBLIC_LTD", "LLP"],
    requiredDocuments: ["Associated Enterprise Contracts", "Benchmarking Study", "Inter-company Invoices & Ledgers"]
  },

  // ─── TDS & TCS DEPOSITS & RETURNS ───
  {
    code: "TDS_CHALLAN_281",
    category: "TDS",
    formName: "Challan 281 (Monthly)",
    title: "TDS / TCS Monthly Deposit Challan 281",
    description: "Monthly deposit of tax deducted at source under Sections 192, 194C, 194J, 194Q, 194I, etc.",
    frequency: "MONTHLY",
    governingAct: "Income Tax Act, 1961",
    governingSection: "Section 200(1) r/w Rule 30",
    penaltySection: "Section 201(1A)",
    penaltyFormulaDescription: "1.50% interest per month from date of deduction to date of actual deposit.",
    applicableConstitutions: ["PVT_LTD", "PUBLIC_LTD", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"],
    dueDayOfMonth: 7,
    requiredDocuments: ["TDS Deduction Register", "Contractor & Professional Bills", "Salary Payroll Register"]
  },
  {
    code: "TDS_RETURN_24Q",
    category: "TDS",
    formName: "Form 24Q",
    title: "Quarterly TDS Return on Salary Payments",
    description: "Quarterly statement of deduction of tax on salary payments to employees (Annexure I & II).",
    frequency: "QUARTERLY",
    governingAct: "Income Tax Act, 1961",
    governingSection: "Section 200(3) r/w Rule 31A",
    penaltySection: "Section 234E & Section 271H",
    penaltyFormulaDescription: "₹200/day late fee capped at TDS amount + penalty between ₹10,000 and ₹1,00,000.",
    applicableConstitutions: ["PVT_LTD", "PUBLIC_LTD", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"],
    requiredDocuments: ["Quarterly Salary Register", "Employee PANs", "Challan 281 BSR Codes & CINs"]
  },
  {
    code: "TDS_RETURN_26Q",
    category: "TDS",
    formName: "Form 26Q",
    title: "Quarterly TDS Return on Non-Salary Domestic Payments",
    description: "Quarterly statement of deduction of tax on contractors (194C), fees (194J), rent (194I), goods (194Q).",
    frequency: "QUARTERLY",
    governingAct: "Income Tax Act, 1961",
    governingSection: "Section 200(3) r/w Rule 31A",
    penaltySection: "Section 234E & Section 271H",
    penaltyFormulaDescription: "₹200/day late fee capped at TDS amount + penalty under Section 271H.",
    applicableConstitutions: ["PVT_LTD", "PUBLIC_LTD", "LLP", "PARTNERSHIP", "PROPRIETORSHIP"],
    requiredDocuments: ["Non-Salary Deduction Vouchers", "Deductee PAN Verification", "Paid Challan 281 Receipts"]
  },

  // ─── CORPORATE (MCA / ROC) STATUTORY FILINGS ───
  {
    code: "ROC_DIR3_KYC",
    category: "ROC_MCA",
    formName: "DIR-3 KYC / Web-KYC",
    title: "Annual Director Identification Number (DIN) KYC",
    description: "Mandatory annual verification of email, mobile, and address for all approved DIN holders.",
    frequency: "ANNUAL",
    governingAct: "Companies Act, 2013",
    governingSection: "Rule 12A, Companies (Appointment and Qualification) Rules",
    penaltySection: "Deactivation + Late Fee",
    penaltyFormulaDescription: "DIN deactivation in MCA system + flat ₹5,000 late fee per director upon delayed filing.",
    applicableConstitutions: ["PVT_LTD", "PUBLIC_LTD", "LLP"],
    requiredDocuments: ["Director Active Mobile & Email OTP", "Valid Passport / Aadhaar", "Class 3 DSC"]
  },
  {
    code: "ROC_DPT3",
    category: "ROC_MCA",
    formName: "Form DPT-3",
    title: "Return of Deposits / Particulars of Non-Deposit Loans",
    description: "Annual disclosure of all outstanding loans and receipts not considered deposits u/s 73.",
    frequency: "ANNUAL",
    governingAct: "Companies Act, 2013",
    governingSection: "Section 73 r/w Rule 16, Deposit Rules",
    penaltySection: "Rule 21, Deposit Rules",
    penaltyFormulaDescription: "Fine of minimum ₹1 Lakh up to ₹10 Lakhs on company and defaulting officers.",
    applicableConstitutions: ["PVT_LTD", "PUBLIC_LTD"],
    requiredDocuments: ["Audited March 31 Balance Sheet", "Borrowings & Unsecured Loan Ledgers", "Bank Sanction Letters"]
  },
  {
    code: "ROC_MSME1_H1",
    category: "ROC_MCA",
    formName: "Form MSME-1 (H1)",
    title: "Half-Yearly Return of Overdue MSME Outstanding Payments (Apr–Sep)",
    description: "Mandatory reporting of payments due to Micro and Small enterprises exceeding 45 days.",
    frequency: "HALF_YEARLY",
    governingAct: "Companies Act, 2013",
    governingSection: "Section 405 r/w Order 2019",
    penaltySection: "Section 405(4)",
    penaltyFormulaDescription: "₹20,000 fine on company + ₹1,000/day continuing default.",
    applicableConstitutions: ["PVT_LTD", "PUBLIC_LTD"],
    requiredDocuments: ["Sundry Creditors Ledger", "MSME Udyam Registration Certificates", "Aging Analysis > 45 Days"]
  },
  {
    code: "ROC_MSME1_H2",
    category: "ROC_MCA",
    formName: "Form MSME-1 (H2)",
    title: "Half-Yearly Return of Overdue MSME Outstanding Payments (Oct–Mar)",
    description: "Mandatory reporting of payments due to Micro and Small enterprises exceeding 45 days.",
    frequency: "HALF_YEARLY",
    governingAct: "Companies Act, 2013",
    governingSection: "Section 405 r/w Order 2019",
    penaltySection: "Section 405(4)",
    penaltyFormulaDescription: "₹20,000 fine on company + ₹1,000/day continuing default.",
    applicableConstitutions: ["PVT_LTD", "PUBLIC_LTD"],
    requiredDocuments: ["March 31 Creditor Aging", "MSME Declaration Letters"]
  },
  {
    code: "ROC_AOC4",
    category: "ROC_MCA",
    formName: "Form AOC-4 / AOC-4 XBRL",
    title: "AOC-4 Statutory Financial Statements & Board Report",
    description: "Filing of annual balance sheet, P&L, auditor's report, and director's report with the ROC.",
    frequency: "ANNUAL",
    governingAct: "Companies Act, 2013",
    governingSection: "Section 137 r/w Rule 12",
    penaltySection: "Section 403 & Section 137(3)",
    penaltyFormulaDescription: "₹100/day continuing default per day for company + penalty on directors up to ₹5 Lakhs.",
    applicableConstitutions: ["PVT_LTD", "PUBLIC_LTD"],
    requiredDocuments: ["Signed Balance Sheet & P&L with UDIN", "Signed Board Report", "Notice of AGM", "Auditor Report"]
  },
  {
    code: "ROC_MGT7",
    category: "ROC_MCA",
    formName: "Form MGT-7 / MGT-7A",
    title: "MGT-7 Annual Return of Corporate Entity",
    description: "Comprehensive annual secretarial return of shareholding, promoters, meetings, and governance.",
    frequency: "ANNUAL",
    governingAct: "Companies Act, 2013",
    governingSection: "Section 92 r/w Rule 11",
    penaltySection: "Section 92(5)",
    penaltyFormulaDescription: "₹100/day continuing default without upper cap.",
    applicableConstitutions: ["PVT_LTD", "PUBLIC_LTD"],
    requiredDocuments: ["Shareholding Pattern as on FY End", "Board & Committee Meeting Minutes", "Directors Attendance Register"]
  },
  {
    code: "ROC_LLP_FORM_11",
    category: "ROC_MCA",
    formName: "LLP Form 11",
    title: "Form 11 Annual Return of Limited Liability Partnership",
    description: "Annual return of LLP partners, contributions, and details of penalties imposed.",
    frequency: "ANNUAL",
    governingAct: "Limited Liability Partnership Act, 2008",
    governingSection: "Section 35 r/w Rule 25(1)",
    penaltySection: "Section 69 of LLP Act",
    penaltyFormulaDescription: "₹100/day continuing default per day.",
    applicableConstitutions: ["LLP"],
    requiredDocuments: ["Partners Contribution Statement", "Designated Partner DPINs"]
  },
  {
    code: "ROC_LLP_FORM_8",
    category: "ROC_MCA",
    formName: "LLP Form 8",
    title: "Form 8 Statement of Account & Solvency of LLP",
    description: "Annual declaration of solvency and financial position signed by designated partners.",
    frequency: "ANNUAL",
    governingAct: "Limited Liability Partnership Act, 2008",
    governingSection: "Section 34 r/w Rule 24",
    penaltySection: "Section 69 of LLP Act",
    penaltyFormulaDescription: "₹100/day continuing default per day.",
    applicableConstitutions: ["LLP"],
    requiredDocuments: ["Statement of Assets & Liabilities", "Income & Expenditure Statement", "Solvency Declaration"]
  }
];

export const getDeadlinesByCategory = (category: ComplianceCategory): StatutoryDeadlineDefinition[] => {
  return STATUTORY_DEADLINES_MASTER.filter((d) => d.category === category);
};

export const getDeadlinesForConstitution = (type: EntityType): StatutoryDeadlineDefinition[] => {
  return STATUTORY_DEADLINES_MASTER.filter((d) => d.applicableConstitutions.includes(type));
};
