/**
 * Brains & Taxes — Enterprise Legal Knowledge Graph
 * 
 * Part 6: Unified Temporal GraphRAG Retriever
 * 
 * Master Class Orchestrator for Multi-Billion Dollar Legal Intelligence:
 * Executes Query Intent Parsing -> Temporal Hard Filtering -> Constitutional Precedence
 * Re-ranking -> Multi-Hop Statutory Traversal -> Evidence Grounded Context Pack Generation.
 */

import { LegalGraphStore } from './legalGraphStore';
import { TemporalStatutoryFilter } from './temporalFilter';
import { ConstitutionalPrecedenceReranker } from './precedenceReranker';
import { LegalGraphTraversal } from './graphTraversal';
import { 
  LegalGraphNode, 
  ParsedQueryContext, 
  GroundedRetrievalResult 
} from './legalGraphTypes';

export interface LLMGroundedContextPack {
  queryContext: ParsedQueryContext;
  topLegalAnchor: string;
  governingAct: string;
  temporalVerdict: string;
  statutoryAlerts: string[];
  groundedResults: GroundedRetrievalResult[];
  formattedContextPrompt: string;
}

export class TemporalGraphRagEngine {
  private store: LegalGraphStore;
  private traversal: LegalGraphTraversal;

  constructor(store?: LegalGraphStore) {
    this.store = store || new LegalGraphStore();
    this.traversal = new LegalGraphTraversal(this.store);
  }

  /**
   * Primary entry point: Executes end-to-end Temporal GraphRAG
   */
  public query(context: ParsedQueryContext): LLMGroundedContextPack {
    const rawTokens = this.tokenizeQuery(context.rawQuery);
    
    // Step 1: Candidate Retrieval
    let candidateNodes: LegalGraphNode[] = [];
    if (context.targetSection) {
      const sectionNode = this.store.getAllNodes().find(n => 
        n.statutoryReference.toLowerCase().includes(context.targetSection!.toLowerCase()) ||
        n.id.toLowerCase().includes(context.targetSection!.toLowerCase())
      );
      if (sectionNode) candidateNodes.push(sectionNode);
    }

    const tokenMatches = this.store.findByTokens(rawTokens);
    for (const node of tokenMatches) {
      if (!candidateNodes.some(c => c.id === node.id)) {
        candidateNodes.push(node);
      }
    }

    if (candidateNodes.length === 0) {
      candidateNodes = this.store.getAllNodes();
    }

    // Step 2: Temporal Hard Filtering & Auditing
    const temporalFiltered: { node: LegalGraphNode; temporalStatus: any; warning?: string }[] = [];
    const statutoryAlerts: string[] = [];

    for (const node of candidateNodes) {
      const tempEval = TemporalStatutoryFilter.evaluateTemporalFitness(node, context);
      
      if (tempEval.statutoryWarning) {
        statutoryAlerts.push(tempEval.statutoryWarning);
      }

      if (tempEval.isValidForQuery) {
        temporalFiltered.push({
          node,
          temporalStatus: tempEval.status,
          warning: tempEval.statutoryWarning
        });
      } else if (tempEval.status === 'OMITTED_SUNSET') {
        // Retain omitted nodes to alert agent NOT to advise client under omitted laws
        temporalFiltered.push({
          node,
          temporalStatus: tempEval.status,
          warning: tempEval.statutoryWarning
        });
      }
    }

    // Step 3: Constitutional Authority Precedence Re-ranking
    const scoredCandidates = temporalFiltered.map(item => {
      const baseRelevance = this.computeLexicalMatch(item.node, rawTokens);
      return {
        node: item.node,
        baseRelevance,
        temporalStatus: item.temporalStatus,
        warning: item.warning
      };
    });

    const rankedNodes = ConstitutionalPrecedenceReranker.rankByPrecedenceAndRelevance(
      scoredCandidates,
      context
    );

    // Step 4: Multi-Hop Statutory Traversal for Top Nodes
    const groundedResults: GroundedRetrievalResult[] = [];
    const topCandidates = rankedNodes.slice(0, 5);

    for (const item of topCandidates) {
      const subGraph = this.traversal.traverseStatutoryContext(item.node.id, 2);

      groundedResults.push({
        primaryNode: item.node,
        relevanceScore: item.finalScore,
        temporalStatus: item.node.temporal.isOmitted ? 'OMITTED_SUNSET' : (item.node.temporal.isRetrospective ? 'RETROSPECTIVELY_VALIDATED' : 'CURRENTLY_ACTIVE'),
        precedenceWeight: item.precedence.finalWeight,
        overridingNodes: subGraph?.overridingNodes || [],
        subordinateRules: subGraph?.subordinateRules || [],
        judicialPrecedents: subGraph?.judicialPrecedents || [],
        formsAndReporting: subGraph?.statutoryForms || [],
        deterministicCalculations: subGraph?.deterministicCalculations || [],
        administrativeClarifications: [],
        reasoningChain: subGraph?.reasoningChain || [],
        statutoryWarning: item.precedence.precedenceNotes
      });
    }

    // Step 5: Synthesize Grounded Context Pack for LLM / Agent Consumption
    return this.assembleContextPack(context, groundedResults, statutoryAlerts);
  }

