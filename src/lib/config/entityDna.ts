import { EntityType } from "@/lib/types";

export interface ComplianceRequirement {
  code: string;
  title: string;
  governingAct: string;
  frequency: "MONTHLY" | "QUARTERLY" | "ANNUAL" | "EVENT_BASED";
  dueDateDescription: string;
  penaltyClause: string;
}

export interface VaultCategoryConfig {
  id: string;
  name: string;
  description: string;
  requiredFileTypes: string[];
  mandatoryForFiling: boolean;
}

export interface EntityDnaProfile {
  type: EntityType;
  label: string;
  governingBody: string;
  primaryIdentifierLabel: string; // CIN, LLPIN, PAN, REG_NO
  taxReturnForm: string; // ITR-6, ITR-5, ITR-3, ITR-7
  mandatoryRequirements: ComplianceRequirement[];
  vaultCategories: VaultCategoryConfig[];
  caroApplicability: boolean;
  statutoryAuditMandatory: boolean;
}

export const ENTITY_DNA_REGISTRY: Record<EntityType, EntityDnaProfile> = {
  PVT_LTD: {
    type: "PVT_LTD",
    label: "Private Limited Company",
    governingBody: "Ministry of Corporate Affairs (MCA) & Income Tax Dept",
    primaryIdentifierLabel: "CIN (Corporate Identification Number)",
    taxReturnForm: "ITR-6",
    caroApplicability: true,
    statutoryAuditMandatory: true,
    mandatoryRequirements: [
      {
        code: "ROC_AOC4",
        title: "AOC-4 (Financial Statements & Board Report)",
        governingAct: "Section 137, Companies Act 2013",
        frequency: "ANNUAL",
        dueDateDescription: "Within 30 days of AGM (30th October)",
        penaltyClause: "₹100/day per form continuing default for company + directors"
      },
      {
        code: "ROC_MGT7",
        title: "MGT-7 / MGT-7A (Annual Return)",
        governingAct: "Section 92, Companies Act 2013",
        frequency: "ANNUAL",
        dueDateDescription: "Within 60 days of AGM (29th November)",
        penaltyClause: "₹100/day continuing default without ceiling"
      },
      {
        code: "ROC_DIR3_KYC",
        title: "DIR-3 KYC / Web-KYC (Director Identification Number)",
        governingAct: "Rule 12A, Companies (Appointment and Qualification) Rules",
        frequency: "ANNUAL",
        dueDateDescription: "30th September every year",
        penaltyClause: "DIN deactivation + ₹5,000 late fee per director"
      },
      {
        code: "ROC_DPT3",
        title: "DPT-3 (Return of Deposits / Non-Deposit Loans)",
        governingAct: "Rule 16, Companies (Acceptance of Deposits) Rules",
        frequency: "ANNUAL",
        dueDateDescription: "30th June every year",
        penaltyClause: "Minimum ₹1 Lakh up to ₹10 Lakhs fine on company"
      },
      {
        code: "ROC_MSME1",
        title: "MSME-1 (Half-Yearly Overdue Return)",
        governingAct: "Order 2019 under Section 405, Companies Act 2013",
        frequency: "QUARTERLY",
        dueDateDescription: "30th April & 31st October",
        penaltyClause: "₹20,000 fine on company and directors"
      }
    ],
    vaultCategories: [
      {
        id: "ROC_DOCS",
        name: "ROC & Secretarial Registers",
        description: "Incorporation Cert, MOA/AOA, Statutory Registers, Share Certificates",
        requiredFileTypes: [".pdf"],
        mandatoryForFiling: true
      },
      {
        id: "BOARD_MINUTES",
        name: "Board & AGM Minute Books",
        description: "Signed minutes of all quarterly board meetings and AGM notices",
        requiredFileTypes: [".pdf"],
        mandatoryForFiling: true
      },
      {
        id: "FINANCIALS",
        name: "Audited Financials & CARO Notes",
        description: "Balance sheet, P&L, Notes to Accounts with UDIN certification",
        requiredFileTypes: [".pdf", ".xlsx"],
        mandatoryForFiling: true
      },
      {
        id: "DIRECTOR_KYC",
        name: "Director KYC & DSC Register",
        description: "PAN, Aadhaar, Passport copies and DSC expiry records",
        requiredFileTypes: [".pdf", ".jpg"],
        mandatoryForFiling: true
      }
    ]
  },

  LLP: {
    type: "LLP",
    label: "Limited Liability Partnership",
    governingBody: "Ministry of Corporate Affairs (MCA)",
    primaryIdentifierLabel: "LLPIN (LLP Identification Number)",
    taxReturnForm: "ITR-5",
    caroApplicability: false,
    statutoryAuditMandatory: false, // Mandatory only if turnover > 40L or contribution > 25L
    mandatoryRequirements: [
      {
        code: "LLP_FORM_11",
        title: "Form 11 (Annual Return of LLP)",
        governingAct: "Rule 25(1), LLP Rules 2009",
        frequency: "ANNUAL",
        dueDateDescription: "30th May every year (within 60 days of FY close)",
        penaltyClause: "₹100/day continuing default per day"
      },
      {
        code: "LLP_FORM_8",
        title: "Form 8 (Statement of Account & Solvency)",
        governingAct: "Rule 24, LLP Rules 2009",
        frequency: "ANNUAL",
        dueDateDescription: "30th October (within 30 days from 6 months of FY end)",
        penaltyClause: "₹100/day continuing default"
      },
      {
        code: "ROC_DIR3_KYC",
        title: "DIR-3 KYC for Designated Partners (DPIN)",
        governingAct: "Rule 12A, Appointment Rules",
        frequency: "ANNUAL",
        dueDateDescription: "30th September",
        penaltyClause: "DPIN deactivation + ₹5,000 late fee"
      }
    ],
    vaultCategories: [
      {
        id: "LLP_AGREEMENT",
        name: "LLP Agreement & Supplemental Deeds",
        description: "Original agreement stamped by state government & subsequent amendments",
        requiredFileTypes: [".pdf"],
        mandatoryForFiling: true
      },
      {
        id: "PARTNER_CONTRIBUTION",
        name: "Partner Capital Accounts & Profit Ratios",
        description: "Capital ledgers, drawing schedules, and profit-sharing ratios",
        requiredFileTypes: [".xlsx", ".pdf"],
        mandatoryForFiling: true
      }
    ]
  },

  PARTNERSHIP: {
    type: "PARTNERSHIP",
    label: "Traditional Partnership Firm",
    governingBody: "Registrar of Firms (ROF) & Income Tax Department",
    primaryIdentifierLabel: "Firm PAN & RoF Registration Number",
    taxReturnForm: "ITR-5",
    caroApplicability: false,
    statutoryAuditMandatory: false,
    mandatoryRequirements: [
      {
        code: "TAX_AUDIT_3CB",
        title: "Form 3CB-3CD (Tax Audit u/s 44AB)",
        governingAct: "Section 44AB, Income Tax Act 1961",
        frequency: "ANNUAL",
        dueDateDescription: "30th September (or 31st October if audit applies)",
        penaltyClause: "0.5% of turnover or ₹1,50,000 u/s 271B"
      },
      {
        code: "SEC_40B_CHECK",
        title: "Section 40(b) Partner Remuneration Limiter",
        governingAct: "Section 40(b), Income Tax Act 1961",
        frequency: "ANNUAL",
        dueDateDescription: "Prior to finalizing partnership tax computation",
        penaltyClause: "Excess partner remuneration disallowed and added to firm taxable income"
      }
    ],
    vaultCategories: [
      {
        id: "PARTNERSHIP_DEED",
        name: "Notarized Partnership Deed",
        description: "Deed clearly specifying interest rate (<= 12%) and remuneration clauses",
        requiredFileTypes: [".pdf"],
        mandatoryForFiling: true
      },
      {
        id: "PARTNER_TAX_PACKS",
        name: "Partner Individual Returns & Capital Statements",
        description: "Schedule of interest and remuneration credited to individual partner PANs",
        requiredFileTypes: [".pdf"],
        mandatoryForFiling: false
      }
    ]
  },

  TRUST_NGO: {
    type: "TRUST_NGO",
    label: "Charitable Trust / Section 8 NGO",
    governingBody: "Income Tax Exemptions Wing & Charity Commissioner",
    primaryIdentifierLabel: "12AB Unique Registration Number (URN)",
    taxReturnForm: "ITR-7",
    caroApplicability: false,
    statutoryAuditMandatory: true,
    mandatoryRequirements: [
      {
        code: "FORM_10B_10BB",
        title: "Form 10B / Form 10BB (Audit Report for Charitable Trusts)",
        governingAct: "Section 12A(1)(b) / 10(23C), Income Tax Act",
        frequency: "ANNUAL",
        dueDateDescription: "One month prior to ITR due date (30th September)",
        penaltyClause: "Loss of Section 11/12 tax exemption, taxed at Maximum Marginal Rate (30%+)"
      },
      {
        code: "FORM_10BD",
        title: "Form 10BD (Statement of Donations for 80G Certificates)",
        governingAct: "Section 80G(5)(viii), Income Tax Act",
        frequency: "ANNUAL",
        dueDateDescription: "31st May following the financial year",
        penaltyClause: "₹200/day late fee u/s 234G + penalty up to ₹1,00,000 u/s 271K"
      },
      {
        code: "FCRA_RETURN",
        title: "FC-4 Return (Foreign Contribution Regulation Act)",
        governingAct: "Section 18, FCRA 2010 (Ministry of Home Affairs)",
        frequency: "ANNUAL",
        dueDateDescription: "31st December",
        penaltyClause: "Cancellation of FCRA license and freezing of SBI New Delhi FCRA A/c"
      }
    ],
    vaultCategories: [
      {
        id: "TRUST_REGISTRATION",
        name: "12AB & 80G Final Orders",
        description: "Form 10AC/10AD orders issued by CIT (Exemptions) with 5-year validity",
        requiredFileTypes: [".pdf"],
        mandatoryForFiling: true
      },
      {
        id: "DONOR_REGISTRY",
        name: "Donor PAN & Donation Vouchers",
        description: "Clean CSV/Excel of all 80G donors with PAN, address, and amount for Form 10BD",
        requiredFileTypes: [".xlsx", ".csv", ".pdf"],
        mandatoryForFiling: true
      },
      {
        id: "UTILIZATION_CERT",
        name: "Project Utilization Certificates",
        description: "Program-wise vouchers proving 85% application of trust income u/s 11(1)",
        requiredFileTypes: [".pdf"],
        mandatoryForFiling: true
      }
    ]
  },

  PROPRIETORSHIP: {
    type: "PROPRIETORSHIP",
    label: "Sole Proprietorship Enterprise",
    governingBody: "Income Tax Department & GST Council",
    primaryIdentifierLabel: "Proprietor PAN & GSTIN",
    taxReturnForm: "ITR-3 / ITR-4 (Sugam)",
    caroApplicability: false,
    statutoryAuditMandatory: false,
    mandatoryRequirements: [
      {
        code: "PRESUMPTIVE_44AD",
        title: "Section 44AD / 44ADA Presumptive Eligibility",
        governingAct: "Section 44AD/ADA, Income Tax Act",
        frequency: "ANNUAL",
        dueDateDescription: "31st July (if non-audit) or 31st October",
        penaltyClause: "Mandatory books of accounts maintenance u/s 44AA if profit declared < 6%/8%"
      },
      {
        code: "GST_3B_MONTHLY",
        title: "GSTR-3B & GSTR-1 Monthly Return",
        governingAct: "CGST Act 2017",
        frequency: "MONTHLY",
        dueDateDescription: "11th (GSTR-1) and 20th (GSTR-3B)",
        penaltyClause: "₹50/day late fee + 18% p.a. interest on cash tax liability"
      }
    ],
    vaultCategories: [
      {
        id: "BANK_ACCOUNTS",
        name: "Business & Personal Current Accounts",
        description: "12 months bank statements with clear segregation of personal drawings",
        requiredFileTypes: [".pdf", ".xlsx"],
        mandatoryForFiling: true
      },
      {
        id: "PURCHASE_SALES_BILLS",
        name: "GST Invoices & Purchase Registers",
        description: "Tax invoices supporting ITC claim and e-way bill references",
        requiredFileTypes: [".pdf", ".zip"],
        mandatoryForFiling: true
      }
    ]
  },

  INDIVIDUAL_HNI: {
    type: "INDIVIDUAL_HNI",
    label: "High-Net-Worth Individual (HNWI)",
    governingBody: "Income Tax Department",
    primaryIdentifierLabel: "Individual PAN",
    taxReturnForm: "ITR-2 / ITR-3",
    caroApplicability: false,
    statutoryAuditMandatory: false,
    mandatoryRequirements: [
      {
        code: "AIS_TIS_RECON",
        title: "Annual Information Statement (AIS) Reconciliation",
        governingAct: "Rule 114-I, Income Tax Rules",
        frequency: "ANNUAL",
        dueDateDescription: "Prior to ITR submission (31st July)",
        penaltyClause: "High risk of automated Section 143(1)(a) adjustment demand"
      },
      {
        code: "SCHEDULE_FA",
        title: "Schedule FA (Foreign Assets Disclosure)",
        governingAct: "Black Money Act 2015",
        frequency: "ANNUAL",
        dueDateDescription: "Concurrent with ITR filing",
        penaltyClause: "Flat ₹10 Lakh penalty u/s 43 of Black Money Act for non-disclosure"
      }
    ],
    vaultCategories: [
      {
        id: "CAPITAL_GAINS",
        name: "Mutual Fund & Demat Capital Gain Packs",
        description: "CAMS/KFintech statements, Zerodha/Groww P&L packs for 112A/111A calculation",
        requiredFileTypes: [".xlsx", ".pdf"],
        mandatoryForFiling: true
      },
      {
        id: "FOREIGN_ASSETS",
        name: "Foreign Stock / ESOP / US Account Statements",
        description: "Vested RSU details, Morgan Stanley / Charles Schwab statements",
        requiredFileTypes: [".pdf"],
        mandatoryForFiling: false
      }
    ]
  },

  PUBLIC_LTD: {
    type: "PUBLIC_LTD",
    label: "Public Limited Company",
    governingBody: "MCA & SEBI (if listed)",
    primaryIdentifierLabel: "CIN",
    taxReturnForm: "ITR-6",
    caroApplicability: true,
    statutoryAuditMandatory: true,
    mandatoryRequirements: [
      {
        code: "ROC_AOC4_XBRL",
        title: "AOC-4 XBRL (Mandatory XBRL Filing)",
        governingAct: "Rule 3, Companies (Filing of Documents and Forms in XBRL) Rules",
        frequency: "ANNUAL",
        dueDateDescription: "30 days from AGM",
        penaltyClause: "Severe MCA compounding penalties"
      }
    ],
    vaultCategories: [
      {
        id: "SECRETARIAL_AUDIT",
        name: "Secretarial Audit Report (Form MR-3)",
        description: "Certified report by practicing Company Secretary",
        requiredFileTypes: [".pdf"],
        mandatoryForFiling: true
      }
    ]
  }
};

