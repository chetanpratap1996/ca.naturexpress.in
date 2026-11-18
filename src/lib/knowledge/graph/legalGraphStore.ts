/**
 * Brains & Taxes — Enterprise Legal Knowledge Graph
 * 
 * Part 2: In-Memory Indexed Legal Knowledge Graph Store
 * 
 * Provides ultra-fast indexed traversal, multi-hop relationship querying,
 * and canonical seed nodes across high-stakes statutory domains.
 */

import { LegalGraphNode, LegalGraphEdge, LegalEdgeType, LegalNodeType } from './legalGraphTypes';

export class LegalGraphStore {
  private nodes: Map<string, LegalGraphNode> = new Map();
  private outgoingEdges: Map<string, LegalGraphEdge[]> = new Map();
  private incomingEdges: Map<string, LegalGraphEdge[]> = new Map();
  private domainIndex: Map<string, Set<string>> = new Map();
  private typeIndex: Map<LegalNodeType, Set<string>> = new Map();
  private tokenIndex: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeCanonicalSeedGraph();
  }

  public addNode(node: LegalGraphNode): void {
    this.nodes.set(node.id, node);

    // Index by domain
    if (!this.domainIndex.has(node.domainId)) {
      this.domainIndex.set(node.domainId, new Set());
    }
    this.domainIndex.get(node.domainId)!.add(node.id);

    // Index by type
    if (!this.typeIndex.has(node.type)) {
      this.typeIndex.set(node.type, new Set());
    }
    this.typeIndex.get(node.type)!.add(node.id);

    // Index by tokens
    for (const token of node.searchableTokens) {
      const lower = token.toLowerCase();
      if (!this.tokenIndex.has(lower)) {
        this.tokenIndex.set(lower, new Set());
      }
      this.tokenIndex.get(lower)!.add(node.id);
    }
  }

  public addEdge(edge: LegalGraphEdge): void {
    if (!this.outgoingEdges.has(edge.sourceNodeId)) {
      this.outgoingEdges.set(edge.sourceNodeId, []);
    }
    this.outgoingEdges.get(edge.sourceNodeId)!.push(edge);

    if (!this.incomingEdges.has(edge.targetNodeId)) {
      this.incomingEdges.set(edge.targetNodeId, []);
    }
    this.incomingEdges.get(edge.targetNodeId)!.push(edge);
  }

  public getNode(id: string): LegalGraphNode | undefined {
    return this.nodes.get(id);
  }

  public getAllNodes(): LegalGraphNode[] {
    return Array.from(this.nodes.values());
  }

  public getOutgoingEdges(nodeId: string, edgeType?: LegalEdgeType): LegalGraphEdge[] {
    const edges = this.outgoingEdges.get(nodeId) || [];
    return edgeType ? edges.filter(e => e.type === edgeType) : edges;
  }

  public getIncomingEdges(nodeId: string, edgeType?: LegalEdgeType): LegalGraphEdge[] {
    const edges = this.incomingEdges.get(nodeId) || [];
    return edgeType ? edges.filter(e => e.type === edgeType) : edges;
  }

  public getNeighbors(nodeId: string, edgeType?: LegalEdgeType): LegalGraphNode[] {
    const outgoing = this.getOutgoingEdges(nodeId, edgeType);
    const neighbors: LegalGraphNode[] = [];
    for (const edge of outgoing) {
      const target = this.nodes.get(edge.targetNodeId);
      if (target) neighbors.push(target);
    }
    return neighbors;
  }

  public findByTokens(tokens: string[]): LegalGraphNode[] {
    const matchedNodeIds = new Set<string>();
    for (const token of tokens) {
      const lower = token.toLowerCase();
      const nodeIds = this.tokenIndex.get(lower);
      if (nodeIds) {
        for (const id of nodeIds) matchedNodeIds.add(id);
      }
    }
    return Array.from(matchedNodeIds)
      .map(id => this.nodes.get(id)!)
      .filter(Boolean);
  }

  /**
   * Seed graph containing authoritative statutory anchors
   */
  private initializeCanonicalSeedGraph(): void {
    // ------------------------------------------------------------------------
    // DIRECT TAXATION (ACT 1961 & 2025 TRANSITION)
    // ------------------------------------------------------------------------
    this.addNode({
      id: 'IT-ACT-1961',
      type: 'STATUTE',
      title: 'Income-tax Act, 1961',
      domainId: '2_DIRECT_TAXATION_INCOME_TAX',
      authorityLevel: 'PARLIAMENTARY_ACT',
      jurisdiction: 'PAN_INDIA',
      statutoryReference: 'Act No. 43 of 1961',
      verbatimContent: 'An Act to consolidate and amend the law relating to income-tax and super-tax.',
      temporal: {
        effectiveFrom: '1962-04-01',
        effectiveTo: null,
        isRetrospective: false,
        applicablePreviousYears: ['FY 2023-24', 'FY 2024-25', 'FY 2025-26'],
        applicableAssessmentYears: ['AY 2024-25', 'AY 2025-26', 'AY 2026-27'],
        isOmitted: false
      },
      searchableTokens: ['income tax', 'it act', '1961', 'direct tax', 'ay 2026-27', 'fy 2025-26']
    });

    this.addNode({
      id: 'IT-ACT-2025',
      type: 'STATUTE',
      title: 'Income-tax Act, 2025',
      domainId: '2_DIRECT_TAXATION_INCOME_TAX',
      authorityLevel: 'PARLIAMENTARY_ACT',
      jurisdiction: 'PAN_INDIA',
      statutoryReference: 'Income-tax Act, 2025 (Commencing 01.04.2026)',
      verbatimContent: 'Enacted to establish unified Tax Year taxation, replacing dual Previous Year / Assessment Year framework from Tax Year 2026-27 onwards.',
      temporal: {
        effectiveFrom: '2026-04-01',
        effectiveTo: null,
        isRetrospective: false,
        applicablePreviousYears: [],
        applicableAssessmentYears: [],
        applicableTaxYears: ['Tax Year 2026-27 onwards'],
        isOmitted: false
      },
      searchableTokens: ['income tax 2025', 'tax year 2026-27', 'new act', 'direct tax code']
    });

    // Section 43B(h)
    this.addNode({
      id: 'IT-SEC-43BH',
      type: 'SUB_SECTION',
      title: 'Section 43B(h) MSME Deduction Timing',
      domainId: '2_DIRECT_TAXATION_INCOME_TAX',
      authorityLevel: 'PARLIAMENTARY_ACT',
      jurisdiction: 'PAN_INDIA',
      statutoryReference: 'Section 43B(h), Income-tax Act, 1961',
      verbatimContent: 'Any sum payable by the assessee to a micro or small enterprise beyond the time limit specified in section 15 of the MSMED Act, 2006 shall be allowed only in the year of actual payment. Proviso allowing payment before return due date does NOT apply to clause (h).',
      isNonObstante: true,
      temporal: {
        effectiveFrom: '2023-04-01',
        effectiveTo: null,
        isRetrospective: false,
        applicablePreviousYears: ['FY 2023-24 onwards', 'FY 2024-25', 'FY 2025-26'],
        applicableAssessmentYears: ['AY 2024-25 onwards', 'AY 2025-26', 'AY 2026-27'],
        isOmitted: false
      },
      searchableTokens: ['43b(h)', '43bh', 'msme payment', '15 days', '45 days', 'disallowance', 'micro small']
    });

    // MSMED Act Section 15
    this.addNode({
      id: 'MSMED-SEC-15',
      type: 'SECTION',
      title: 'Section 15, MSMED Act, 2006 (Liability of Buyer to Make Payment)',
      domainId: '11_IP_AND_BUSINESS_REGISTRATIONS',
      authorityLevel: 'PARLIAMENTARY_ACT',
      jurisdiction: 'PAN_INDIA',
      statutoryReference: 'Section 15, Micro, Small and Medium Enterprises Development Act, 2006',
      verbatimContent: 'Buyer shall make payment on or before agreed date, which shall not exceed 45 days from day of acceptance. In absence of agreement, payment within 15 days.',
      temporal: {
        effectiveFrom: '2006-10-02',
        effectiveTo: null,
        isRetrospective: false,
        applicablePreviousYears: ['All Years'],
        applicableAssessmentYears: ['All Years'],
        isOmitted: false
      },
      searchableTokens: ['msmed section 15', 'msme 45 days', 'msme 15 days', 'buyer payment']
    });

    // Precedent: Silpi Industries (Supreme Court)
    this.addNode({
      id: 'PREC-SC-SILPI-INDUSTRIES',
      type: 'JUDICIAL_PRECEDENT',
      title: 'Silpi Industries v. Kerala State Road Transport Corporation',
      domainId: '2_DIRECT_TAXATION_INCOME_TAX',
      authorityLevel: 'JUDICIAL_SUPREME_COURT',
      authorityForum: 'SUPREME_COURT_OF_INDIA',
      jurisdiction: 'PAN_INDIA',
      statutoryReference: '(2021) 18 SCC 790 (SC)',
      verbatimContent: 'Benefits under MSMED Act accrue only if the seller was registered as an MSME on the date of supply/contract. Subsequent registration does not apply retrospectively.',
      precedentTreatment: 'GOOD_LAW_BINDING',
      temporal: {
        effectiveFrom: '2021-06-29',
        effectiveTo: null,
        isRetrospective: false,
        applicablePreviousYears: ['All Years'],
        applicableAssessmentYears: ['All Years'],
        isOmitted: false
      },
      searchableTokens: ['silpi industries', 'msme registration date', 'retrospective udyam']
    });

    // Section 206AB (Omitted)
    this.addNode({
      id: 'IT-SEC-206AB',
      type: 'SECTION',
      title: 'Section 206AB Higher TDS for Non-Filers (Omitted w.e.f. 01.04.2025)',
      domainId: '6_TDS_TCS_WITHHOLDING_TAX',
      authorityLevel: 'PARLIAMENTARY_ACT',
      jurisdiction: 'PAN_INDIA',
      statutoryReference: 'Section 206AB, Income-tax Act, 1961',
      verbatimContent: 'Mandated higher withholding tax rate for specified persons who failed to file ITR. Omitted by Finance Act, 2025 w.e.f. 1 April 2025.',
      temporal: {
        effectiveFrom: '2021-07-01',
        effectiveTo: '2025-03-31',
        isRetrospective: false,
        applicablePreviousYears: ['FY 2021-22', 'FY 2022-23', 'FY 2023-24', 'FY 2024-25'],
        applicableAssessmentYears: ['AY 2022-23', 'AY 2023-24', 'AY 2024-25', 'AY 2025-26'],
        isOmitted: true,
        omissionDate: '2025-04-01',
        omissionStatute: 'Finance Act, 2025'
      },
      searchableTokens: ['206ab', 'non filer tds', 'higher tds rate', 'omitted section 206ab']
    });

    // Section 194Q
    this.addNode({
      id: 'IT-SEC-194Q',
      type: 'SECTION',
      title: 'Section 194Q TDS on Purchase of Goods',
      domainId: '6_TDS_TCS_WITHHOLDING_TAX',
      authorityLevel: 'PARLIAMENTARY_ACT',
      jurisdiction: 'PAN_INDIA',
      statutoryReference: 'Section 194Q, Income-tax Act, 1961',
      verbatimContent: 'Buyer with turnover exceeding INR 10 Crores responsible for paying sum exceeding INR 50 Lakhs for purchase of goods must deduct TDS at 0.1%.',
      temporal: {
        effectiveFrom: '2021-07-01',
        effectiveTo: null,
        isRetrospective: false,
        applicablePreviousYears: ['FY 2021-22 onwards', 'FY 2024-25', 'FY 2025-26'],
        applicableAssessmentYears: ['AY 2022-23 onwards', 'AY 2025-26', 'AY 2026-27'],
        isOmitted: false
      },
      searchableTokens: ['194q', 'purchase of goods tds', '0.1% tds', '50 lakhs goods']
    });

    // ------------------------------------------------------------------------
    // GST (CGST SECTION 16 & RETROSPECTIVE VALIDATIONS)
    // ------------------------------------------------------------------------
    this.addNode({
      id: 'CGST-SEC-16-2-AA',
      type: 'CLAUSE',
      title: 'Section 16(2)(aa) GSTR-2B Matching Condition',
      domainId: '3_GST_GOODS_AND_SERVICES_TAX',
      authorityLevel: 'PARLIAMENTARY_ACT',
      jurisdiction: 'PAN_INDIA',
      statutoryReference: 'Section 16(2)(aa), CGST Act, 2017',
      verbatimContent: 'No ITC entitlement unless supplier has furnished details of invoice/debit note in GSTR-1 and communicated to recipient via GSTR-2B.',
      isNonObstante: true,
      temporal: {
        effectiveFrom: '2022-01-01',
        effectiveTo: null,
        isRetrospective: false,
        applicablePreviousYears: ['FY 2021-22 (Q4 onwards)', 'FY 2022-23 onwards'],
        applicableAssessmentYears: [],
        isOmitted: false
      },
      searchableTokens: ['16(2)(aa)', 'gstr-2b match', 'itc condition', 'supplier gstr-1']
    });

    this.addNode({
      id: 'CGST-SEC-16-5',
      type: 'SUB_SECTION',
      title: 'Section 16(5) Retrospective Relief for Historical ITC (FY 17-18 to 20-21)',
      domainId: '3_GST_GOODS_AND_SERVICES_TAX',
      authorityLevel: 'PARLIAMENTARY_ACT',
      jurisdiction: 'PAN_INDIA',
      statutoryReference: 'Section 16(5), CGST Act, 2017 (Inserted by Finance (No. 2) Act, 2024)',
      verbatimContent: 'Registered person entitled to take ITC in any return filed up to 30 November 2021 for invoices relating to FY 2017-18, 2018-19, 2019-20, and 2020-21. Overrides Section 16(4).',
      isNonObstante: true,
      temporal: {
        effectiveFrom: '2024-08-16',
        effectiveTo: null,
        isRetrospective: true,
        retrospectiveFrom: '2017-07-01',
        applicablePreviousYears: ['FY 2017-18', 'FY 2018-19', 'FY 2019-20', 'FY 2020-21'],
        applicableAssessmentYears: [],
        isOmitted: false
      },
      searchableTokens: ['16(5)', '16(4) relief', 'retrospective itc', '30 november 2021', 'circular 237']
    });

    // Precedent: Mohit Minerals (Supreme Court on Ocean Freight)
    this.addNode({
      id: 'PREC-SC-MOHIT-MINERALS',
      type: 'JUDICIAL_PRECEDENT',
      title: 'Union of India v. Mohit Minerals Pvt Ltd',
      domainId: '3_GST_GOODS_AND_SERVICES_TAX',
      authorityLevel: 'JUDICIAL_SUPREME_COURT',
      authorityForum: 'SUPREME_COURT_OF_INDIA',
      jurisdiction: 'PAN_INDIA',
      statutoryReference: '(2022) 10 SCC 700 (SC)',
      verbatimContent: 'Levy of IGST on ocean freight paid by foreign supplier on CIF import of goods is unconstitutional as composite import already suffers IGST at customs under Customs Tariff Act.',
      precedentTreatment: 'GOOD_LAW_BINDING',
      temporal: {
        effectiveFrom: '2022-05-19',
        effectiveTo: null,
        isRetrospective: false,
        applicablePreviousYears: ['All GST Years'],
        applicableAssessmentYears: [],
        isOmitted: false
      },
      searchableTokens: ['mohit minerals', 'ocean freight rcm', 'cif import igst']
    });

    // ------------------------------------------------------------------------
    // CONNECTING EDGES
    // ------------------------------------------------------------------------
    this.addEdge({
      id: 'EDGE-43BH-MSMED15',
      sourceNodeId: 'IT-SEC-43BH',
      targetNodeId: 'MSMED-SEC-15',
      type: 'CONTAINS',
      description: 'Section 43B(h) explicitly borrows payment timelines from Section 15 of MSMED Act, 2006.',
      isStrongBinding: true
    });

    this.addEdge({
      id: 'EDGE-43BH-SILPI',
      sourceNodeId: 'IT-SEC-43BH',
      targetNodeId: 'PREC-SC-SILPI-INDUSTRIES',
      type: 'INTERPRETED_BY_PRECEDENT',
      description: 'Supreme Court ruling in Silpi Industries governs applicability based on registration date.',
      isStrongBinding: true
    });

    this.addEdge({
      id: 'EDGE-16-5-OVERRIDES-16-4',
      sourceNodeId: 'CGST-SEC-16-5',
      targetNodeId: 'CGST-SEC-16-2-AA',
      type: 'OVERRIDES_NON_OBSTANTE',
      description: 'Section 16(5) retrospectively validates ITC for FY 2017-18 through 2020-21 claimed up to 30.11.2021.',
      isStrongBinding: true
    });
  }
}
