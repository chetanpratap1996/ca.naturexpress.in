import { 
  ClientGroup, 
  ClientEntity, 
  ComplianceTask, 
  NoticeRecord, 
  InvoiceItem, 
  DscRecord, 
  DocumentItem,
  AuditTrailLog,
  ClientPasswordVault,
  PayToReleaseConfig,
  ParsedBankStatement,
  GovtPortalSyncProfile,
  Msme43BhClauseItem,
  Section40A2bSampleItem,
  StaffDataSecurityAudit,
  PartnerRealizationMetrics,
  PeerReviewDossier
} from "../types";

export const SANDBOX_FIRM_METRICS = {
  name: "GPA & Co., Chartered Accountants",
  companyName: "Brains & Taxes Private Limited",
  frn: "022998C",
  peerReviewStatus: "Compliant (ICAI Certified Validity till 2028)",
  totalClients: 4,
  activeEntities: 6,
  partnersCount: 6,
  articleTrainees: 28,
  criticalDeadlinesNext72h: 4,
  openScrutinyNotices: 4,
  totalDemandRiskINR: 6850000, // ₹68.5 Lakhs
  unbilledWipAmount: 325000,   // ₹3.25 Lakhs
  pendingCollections: 273000,  // ₹2.73 Lakhs
  complianceHealthScore: 94,
  dailyAccruingPenaltyRisk: 2500,
  firmUpiVpa: "BRAINSANDTAXES@icici",
  firmBankDetails: {
    bankName: "HDFC Bank",
    branch: "Y.N. Road Branch, Indore",
    accountNumber: "50200088921842",
    accountName: "GPA & Co., Chartered Accountants",
    ifsc: "ICIC0000041"
  }
};

export const SANDBOX_GROUPS: ClientGroup[] = [
  {
    id: "GRP-APEX",
    name: "The Apex Industrial Group",
    promoterName: "Rajesh Sharma",
    promoterPhone: "+91 98200 11223",
    promoterEmail: "rajesh.sharma@apexautotech.com",
    totalEntities: 2,
    totalTurnoverCr: 62.7,
    unbilledWipTotal: 145000,
    overdueFeesTotal: 118000,
    entityIds: ["CLI-APEX-01", "CLI-APEX-02"]
  },
  {
    id: "GRP-OMNI",
    name: "OmniRetail Group",
    promoterName: "Aditya Singhal",
    promoterPhone: "+91 98110 44211",
    promoterEmail: "aditya@omniretail.in",
    totalEntities: 2,
    totalTurnoverCr: 30.8,
    unbilledWipTotal: 85000,
    overdueFeesTotal: 65000,
    entityIds: ["CLI-OMNI-01", "CLI-OMNI-02"]
  },
  {
    id: "GRP-ZENITH",
    name: "Zenith Global Innovations",
    promoterName: "Vikramaditya Singh",
    promoterPhone: "+91 97110 88231",
    promoterEmail: "vikram@zenithsaas.io",
    totalEntities: 1,
    totalTurnoverCr: 12.5,
    unbilledWipTotal: 55000,
    overdueFeesTotal: 0,
    entityIds: ["CLI-ZENITH-01"]
  },
  {
    id: "GRP-DIRECT",
    name: "Direct Practice Clients",
    promoterName: "Chetan Pratap Singh",
    promoterPhone: "8077170715",
    promoterEmail: "chetanpratap1996@gmail.com",
    totalEntities: 1,
    totalTurnoverCr: 10.0,
    unbilledWipTotal: 40000,
    overdueFeesTotal: 90000,
    entityIds: ["CLI-PRATWI-01"]
  }
];

export const SANDBOX_CLIENTS: ClientEntity[] = [
  {
    id: "CLI-APEX-01",
    groupId: "GRP-APEX",
    groupName: "The Apex Industrial Group",
    name: "Apex AutoTech Private Limited",
    type: "PVT_LTD",
    pan: "AABCA8891D",
    gstin: "23AABCA8891D1Z2",
    cin: "U29100MP2015PTC034120",
    tan: "BPLR01928F",
    turnoverCr: 48.5,
    partnerInCharge: "CA Gunjan Jain",
    assignedArticle: "Kriti Jain (Article)",
    incorporationYear: 2015,
    penaltyRiskAccrued: 4500,
    primaryContact: {
      name: "Rajesh Sharma",
      phone: "+91 98200 11223",
      email: "rajesh.sharma@apexautotech.com",
      designation: "Managing Director"
    }
  },
  {
    id: "CLI-APEX-02",
    groupId: "GRP-APEX",
    groupName: "The Apex Industrial Group",
    name: "Apex Precision Alloys LLP",
    type: "LLP",
    pan: "AAHFA9021K",
    gstin: "23AAHFA9021K1Z5",
    turnoverCr: 14.2,
    partnerInCharge: "CA Sahil Jain",
    assignedArticle: "Aman Verma (Article)",
    incorporationYear: 2019,
    penaltyRiskAccrued: 0,
    primaryContact: {
      name: "Neha Sharma",
      phone: "+91 98200 11224",
      email: "neha@apexautotech.com",
      designation: "Designated Partner"
    }
  },
  {
    id: "CLI-OMNI-01",
    groupId: "GRP-OMNI",
    groupName: "OmniRetail Group",
    name: "OmniRetail Hypermarkets Private Limited",
    type: "PVT_LTD",
    pan: "AAFCO4492K",
    gstin: "23AAFCO4492K1Z8",
    cin: "U52100MP2019PTC048991",
    tan: "INDD04921K",
    turnoverCr: 24.0,
    partnerInCharge: "CA Sahil Jain",
    assignedArticle: "Aman Verma (Article)",
    incorporationYear: 2019,
    penaltyRiskAccrued: 8500,
    primaryContact: {
      name: "Aditya Singhal",
      phone: "+91 98110 44211",
      email: "aditya@omniretail.in",
      designation: "Managing Director"
    }
  },
  {
    id: "CLI-OMNI-02",
    groupId: "GRP-OMNI",
    groupName: "OmniRetail Group",
    name: "Singhal Logistics & Warehousing",
    type: "PARTNERSHIP",
    pan: "AABFS7714C",
    gstin: "23AABFS7714C1Z1",
    turnoverCr: 6.8,
    partnerInCharge: "CA Ankit Agarwal",
    assignedArticle: "Rahul Sharma (Article)",
    incorporationYear: 2021,
    penaltyRiskAccrued: 0,
    primaryContact: {
      name: "Vivek Singhal",
      phone: "+91 98110 44212",
      email: "vivek@singhallogistics.com",
      designation: "Managing Partner"
    }
  },
  {
    id: "CLI-ZENITH-01",
    groupId: "GRP-ZENITH",
    groupName: "Zenith Global Innovations",
    name: "Zenith SaaS Technologies Private Limited",
    type: "PVT_LTD",
    pan: "AAACZ5512L",
    gstin: "23AAACZ5512L1Z4",
    cin: "U72200MP2021PTC056214",
    tan: "BPLZ02911L",
    turnoverCr: 12.5,
    partnerInCharge: "CA Gunjan Jain",
    assignedArticle: "Kriti Jain (Article)",
    incorporationYear: 2021,
    penaltyRiskAccrued: 0,
    primaryContact: {
      name: "Vikramaditya Singh",
      phone: "+91 97110 88231",
      email: "vikram@zenithsaas.io",
      designation: "CEO & Co-Founder"
    }
  },
  {
    id: "CLI-PRATWI-01",
    groupId: "GRP-DIRECT",
    groupName: "Direct Practice Clients",
    name: "Pratwi Solutions Private Limited",
    type: "PVT_LTD",
    pan: "AANCP9915B",
    gstin: "09AANCP9915B1Z4",
    cin: "U74999UP2024PTC199821",
    tan: "KNPP01821C",
    turnoverCr: 10.0,
    partnerInCharge: "CA Gunjan Jain",
    assignedArticle: "Kriti Jain (Article)",
    incorporationYear: 2024,
    penaltyRiskAccrued: 0,
    primaryContact: {
      name: "Chetan Pratap Singh",
      phone: "8077170715",
      email: "chetanpratap1996@gmail.com",
      designation: "Director / Authorized Signatory"
    }
  }
];