/**
 * Dynamic Statutory Threshold Rules Evaluator
 */
export function evaluateEntityThresholds(
  turnoverCr: number,
  cashReceiptsPct: number,
  hasMsmeSuppliers: boolean,
  entityType: EntityType
) {
  // 1. Tax Audit u/s 44AB
  // Limit is 10 Cr if cash transactions <= 5%, else 1 Cr
  const isDigital = cashReceiptsPct <= 5;
  const auditThresholdCr = isDigital ? 10 : 1;
  const taxAuditApplicable = turnoverCr > auditThresholdCr;

  // 2. Section 43B(h) MSME applicability
  const msmeDisallowanceRisk = hasMsmeSuppliers;

  // 3. e-Invoicing threshold (₹5 Cr)
  const eInvoicingMandatory = turnoverCr >= 5 && (entityType === "PVT_LTD" || entityType === "LLP" || entityType === "PARTNERSHIP" || entityType === "PUBLIC_LTD");

  // 4. CARO 2020 (Pvt Ltd: turnover > 10 Cr)
  const caroApplicable = entityType === "PUBLIC_LTD" || (entityType === "PVT_LTD" && turnoverCr > 10);

  return {
    turnoverCr,
    isDigital,
    auditThresholdCr,
    taxAuditApplicable,
    msmeDisallowanceRisk,
    eInvoicingMandatory,
    caroApplicable
  };
}
