/**
 * Brains & Taxes — Enterprise 3-Tier Maker-Checker Multi-Agent Swarm
 * 
 * Part 2: Article Trainee Agent (The Maker)
 * 
 * Responsibilities:
 * - Data parsing, voucher scrubbing, and line-item extraction
 * - Executing deterministic arithmetic calculation routines
 * - Assembling the MakerDraftWorkpaper with source document provenance
 * 
 * Inviolable Guardrail:
 * - Trainee is strictly barred from releasing client advice or signing workpapers.
 */

import { MakerWorkpaper, SourceDocumentReference } from './swarmTypes';

export class MakerUnauthorizedReleaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MakerUnauthorizedReleaseError';
  }
}

export class ArticleMakerAgent {
  private traineeName: string;
  private articleshipRegNo: string;

  constructor(
    traineeName: string = 'Article Assistant Analyst',
    articleshipRegNo: string = 'CRO-0641209'
  ) {
    this.traineeName = traineeName;
    this.articleshipRegNo = articleshipRegNo;
  }

  /**
   * Prepares draft workpaper from raw client evidence
   */
  public prepareWorkpaper(params: {
    clientEntityName: string;
    targetSubject: string;
    targetFinancialYear: string;
    targetAssessmentYear?: string;
    extractedFacts: Record<string, any>;
    sourceDocs: SourceDocumentReference[];
    calculations: {
      calculationType: string;
      computedAmountInr: number;
      roundingRuleApplied: string;
      formulaDetails: string;
    }[];
    statutoryObservations: string[];
  }): MakerWorkpaper {
    const workpaperId = `WP-MAKER-${Date.now().toString(36).toUpperCase()}`;

    return {
      workpaperId,
      preparedBy: {
        traineeName: this.traineeName,
        articleshipRegNo: this.articleshipRegNo,
        timestamp: new Date().toISOString()
      },
      clientEntityName: params.clientEntityName,
      targetSubject: params.targetSubject,
      targetFinancialYear: params.targetFinancialYear,
      targetAssessmentYear: params.targetAssessmentYear,
      extractedFactualSchedule: params.extractedFacts,
      primarySourcesReferenced: params.sourceDocs,
      draftMathematicalCalculations: params.calculations,
      initialStatutoryFindings: params.statutoryObservations,
      isLockedForReview: true
    };
  }

  /**
   * INVIOLABLE GUARDRAIL: Trainee cannot communicate outward opinions to clients
   */
  public attemptClientRelease(): never {
    throw new MakerUnauthorizedReleaseError(
      'ICAI SQC 1 VIOLATION PREVENTED: Article assistants and trainees are statutorily prohibited from releasing certified opinions, audit reports, or client advisory deliverables. Submission must be reviewed by a Tax Manager and signed by an FCA Partner.'
    );
  }
}