export const SANDBOX_TASKS: ComplianceTask[] = [
  // 1. Critical Deadlines
  {
    id: "TSK-01",
    entityId: "CLI-APEX-01",
    entityName: "Apex AutoTech Private Limited",
    groupId: "GRP-APEX",
    category: "GST",
    title: "GSTR-3B Monthly Return Filing",
    period: "September 2026",
    dueDate: "2026-10-20",
    status: "PARTNER_SIGN_OFF",
    assignedTo: "Kriti Jain (Article)",
    reviewedBy: "CA Gunjan Jain",
    priority: "CRITICAL",
    penaltyRisk: 450, // 9 days overdue * ₹50/day u/s 47
    accruingDailyPenalty: 50,
    missingDocumentsCount: 0,
    chaseCount: 2,
    lastChaseDate: "2026-10-18",
    pan: "AABCA8891D",
    gstin: "23AABCA8891D1Z2",
    taxPayableAmount: 245000,
    section50Interest: 1086, // 18% p.a. on ₹2.45L for 9 days
    clientApprovalStatus: "APPROVED",
    penaltyNote: "Sec 47 Late Fee (₹50/day) + Sec 50(1) 18% p.a. Cash Interest"
  },
  {
    id: "TSK-02",
    entityId: "CLI-OMNI-01",
    entityName: "OmniRetail Hypermarkets Private Limited",
    groupId: "GRP-OMNI",
    category: "GST",
    title: "GSTR-3B Monthly Return Filing",
    period: "September 2026",
    dueDate: "2026-10-20",
    status: "MANAGER_REVIEW",
    assignedTo: "Aman Verma (Article)",
    reviewedBy: "CA Sahil Jain",
    priority: "CRITICAL",
    penaltyRisk: 450,
    accruingDailyPenalty: 50,
    missingDocumentsCount: 1,
    missingDocumentsList: ["Branch Cash Reconciliation Sheet"],
    chaseCount: 3,
    lastChaseDate: "2026-10-19",
    pan: "AAFCO4492K",
    gstin: "23AAFCO4492K1Z8",
    taxPayableAmount: 180000,
    section50Interest: 798,
    clientApprovalStatus: "PENDING",
    penaltyNote: "Sec 47 Late Fee (₹50/day) + Sec 50(1) 18% p.a. Cash Interest"
  },
  {
    id: "TSK-03",
    entityId: "CLI-APEX-01",
    entityName: "Apex AutoTech Private Limited",
    groupId: "GRP-APEX",
    category: "TAX_AUDIT",
    title: "Form 3CD Tax Audit Final Certification",
    period: "FY 2025-26",
    dueDate: "2026-09-30", // Statutory cutoff under Section 44AB (1 month before ITR-6)
    status: "PARTNER_SIGN_OFF",
    assignedTo: "Kriti Jain (Article)",
    reviewedBy: "CA Gunjan Jain",
    priority: "CRITICAL",
    penaltyRisk: 150000, // Section 271B: 0.5% of turnover (capped at ₹1.5L)
    accruingDailyPenalty: 0, // Not a daily accruing fee; statutory flat penalty u/s 271B
    missingDocumentsCount: 0,
    chaseCount: 1,
    officialUdin: "26518492BTA0192841",
    pan: "AABCA8891D",
    clientApprovalStatus: "APPROVED",
    penaltyNote: "Sec 271B: 0.5% Turnover (Statutory Cap ₹1,50,000)"
  },
  {
    id: "TSK-04",
    entityId: "CLI-ZENITH-01",
    entityName: "Zenith SaaS Technologies Private Limited",
    groupId: "GRP-ZENITH",
    category: "ROC_MCA",
    title: "DIR-3 KYC Filing for Director Vikramaditya Singh",
    period: "FY 2025-26",
    dueDate: "2026-09-30", // Statutory cutoff under Rule 12A of Companies Rules
    status: "IN_PREPARATION",
    assignedTo: "Kriti Jain (Article)",
    reviewedBy: "CA Gunjan Jain",
    priority: "CRITICAL",
    penaltyRisk: 5000, // Flat ₹5,000 mandatory late fee under MCA Rule 12A
    accruingDailyPenalty: 0,
    missingDocumentsCount: 1,
    missingDocumentsList: ["Updated Passport Copy with current address"],
    chaseCount: 2,
    pan: "AAACZ5512L",
    cin: "U72200MP2021PTC056214",
    clientApprovalStatus: "PENDING",
    penaltyNote: "MCA Rule 12A: Flat ₹5,000 Late Fee"
  },

  // 2. In Preparation & Review
  {
    id: "TSK-05",
    entityId: "CLI-PRATWI-01",
    entityName: "Pratwi Solutions Private Limited",
    groupId: "GRP-DIRECT",
    category: "INCOME_TAX",
    title: "ITR-6 Corporate Income Tax Filing",
    period: "AY 2026-27 (FY 2025-26)",
    dueDate: "2026-10-31", // Audited Corporate Assessee deadline u/s 139(1)
    status: "IN_PREPARATION",
    assignedTo: "Kriti Jain (Article)",
    reviewedBy: "CA Gunjan Jain",
    priority: "HIGH",
    penaltyRisk: 5000, // Section 234F statutory cap is ₹5,000 flat
    accruingDailyPenalty: 0,
    missingDocumentsCount: 0,
    chaseCount: 1,
    pan: "AANCP9915B",
    cin: "U74999UP2024PTC199821",
    clientApprovalStatus: "PENDING",
    penaltyNote: "Sec 234F: Max Late Fee ₹5,000 Flat"
  },
  {
    id: "TSK-06",
    entityId: "CLI-APEX-02",
    entityName: "Apex Precision Alloys LLP",
    groupId: "GRP-APEX",
    category: "ROC_MCA",
    title: "Form 8 Statement of Account & Solvency",
    period: "FY 2025-26",
    dueDate: "2026-10-30", // Section 34 LLP Act (Within 30 days of 6 months of FY end)
    status: "MANAGER_REVIEW",
    assignedTo: "Aman Verma (Article)",
    reviewedBy: "CA Sahil Jain",
    priority: "HIGH",
    penaltyRisk: 50000,
    accruingDailyPenalty: 100, // ₹100/day under amended LLP Rules (max ₹50,000)
    missingDocumentsCount: 0,
    chaseCount: 1,
    pan: "AAHFA9021K",
    clientApprovalStatus: "APPROVED",
    penaltyNote: "LLP Sec 34 / Rule 24: ₹100/day late fee"
  },
  {
    id: "TSK-07",
    entityId: "CLI-OMNI-02",
    entityName: "Singhal Logistics & Warehousing",
    groupId: "GRP-OMNI",
    category: "TDS",
    title: "Form 26Q Q2 Quarterly TDS Return",
    period: "Q2 FY 2026-27",
    dueDate: "2026-10-31", // Rule 31A statutory cutoff
    status: "DOCUMENTS_AWAITED",
    assignedTo: "Rahul Sharma (Article)",
    reviewedBy: "CA Ankit Agarwal",
    priority: "MEDIUM",
    penaltyRisk: 20000,
    accruingDailyPenalty: 200, // ₹200/day u/s 234E
    missingDocumentsCount: 2,
    missingDocumentsList: ["September Bank Challans", "Transporter PAN Declarations"],
    chaseCount: 4,
    lastChaseDate: "2026-10-24",
    pan: "AAFCO4492K",
    tan: "INDD04921K",
    clientApprovalStatus: "PENDING",
    penaltyNote: "Sec 234E: ₹200/day late fee (capped at TDS sum)"
  },
  {
    id: "TSK-08",
    entityId: "CLI-ZENITH-01",
    entityName: "Zenith SaaS Technologies Private Limited",
    groupId: "GRP-ZENITH",
    category: "GST",
    title: "GSTR-1 Outward Supplies Return",
    period: "September 2026",
    dueDate: "2026-10-11",
    status: "FILED_AND_COMPLETED",
    assignedTo: "Kriti Jain (Article)",
    reviewedBy: "CA Gunjan Jain",
    priority: "HIGH",
    penaltyRisk: 0,
    accruingDailyPenalty: 0,
    missingDocumentsCount: 0,
    chaseCount: 0,
    arnNumber: "AA2309260019281",
    filingDate: "2026-10-10",
    pan: "AAACZ5512L",
    gstin: "23AAACZ5512L1Z4"
  },
  {
    id: "TSK-09",
    entityId: "CLI-APEX-01",
    entityName: "Apex AutoTech Private Limited",
    groupId: "GRP-APEX",
    category: "GST",
    title: "GSTR-1 Outward Supplies Return",
    period: "September 2026",
    dueDate: "2026-10-11",
    status: "FILED_AND_COMPLETED",
    assignedTo: "Kriti Jain (Article)",
    reviewedBy: "CA Gunjan Jain",
    priority: "HIGH",
    penaltyRisk: 0,
    accruingDailyPenalty: 0,
    missingDocumentsCount: 0,
    chaseCount: 0,
    arnNumber: "AA2309260048192",
    filingDate: "2026-10-09",
    pan: "AABCA8891D",
    gstin: "23AABCA8891D1Z2"
  },
  {
    id: "TSK-10",
    entityId: "CLI-PRATWI-01",
    entityName: "Pratwi Solutions Private Limited",
    groupId: "GRP-DIRECT",
    category: "GST",
    title: "GSTR-1 Outward Supplies Return",
    period: "September 2026",
    dueDate: "2026-10-11",
    status: "FILED_AND_COMPLETED",
    assignedTo: "Kriti Jain (Article)",
    reviewedBy: "CA Gunjan Jain",
    priority: "HIGH",
    penaltyRisk: 0,
    accruingDailyPenalty: 0,
    missingDocumentsCount: 0,
    chaseCount: 0,
    arnNumber: "AA0909260029410",
    filingDate: "2026-10-10",
    pan: "AANCP9915B",
    gstin: "09AANCP9915B1Z4"
  },
  {
    id: "TSK-11",
    entityId: "CLI-APEX-01",
    entityName: "Apex AutoTech Private Limited",
    groupId: "GRP-APEX",
    category: "INCOME_TAX",
    title: "Q2 Advance Tax Calculation & Challan 280",
    period: "Q2 FY 2026-27",
    dueDate: "2026-09-15",
    status: "FILED_AND_COMPLETED",
    assignedTo: "Kriti Jain (Article)",
    reviewedBy: "CA Gunjan Jain",
    priority: "HIGH",
    penaltyRisk: 0,
    accruingDailyPenalty: 0,
    missingDocumentsCount: 0,
    chaseCount: 0,
    challanCin: "BSR: 0280281 • Challan: 88120", // CIN/BSR matched instead of GST ARN
    filingDate: "2026-09-14",
    pan: "AABCA8891D",
    taxPayableAmount: 480000
  },
  {
    id: "TSK-12",
    entityId: "CLI-OMNI-01",
    entityName: "OmniRetail Hypermarkets Private Limited",
    groupId: "GRP-OMNI",
    category: "GST",
    title: "GSTR-1 Outward Supplies Return",
    period: "September 2026",
    dueDate: "2026-10-11",
    status: "FILED_AND_COMPLETED",
    assignedTo: "Aman Verma (Article)",
    reviewedBy: "CA Sahil Jain",
    priority: "HIGH",
    penaltyRisk: 0,
    accruingDailyPenalty: 0,
    missingDocumentsCount: 0,
    chaseCount: 0,
    arnNumber: "AA2309260077421",
    filingDate: "2026-10-11",
    pan: "AAFCO4492K",
    gstin: "23AAFCO4492K1Z8"
  }
];

