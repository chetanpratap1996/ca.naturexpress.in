/**
 * Brains & Taxes — Enterprise Legal Knowledge Graph
 * 
 * Part 4: Constitutional Authority & Precedence Re-Ranker
 * 
 * Implements Article 141 of the Constitution of India and
 * administrative law hierarchy to prevent departmental circulars
 * or lower authorities from overriding binding judicial law.
 */

import { LegalGraphNode, ParsedQueryContext } from './legalGraphTypes';
import { AuthorityLevel, JurisdictionCode } from '../types';

export interface PrecedenceScore {
  baseWeight: number;
  jurisdictionBonus: number;
  finalWeight: number;
  authorityClassification: string;
  isBindingOnDepartmentOnly: boolean;
  precedenceNotes: string;
}

export class ConstitutionalPrecedenceReranker {
  /**
   * Computes the constitutional and statutory precedence multiplier
   */
  public static computePrecedenceScore(
    node: LegalGraphNode,
    context: ParsedQueryContext
  ): PrecedenceScore {
    let baseWeight = this.getBaseAuthorityWeight(node.authorityLevel);
    let jurisdictionBonus = 0;
    let isBindingOnDeptOnly = false;
    let notes = '';

    // Check 1: Overruled / Superseded Status
    if (node.precedentTreatment === 'OVERRULED_BY_LARGER_BENCH' || node.precedentTreatment === 'SUPERSEDED_BY_RETROSPECTIVE_AMENDMENT') {
      return {
        baseWeight: 0.1,
        jurisdictionBonus: 0,
        finalWeight: 0.1,
        authorityClassification: 'OVERRULED_OR_SUPERSEDED',
        isBindingOnDepartmentOnly: false,
        precedenceNotes: 'Precedent has been overruled or superseded by retrospective legislation. Cannot be cited as positive authority.'
      };
    }

    // Check 2: Supreme Court of India (Article 141)
    if (node.authorityLevel === 'JUDICIAL_SUPREME_COURT') {
      baseWeight = 5.0;
      notes = 'Article 141 Constitution of India: Law declared by Supreme Court is binding on all courts, tribunals and revenue authorities across India.';
    }

    // Check 3: High Court Jurisdictional Weight
    else if (node.authorityLevel === 'JUDICIAL_HIGH_COURT') {
      const isJurisdictional = this.isJurisdictionalHighCourt(node.jurisdiction, context.clientJurisdiction);
      if (isJurisdictional) {
        jurisdictionBonus = 1.5; // Elevates from 2.5 to 4.0
        notes = `Jurisdictional High Court ruling strictly binding on all Assessing Officers, CIT(A), and ITAT benches in ${context.clientJurisdiction}.`;
      } else {
        jurisdictionBonus = 0;
        notes = 'Non-jurisdictional High Court ruling has strong persuasive authority under CIT v. Godavari Devi Saraf (1978). In absence of contrary jurisdictional decision, revenue cannot ignore it.';
      }
    }

    // Check 4: Administrative Circulars (CBDT / CBIC)
    else if (node.authorityLevel === 'ADMINISTRATIVE_CIRCULAR') {
      isBindingOnDeptOnly = true;
      baseWeight = 1.5;
      notes = 'Binding on Revenue Department officers under Sec 119 IT Act / Sec 168 CGST Act. NOT binding on assessees, tribunals, or courts per Supreme Court in UCO Bank (1999).';
    }

    const finalWeight = baseWeight + jurisdictionBonus;

    return {
      baseWeight,
      jurisdictionBonus,
      finalWeight,
      authorityClassification: node.authorityLevel,
      isBindingOnDepartmentOnly: isBindingOnDeptOnly,
      precedenceNotes: notes
    };
  }

  /**
   * Sorts candidate nodes by combination of relevance and constitutional weight
   */
  public static rankByPrecedenceAndRelevance(
    nodesWithScores: { node: LegalGraphNode; baseRelevance: number }[],
    context: ParsedQueryContext
  ): { node: LegalGraphNode; finalScore: number; precedence: PrecedenceScore }[] {
    return nodesWithScores
      .map(item => {
        const precedence = this.computePrecedenceScore(item.node, context);
        // Final Score = Base Relevance (0-100) * Precedence Multiplier (0.1 to 6.5)
        const finalScore = item.baseRelevance * precedence.finalWeight;
        return {
          node: item.node,
          finalScore,
          precedence
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore);
  }

  private static getBaseAuthorityWeight(level: AuthorityLevel): number {
    switch (level) {
      case 'CONSTITUTIONAL': return 6.0;
      case 'JUDICIAL_SUPREME_COURT': return 5.0;
      case 'PARLIAMENTARY_ACT': return 4.5;
      case 'SUBORDINATE_RULE': return 3.5;
      case 'JUDICIAL_HIGH_COURT': return 2.5; // Modified if jurisdictional
      case 'JUDICIAL_TRIBUNAL_SPECIAL_BENCH': return 2.2;
      case 'JUDICIAL_TRIBUNAL_DIVISION_BENCH': return 1.8;
      case 'STATUTORY_NOTIFICATION': return 2.0;
      case 'ADMINISTRATIVE_CIRCULAR': return 1.5;
      case 'ICAI_MANDATORY_STANDARD': return 1.8;
      case 'ICAI_GUIDANCE_NOTE': return 1.2;
      case 'PORTAL_SCHEMA_OR_UTILITY': return 1.0;
      default: return 1.0;
    }
  }

  private static isJurisdictionalHighCourt(nodeJurisdiction: JurisdictionCode, clientJurisdiction: JurisdictionCode): boolean {
    if (nodeJurisdiction === 'PAN_INDIA') return true;
    return nodeJurisdiction === clientJurisdiction;
  }
}