  private tokenizeQuery(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\/\-\(\)]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length >= 2);
  }

  private computeLexicalMatch(node: LegalGraphNode, tokens: string[]): number {
    let score = 20; // Base score
    const content = (node.title + ' ' + node.statutoryReference + ' ' + node.verbatimContent).toLowerCase();

    for (const t of tokens) {
      if (content.includes(t)) score += 15;
      if (node.searchableTokens.some(st => st.includes(t))) score += 20;
    }

    return Math.min(score, 100);
  }

  private assembleContextPack(
    context: ParsedQueryContext,
    results: GroundedRetrievalResult[],
    alerts: string[]
  ): LLMGroundedContextPack {
    const primary = results[0]?.primaryNode;
    const topAnchor = primary ? primary.statutoryReference : 'General Statutory Framework';
    
    // Resolve governing act
    let governingAct = 'Income-tax Act, 1961';
    if (context.targetAct) {
      governingAct = context.targetAct;
    } else if (context.targetTaxYear && context.targetTaxYear >= 'Tax Year 2026-27') {
      governingAct = 'Income-tax Act, 2025';
    } else if (context.rawQuery.toLowerCase().includes('gst') || context.rawQuery.toLowerCase().includes('itc')) {
      governingAct = 'Central Goods and Services Tax Act, 2017';
    }

    // Format LLM prompt section
    let promptText = `=== BRAINS & TAXES AUTHORITATIVE STATUTORY GROUNDING ===\n`;
    promptText += `GOVERNING STATUTE: ${governingAct}\n`;
    promptText += `CLIENT JURISDICTION: ${context.clientJurisdiction}\n`;
    if (context.targetFinancialYear) promptText += `RELEVANT PERIOD: ${context.targetFinancialYear} (Assessment Year: ${context.targetAssessmentYear || 'N/A'})\n`;
    promptText += `\n`;

    if (alerts.length > 0) {
      promptText += `CRITICAL STATUTORY ALERTS & SUNSET SAFEGUARDS:\n`;
      for (const alert of alerts) {
        promptText += `• ${alert}\n`;
      }
      promptText += `\n`;
    }

    promptText += `VERIFIED STATUTORY NODES & BINDING PRECEDENTS:\n`;
    for (const res of results) {
      const n = res.primaryNode;
      promptText += `------------------------------------------------------------\n`;
      promptText += `[${n.authorityLevel}] ${n.statutoryReference}: ${n.title}\n`;
      promptText += `STATUS: ${res.temporalStatus} | CONSTITUTIONAL PRECEDENCE WEIGHT: ${res.precedenceWeight.toFixed(1)}x\n`;
      promptText += `STATUTORY TEXT:\n"${n.verbatimContent}"\n`;
      
      if (res.judicialPrecedents.length > 0) {
        promptText += `BINDING JUDICIAL RATIOS (ARTICLE 141 / HIGH COURT):\n`;
        for (const prec of res.judicialPrecedents) {
          promptText += `  * ${prec.statutoryReference}: ${prec.verbatimContent}\n`;
        }
      }

      if (res.overridingNodes.length > 0) {
        promptText += `NON-OBSTANTE OVERRIDES:\n`;
        for (const ov of res.overridingNodes) {
          promptText += `  * Overridden by ${ov.statutoryReference}\n`;
        }
      }

      if (res.reasoningChain.length > 0) {
        promptText += `STATUTORY REASONING CHAIN:\n`;
        for (const step of res.reasoningChain) {
          promptText += `  ${step}\n`;
        }
      }
    }
    promptText += `============================================================\n`;

    return {
      queryContext: context,
      topLegalAnchor: topAnchor,
      governingAct,
      temporalVerdict: results[0]?.temporalStatus || 'CURRENTLY_ACTIVE',
      statutoryAlerts: alerts,
      groundedResults: results,
      formattedContextPrompt: promptText
    };
  }
}
