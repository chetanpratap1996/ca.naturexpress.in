/**
 * Brains & Taxes — Enterprise Statutory Refusal & Evidence Requisition
 * 
 * Part 4: Autonomous Agent Refusal Interceptor Middleware
 * 
 * Intercepts LLM / Agent calls. If mandatory conditions precedent are
 * missing, bars execution and forces generation of an Evidence Requisition Docket.
 */

import { StatutoryGatekeeper } from './statutoryGatekeeper';
import { RequisitionGenerator } from './requisitionGenerator';
import { 
  FactPayload, 
  EvidenceRequisitionDocket, 
  StatutoryGateViolation 
} from './refusalTypes';

export interface InterceptionResult {
  allowExecution: boolean;
  verdict: 'PROCEED_VERIFIED' | 'REFUSAL_HALTED' | 'CONDITIONAL_PROCEED_WITH_WARNING';
  violations: StatutoryGateViolation[];
  requisitionDocket?: EvidenceRequisitionDocket;
  agentSystemPromptOverride?: string;
  auditExplanation: string;
}

export class AgentRefusalInterceptor {
  /**
   * Intercepts agent execution prior to LLM inference or calculation
   */
  public static interceptAgentExecution(
    clientName: string,
    subjectTitle: string,
    facts: FactPayload
  ): InterceptionResult {
    const outcome = StatutoryGatekeeper.evaluateAllGates(facts);

    if (outcome.isCleared) {
      return {
        allowExecution: true,
        verdict: 'PROCEED_VERIFIED',
        violations: [],
        auditExplanation: 'All statutory evidentiary gates verified. Safe for agent autonomous calculation and drafting.'
      };
    }

    // Violations exist -> Generate Evidence Requisition Docket
    const docket = RequisitionGenerator.generateDocket(
      clientName,
      subjectTitle,
      outcome.violations
    );

    const isStrictHalt = outcome.severity === 'STRICT_HALT_REFUSAL';

    let promptOverride = `=== MANDATORY AUTONOMOUS AGENT STATUTORY REFUSAL ===\n`;
    promptOverride += `VERDICT: ${isStrictHalt ? 'STRICT REFUSAL TO ADVISE' : 'REQUISITION REQUIRED'}\n`;
    promptOverride += `CLIENT: ${clientName}\n`;
    promptOverride += `SUBJECT: ${subjectTitle}\n\n`;
    promptOverride += `INSTRUCTION TO AGENT:\n`;
    promptOverride += `You must NOT hypothesize, assume, or guess the missing statutory parameters.\n`;
    promptOverride += `You are strictly forbidden from rendering a clean tax opinion or calculation until the following primary documents are uploaded by the client:\n\n`;

    for (const item of docket.requiredDocumentsList) {
      promptOverride += `[Document ${item.itemNumber}] ${item.documentTitle}\n`;
      promptOverride += `  Authority: ${item.issuingAuthority}\n`;
      promptOverride += `  Mandate: ${item.statutoryMandate}\n`;
      for (const pt of item.criticalVerificationPoints) {
        promptOverride += `  • ${pt}\n`;
      }
      promptOverride += `\n`;
    }

    promptOverride += `Deliverable status is LOCKED pending primary source verification.\n`;
    promptOverride += `====================================================\n`;

    return {
      allowExecution: !isStrictHalt,
      verdict: isStrictHalt ? 'REFUSAL_HALTED' : 'CONDITIONAL_PROCEED_WITH_WARNING',
      violations: outcome.violations,
      requisitionDocket: docket,
      agentSystemPromptOverride: promptOverride,
      auditExplanation: `Agent execution ${isStrictHalt ? 'blocked' : 'warned'} by FCA Statutory Refusal Protocol. ${outcome.violations.length} condition(s) violated.`
    };
  }
}
