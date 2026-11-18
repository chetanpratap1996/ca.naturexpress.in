/**
 * Brains & Taxes — Enterprise Legal Knowledge Graph
 * 
 * Part 1: Graph Data Structures & Ontological Types
 * 
 * Multi-Billion Dollar Architecture:
 * Replaces naive vector search with an explicit, typed, temporal,
 * precedence-aware legal knowledge graph of Indian jurisprudence.
 */

import { AuthorityForum, AuthorityLevel, JurisdictionCode, PrecedentTreatmentStatus } from '../types';

export type LegalNodeType =
  | 'STATUTE'                 // e.g. "Income-tax Act, 1961", "CGST Act, 2017"
  | 'SECTION'                 // e.g. "Section 43B", "Section 16", "Section 185"
  | 'SUB_SECTION'             // e.g. "Section 43B(h)", "Section 16(2)"
  | 'CLAUSE'                  // e.g. "Section 16(2)(aa)"
  | 'PROVISO'                 // e.g. "First Proviso to Section 43B"
  | 'EXPLANATION'             // e.g. "Explanation 1 to Section 148"
  | 'SUBORDINATE_RULE'        // e.g. "Rule 37A", "Rule 11UA", "Rule 42"
  | 'ADMINISTRATIVE_CIRCULAR' // e.g. "CBDT Circular 19/2019", "CBIC Circular 170/2022"
  | 'STATUTORY_NOTIFICATION'  // e.g. "Notification No. 04/2019-CT(R)"
  | 'JUDICIAL_PRECEDENT'      // e.g. "Mohit Minerals (SC)", "Silpi Industries (SC)"
  | 'STATUTORY_FORM'          // e.g. "Form 3CD", "GSTR-3B", "AOC-4"
  | 'DETERMINISTIC_CALC';     // e.g. "CALC_SEC_50_NET_CASH", "CALC_INTEREST_234ABC"

export type LegalEdgeType =
  | 'CONTAINS'                       // Statute -> Section -> SubSection -> Clause
  | 'SUBJECT_TO_PROVISO'             // Section -> Proviso
  | 'CLARIFIED_BY_EXPLANATION'       // Section -> Explanation
  | 'DERIVED_FROM_RULE'              // Section -> SubordinateRule
  | 'OVERRIDES_NON_OBSTANTE'         // Section -> Other Sections ("Notwithstanding...")
  | 'INTERPRETED_BY_PRECEDENT'       // Section -> JudicialPrecedent
  | 'CLARIFIED_BY_CIRCULAR'          // Section -> AdministrativeCircular
  | 'REPORTED_IN_FORM'               // Section -> StatutoryForm (e.g. Form 3CD Clause 22)
  | 'CALCULATED_BY'                  // Section -> DeterministicCalculation
  | 'OVERRULED_BY'                   // JudicialPrecedent -> JudicialPrecedent
  | 'SUPERSEDED_BY_AMENDMENT'        // JudicialPrecedent / Section -> Statute (Retrospective act)
  | 'CONFLICTS_WITH_HIGH_COURT'      // JudicialPrecedent -> JudicialPrecedent
  | 'AFFIRMED_BY';                   // High Court -> Supreme Court

/**
 * Universal Temporal Scope for Any Legal Entity
 */
export interface TemporalValidity {
  effectiveFrom: string;             // ISO Date e.g. "1962-04-01"
  effectiveTo?: string | null;       // Null means currently active law
  isRetrospective: boolean;
  retrospectiveFrom?: string | null; // e.g. "2017-07-01" for Sec 16(5) CGST
  applicablePreviousYears: string[]; // e.g. ["FY 2023-24", "FY 2024-25", "FY 2025-26"]
  applicableAssessmentYears: string[]; // e.g. ["AY 2024-25", "AY 2025-26", "AY 2026-27"]
  applicableTaxYears?: string[];     // e.g. ["Tax Year 2026-27 onwards"]
  isOmitted: boolean;
  omissionDate?: string | null;      // e.g. "2025-04-01" for Sec 206AB
  omissionStatute?: string | null;   // e.g. "Finance Act, 2025"
  sunsetCondition?: string | null;   // e.g. "Commenced production on or before 31.03.2024" for 115BAB
}

/**
 * Node within the Legal Knowledge Graph
 */
export interface LegalGraphNode {
  id: string;                        // Unique identifier e.g. "IT-SEC-43BH", "CGST-SEC-16-2-AA"
  type: LegalNodeType;
  title: string;
  domainId: string;                  // e.g. "2_DIRECT_TAXATION_INCOME_TAX"
  authorityLevel: AuthorityLevel;
  authorityForum?: AuthorityForum;
  jurisdiction: JurisdictionCode;
  statutoryReference: string;        // Official legal citation e.g. "Section 43B(h), Income-tax Act, 1961"
  verbatimContent: string;           // Verbatim legal text (never LLM summary)
  temporal: TemporalValidity;
  
  // Specific Metadata Flags
  isNonObstante?: boolean;           // Has "Notwithstanding anything contained in..."
  hasDeemingFiction?: boolean;       // Has "shall be deemed to be..."
  bindingOnRevenueOnly?: boolean;    // True for CBDT/CBIC Circulars
  precedentTreatment?: PrecedentTreatmentStatus;
  primarySourceUri?: string;
  sha256Hash?: string;
  
  // Vector & Keyword Indexing Chunks
  searchableTokens: string[];
}

/**
 * Directed Edge representing statutory relationship
 */
export interface LegalGraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: LegalEdgeType;
  description: string;
  isStrongBinding: boolean;          // True if statutory mandate or Article 141
  notes?: string;
}

/**
 * Parsed User Query Intent
 */
export interface ParsedQueryContext {
  rawQuery: string;
  targetDomain?: string;
  targetAct?: string;
  targetSection?: string;
  targetFinancialYear?: string;      // e.g. "FY 2024-25", "FY 2025-26"
  targetAssessmentYear?: string;     // e.g. "AY 2025-26", "AY 2026-27"
  targetTaxYear?: string;            // e.g. "Tax Year 2026-27"
  transactionDate?: string;          // ISO Date e.g. "2025-05-15"
  clientJurisdiction: JurisdictionCode;
  entityType?: string;
  isLitigationDefense: boolean;
}

/**
 * Retrieval Result Pack with Complete Provenance
 */
export interface GroundedRetrievalResult {
  primaryNode: LegalGraphNode;
  relevanceScore: number;
  temporalStatus: 'CURRENTLY_ACTIVE' | 'RETROSPECTIVELY_VALIDATED' | 'OMITTED_SUNSET' | 'FUTURE_INOPERATIVE';
  precedenceWeight: number;          // Constitutional multiplier (Art 141 SC = 5.0, HC = 4.0, etc.)
  overridingNodes: LegalGraphNode[]; // Nodes that override this node via non-obstante clauses
  subordinateRules: LegalGraphNode[];// Associated Rules
  judicialPrecedents: LegalGraphNode[]; // Relevant binding court rulings
  formsAndReporting: LegalGraphNode[]; // Forms (e.g. Form 3CD Clause 22)
  deterministicCalculations: LegalGraphNode[]; // Pure math engines
  administrativeClarifications: LegalGraphNode[]; // Circulars
  reasoningChain: string[];
  statutoryWarning?: string;         // e.g. "OMITTED w.e.f. 01.04.2025 by Finance Act 2025"
}
