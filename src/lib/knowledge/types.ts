/**
 * Brains & Taxes — Unified Enterprise CA Knowledge Architecture
 * 
 * THE 3D KNOWLEDGE CUBE:
 * 1. Scope (Axis X): 20 Professional CA Practice Domains
 * 2. Structure (Axis Y): 12-Dimensional Statutory Ontology
 * 3. Operational Stack (Axis Z): 5-Layer Provenance & Deterministic Execution Pipeline
 * 
 * Hierarchy of Authority in Indian Law:
 * Constitution -> Parliamentary Acts -> Subordinate Rules -> Statutory Notifications
 * -> Administrative Circulars (CBDT/CBIC/MCA/RBI) -> Judicial Precedents (SC > Jurisdictional HC > Tribunal)
 * -> ICAI Standards & Guidance Notes -> Executive Portal Realities.
 */

export type AuthorityForum = 
  | 'PARLIAMENT_OF_INDIA'
  | 'CENTRAL_BOARD_OF_DIRECT_TAXES'
  | 'CENTRAL_BOARD_OF_INDIRECT_TAXES_AND_CUSTOMS'
  | 'MINISTRY_OF_CORPORATE_AFFAIRS'
  | 'RESERVE_BANK_OF_INDIA'
  | 'ICAI_COUNCIL'
  | 'SUPREME_COURT_OF_INDIA'
  | 'HIGH_COURT_OF_DELHI'
  | 'HIGH_COURT_OF_BOMBAY'
  | 'HIGH_COURT_OF_MADHYA_PRADESH'
  | 'HIGH_COURT_OF_CALCUTTA'
  | 'HIGH_COURT_OF_MADRAS'
  | 'HIGH_COURT_OF_KARNATAKA'
  | 'HIGH_COURT_OF_GUJARAT'
  | 'INCOME_TAX_APPELLATE_TRIBUNAL_SPECIAL_BENCH'
  | 'INCOME_TAX_APPELLATE_TRIBUNAL_DIVISION_BENCH'
  | 'CESTAT_DIVISION_BENCH'
  | 'GSTAT_PRINCIPAL_BENCH'
  | 'AUTHORITY_FOR_ADVANCE_RULINGS';

export type AuthorityLevel = 
  | 'CONSTITUTIONAL'
  | 'PARLIAMENTARY_ACT'
  | 'SUBORDINATE_RULE'
  | 'STATUTORY_NOTIFICATION'
  | 'ADMINISTRATIVE_CIRCULAR'
  | 'JUDICIAL_SUPREME_COURT'
  | 'JUDICIAL_HIGH_COURT'
  | 'JUDICIAL_TRIBUNAL_SPECIAL_BENCH'
  | 'JUDICIAL_TRIBUNAL_DIVISION_BENCH'
  | 'AUTHORITY_FOR_ADVANCE_RULINGS'
  | 'ICAI_MANDATORY_STANDARD'
  | 'ICAI_GUIDANCE_NOTE'
  | 'PORTAL_SCHEMA_OR_UTILITY';

export type JurisdictionCode = 
  | 'PAN_INDIA'
  | 'DELHI_HC'
  | 'BOMBAY_HC'
  | 'MADRAS_HC'
  | 'CALCUTTA_HC'
  | 'MP_HC'
  | 'GUJARAT_HC'
  | 'KARNATAKA_HC'
  | 'ALLAHABAD_HC'
  | 'PUNJAB_HARYANA_HC'
  | 'TELANGANA_HC'
  | 'RAJASTHAN_HC'
  | 'CUSTOM_STATE';

export type SourceDocumentType =
  | 'CENTRAL_ACT'
  | 'FINANCE_ACT_AMENDMENT'
  | 'STATUTORY_RULE'
  | 'OFFICIAL_GAZETTE_NOTIFICATION'
  | 'BOARD_CIRCULAR_SECTION_119'
  | 'BOARD_CIRCULAR_SECTION_168'
  | 'JUDICIAL_JUDGMENT'
  | 'ICAI_AUDITING_STANDARD'
  | 'ICAI_GUIDANCE_NOTE';

export type VerificationState =
  | 'DRAFT_EXTRACTION'
  | 'UNDER_FCA_AUDIT'
  | 'VERIFIED_PRIMARY_SOURCE'
  | 'SUPERSEDED_OUTDATED'
  | 'QUARANTINED_DEFECTIVE';

export type PrecedentTreatmentStatus =
  | 'GOOD_LAW_BINDING'
  | 'AFFIRMED_BY_SUPREME_COURT'
  | 'DISTINGUISHED_ON_FACTS'
  | 'OVERRULED_BY_LARGER_BENCH'
  | 'SUPERSEDED_BY_RETROSPECTIVE_AMENDMENT'
  | 'CONTRARY_HIGH_COURT_VIEWS_EXIST';

