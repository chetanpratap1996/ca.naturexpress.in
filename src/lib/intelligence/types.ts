/**
 * Brains & Taxes — Practice Intelligence & Client Acquisition Engine
 * Domain Types & Schemas
 * 
 * Multi-tenant, white-label ready.
 * 1000% Accuracy Architecture: Every lead is backed by cryptographic proof
 * and deterministic statutory rules from official government registries.
 */

export type ServiceTrack = 
  | 'NEW_INCORPORATION'    // Day 0-30 ADT-1, Day 0-180 INC-20A, GST, Bank account, DPIIT
  | 'SME_RETAINER_VCFO'     // Monthly GST, TDS, MIS, Working Capital CMA, ERP Sync
  | 'PENALTY_RESCUE';      // ROC ₹100/day late fees, GST 3B lag, ITC suspension, DIN deactivation

export type StatutorySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'OPPORTUNITY';

export type LeadStage = 
  | 'DISCOVERED'          // Raw statutory data crawled
  | 'VERIFIED'            // Checksum and government portal verified
  | 'ADVISORY_GENERATED'  // Diagnostic compliance docket created
  | 'ENGAGED'             // Partner or BD outreach sent
  | 'CONVERTED'           // Onboarded into Brains & Taxes practice
  | 'ARCHIVED';           // Not serviceable or non-responsive

export type CompanyType = 
  | 'PVT_LTD' 
  | 'LLP' 
  | 'OPC' 
  | 'PUBLIC_LTD' 
  | 'PROPRIETORSHIP' 
  | 'PARTNERSHIP';

export interface DirectorInfo {
  din: string;
  name: string;
  designation: string;
  appointmentDate?: string;
  mobileMasked?: string;
  emailMasked?: string;
}

export interface ReturnFilingStatus {
  returnType: 'GSTR1' | 'GSTR3B' | 'AOC-4' | 'MGT-7';
  period: string;
  filingDate: string | null;
  status: 'Filed' | 'Not Filed';
  arn?: string;
}

export interface GstRegistrationInfo {
  gstin: string;
  legalName: string;
  tradeName: string;
  status: 'Active' | 'Suspended' | 'Cancelled' | 'Pending';
  taxpayerType: 'Regular' | 'Composition' | 'SEZ Unit' | 'Tax Deductor';
  registrationDate: string;
  stateCode: string;
  filingFrequency: 'Monthly' | 'Quarterly';
  returnFilingHistory: ReturnFilingStatus[];
  defaultsCount: number;
  principalPlace: {
    buildingName?: string;
    street?: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
  };
}

export interface StatutoryPainPoint {
  id: string;
  ruleCode: string;
  serviceTrack: ServiceTrack;
  severity: StatutorySeverity;
  title: string;
  legalBasis: string;
  daysRemaining: number; // Negative value indicates overdue days
  statutoryDeadline: string;
  penaltyInr: number;
  commercialImpact: string;
  actionPlan: string;
}

export interface VerificationProof {
  registrySource: 'MCA_ROC_MASTER' | 'GSTN_PORTAL' | 'OPEN_STREET_MAP' | 'MSME_UDYAM' | 'MANUAL_IMPORT';
  verifiedAt: string;
  accuracyScore: number; // 1000 = Deterministically matched against statutory data
  sourceUrl: string;
  rawHash: string; // SHA-256 hash of raw extracted registry JSON
  evidenceSummary: string;
}

export interface TargetEntityLead {
  id: string;
  firmId: string; // Multi-tenant white-label isolation
  cin?: string;
  gstin?: string;
  pan?: string;
  legalName: string;
  tradeName?: string;
  companyType: CompanyType;
  incorporationDate: string;
  authorizedCapitalInr: number;
  paidUpCapitalInr: number;
  state: string;
  stateCode: string;
  rocJurisdiction: string;
  city: string;
  pincode: string;
  registeredAddress: string;
  industrialCluster?: string;
  directors: DirectorInfo[];
  gstDetails?: GstRegistrationInfo;
  chargesRegistered?: {
    chargeId: string;
    holderName: string;
    amountInr: number;
    creationDate: string;
    status: 'OPEN' | 'SATISFIED';
  }[];
  painPoints: StatutoryPainPoint[];
  totalPenaltyExposureInr: number;
  highestSeverity: StatutorySeverity;
  primaryTrack: ServiceTrack;
  proof: VerificationProof;
  stage: LeadStage;
  // Decision Maker & Real Contact Intelligence for Sales
  phone?: string;
  email?: string;
  website?: string;
  googleMapsUrl?: string;
  suggestedFeeInr?: number;
  annualTurnoverEstimatedInr?: number;
  industrySector?: string;
  followUpDate?: string;
  dealValueEstimatedInr?: number;
  hotLead?: boolean;
  outreachNotes?: string;
  assignedStaffId?: string;
  lastContactedAt?: string;
  convertedClientId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadFilterCriteria {
  state?: string;
  rocJurisdiction?: string;
  serviceTrack?: ServiceTrack;
  highestSeverity?: StatutorySeverity;
  stage?: LeadStage;
  searchQuery?: string;
  industrialCluster?: string;
  minPenaltyInr?: number;
  minCapitalInr?: number;
  hotOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface AdvisoryDocketOutput {
  leadId: string;
  companyName: string;
  whatsappAdvisoryText: string;
  emailSubject: string;
  emailBodyHtml: string;
  statutoryChecklist: {
    formName: string;
    authority: 'MCA' | 'GSTN' | 'CBDT' | 'BANK';
    dueDate: string;
    status: 'PENDING' | 'OVERDUE' | 'CRITICAL';
    statutoryCost: string;
  }[];
}