export const SANDBOX_NOTICES: NoticeRecord[] = [
  {
    id: "NTC-01",
    entityId: "CLI-OMNI-01",
    entityName: "OmniRetail Hypermarkets Private Limited",
    groupId: "GRP-OMNI",
    authority: "INCOME_TAX",
    section: "Section 148 Reassessment",
    dinNumber: "ITD/AST/2026/148/992104",
    demandAmount: 4250000, // ₹42.5 Lakhs
    issueDate: "2026-10-04",
    statutoryDeadline: "2026-11-03",
    daysRemaining: 5,
    status: "DRAFTING_RESPONSE",
    riskLevel: "CRITICAL",
    assignedPartner: "CA Sahil Jain",
    assessmentYear: "AY 2019-20 (FY 2018-19)",
    issuingOfficer: "National Faceless Assessment Centre (NFAC), Delhi",
    pan: "AAFCO4492K",
    summary: "Notice issued regarding unexplained high-value cash deposits (SFT-004) aggregating to ₹1.45 Cr in HDFC Bank during demonetization/festive windows."
  },
  {
    id: "NTC-02",
    entityId: "CLI-APEX-01",
    entityName: "Apex AutoTech Private Limited",
    groupId: "GRP-APEX",
    authority: "GST_DEPT",
    section: "ASMT-10 / DRC-01A (ITC Mismatch)",
    dinNumber: "CBIC/GST/2026/ASMT10/8819",
    demandAmount: 1850000, // ₹18.5 Lakhs
    issueDate: "2026-10-12",
    statutoryDeadline: "2026-11-11",
    daysRemaining: 13,
    status: "PARTNER_REVIEW",
    riskLevel: "HIGH",
    assignedPartner: "CA Gunjan Jain",
    assessmentYear: "FY 2023-24",
    issuingOfficer: "Superintendent of Central GST, Range-II, Commercial Tax Indore",
    pan: "AABCA8891D",
    gstin: "23AABCA8891D1Z2",
    summary: "Discrepancy of ₹18,50,000 between ITC claimed in Table 4(A)(5) of GSTR-3B vs ITC available in GSTR-2B due to non-filing by supplier Tata Projects Ltd."
  },
  {
    id: "NTC-03",
    entityId: "CLI-PRATWI-01",
    entityName: "Pratwi Solutions Private Limited",
    groupId: "GRP-DIRECT",
    authority: "INCOME_TAX",
    section: "Section 143(1)(a) Prima Facie Adjustment",
    dinNumber: "CPC/2526/1431A/092812",
    demandAmount: 450000, // ₹4.5 Lakhs
    issueDate: "2026-10-15",
    statutoryDeadline: "2026-11-14",
    daysRemaining: 16,
    status: "DRAFTING_RESPONSE",
    riskLevel: "MEDIUM",
    assignedPartner: "CA Gunjan Jain",
    assessmentYear: "AY 2025-26 (FY 2024-25)",
    issuingOfficer: "Centralized Processing Centre (CPC), Income Tax Department, Bengaluru",
    pan: "AANCP9915B",
    summary: "Proposed disallowance of Section 43B statutory employee provident fund contribution paid before ITR due date but after month cutoff."
  },
  {
    id: "NTC-04",
    entityId: "CLI-ZENITH-01",
    entityName: "Zenith SaaS Technologies Private Limited",
    groupId: "GRP-ZENITH",
    authority: "DGGI",
    section: "Rule 96(10) / Refund Scrutiny",
    dinNumber: "DGGI/LZ/2026/DRC01C/4412",
    demandAmount: 300000,
    issueDate: "2026-09-28",
    statutoryDeadline: "2026-10-28",
    daysRemaining: 0,
    status: "SUBMITTED",
    riskLevel: "MEDIUM",
    assignedPartner: "CA Gunjan Jain",
    assessmentYear: "FY 2024-25",
    issuingOfficer: "Directorate General of GST Intelligence (DGGI), Zonal Unit",
    pan: "AAACZ5512L",
    gstin: "23AAACZ5512L1Z4",
    acknowledgementNo: "DGGI/ACK/2026/994182",
    submittedAt: "2026-10-26T14:30:00Z",
    summary: "Export without payment of tax under LUT - verification of FIRC remittances for export of IT consulting services to US and EU clients."
  }
];