export type HolidayRolloverProtocol =
  | 'SECTION_10_GCA_COURT_OR_OFFICE_ONLY' // Strict: Applies ONLY to statutory filings in court or govt office
  | 'NI_ACT_SECTION_25_BANKING_DAY'        // Applies strictly to bank clearing transactions
  | 'STRICT_CALENDAR_NO_ROLLOVER';         // Private commercial debtor-creditor contracts (MSME Sec 15)

export type TaxRegimeType = 'NEW_CONCESSIONAL' | 'OLD_REGULAR' | 'MAT_115JB' | 'AMT_115JC' | 'SPECIAL_RATE';

export type RiskSeverity = 'NEGLIGIBLE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'PENAL_PROSECUTION';

// =============================================================================
// LAYER 1: PRIMARY LEGAL SOURCE PROVENANCE
// =============================================================================
export interface PrimaryLegalSource {
  source_id: string; // Official unique identifier or SHA-256
  source_type: SourceDocumentType;
  issuing_authority: AuthorityForum;
  official_title: string;
  official_reference_number: string; // e.g. "Circular No. 19/2019 [F. No. 225/157/2019-ITA.II]"
  gazette_notification_number?: string; // e.g. "G.S.R. 561(E)"
  publication_date: string; // ISO 8601
  commencement_date: string; // ISO 8601
  primary_source_uri: string; // Official gov.in or sci.gov.in portal link
  sha256_checksum?: string;
  is_active_law: boolean;
  repeal_or_omission_date?: string | null;
  repealing_act_ref?: string | null;
}

// =============================================================================
// LAYER 2: STRUCTURED LEGAL KNOWLEDGE GRAPH & 12 DIMENSIONS
// =============================================================================

/** Dimension 1: Applicable Acts and Sections */
export interface ApplicableStatute {
  actName: string;                     // e.g., "Income Tax Act, 1961", "Income-tax Act, 2025", "CGST Act, 2017"
  actYear: number;
  section: string;                     // e.g., "Section 43B(h)", "Section 16(2)(aa)"
  subSection?: string;
  clause?: string;
  title: string;
  statutoryText: string;
  isNonObstante: boolean;              // "Notwithstanding anything contained in..."
  hasDeemingFiction: boolean;          // "shall be deemed to be..."
  provisos: (string | {
    provisoNumber: number;
    verbatimText: string;
    conditionPrecedent?: string;
    statutoryEffect?: string;
  })[];
  explanations: (string | {
    explanationNumber: number;
    verbatimText: string;
    clarificationScope?: string;
  })[];
  primarySourceRef?: string;
  
  // Explicit Temporal Separation (Previous Year vs Assessment Year vs Tax Year)
  temporalScope?: {
    effectiveFromDate: string;
    effectiveToDate?: string | null;
    applicablePreviousYears: string[]; // e.g. ["FY 2024-25", "FY 2025-26"]
    applicableAssessmentYears: string[]; // e.g. ["AY 2025-26", "AY 2026-27"]
    applicableTaxYears?: string[];     // e.g. ["Tax Year 2026-27 onwards" for 2025 Act]
  };
}

/** Dimension 2: Rules and Sub-Rules */
export interface SubordinateRule {
  parentActSection: string;            // Link to parent statute
  ruleBook: string;                    // e.g., "Income Tax Rules, 1962", "CGST Rules, 2017"
  ruleNumber: string;                  // e.g., "Rule 37A", "Rule 11UA", "Rule 42"
  subRule?: string;
  ruleTitle: string;
  prescribedConditions: string[];
  computationMethods?: string[];
  prescribedRegistersOrRecords?: string[];
}

/** Dimension 3: Forms and Filing Procedures */
export interface FormAndFilingProcedure {
  formNumber: string;                  // e.g., "Form 3CD", "GSTR-3B", "AOC-4", "Form 26Q"
  formTitle: string;
  statutoryAuthority: 'CBDT' | 'CBIC' | 'MCA' | 'RBI' | 'EPFO' | 'ESIC' | 'DGFT';
  portal: 'E_FILING_IT' | 'GSTN' | 'MCA21_V3' | 'TRACES' | 'ICEGATE' | 'FIRMS_RBI';
  filingMode: 'JSON_SCHEMA' | 'OFFLINE_UTILITY_EXCEL' | 'WEB_FORM_DIRECT' | 'XBRL_INSTANCE';
  verificationMode: 'DSC_CLASS_3' | 'AADHAAR_OTP_EVC' | 'NET_BANKING_EVC';
  mandatoryAttachments: string[];
  statutoryCertificationRequired: boolean; // Needs CA Sign-off / UDIN
}

