/**
 * Brains & Taxes — Enterprise Statutory Refusal & Evidence Requisition
 * 
 * Part 3: Client Evidence Requisition Docket Generator
 * 
 * Automatically structures an executive-grade Requisition for Information (RFI)
 * adhering to ICAI Standards on Auditing (SA 500 Audit Evidence, SA 230 Documentation).
 */

import { 
  StatutoryGateViolation, 
  EvidenceRequisitionDocket 
} from './refusalTypes';

export class RequisitionGenerator {
  /**
   * Generates a formal evidence requisition docket from identified gate violations
   */
  public static generateDocket(
    clientEntityName: string,
    targetSubject: string,
    violations: StatutoryGateViolation[]
  ): EvidenceRequisitionDocket {
    const docketId = `RFI-GPA-${Date.now().toString(36).toUpperCase()}`;
    const generatedAt = new Date().toISOString();

    const items = violations.map((v, idx) => ({
      itemNumber: idx + 1,
      documentTitle: v.remedialDocumentNeeded.split(':')[0] || v.remedialDocumentNeeded,
      acceptedFormats: ['ORIGINAL_PDF_CERTIFICATE', 'PORTAL_EXTRACT_JSON', 'SIGNED_COMMERCIAL_CONTRACT'],
      issuingAuthority: this.resolveIssuingAuthority(v.gateCategory),
      criticalVerificationPoints: [
        `Verify: ${v.missingParameterName}`,
        `Legal Rationale: ${v.legalRationale}`,
        `Risk Identified: ${v.penalRiskIfIgnored}`
      ],
      statutoryMandate: v.statutoryCitation
    }));

    const memo = `MEMORANDUM FROM SENIOR TAX & AUDIT PARTNER (GPA & CO., CHARTERED ACCOUNTANTS)
TO: Management of ${clientEntityName}
DATE: ${generatedAt.split('T')[0]}
SUBJECT: Statutory Evidence Requisition for ${targetSubject}

In accordance with mandatory standards established by the Institute of Chartered Accountants of India (ICAI SA 500 'Audit Evidence' and SA 230 'Audit Documentation'), our practice cannot render formal tax opinions, sign statutory returns, or finalize audit workpapers without independently examining primary source evidence.

Our statutory gatekeeper has halted automated processing due to ${violations.length} unfulfilled condition(s) precedent. Proceeding without verifying these documents exposes the enterprise to severe statutory additions, disallowances, and punitive tax liabilities.

Please arrange to upload verified digital copies of the items listed in the requisition docket below to the Brains & Taxes client vault.`;

    const caveat = `REGULATORY COMPLIANCE STATEMENT: This requisition is issued pursuant to statutory due diligence duties under the Chartered Accountants Act, 1949 and Section 143 of the Companies Act, 2013. Advice rendered on incomplete or hypothetical facts is void and does not shield the assessee from penalties under Section 270A of the Income-tax Act or Section 122 of the CGST Act.`;

    return {
      docketId,
      generatedAt,
      clientEntityName,
      targetComplianceSubject: targetSubject,
      refusalVerdict: 'HALTED_PENDING_PRIMARY_EVIDENCE',
      seniorPartnerMemorandum: memo,
      requiredDocumentsList: items,
      regulatoryCaveat: caveat
    };
  }

  private static resolveIssuingAuthority(gate: string): string {
    switch (gate) {
      case 'MSME_SECTION_43BH': return 'Ministry of MSME (Udyam Portal) & Commercial Supplier';
      case 'CASH_CREDIT_SECTION_68': return 'Income Tax Department (ITD) & Statutory Auditors of Lender';
      case 'GST_ITC_SECTION_16': return 'Goods and Services Tax Network (GSTN) & Logistics Transporter';
      case 'CORPORATE_LOAN_SECTION_185': return 'Ministry of Corporate Affairs (MCA ROC) & Board of Directors';
      case 'NOTICE_JURISDICTION_DIN': return 'Central Board of Direct Taxes (CBDT Directorate of Systems)';
      default: return 'Statutory Government Authority';
    }
  }
}