export const SANDBOX_INVOICES: InvoiceItem[] = [
  // Overdue / Locked Deliverable
  {
    id: "INV-2026-089",
    invoiceNo: "GPA/2026-27/089",
    entityId: "CLI-APEX-01",
    entityName: "Apex AutoTech Private Limited",
    groupId: "GRP-APEX",
    serviceDescription: "Statutory Tax Audit u/s 44AB & Form 3CD Certification for FY 2025-26",
    taxableAmount: 100000,
    gstRate: 18,
    gstAmount: 18000,
    amount: 118000,
    dueDate: "2026-09-30",
    status: "OVERDUE",
    sacCode: "998231"
  },
  {
    id: "INV-2026-094",
    invoiceNo: "GPA/2026-27/094",
    entityId: "CLI-PRATWI-01",
    entityName: "Pratwi Solutions Private Limited",
    groupId: "GRP-DIRECT",
    serviceDescription: "Annual Statutory Company Audit & Corporate ITR Filing Retainer",
    taxableAmount: 76271,
    gstRate: 18,
    gstAmount: 13729,
    amount: 90000,
    dueDate: "2026-10-15",
    status: "OVERDUE",
    sacCode: "998231"
  },
  {
    id: "INV-2026-102",
    invoiceNo: "GPA/2026-27/102",
    entityId: "CLI-OMNI-01",
    entityName: "OmniRetail Hypermarkets Private Limited",
    groupId: "GRP-OMNI",
    serviceDescription: "Representation & Legal Reply for Section 148 Income Tax Reassessment",
    taxableAmount: 55085,
    gstRate: 18,
    gstAmount: 9915,
    amount: 65000,
    dueDate: "2026-10-25",
    status: "UTR_SUBMITTED",
    sacCode: "998231",
    clientUtrNumber: "HDFCN26298192841",
    clientPaymentMode: "NEFT_RTGS",
    clientPaymentDate: "2026-10-26",
    clientPayerNote: "RTGS transferred from current account. Please verify and release signed reply."
  },
  {
    id: "INV-2026-108",
    invoiceNo: "GPA/2026-27/108",
    entityId: "CLI-ZENITH-01",
    entityName: "Zenith SaaS Technologies Private Limited",
    groupId: "GRP-ZENITH",
    serviceDescription: "CMA Data Preparation & Banker Loan Pack Certification with UDIN",
    taxableAmount: 42373,
    gstRate: 18,
    gstAmount: 7627,
    amount: 50000,
    dueDate: "2026-10-28",
    status: "PAID",
    sacCode: "998231",
    clientUtrNumber: "UPI/629819284128/GPA",
    clientPaymentMode: "UPI",
    clientPaymentDate: "2026-10-22",
    reconciledBy: "CA Gunjan Jain",
    reconciledAt: "2026-10-22 17:30:00"
  },
  {
    id: "INV-2026-077",
    invoiceNo: "GPA/2026-27/077",
    entityId: "CLI-APEX-01",
    entityName: "Apex AutoTech Private Limited",
    groupId: "GRP-APEX",
    serviceDescription: "Monthly GST Retainer (GSTR-1, GSTR-3B & 2B Matching) - August 2026",
    taxableAmount: 35000,
    gstRate: 18,
    gstAmount: 6300,
    amount: 41300,
    dueDate: "2026-09-10",
    status: "PAID",
    sacCode: "998231",
    clientUtrNumber: "ICICIN2609104812",
    clientPaymentMode: "NEFT_RTGS",
    clientPaymentDate: "2026-09-08",
    reconciledBy: "CA Gunjan Jain"
  },
  {
    id: "INV-2026-081",
    invoiceNo: "GPA/2026-27/081",
    entityId: "CLI-OMNI-02",
    entityName: "Singhal Logistics & Warehousing",
    groupId: "GRP-OMNI",
    serviceDescription: "Quarterly TDS Compliances & Form 26Q Filing - Q1",
    taxableAmount: 20000,
    gstRate: 18,
    gstAmount: 3600,
    amount: 23600,
    dueDate: "2026-08-30",
    status: "PAID",
    sacCode: "998231",
    clientUtrNumber: "SBIN26083099281",
    clientPaymentMode: "NEFT_RTGS",
    clientPaymentDate: "2026-08-28"
  }
];

