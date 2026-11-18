/**
 * Brains & Taxes — Enterprise Legal Knowledge Graph
 * 
 * Part 5: Multi-Hop Legal Graph Traversal Engine
 * 
 * Explores relationships between sections, subordinate rules, forms,
 * precedents, and calculations, constructing an audit trail reasoning chain.
 */

import { LegalGraphStore } from './legalGraphStore';
import { LegalGraphNode, LegalEdgeType } from './legalGraphTypes';

export interface TraversalSubGraph {
  primaryNode: LegalGraphNode;
  overridingNodes: LegalGraphNode[];
  provisosAndExplanations: LegalGraphNode[];
  subordinateRules: LegalGraphNode[];
  judicialPrecedents: LegalGraphNode[];
  statutoryForms: LegalGraphNode[];
  deterministicCalculations: LegalGraphNode[];
  reasoningChain: string[];
}

export class LegalGraphTraversal {
  constructor(private store: LegalGraphStore) {}

  /**
   * Traverses up to N hops from a starting node to build the complete statutory ecosystem
   */
  public traverseStatutoryContext(primaryNodeId: string, maxDepth: number = 3): TraversalSubGraph | null {
    const primaryNode = this.store.getNode(primaryNodeId);
    if (!primaryNode) return null;

    const overridingNodes: LegalGraphNode[] = [];
    const provisosAndExplanations: LegalGraphNode[] = [];
    const subordinateRules: LegalGraphNode[] = [];
    const judicialPrecedents: LegalGraphNode[] = [];
    const statutoryForms: LegalGraphNode[] = [];
    const deterministicCalculations: LegalGraphNode[] = [];
    const reasoningChain: string[] = [];

    reasoningChain.push(`[Root Provision] ${primaryNode.statutoryReference}: ${primaryNode.title}`);

    // Visited set to avoid cycles
    const visited = new Set<string>();
    visited.add(primaryNode.id);

    // Queue for BFS
    interface QueueItem {
      node: LegalGraphNode;
      depth: number;
    }
    const queue: QueueItem[] = [{ node: primaryNode, depth: 0 }];

    while (queue.length > 0) {
      const { node, depth } = queue.shift()!;
      if (depth >= maxDepth) continue;

      const edges = this.store.getOutgoingEdges(node.id);

      for (const edge of edges) {
        if (visited.has(edge.targetNodeId)) continue;
        visited.add(edge.targetNodeId);

        const targetNode = this.store.getNode(edge.targetNodeId);
        if (!targetNode) continue;

        // Categorize target node
        this.categorizeNode(
          edge.type,
          targetNode,
          overridingNodes,
          provisosAndExplanations,
          subordinateRules,
          judicialPrecedents,
          statutoryForms,
          deterministicCalculations,
          reasoningChain,
          depth + 1
        );

        queue.push({ node: targetNode, depth: depth + 1 });
      }

      // Check incoming non-obstante overrides (nodes that override this node)
      const incoming = this.store.getIncomingEdges(node.id, 'OVERRIDES_NON_OBSTANTE');
      for (const edge of incoming) {
        if (!visited.has(edge.sourceNodeId)) {
          visited.add(edge.sourceNodeId);
          const sourceNode = this.store.getNode(edge.sourceNodeId);
          if (sourceNode) {
            overridingNodes.push(sourceNode);
            reasoningChain.push(`[Statutory Override] Overridden by non-obstante mandate: ${sourceNode.statutoryReference}`);
          }
        }
      }
    }

    return {
      primaryNode,
      overridingNodes,
      provisosAndExplanations,
      subordinateRules,
      judicialPrecedents,
      statutoryForms,
      deterministicCalculations,
      reasoningChain
    };
  }

  private categorizeNode(
    edgeType: LegalEdgeType,
    node: LegalGraphNode,
    overriding: LegalGraphNode[],
    provisos: LegalGraphNode[],
    rules: LegalGraphNode[],
    precedents: LegalGraphNode[],
    forms: LegalGraphNode[],
    calcs: LegalGraphNode[],
    reasoningChain: string[],
    depth: number
  ): void {
    const indent = '  '.repeat(depth);

    switch (node.type) {
      case 'JUDICIAL_PRECEDENT':
        precedents.push(node);
        reasoningChain.push(`${indent}[Judicial Precedent] ${node.statutoryReference}: ${node.title} (${node.verbatimContent})`);
        break;
      case 'SUBORDINATE_RULE':
        rules.push(node);
        reasoningChain.push(`${indent}[Subordinate Rule] ${node.statutoryReference}: ${node.title}`);
        break;
      case 'PROVISO':
      case 'EXPLANATION':
        provisos.push(node);
        reasoningChain.push(`${indent}[Proviso/Exception] ${node.statutoryReference}: ${node.verbatimContent}`);
        break;
      case 'STATUTORY_FORM':
        forms.push(node);
        reasoningChain.push(`${indent}[Audit/Reporting Form] ${node.statutoryReference}`);
        break;
      case 'DETERMINISTIC_CALC':
        calcs.push(node);
        reasoningChain.push(`${indent}[Deterministic Algorithm] ${node.title}`);
        break;
      default:
        if (edgeType === 'OVERRIDES_NON_OBSTANTE') {
          overriding.push(node);
          reasoningChain.push(`${indent}[Non-Obstante Override] ${node.statutoryReference}`);
        } else {
          reasoningChain.push(`${indent}[Related Statute] ${node.statutoryReference}`);
        }
    }
  }
}
