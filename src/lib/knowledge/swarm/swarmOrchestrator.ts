/**
 * Brains & Taxes — Enterprise 3-Tier Maker-Checker Multi-Agent Swarm
 * 
 * Part 5: Swarm Coordinator & State Machine Orchestrator
 * 
 * Manages the complete lifecycle from ingestion through maker preparation,
 * checker review, partner adjudication, and fee release gatekeeping.
 */

import { ArticleMakerAgent } from './articleMakerAgent';
import { TaxManagerCheckerAgent } from './taxManagerCheckerAgent';
import { FcaPartnerAgent } from './fcaPartnerAgent';
import { 
  SwarmSessionAuditTrail, 
  SwarmWorkflowState, 
  MakerWorkpaper 
} from './swarmTypes';

export class SwarmCoordinator {
  private sessions: Map<string, SwarmSessionAuditTrail> = new Map();
  private makerAgent: ArticleMakerAgent;
  private checkerAgent: TaxManagerCheckerAgent;
  private partnerAgent: FcaPartnerAgent;

  constructor() {
    this.makerAgent = new ArticleMakerAgent();
    this.checkerAgent = new TaxManagerCheckerAgent();
    this.partnerAgent = new FcaPartnerAgent();
  }

  public startSession(clientName: string, subjectTitle: string): SwarmSessionAuditTrail {
    const sessionId = `SWARM-${Date.now().toString(36).toUpperCase()}`;
    const initialSession: SwarmSessionAuditTrail = {
      sessionId,
      clientName,
      currentState: 'MAKER_PREPARATION',
      stateHistory: [{
        state: 'MAKER_PREPARATION',
        transitionedBy: 'System Ingestion Pipeline',
        role: 'ARTICLE_TRAINEE_MAKER',
        timestamp: new Date().toISOString(),
        notes: `Engagement initialized for ${subjectTitle}. Assigned to Article Assistant for workpaper preparation.`
      }]
    };

    this.sessions.set(sessionId, initialSession);
    return initialSession;
  }

  public getSession(sessionId: string): SwarmSessionAuditTrail | undefined {
    return this.sessions.get(sessionId);
  }

  public submitMakerWorkpaper(sessionId: string, workpaper: MakerWorkpaper): SwarmSessionAuditTrail {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found.`);

    session.makerWorkpaper = workpaper;
    session.currentState = 'CHECKER_REVIEW';
    session.stateHistory.push({
      state: 'CHECKER_REVIEW',
      transitionedBy: workpaper.preparedBy.traineeName,
      role: 'ARTICLE_TRAINEE_MAKER',
      timestamp: new Date().toISOString(),
      notes: 'Workpaper locked and submitted to Tax Manager for quality control review.'
    });

    return session;
  }

  public runCheckerReview(sessionId: string): SwarmSessionAuditTrail {
    const session = this.sessions.get(sessionId);
    if (!session || !session.makerWorkpaper) {
      throw new Error(`Cannot run review: Session or maker workpaper missing.`);
    }

    const report = this.checkerAgent.reviewWorkpaper(session.makerWorkpaper);
    session.checkerReport = report;

    if (report.verdict === 'APPROVED_FOR_PARTNER_REVIEW') {
      session.currentState = 'PARTNER_ADJUDICATION';
      session.stateHistory.push({
        state: 'PARTNER_ADJUDICATION',
        transitionedBy: report.reviewedBy.managerName,
        role: 'TAX_MANAGER_CHECKER',
        timestamp: new Date().toISOString(),
        notes: 'Quality control review approved. Promoted to FCA Partner for legal sign-off and UDIN generation.'
      });
    } else {
      session.currentState = 'REVISION_REQUIRED';
      session.stateHistory.push({
        state: 'REVISION_REQUIRED',
        transitionedBy: report.reviewedBy.managerName,
        role: 'TAX_MANAGER_CHECKER',
        timestamp: new Date().toISOString(),
        notes: report.defectInstructions || 'Returned to article maker due to detected defects.'
      });
    }

    return session;
  }

  public runPartnerAdjudication(
    sessionId: string,
    billing: { invoiceNumber: string; feeInr: number; isPaid: boolean }
  ): SwarmSessionAuditTrail {
    const session = this.sessions.get(sessionId);
    if (!session || !session.makerWorkpaper || !session.checkerReport) {
      throw new Error(`Incomplete swarm pipeline for partner sign-off.`);
    }

    const docket = this.partnerAgent.signOffAndAdjudicate(
      session.makerWorkpaper,
      session.checkerReport,
      {
        invoiceNumber: billing.invoiceNumber,
        professionalFeeInr: billing.feeInr,
        isFeePaid: billing.isPaid
      }
    );

    session.partnerDocket = docket;
    session.currentState = docket.payToReleaseStatus.isEscrowLocked
      ? 'PAY_TO_RELEASE_LOCKED'
      : 'RELEASED_AND_UDIN_ACTIVE';

    session.stateHistory.push({
      state: session.currentState,
      transitionedBy: docket.partnerSignoff.partnerName,
      role: 'FCA_PARTNER_SIGNATORY',
      timestamp: new Date().toISOString(),
      notes: `Litigator brief synthesized. UDIN stamped: ${docket.udinMetadata.udinNumber}. Escrow status: ${session.currentState}.`
    });

    return session;
  }

  public releaseViaPayment(sessionId: string, utrNumber: string): SwarmSessionAuditTrail {
    const session = this.sessions.get(sessionId);
    if (!session || !session.partnerDocket) {
      throw new Error(`Cannot release: Partner docket not generated.`);
    }

    session.partnerDocket = this.partnerAgent.unlockPayToReleaseDeliverable(
      session.partnerDocket,
      utrNumber
    );
    session.currentState = 'RELEASED_AND_UDIN_ACTIVE';

    session.stateHistory.push({
      state: 'RELEASED_AND_UDIN_ACTIVE',
      transitionedBy: 'Brains & Taxes Fee Gatekeeper',
      role: 'FCA_PARTNER_SIGNATORY',
      timestamp: new Date().toISOString(),
      notes: `Fee payment verified via UTR ${utrNumber}. Certified deliverable released to client portal.`
    });

    return session;
  }
}
