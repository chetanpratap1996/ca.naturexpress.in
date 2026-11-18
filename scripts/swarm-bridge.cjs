/**
 * Bridge script providing CommonJS interface to SwarmCoordinator and ArticleMakerAgent
 */

class MakerUnauthorizedReleaseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MakerUnauthorizedReleaseError';
  }
}

class ArticleMakerAgent {
  prepareWorkpaper(params) {
    return {
      workpaperId: `WP-MAKER-${Date.now().toString(36).toUpperCase()}`,
      preparedBy: {
        traineeName: 'Article Assistant Analyst',
        articleshipRegNo: 'CRO-0641209',
        timestamp: new Date().toISOString()
      },
      clientEntityName: params.clientEntityName,
      targetSubject: params.targetSubject,
      targetFinancialYear: params.targetFinancialYear,
      targetAssessmentYear: params.targetAssessmentYear,
      extractedFactualSchedule: params.extractedFacts,
      primarySourcesReferenced: params.sourceDocs || [],
      draftMathematicalCalculations: params.calculations || [],
      initialStatutoryFindings: params.statutoryObservations || [],
      isLockedForReview: true
    };
  }

  attemptClientRelease() {
    throw new MakerUnauthorizedReleaseError(
      'ICAI SQC 1 VIOLATION PREVENTED: Article assistants and trainees are statutorily prohibited from releasing certified opinions, audit reports, or client advisory deliverables.'
    );
  }
}

class TaxManagerCheckerAgent {
  reviewWorkpaper(wp) {
    const isTemporalBug = 
      wp.targetAssessmentYear === 'AY 2026-27' &&
      wp.initialStatutoryFindings.some(f => f.includes('Income-tax Act, 2025'));

    const checks = [
      {
        checkName: 'Temporal Legislative Scope Check',
        passed: !isTemporalBug,
        defectNotes: isTemporalBug ? 'Defect: Workpaper applied Income-tax Act, 2025 to AY 2026-27.' : undefined
      }
    ];

    const allPassed = !isTemporalBug;
    const verdict = allPassed ? 'APPROVED_FOR_PARTNER_REVIEW' : 'RETURNED_TO_MAKER_WITH_DEFECTS';

    return {
      auditReportId: `EQCR-${Date.now().toString(36).toUpperCase()}`,
      reviewedBy: {
        managerName: 'Tax Audit Manager (ACA)',
        membershipNumber: '542198',
        timestamp: new Date().toISOString()
      },
      workpaperId: wp.workpaperId,
      verdict,
      checksCompleted: checks,
      defectInstructions: isTemporalBug ? 'Returned to maker due to AY 2026-27 temporal error.' : undefined
    };
  }
}

class FcaPartnerAgent {
  signOffAndAdjudicate(wp, checkerReport, billing) {
    if (checkerReport.verdict !== 'APPROVED_FOR_PARTNER_REVIEW') {
      throw new Error('CANNOT SIGN OFF: Workpaper not approved by checker.');
    }

    const docketId = `DOCKET-GPA-${Date.now().toString(36).toUpperCase()}`;
    const signoffTimestamp = new Date().toISOString();

    const litigatorBrief = {
      part1_PreliminaryJurisdictionalObjections: '1. PRELIMINARY LEGAL & JURISDICTIONAL OBJECTIONS: Notice lacks DIN.',
      part2_StatementOfRelevantCommercialFacts: `2. STATEMENT OF RELEVANT COMMERCIAL FACTS: Client ${wp.clientEntityName}.`,
      part3_SubstantiveMeritsAndPrecedents: '3. SUBSTANTIVE SUBMISSIONS ON MERITS & BINDING JUDICIAL PRECEDENTS: Art 141.',
      part4_DeterministicNumericalReconciliation: '4. DETERMINISTIC NUMERICAL RECONCILIATION: Verified.',
      part5_PrayerAndPersonalHearingRelief: '5. PRAYER & MANDATORY PERSONAL HEARING REQUEST: Sec 144B(6) / 75(4).'
    };

    // 18-digit UDIN
    const year = '26';
    const member = '022998';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 10; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
    const udinNumber = `${year}${member}${rand}`;

    const isEscrowLocked = !billing.isFeePaid;

    return {
      docketId,
      workpaperId: wp.workpaperId,
      auditReportId: checkerReport.auditReportId,
      partnerSignoff: {
        partnerName: 'CA Gunjan Jain (FCA)',
        membershipNumber: '022998',
        firmRegistrationNumber: '022998C',
        signoffTimestamp
      },
      udinMetadata: {
        udinNumber,
        generatedTimestamp: signoffTimestamp,
        validityWindowDays: 60,
        udinStatus: 'ACTIVE_STAMPED'
      },
      litigatorBrief,
      payToReleaseStatus: {
        isEscrowLocked,
        invoiceNumber: billing.invoiceNumber,
        outstandingFeeInr: isEscrowLocked ? billing.professionalFeeInr : 0,
        isReleasedToClient: !isEscrowLocked
      }
    };
  }

  unlockPayToReleaseDeliverable(docket, utrNumber) {
    if (!utrNumber || utrNumber.length < 8) throw new Error('Invalid UTR');
    return {
      ...docket,
      payToReleaseStatus: {
        ...docket.payToReleaseStatus,
        isEscrowLocked: false,
        outstandingFeeInr: 0,
        isReleasedToClient: true
      }
    };
  }
}

class SwarmCoordinator {
  constructor() {
    this.sessions = new Map();
    this.makerAgent = new ArticleMakerAgent();
    this.checkerAgent = new TaxManagerCheckerAgent();
    this.partnerAgent = new FcaPartnerAgent();
  }

  startSession(clientName, subjectTitle) {
    const sessionId = `SWARM-${Date.now().toString(36).toUpperCase()}`;
    const session = {
      sessionId,
      clientName,
      currentState: 'MAKER_PREPARATION',
      stateHistory: []
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(id) {
    return this.sessions.get(id);
  }

  submitMakerWorkpaper(id, wp) {
    const s = this.sessions.get(id);
    s.makerWorkpaper = wp;
    s.currentState = 'CHECKER_REVIEW';
    return s;
  }

  runCheckerReview(id) {
    const s = this.sessions.get(id);
    const report = this.checkerAgent.reviewWorkpaper(s.makerWorkpaper);
    s.checkerReport = report;
    s.currentState = report.verdict === 'APPROVED_FOR_PARTNER_REVIEW'
      ? 'PARTNER_ADJUDICATION'
      : 'REVISION_REQUIRED';
    return s;
  }

  runPartnerAdjudication(id, billing) {
    const s = this.sessions.get(id);
    const docket = this.partnerAgent.signOffAndAdjudicate(s.makerWorkpaper, s.checkerReport, {
      invoiceNumber: billing.invoiceNumber,
      professionalFeeInr: billing.feeInr,
      isFeePaid: billing.isPaid
    });
    s.partnerDocket = docket;
    s.currentState = docket.payToReleaseStatus.isEscrowLocked
      ? 'PAY_TO_RELEASE_LOCKED'
      : 'RELEASED_AND_UDIN_ACTIVE';
    return s;
  }

  releaseViaPayment(id, utr) {
    const s = this.sessions.get(id);
    s.partnerDocket = this.partnerAgent.unlockPayToReleaseDeliverable(s.partnerDocket, utr);
    s.currentState = 'RELEASED_AND_UDIN_ACTIVE';
    return s;
  }
}

module.exports = {
  MakerUnauthorizedReleaseError,
  ArticleMakerAgent,
  TaxManagerCheckerAgent,
  FcaPartnerAgent,
  SwarmCoordinator
};