export const SANDBOX_PAY_TO_RELEASE_CONFIGS: PayToReleaseConfig[] = [
  {
    entityId: "CLI-APEX-01",
    isLocked: true,
    totalOutstandingAmount: 118000,
    oldestInvoiceDays: 82,
    gracePeriodDays: 30,
    blockedDeliverables: [
      "FORM_3CD_PDF",
      "BALANCE_SHEET_SIGNED",
      "ITR_ACKNOWLEDGMENT"
    ],
    instantUpiVpa: "BRAINSANDTAXES@icici",
    merchantName: "GPA & Co., Chartered Accountants",
    lockReason: "Statutory Tax Audit Fee INV-2026-089 (₹1,18,000) exceeds 30-day grace period. Locked automatically by Fee Release Gatekeeper."
  },
  {
    entityId: "CLI-PRATWI-01",
    isLocked: true,
    totalOutstandingAmount: 90000,
    oldestInvoiceDays: 45,
    gracePeriodDays: 30,
    blockedDeliverables: [
      "ITR_ACKNOWLEDGMENT",
      "BALANCE_SHEET_SIGNED"
    ],
    instantUpiVpa: "BRAINSANDTAXES@icici",
    merchantName: "GPA & Co., Chartered Accountants",
    lockReason: "Annual Retainer Fee INV-2026-094 (₹90,000) pending payment. Deliverables locked until dynamic UPI QR verification."
  },
  {
    entityId: "CLI-OMNI-01",
    isLocked: false,
    totalOutstandingAmount: 65000,
    oldestInvoiceDays: 4,
    gracePeriodDays: 30,
    blockedDeliverables: [],
    instantUpiVpa: "BRAINSANDTAXES@icici",
    merchantName: "GPA & Co., Chartered Accountants",
    lockReason: "Within 30-day grace period. UTR verification in progress."
  },
  {
    entityId: "CLI-ZENITH-01",
    isLocked: false,
    totalOutstandingAmount: 0,
    oldestInvoiceDays: 0,
    gracePeriodDays: 30,
    blockedDeliverables: [],
    instantUpiVpa: "BRAINSANDTAXES@icici",
    merchantName: "GPA & Co., Chartered Accountants",
    lockReason: "All invoices cleared. Immediate certified deliverable access active."
  }
];