/** Dimension 4: Due Dates and Applicability */
export interface TimelineAndApplicability {
  entityTypeApplicability: string[];   // e.g., ["PVT_LTD", "LLP", "PARTNERSHIP", "INDIVIDUAL_AUDIT"]
  turnoverThresholdInr?: number;
  capitalThresholdInr?: number;
  transactionThresholdInr?: number;
  recurringFrequency: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL' | 'TRANSACTIONAL';
  statutoryDueDateFormula: string;
  limitationPeriod: string;
  holidayRolloverProtocol?: HolidayRolloverProtocol;
}

/** Dimension 5: Latest Amendments & Sunset Registry */
export interface AmendmentRecord {
  amendmentSource: string;             // e.g., "Finance Act, 2025", "Finance (No. 2) Act, 2024"
  effectiveDate: string;               // ISO date
  applicableFinancialYear: string;     // e.g., "FY 2024-25 onwards"
  applicableAssessmentYear?: string;
  applicableTaxYear?: string;
  isRetrospective: boolean;
  retrospectiveEffectiveDate?: string;
  summaryOfChange: string;
  preAmendmentPosition: string;
  postAmendmentPosition: string;
  isOmittedOrSunset?: boolean;
  omissionReason?: string;
}

/** Dimension 6: Circulars and Notifications */
export interface AdministrativeGuidance {
  guidanceType: 'CBDT_CIRCULAR' | 'CBDT_NOTIFICATION' | 'CBIC_CIRCULAR' | 'CBIC_NOTIFICATION' | 'MCA_CIRCULAR' | 'RBI_MASTER_DIRECTION';
  referenceNumber: string;
  issueDate: string;
  subject: string;
  bindingOnRevenue: boolean;           // Invariable law under Sec 119 IT / Sec 168 CGST
  bindingOnAssesseeOrCourt: boolean;   // Invariable law (Per SC in UCO Bank / Dhiren Chemical)
  keyClarifications: string[];
  exceptionsPermitted?: string[];      // e.g. Para 3 Circular 19/2019 DIN exceptions
}

/** Dimension 7: Relevant Judicial Precedents */
export interface JudicialPrecedent {
  caseTitle: string;
  citation: string;
  forum: AuthorityForum | string;
  benchComposition?: 'SINGLE_JUDGE' | 'DIVISION_BENCH' | 'FULL_BENCH' | 'CONSTITUTION_BENCH';
  jurisdiction: JurisdictionCode;
  judgmentDate: string;
  keyLegalIssue: string;
  ratioDecidendi: string;
  treatmentStatus?: PrecedentTreatmentStatus;
  isOverruled: boolean;
  overruledBy?: string;
  favourability: 'FAVOUR_OF_ASSESSEE' | 'FAVOUR_OF_REVENUE' | 'SPLIT_PRO_RATA';
  practiceApplicationNotes: string;
}

/** Dimension 8: Practical Calculations (Layer 4 Execution) */
export interface PracticalCalculation {
  calculationCode: string;
  title: string;
  formulaDescription: string;
  roundingStatute?: 'RULE_119A_DOWN_100_UP_MONTH' | 'SECTION_288A_NEAREST_10' | 'EXACT_PAISE';
  holidayProtocol?: HolidayRolloverProtocol;
  mathematicalLogic?: string;
  inputVariables: { name: string; type: 'CURRENCY' | 'PERCENTAGE' | 'DAYS' | 'FLAG'; description: string }[];
  workedExample: {
    scenarioDescription: string;
    sampleInputs: Record<string, any>;
    stepByStepComputation: { stepNumber: number; title: string; computedValue: number | string; notes: string }[];
    finalResult: string | number;
  };
}

/** Dimension 9: Real-World Case Studies */
export interface RealWorldCaseStudy {
  caseCode: string;
  industry: string;
  businessContext: string;
  factualMatrix: string;
  statutoryConflictIdentified: string;
  strategicResolution: string;
  quantifiedSavingsOrRiskAvoidanceInr: number;
  deliverablesProduced: string[];
}

/** Dimension 10: Common Errors, Disallowances & Traps */
export interface CommonTrapAndError {
  errorCode: string;
  category: 'AUDIT_DISALLOWANCE' | 'PORTAL_GLITCH' | 'INCORRECT_DISCLOSURE' | 'LIMITATION_MISSED' | 'OBSOLETE_LAW_USAGE';
  errorDescription: string;
  departmentTriggerRisk: string;
  consequence: string;
  preventiveChecklist: string[];
  rectificationMechanism: string;
}

