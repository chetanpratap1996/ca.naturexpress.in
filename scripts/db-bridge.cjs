/**
 * Bridge script providing CommonJS interface to DualTrackKnowledgeClient for Node execution
 */

class DualTrackKnowledgeClient {
  constructor() {
    this.primarySources = new Map();
    this.provisions = new Map();
    this.provisos = new Map();
    this.precedents = new Map();
    this.associations = new Map();
    this.seedData();
  }

  getProvisionWithFullProvenance(provisionCode, asOfDate = '2026-04-01') {
    const prov = Array.from(this.provisions.values()).find(p => p.provision_code === provisionCode);
    if (!prov) return null;

    const source = this.primarySources.get(prov.primary_source_id);
    const provisosList = this.provisos.get(prov.id) || [];
    const assocList = this.associations.get(prov.id) || [];

    const precedentsList = assocList.map(a => ({
      precedent: this.precedents.get(a.precedentId),
      associationType: a.type
    })).filter(p => !!p.precedent);

    let temporalState = 'ACTIVE_CURRENT';
    if (prov.is_omitted && prov.omission_date && asOfDate >= prov.omission_date) {
      temporalState = 'OMITTED_SUNSET';
    }

    return {
      provision: prov,
      primarySource: source,
      provisosAndExplanations: provisosList,
      precedents: precedentsList,
      temporalValidityState: temporalState
    };
  }

  searchProvisions(params) {
    const results = [];
    const asOf = params.asOfDate || '2026-04-01';
    const q = params.queryText.toLowerCase();

    for (const prov of this.provisions.values()) {
      if (params.targetDomain && prov.domain_id !== params.targetDomain) continue;
      const match = prov.section_number.toLowerCase().includes(q) || 
                    prov.title.toLowerCase().includes(q) ||
                    (prov.verbatim_statutory_text && prov.verbatim_statutory_text.toLowerCase().includes(q));
      if (match) {
        results.push(this.getProvisionWithFullProvenance(prov.provision_code, asOf));
      }
    }
    return results;
  }

  seedData() {
    const sourceFa2024 = {
      id: 'src-fa-2024-no2',
      source_code: 'GAZETTE-FA-2024-NO2',
      official_title: 'The Finance (No. 2) Act, 2024',
      gazette_notification_number: 'G.S.R. 502(E)',
      primary_source_uri: 'https://egazette.gov.in/WriteReadData/2024/GSR502E.pdf',
      sha256_checksum: 'b712c9849201f82d491c390281b40192e817293840291a82e7192847291038a2'
    };
    this.primarySources.set(sourceFa2024.id, sourceFa2024);

    const sourceFa2025 = {
      id: 'src-fa-2025',
      source_code: 'GAZETTE-FA-2025',
      official_title: 'The Finance Act, 2025',
      primary_source_uri: 'https://egazette.gov.in/WriteReadData/2025/259812.pdf',
      sha256_checksum: 'a89c4e2f1d93b827e491c3f58a7061b4029d918375491a92e81d7293b68402a1'
    };
    this.primarySources.set(sourceFa2025.id, sourceFa2025);

    const prov43bh = {
      id: 'prov-it-43bh',
      provision_code: 'IT-1961-SEC-43BH',
      primary_source_id: sourceFa2024.id,
      domain_id: '2_DIRECT_TAXATION_INCOME_TAX',
      section_number: '43B(h)',
      title: 'Disallowance of Dues to MSME Micro and Small Enterprises',
      verbatim_statutory_text: 'Any sum payable by the assessee to a micro or small enterprise beyond the time limit specified in section 15 of MSMED Act.',
      is_omitted: false,
      verification_state: 'VERIFIED_PRIMARY_SOURCE',
      verified_by_membership_no: '022998'
    };
    this.provisions.set(prov43bh.id, prov43bh);

    const proviso43b = {
      id: 'pe-43bh-1',
      provision_id: prov43bh.id,
      element_type: 'PROVISO',
      verbatim_text: 'Provided that nothing contained in the first proviso to section 43B shall apply to clause (h).'
    };
    this.provisos.set(prov43bh.id, [proviso43b]);

    const prov206ab = {
      id: 'prov-it-206ab',
      provision_code: 'IT-1961-SEC-206AB',
      primary_source_id: sourceFa2025.id,
      domain_id: '6_TDS_TCS_WITHHOLDING_TAX',
      section_number: '206AB',
      title: 'Special Provision for Higher TDS (OMITTED)',
      is_omitted: true,
      omission_date: '2025-04-01'
    };
    this.provisions.set(prov206ab.id, prov206ab);

    const precSilpi = {
      id: 'prec-sc-silpi-2021',
      case_code: 'SC-2021-SILPI-INDUSTRIES',
      case_title: 'Silpi Industries v. Kerala State Road Transport Corporation',
      law_report_citation: '(2021) 18 SCC 790',
      treatment_status: 'GOOD_LAW_BINDING'
    };
    this.precedents.set(precSilpi.id, precSilpi);

    this.associations.set(prov43bh.id, [{
      precedentId: precSilpi.id,
      type: 'INTERPRETS_STATUTE'
    }]);
  }
}

module.exports = { DualTrackKnowledgeClient };