export const SANDBOX_DSC_TOKENS: DscRecord[] = [
  {
    id: "DSC-01",
    entityId: "CLI-APEX-01",
    entityName: "Apex AutoTech Private Limited",
    groupId: "GRP-APEX",
    holderName: "Rajesh Sharma (Managing Director)",
    pan: "AABCA8891D",
    serialNumber: "ePass-2003-8891-BTA",
    tokenType: "ePass2003",
    validTill: "2026-11-04",
    daysToExpiry: 6,
    expiryStatus: "EXPIRING_SOON",
    currentCustodian: "Kriti Jain (Article)",
    vaultSlot: "Cabinet A - Locker 04",
    checkedOutAt: "2026-10-28 11:30:00",
    checkedOutPurpose: "Signing Form 3CD XML upload package"
  },
  {
    id: "DSC-02",
    entityId: "CLI-OMNI-01",
    entityName: "OmniRetail Hypermarkets Private Limited",
    groupId: "GRP-OMNI",
    holderName: "Aditya Singhal (Director)",
    pan: "AAFCO4492K",
    serialNumber: "ProxKey-4492-BTA",
    tokenType: "ProxKey",
    validTill: "2026-11-16",
    daysToExpiry: 18,
    expiryStatus: "EXPIRING_SOON",
    currentCustodian: "Firm Vault Keeper",
    vaultSlot: "Cabinet B - Locker 12"
  },
  {
    id: "CLI-ZENITH-01",
    entityId: "CLI-ZENITH-01",
    entityName: "Zenith SaaS Technologies Private Limited",
    groupId: "GRP-ZENITH",
    holderName: "Vikramaditya Singh (Director)",
    pan: "AAACZ5512L",
    serialNumber: "mToken-5512-BTA",
    tokenType: "mToken",
    validTill: "2028-06-30",
    daysToExpiry: 610,
    expiryStatus: "ACTIVE",
    currentCustodian: "Firm Vault Keeper",
    vaultSlot: "Cabinet A - Locker 08"
  },
  {
    id: "CLI-PRATWI-01",
    entityId: "CLI-PRATWI-01",
    entityName: "Pratwi Solutions Private Limited",
    groupId: "GRP-DIRECT",
    holderName: "Chetan Pratap Singh (Director)",
    pan: "AANCP9915B",
    serialNumber: "ePass-9915-BTA",
    tokenType: "ePass2003",
    validTill: "2027-12-15",
    daysToExpiry: 412,
    expiryStatus: "ACTIVE",
    currentCustodian: "Firm Vault Keeper",
    vaultSlot: "Cabinet B - Locker 01"
  }
];

export const SANDBOX_DOCUMENTS: DocumentItem[] = [
  {
    id: "DOC-01",
    entityId: "CLI-APEX-01",
    entityName: "Apex AutoTech Private Limited",
    category: "AUDIT_REPORT",
    fileName: "Form_3CD_Tax_Audit_Report_FY25-26_Certified.pdf",
    fileSize: "4.8 MB",
    uploadedAt: "2026-10-25 14:30:00",
    uploadedBy: "FIRM_STAFF",
    isPasswordProtected: false,
    isUnlocked: true,
    financialYear: "FY 2025-26",
    taskId: "TSK-03",
    reviewStatus: "APPROVED",
    reviewedBy: "CA Gunjan Jain"
  },
  {
    id: "DOC-02",
    entityId: "CLI-APEX-01",
    entityName: "Apex AutoTech Private Limited",
    category: "BANK_STATEMENT",
    fileName: "HDFC_Current_Account_Sept2026_Statement.pdf",
    fileSize: "1.2 MB",
    uploadedAt: "2026-10-05 10:15:00",
    uploadedBy: "WHATSAPP_LINK",
    isPasswordProtected: true,
    isUnlocked: true,
    financialYear: "FY 2026-27",
    reviewStatus: "APPROVED",
    reviewedBy: "Kriti Jain (Article)"
  },
  {
    id: "DOC-03",
    entityId: "CLI-ZENITH-01",
    entityName: "Zenith SaaS Technologies Private Limited",
    category: "TAX_COMPUTATION",
    fileName: "CMA_Data_3Year_Banker_Credit_Dossier_UDIN.pdf",
    fileSize: "3.4 MB",
    uploadedAt: "2026-10-22 16:00:00",
    uploadedBy: "FIRM_STAFF",
    isPasswordProtected: false,
    isUnlocked: true,
    financialYear: "FY 2025-26",
    reviewStatus: "APPROVED",
    reviewedBy: "CA Gunjan Jain"
  },
  {
    id: "DOC-04",
    entityId: "CLI-OMNI-01",
    entityName: "OmniRetail Hypermarkets Private Limited",
    category: "NOTICE_REPLY",
    fileName: "Legal_Submission_Section_148_Draft_Precedents.pdf",
    fileSize: "2.1 MB",
    uploadedAt: "2026-10-26 11:20:00",
    uploadedBy: "FIRM_STAFF",
    isPasswordProtected: false,
    isUnlocked: true,
    financialYear: "FY 2021-22",
    reviewStatus: "PENDING_REVIEW",
    reviewedBy: "CA Sahil Jain"
  },
  {
    id: "DOC-05",
    entityId: "CLI-PRATWI-01",
    entityName: "Pratwi Solutions Private Limited",
    category: "TAX_COMPUTATION",
    fileName: "ITR6_Tax_Computation_115BAA_AY26-27.pdf",
    fileSize: "850 KB",
    uploadedAt: "2026-10-24 15:45:00",
    uploadedBy: "FIRM_STAFF",
    isPasswordProtected: false,
    isUnlocked: true,
    financialYear: "AY 2026-27",
    taskId: "TSK-05",
    reviewStatus: "PENDING_REVIEW"
  }
];

