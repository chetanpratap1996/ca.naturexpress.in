/**
 * Brains & Taxes — Enterprise Dual-Track Database Types
 * 
 * Part 2: Relational Schema Types & Hybrid Vector Contracts
 * 
 * Replaces flat JSONB stores with fully normalized, typed entities
 * with cryptographic SHA-256 provenance and bi-temporal validity.
 */

import { AuthorityForum, SourceDocumentType, VerificationState, PrecedentTreatmentStatus } from '../types';

export interface PrimaryLegalSourceRow {
  id: string;
  source_code: string;
  source_type: SourceDocumentType;
  issuing_authority: AuthorityForum;
  official_title: string;
  official_reference_number: string;
  gazette_notification_number?: string | null;
  publication_date: string;
  commencement_date: string;
  primary_source_uri: string;
  sha256_checksum: string;
  is_active_law: boolean;
  repeal_or_omission_date?: string | null;
  repealing_act_ref?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StatutoryProvisionRow {
  id: string;
  provision_code: string;
  primary_source_id: string;
  act_code: 'INCOME_TAX_ACT_1961' | 'INCOME_TAX_ACT_2025' | 'CGST_ACT_2017' | 'IGST_ACT_2017' | 'COMPANIES_ACT_2013' | 'MSMED_ACT_2006' | 'FEMA_1999';
  domain_id: string;
  section_number: string;
  sub_section?: string | null;
  clause?: string | null;
  title: string;
  verbatim_statutory_text: string;
  is_non_obstante: boolean;
  has_deeming_fiction: boolean;
  effective_from: string;
  effective_to?: string | null;
  applicable_previous_years: string[];
  applicable_assessment_years: string[];
  applicable_tax_years: string[];
  is_omitted: boolean;
  omission_date?: string | null;
  omitted_by_source_id?: string | null;
  verification_state: VerificationState;
  verified_by_membership_no?: string | null;
  verification_timestamp?: string | null;
  embedding?: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface ProvisoExplanationRow {
  id: string;
  provision_id: string;
  element_type: 'PROVISO' | 'EXPLANATION';
  ordinal_number: number;
  verbatim_text: string;
  condition_precedent?: string | null;
  statutory_effect: string;
  effective_from: string;
  effective_to?: string | null;
  created_at: string;
}

export interface LegislativeAmendmentRow {
  id: string;
  provision_id: string;
  amending_source_id: string;
  amendment_type: 'INSERTION' | 'SUBSTITUTION' | 'OMISSION' | 'RETROSPECTIVE_RELAXATION' | 'SUNSET_EXPIRY';
  effective_date: string;
  is_retrospective: boolean;
  retrospective_effective_date?: string | null;
  applicable_financial_years: string[];
  applicable_assessment_years: string[];
  applicable_tax_years: string[];
  nature_of_amendment: string;
  pre_amendment_verbatim?: string | null;
  post_amendment_verbatim: string;
  created_at: string;
}

export interface JudicialPrecedentRow {
  id: string;
  case_code: string;
  case_title: string;
  neutral_citation?: string | null;
  law_report_citation: string;
  adjudicating_forum: AuthorityForum;
  bench_composition: 'SINGLE_JUDGE' | 'DIVISION_BENCH' | 'FULL_BENCH' | 'CONSTITUTION_BENCH';
  judgment_date: string;
  key_legal_issue: string;
  ratio_decidendi: string;
  treatment_status: PrecedentTreatmentStatus;
  is_overruled: boolean;
  overruled_by_precedent_id?: string | null;
  superseded_by_source_id?: string | null;
  favourability: 'FAVOUR_OF_ASSESSEE' | 'FAVOUR_OF_REVENUE' | 'SPLIT_PRO_RATA';
  created_at: string;
  updated_at: string;
}

export interface DualTrackQueryParams {
  queryText: string;
  queryEmbedding?: number[];
  targetAct?: string;
  targetDomain?: string;
  targetFinancialYear?: string;
  targetAssessmentYear?: string;
  targetTaxYear?: string;
  asOfDate?: string; // Temporal snapshot date (e.g. "2025-05-15")
  limit?: number;
}

export interface DualTrackHydratedProvision {
  provision: StatutoryProvisionRow;
  primarySource: PrimaryLegalSourceRow;
  provisosAndExplanations: ProvisoExplanationRow[];
  amendments: LegislativeAmendmentRow[];
  precedents: {
    precedent: JudicialPrecedentRow;
    associationType: string;
    notes: string;
  }[];
  ftsRankScore: number;
  vectorDistanceScore?: number;
  finalHybridScore: number;
  temporalValidityState: 'ACTIVE_CURRENT' | 'OMITTED_SUNSET' | 'RETROSPECTIVE_VALID' | 'FUTURE_INOPERATIVE';
}