/** Dimension 11: Assessment, Notice and Reply Procedures */
export interface NoticeAndAppellateProcedure {
  noticeSection: string;               // e.g., "Section 148A(b)", "DRC-01 under Section 74A"
  issuingAuthority: string;
  statutoryResponseDays: number;
  
  preliminaryValidationGates?: {
    requiresDin: boolean;
    dinVerificationProtocol: 'TWO_TIER_CIRCULAR_19_2019';
    requiresPriorSanction: boolean;    // e.g. Sec 151 approval
    sanctioningAuthority?: string;
    facelessSopCompliance: boolean;
  };

  groundsOfDefense: {
    isJurisdictionalChallenge: boolean;
    primaryDefenseArg: string;
    substantiveMeritsArg: string;
    limitationDefense?: string;
  };
  
  proceduralChecklist?: string[];
  draftingStructureTemplate: string[];
  appealHierarchyPath: string[];
}

/** Dimension 12: Professional Opinion and Advisory Framework (Layer 5 Agent Contract) */
export interface AdvisoryFramework {
  opinionCategory: 'TRANSACTION_STRUCTURING' | 'LITIGATION_EXPOSURE' | 'M_AND_A_TAX_DUEDILIGENCE' | 'ACCOUNTING_DISCLOSURE';
  
  refusalProtocol?: {
    mandatoryChecks: {
      factName: string;
      isRequiredForOpinion: boolean;
      refusalTriggerMessage: string;
    }[];
  };

  standardStructure: {
    sectionTitle: string;
    contentGuidance: string;
  }[];

  riskGradingMatrix: {
    grade: 'CONSERVATIVE_SAFE' | 'ARGUABLE_DEFENSIBLE' | 'AGGRESSIVE_HIGH_EXPOSURE';
    taxSavingsPotential: string;
    litigationProbability: string;
    requiredDisclosures: string[];
  }[];

  icaiComplianceStandards: string[];   // e.g. "SQC 1", "SA 230", "Code of Ethics"
  boilerplateCaveatsAndDisclaimers: string[];
}

// =============================================================================
// COMPLETE DOMAIN DEFINITION (20 DOMAINS ENUM)
// =============================================================================
export type CADomainId = 
  | '1_ACCOUNTING_FINANCIAL_REPORTING'
  | '2_DIRECT_TAXATION_INCOME_TAX'
  | '3_GST_GOODS_AND_SERVICES_TAX'
  | '4_CORPORATE_LAWS_SECRETARIAL'
  | '5_TAX_AUDIT_STATUTORY_AUDIT'
  | '6_TDS_TCS_WITHHOLDING_TAX'
  | '7_FINANCIAL_MANAGEMENT_CORPORATE_FINANCE'
  | '8_RBI_BANKING_FINANCIAL_REGULATIONS'
  | '9_LLP_PARTNERSHIP_PROPRIETORSHIP'
  | '10_LABOUR_LAWS_EMPLOYMENT'
  | '11_IP_AND_BUSINESS_REGISTRATIONS'
  | '12_INTERNATIONAL_TAX_GLOBAL_COMPLIANCE'
  | '13_LITIGATION_NOTICES_REPRESENTATION'
  | '14_GOVERNMENT_PORTALS_DIGITAL'
  | '15_BUSINESS_ADVISORY_STRATEGY'
  | '16_PROFESSIONAL_ETHICS_ICAI'
  | '17_SPECIALISED_INDUSTRIES'
  | '18_ADVANCED_PROFESSIONAL_JUDGEMENT'
  | '19_KNOWLEDGE_SOURCES_LEGAL_RESEARCH'
  | '20_PRACTICE_MANAGEMENT_CLIENT_HANDLING';

export interface CADomainDefinition {
  id: CADomainId;
  domainNumber: number;
  title: string;
  tagline: string;
  subTopics: string[];
  primaryStatutoryActs: string[];
  governingRegulatoryBodies: string[];
  seniorCaExpectation: string;
  
  // The 12-Dimensional Realization
  dimensions: {
    applicableStatutes: ApplicableStatute[];
    subordinateRules: SubordinateRule[];
    formsAndFilings: FormAndFilingProcedure[];
    timelinesAndApplicability: TimelineAndApplicability[];
    latestAmendments: AmendmentRecord[];
    administrativeGuidance: AdministrativeGuidance[];
    judicialPrecedents: JudicialPrecedent[];
    practicalCalculations: PracticalCalculation[];
    caseStudies: RealWorldCaseStudy[];
    commonErrorsAndTraps: CommonTrapAndError[];
    noticeAndAppellateProcedures: NoticeAndAppellateProcedure[];
    advisoryFramework: AdvisoryFramework;
  };
}