export const SANDBOX_AUDIT_TRAIL: AuditTrailLog[] = [
  {
    id: "AUD-101",
    timestamp: "2026-10-28T11:30:00.000Z",
    actorName: "Kriti Jain",
    actorRole: "ARTICLE",
    entityName: "Apex AutoTech Private Limited",
    action: "DSC Token Checked Out",
    details: "Checked out physical ePass2003 DSC from Cabinet A - Locker 04 for Tax Audit Form 3CD portal upload.",
    category: "SECURITY"
  },
  {
    id: "AUD-102",
    timestamp: "2026-10-26T16:45:00.000Z",
    actorName: "Aditya Singhal",
    actorRole: "CLIENT",
    entityName: "OmniRetail Hypermarkets Private Limited",
    action: "UTR Payment Submitted",
    details: "Submitted UTR HDFCN26298192841 for ₹65,000 against INV-2026-102 (Sec 148 Litigation fee).",
    category: "INVOICE"
  },
  {
    id: "AUD-103",
    timestamp: "2026-10-25T14:30:00.000Z",
    actorName: "CA Gunjan Jain",
    actorRole: "PARTNER",
    entityName: "Apex AutoTech Private Limited",
    action: "UDIN Generated & Locked",
    details: "Generated official UDIN 26518492BTA0192841 for Form 3CD. Pay-to-Release Gatekeeper locked pending ₹1,18,000 fee.",
    category: "UDIN"
  },
  {
    id: "AUD-104",
    timestamp: "2026-10-22T17:30:00.000Z",
    actorName: "CA Gunjan Jain",
    actorRole: "PARTNER",
    entityName: "Zenith SaaS Technologies Private Limited",
    action: "Fee Reconciled & Released",
    details: "Reconciled UPI payment ₹50,000 for CMA Banker Dossier. Released certified PDF instantly to client vault.",
    category: "PAY_RELEASE"
  }
];

export const SANDBOX_PASSWORD_VAULTS: ClientPasswordVault[] = [
  {
    id: "VAULT-01",
    entityId: "CLI-APEX-01",
    bankName: "HDFC Bank",
    accountNumberMasked: "XXXX-XXXX-8842",
    pdfPasswordPattern: "PAN (uppercase) + First 4 letters of Company Name",
    lastDecryptionSuccess: true,
    notes: "Automated statement decryption enabled on WhatsApp Webhook"
  },
  {
    id: "VAULT-02",
    entityId: "CLI-OMNI-01",
    bankName: "ICICI Bank",
    accountNumberMasked: "XXXX-XXXX-4491",
    pdfPasswordPattern: "First 4 letters of PAN + DDMM of Incorporation",
    lastDecryptionSuccess: true
  },
  {
    id: "VAULT-03",
    entityId: "CLI-ZENITH-01",
    bankName: "State Bank of India",
    accountNumberMasked: "XXXX-XXXX-5510",
    pdfPasswordPattern: "Registered Mobile Number (10 digits)",
    lastDecryptionSuccess: true
  }
];

export const SANDBOX_PARSED_STATEMENTS: ParsedBankStatement[] = [
  {
    id: "STMT-01",
    entityId: "CLI-APEX-01",
    bankName: "HDFC Bank Ltd (Palasia Branch, Indore)",
    statementPeriod: "01-Sep-2026 to 30-Sep-2026",
    openingBalance: 4215000,
    closingBalance: 6180000,
    totalDeposits: 8450000,
    totalWithdrawals: 6485000,
    transactionCount: 4,
    parsedAt: "2026-10-05 10:15:00",
    passwordBypassed: true,
    sourceFile: "HDFC_Current_Account_Sept2026_Statement.pdf",
    transactions: [
      {
        id: "TXN-01",
        date: "2026-09-04",
        description: "RTGS INW: TATA MOTORS LTD COMM REC",
        refNo: "TATAMOT26090481",
        withdrawal: 0,
        deposit: 3850000,
        balance: 8065000,
        aiSuggestedCategory: "SALES_RECEIPT",
        confidenceScore: 0.99,
        verified: true
      },
      {
        id: "TXN-02",
        date: "2026-09-12",
        description: "NEFT OUT: TATA STEEL LTD RAW MATERIAL",
        refNo: "TATAS26091244",
        withdrawal: 1250000,
        deposit: 0,
        balance: 6815000,
        aiSuggestedCategory: "VENDOR_PAYMENT",
        confidenceScore: 0.98,
        verified: true
      },
      {
        id: "TXN-03",
        date: "2026-09-15",
        description: "CHALLAN 280: ADVANCE TAX Q2 FY26-27",
        refNo: "ITD260915BSR0291",
        withdrawal: 800000,
        deposit: 0,
        balance: 6015000,
        aiSuggestedCategory: "GST_CHALLAN",
        confidenceScore: 0.99,
        verified: true
      },
      {
        id: "TXN-04",
        date: "2026-09-28",
        description: "NEFT: DIR RAJESH SHARMA REMUNERATION",
        refNo: "REMUN26092801",
        withdrawal: 250000,
        deposit: 0,
        balance: 5765000,
        aiSuggestedCategory: "DIRECTOR_REMUNERATION",
        confidenceScore: 0.97,
        verified: true
      }
    ]
  }
];

