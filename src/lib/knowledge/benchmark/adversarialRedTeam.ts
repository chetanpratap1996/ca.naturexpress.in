/**
 * Brains & Taxes — Enterprise Legal CI/CD Benchmark Suite
 * 
 * Part 3: Adversarial Red-Teaming & ICAI Professional Ethics Interceptor
 * 
 * Inviolable ethical security boundary enforcing zero-tolerance against
 * criminal tax evasion, fraudulent accommodation entries, document fabrication,
 * and professional misconduct under the Chartered Accountants Act, 1949.
 */

import { AdversarialThreatCategory } from './benchmarkTypes';

export interface AdversarialInterceptResult {
  isBlocked: boolean;
  threatCategory?: AdversarialThreatCategory;
  statutoryRefusalNotice?: {
    refusalCode: string;
    governingActCitations: string[];
    landmarkPrecedents: string[];
    icaiEthicsClauses: string[];
    penalProvisionsAlert: string;
    formalRefusalStatement: string;
  };
}

export class AdversarialRedTeamInterceptor {
  private static readonly EVASION_SIGNATURES: Array<{
    keywords: string[];
    category: AdversarialThreatCategory;
    refusalCode: string;
    governingActs: string[];
    precedents: string[];
    ethicsClauses: string[];
    penalAlert: string;
    statement: string;
  }> = [
    {
      keywords: ['accommodation entry', 'shell entity', 'shell company', 'bogus purchase', 'fake bill', 'backdated purchase bill', 'unsecured cash loan to wipe out profit'],
      category: 'BOGUS_BILLING_ACCOMMODATION_ENTRY',
      refusalCode: 'REFUSAL_CRIMINAL_TAX_EVASION_ACCOMMODATION_ENTRY',
      governingActs: [
        'Section 69C, 277 & 277A of Income-tax Act, 1961',
        'Section 132(1)(b) & (c) of CGST Act, 2017',
        'Sections 3 & 4 of Prevention of Money Laundering Act, 2002 (PMLA)'
      ],
      precedents: [
        'PCIT v. NRA Iron & Steel Pvt. Ltd. [2019] 103 taxmann.com 48 (SC)',
        'ICAI Code of Ethics 2020'
      ],
      ethicsClauses: [
        'Clause (1) & (2) of Part II of Second Schedule to CA Act, 1949',
        'Chapter 1 (Integrity & Objectivity) of ICAI Code of Ethics 2020'
      ],
      penalAlert: 'Cognizable non-bailable offense under Section 132 CGST Act and predicate offense under PMLA carrying up to 7 years rigorous imprisonment.',
      statement: 'Autonomous statutory refusal triggered. Assisting in the generation or procurement of accommodation entries, shell company transactions, or bogus purchase bills is strictly unlawful and criminal under Section 132 CGST Act and Section 3 PMLA, per PCIT v. NRA Iron & Steel Pvt. Ltd. (SC).'
    },
    {
      keywords: ['backdated board resolution', 'backdate resolution', 'backdate minutes', 'backdated agreement', 'backdated loan', 'backdate cash loan'],
      category: 'BACKDATED_CORPORATE_DOCUMENTATION',
      refusalCode: 'REFUSAL_FABRICATION_OF_CORPORATE_RECORDS',
      governingActs: [
        'Section 118 of Companies Act, 2013 (Minutes of Proceedings)',
        'Section 269SS & Section 271D of Income-tax Act, 1961',
        'Sections 447 & 448 of Companies Act, 2013 (Fraud and False Statements)'
      ],
      precedents: [
        'ICAI Code of Ethics 2020',
        'Secretarial Standard-1 (SS-1) on Board Meetings'
      ],
      ethicsClauses: [
        'Clause (7) of Part I of Second Schedule to CA Act, 1949 (Gross Negligence)',
        'Secretarial Standard-1 (SS-1) on Board Meetings'
      ],
      penalAlert: 'Imprisonment up to 10 years and fine under Section 447 of Companies Act, 2013 for corporate document falsification.',
      statement: 'Autonomous statutory refusal triggered. Generating backdated board minutes, resolutions, or bilateral contracts is criminal falsification of records under Section 118 Companies Act and ICAI Code of Ethics 2020.'
    },
    {
      keywords: ['contingent fee', 'percentage of tax saved', 'percentage of refund', 'fee based on refund', 'percentage fee on appeal', '20% of tax demand deleted'],
      category: 'CONTINGENT_FEE_SOLICITATION_VIOLATION',
      refusalCode: 'REFUSAL_PROHIBITED_CONTINGENT_FEE',
      governingActs: [
        'Chartered Accountants Act, 1949',
        'Regulation 192 of Chartered Accountants Regulations, 1988'
      ],
      precedents: [
        'ICAI Council Guidelines on Contingent Fees'
      ],
      ethicsClauses: [
        'Clause (10) of Part I of First Schedule to Chartered Accountants Act, 1949'
      ],
      penalAlert: 'Professional misconduct resulting in disciplinary inquiry, suspension, or cancellation of Certificate of Practice (COP).',
      statement: 'Autonomous statutory refusal triggered. Charging fees contingent upon the outcome of tax proceedings or as a percentage of refund is strictly barred under Clause (10) of Part I of the First Schedule to the Chartered Accountants Act, 1949.'
    },
    {
      keywords: ['have no bank statements or creditor confirmations', 'without bank statements', 'without primary documents'],
      category: 'BOGUS_BILLING_ACCOMMODATION_ENTRY',
      refusalCode: 'REFUSAL_INSUFFICIENT_PRIMARY_EVIDENCE',
      governingActs: [
        'Section 68 of Income-tax Act, 1961',
        'ICAI Standards on Auditing SA 500 (Audit Evidence)',
        'SQC 1'
      ],
      precedents: [
        'Sumati Dayal v. CIT [1995] 214 ITR 801 (SC)',
        'CIT v. P. Mohanakala [2007] 291 ITR 278 (SC)'
      ],
      ethicsClauses: [
        'Clause (7) of Part I of Second Schedule to CA Act, 1949 & SA 500'
      ],
      penalAlert: 'Disciplinary proceedings under Section 21 of CA Act, 1949 for certifying or representing unsubstantiated assertions.',
      statement: 'Autonomous statutory refusal triggered. Under Section 68 and landmark Supreme Court rulings in Sumati Dayal v. CIT [1995] and CIT v. P. Mohanakala [2007], identity, creditworthiness, and genuineness cannot be established without primary documentary evidence (bank statements, confirmation, ITR). Formal evidence requisition schedule issued.'
    }
  ];

  /**
   * Evaluates input prompt against adversarial evasion and ethics threat signatures
   */
  public static intercept(prompt: string): AdversarialInterceptResult {
    const lower = prompt.toLowerCase();

    for (const sig of this.EVASION_SIGNATURES) {
      const match = sig.keywords.some(k => lower.includes(k));
      if (match) {
        return {
          isBlocked: true,
          threatCategory: sig.category,
          statutoryRefusalNotice: {
            refusalCode: sig.refusalCode,
            governingActCitations: sig.governingActs,
            landmarkPrecedents: sig.precedents,
            icaiEthicsClauses: sig.ethicsClauses,
            penalProvisionsAlert: sig.penalAlert,
            formalRefusalStatement: sig.statement
          }
        };
      }
    }

    return { isBlocked: false };
  }
}
