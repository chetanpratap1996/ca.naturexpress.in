/**
 * Bridge script providing CommonJS interface to LegalGraphStore for Node execution
 */

class LegalGraphStore {
  constructor() {
    this.nodes = new Map();
    this.outgoingEdges = new Map();
    this.initializeCanonicalSeedGraph();
  }

  addNode(node) {
    this.nodes.set(node.id, node);
  }

  addEdge(edge) {
    if (!this.outgoingEdges.has(edge.sourceNodeId)) {
      this.outgoingEdges.set(edge.sourceNodeId, []);
    }
    this.outgoingEdges.get(edge.sourceNodeId).push(edge);
  }

  getNode(id) {
    return this.nodes.get(id);
  }

  getOutgoingEdges(nodeId) {
    return this.outgoingEdges.get(nodeId) || [];
  }

  initializeCanonicalSeedGraph() {
    this.addNode({
      id: 'IT-SEC-43BH',
      title: 'Section 43B(h) MSME Deduction Timing',
      domainId: '2_DIRECT_TAXATION_INCOME_TAX',
      authorityLevel: 'PARLIAMENTARY_ACT',
      statutoryReference: 'Section 43B(h), Income-tax Act, 1961',
      temporal: {
        effectiveFrom: '2023-04-01',
        applicablePreviousYears: ['FY 2023-24', 'FY 2024-25', 'FY 2025-26'],
        isOmitted: false
      }
    });

    this.addNode({
      id: 'MSMED-SEC-15',
      title: 'Section 15, MSMED Act, 2006 (Liability of Buyer to Make Payment)',
      statutoryReference: 'Section 15, MSMED Act, 2006',
      temporal: { effectiveFrom: '2006-10-02', isOmitted: false }
    });

    this.addNode({
      id: 'PREC-SC-SILPI-INDUSTRIES',
      title: 'Silpi Industries v. Kerala State Road Transport Corporation',
      authorityLevel: 'JUDICIAL_SUPREME_COURT',
      statutoryReference: '(2021) 18 SCC 790 (SC)',
      temporal: { effectiveFrom: '2021-06-29', isOmitted: false }
    });

    this.addNode({
      id: 'IT-SEC-206AB',
      title: 'Section 206AB Higher TDS for Non-Filers',
      statutoryReference: 'Section 206AB, Income-tax Act, 1961',
      temporal: {
        effectiveFrom: '2021-07-01',
        effectiveTo: '2025-03-31',
        isOmitted: true,
        omissionDate: '2025-04-01',
        omissionStatute: 'Finance Act, 2025'
      }
    });

    this.addNode({
      id: 'CGST-SEC-16-5',
      title: 'Section 16(5) Retrospective Relief for Historical ITC',
      statutoryReference: 'Section 16(5), CGST Act, 2017',
      temporal: {
        effectiveFrom: '2024-08-16',
        isRetrospective: true,
        retrospectiveFrom: '2017-07-01',
        applicablePreviousYears: ['FY 2017-18', 'FY 2018-19', 'FY 2019-20', 'FY 2020-21'],
        isOmitted: false
      }
    });

    this.addEdge({
      id: 'EDGE-43BH-MSMED15',
      sourceNodeId: 'IT-SEC-43BH',
      targetNodeId: 'MSMED-SEC-15'
    });

    this.addEdge({
      id: 'EDGE-43BH-SILPI',
      sourceNodeId: 'IT-SEC-43BH',
      targetNodeId: 'PREC-SC-SILPI-INDUSTRIES'
    });
  }
}

module.exports = { LegalGraphStore };