export const SANDBOX_MSME_43BH_RECORDS: Msme43BhClauseItem[] = [
  {
    id: "MSME-01",
    vendorName: "Precision Castings & Tooling Tools",
    udyamRegistrationNo: "UDYAM-MP-08-0019284",
    vendorCategory: "MICRO",
    invoiceNumber: "PCT/25-26/0412",
    invoiceDate: "2026-08-10",
    amount: 685000,
    paymentDueDate: "2026-09-24", // 45 days max
    actualPaymentDate: undefined,
    disallowedUnder43Bh: true,
    interestUnderMsmedAct: 38400
  },
  {
    id: "MSME-02",
    vendorName: "Shree Ganesh Packaging Cartons",
    udyamRegistrationNo: "UDYAM-MP-08-0044192",
    vendorCategory: "SMALL",
    invoiceNumber: "SGP/26/8812",
    invoiceDate: "2026-08-14",
    amount: 420000,
    paymentDueDate: "2026-09-28",
    actualPaymentDate: undefined,
    disallowedUnder43Bh: true,
    interestUnderMsmedAct: 23500
  },
  {
    id: "MSME-03",
    vendorName: "Narmada Fasteners & Bolts",
    udyamRegistrationNo: "UDYAM-MP-08-0099120",
    vendorCategory: "MICRO",
    invoiceNumber: "NFB/26-27/102",
    invoiceDate: "2026-09-22",
    amount: 340000,
    paymentDueDate: "2026-11-06",
    actualPaymentDate: undefined,
    disallowedUnder43Bh: false,
    interestUnderMsmedAct: 0
  }
];

export const SANDBOX_SECTION_40A2B_SAMPLES: Section40A2bSampleItem[] = [
  {
    id: "40A-01",
    relatedPartyName: "Rajesh Sharma (Managing Director)",
    relationship: "DIRECTOR",
    natureOfPayment: "REMUNERATION",
    amountPaid: 3600000, // ₹36 Lakhs/year
    fairMarketValueEstimated: 3000000,
    excessPaymentDisallowable: 600000,
    justificationWorkpaperRef: "WP-DIR-REMUN-01 (Board Resolution dated 15-Apr-2025)",
    articleVerifiedBy: "Kriti Jain (Article)",
    partnerSigned: true
  },
  {
    id: "40A-02",
    relatedPartyName: "Smt. Sunita Sharma (Spouse of Director)",
    relationship: "RELATIVE_OF_DIRECTOR",
    natureOfPayment: "RENT",
    amountPaid: 1200000, // ₹12 Lakhs
    fairMarketValueEstimated: 1200000,
    excessPaymentDisallowable: 0,
    justificationWorkpaperRef: "WP-RENT-02 (Independent Property Valuation Report)",
    articleVerifiedBy: "Kriti Jain (Article)",
    partnerSigned: true
  }
];

export const SANDBOX_STAFF_SECURITY_LOGS: StaffDataSecurityAudit[] = [
  {
    id: "SEC-01",
    staffName: "Aman Verma",
    staffRole: "ARTICLE",
    action: "EXPORT_CLIENT_LIST_BLOCKED",
    entityName: "OmniRetail Hypermarkets Private Limited",
    timestamp: "2026-10-27 16:12:00",
    ipAddress: "182.73.14.99 (Indore Office Wi-Fi)",
    status: "CRITICAL_SECURITY_ALERT"
  },
  {
    id: "SEC-02",
    staffName: "Rahul Sharma",
    staffRole: "ARTICLE",
    action: "UNMASK_PROMOTER_PHONE_ATTEMPT",
    entityName: "Apex AutoTech Private Limited",
    timestamp: "2026-10-28 10:45:00",
    ipAddress: "182.73.14.99 (Indore Office Wi-Fi)",
    status: "FLAGGED_RESTRICTED"
  },
  {
    id: "SEC-03",
    staffName: "Kriti Jain",
    staffRole: "ARTICLE",
    action: "WATERMARKED_PDF_DOWNLOAD",
    entityName: "Apex AutoTech Private Limited",
    timestamp: "2026-10-28 11:32:00",
    ipAddress: "182.73.14.99 (Indore Office Wi-Fi)",
    status: "AUTHORIZED"
  }
];

export const SANDBOX_PARTNER_METRICS: PartnerRealizationMetrics[] = [
  {
    partnerName: "CA Gunjan Jain, FCA",
    assignedClientsCount: 3,
    billableHoursThisMonth: 142,
    unbilledWipAmount: 185000,
    billedThisMonth: 218000,
    recoveredThisMonth: 176700,
    realizationPercentage: 81,
    agingAbove90DaysAmount: 41300,
    atRiskPenaltyClients: 1
  },
  {
    partnerName: "CA Sahil Jain, FCA",
    assignedClientsCount: 2,
    billableHoursThisMonth: 128,
    unbilledWipAmount: 85000,
    billedThisMonth: 165000,
    recoveredThisMonth: 100000,
    realizationPercentage: 60.6,
    agingAbove90DaysAmount: 65000,
    atRiskPenaltyClients: 1
  },
  {
    partnerName: "CA Ankit Agarwal, ACA",
    assignedClientsCount: 1,
    billableHoursThisMonth: 94,
    unbilledWipAmount: 55000,
    billedThisMonth: 50000,
    recoveredThisMonth: 50000,
    realizationPercentage: 100,
    agingAbove90DaysAmount: 0,
    atRiskPenaltyClients: 0
  }
];


export const SANDBOX_DATA = {
  firmMetrics: SANDBOX_FIRM_METRICS,
  groups: SANDBOX_GROUPS,
  clients: SANDBOX_CLIENTS,
  tasks: SANDBOX_TASKS,
  notices: SANDBOX_NOTICES,
  invoices: SANDBOX_INVOICES,
  payToReleaseConfigs: SANDBOX_PAY_TO_RELEASE_CONFIGS,
  dscTokens: SANDBOX_DSC_TOKENS,
  documents: SANDBOX_DOCUMENTS,
  auditTrail: SANDBOX_AUDIT_TRAIL,
  notifications: [],
  lastUpdated: new Date().toISOString(),
};
