/**
 * Brains & Taxes — Enterprise Statutory Refusal & Evidence Requisition
 * 
 * Part 2: Deterministic Statutory Gatekeeper
 * 
 * Enforces zero-hallucination evidentiary preconditions.
 * Validates primary proofs before allowing agents to compute or advise.
 */

import { 
  FactPayload, 
  StatutoryGateViolation, 
  GateEvaluationOutcome 
} from './refusalTypes';

export class StatutoryGatekeeper {
  /**
   * Evaluates all applicable statutory gates against provided client facts
   */
  public static evaluateAllGates(facts: FactPayload): GateEvaluationOutcome {
    const violations: StatutoryGateViolation[] = [];

    // Gate 1: MSME Section 43B(h) Gate
    if (facts.domainId.includes('DIRECT_TAX') || facts.targetSection?.includes('43B')) {
      this.evaluateMsmeGate(facts, violations);
    }

    // Gate 2: Section 68 Cash Credits Gate
    if (facts.targetSection?.includes('68') || facts.targetSection?.includes('UNSECURED_LOAN')) {
      this.evaluateCashCreditGate(facts, violations);
    }

    // Gate 3: GST Section 16 ITC Gate
    if (facts.domainId.includes('GST') || facts.targetSection?.includes('16')) {
      this.evaluateGstItcGate(facts, violations);
    }

    // Gate 4: Companies Act Section 185 Loan to Directors Gate
    if (facts.targetSection?.includes('185') || facts.domainId.includes('CORPORATE_LAWS')) {
      this.evaluateSection185Gate(facts, violations);
    }

    // Gate 5: Notice Jurisdiction & DIN Gate
    if (facts.noticeHasDin !== undefined || facts.manualIssuanceHasPriorCcitApproval !== undefined) {
      this.evaluateNoticeJurisdictionGate(facts, violations);
    }

    const isCleared = violations.length === 0;
    const hasStrictHalt = violations.some(v => v.severity === 'STRICT_HALT_REFUSAL');
    const hasRequisition = violations.some(v => v.severity === 'REQUISITION_REQUIRED');

    let severity: 'CLEARED' | 'STRICT_HALT_REFUSAL' | 'REQUISITION_REQUIRED' | 'CONDITIONAL_ESCALATION_WARNING' = 'CLEARED';
    if (hasStrictHalt) severity = 'STRICT_HALT_REFUSAL';
    else if (hasRequisition) severity = 'REQUISITION_REQUIRED';
    else if (violations.length > 0) severity = 'CONDITIONAL_ESCALATION_WARNING';

    return {
      isCleared,
      severity,
      violations,
      partnerAdvisoryNotes: isCleared 
        ? 'All statutory conditions precedent verified against primary evidentiary standards.'
        : `Execution blocked by statutory gatekeeper. ${violations.length} condition(s) precedent unfulfilled.`
    };
  }

  // --------------------------------------------------------------------------
  // GATE 1: MSME SECTION 43B(h) EVIDENTIARY GATE
  // --------------------------------------------------------------------------
  private static evaluateMsmeGate(facts: FactPayload, violations: StatutoryGateViolation[]): void {
    // Check 1: Enterprise Classification (Medium is excluded)
    if (facts.supplierEnterpriseType === 'MEDIUM') {
      // Medium enterprises are statutorily outside Section 43B(h)
      return;
    }

    // Check 2: Trader Exclusion (Retail/Wholesale traders excluded)
    if (facts.supplierMajorActivity === 'TRADING') {
      // Traders with Udyam registration are limited to Priority Sector Lending
      // Excluded from Section 43B(h) per OM 2/1(5)/2021 & CBDT Circular 1/2024
      return;
    }

    // Check 3: Registration Date vs Invoice Date (Silpi Industries SC)
    if (!facts.supplierUdyamRegistrationDate) {
      violations.push({
        gateCategory: 'MSME_SECTION_43BH',
        severity: 'STRICT_HALT_REFUSAL',
        conditionId: 'MSME_REG_DATE_UNKNOWN',
        missingParameterName: 'supplierUdyamRegistrationDate',
        legalRationale: 'Under Supreme Court ruling in Silpi Industries (2021) 18 SCC 790, MSMED Act benefits apply only if supplier held valid Udyam registration on invoice date.',
        statutoryCitation: 'Section 43B(h) IT Act r/w Section 2(n) & Section 15 MSMED Act, 2006',
        remedialDocumentNeeded: 'Official Udyam Registration Certificate downloaded from udyamregistration.gov.in showing Date of Registration.',
        penalRiskIfIgnored: 'Unlawful disallowance of valid expense, distorting taxable business profits.'
      });
      return;
    }

    if (facts.invoiceDate && facts.supplierUdyamRegistrationDate > facts.invoiceDate) {
      // Registered AFTER invoice date -> Not covered by MSMED Act for this transaction
      return;
    }

    // Check 4: Written Agreement Status (15 Days vs 45 Days)
    if (facts.hasWrittenCreditAgreement === undefined) {
      violations.push({
        gateCategory: 'MSME_SECTION_43BH',
        severity: 'REQUISITION_REQUIRED',
        conditionId: 'MSME_AGREEMENT_STATUS_UNVERIFIED',
        missingParameterName: 'hasWrittenCreditAgreement',
        legalRationale: 'In the absence of a written credit agreement, Section 15 mandates payment within 15 days (not 45 days). System cannot compute limitation without reviewing terms.',
        statutoryCitation: 'Section 15, MSMED Act, 2006 (Appointment Day Definition)',
        remedialDocumentNeeded: 'Copy of Purchase Order (PO), Vendor Master Agreement, or commercial credit contract.',
        penalRiskIfIgnored: 'Understating overdue days by 30 days if defaulting to 45-day calculation without agreement.'
      });
    }
  }

  // --------------------------------------------------------------------------
  // GATE 2: SECTION 68 CASH CREDITS (TRIPLE TEST)
  // --------------------------------------------------------------------------
  private static evaluateCashCreditGate(facts: FactPayload, violations: StatutoryGateViolation[]): void {
    const missingPillars: string[] = [];

    if (!facts.lenderPan) missingPillars.push('Pillar 1: Identity (Lender PAN)');
    if (!facts.lenderItrAcknowledgmentInPossession || !facts.lenderAuditedBalanceSheetInPossession) {
      missingPillars.push('Pillar 2: Creditworthiness (Lender Audited Balance Sheet & ITR Acknowledgement)');
    }
    if (!facts.bankingChannelDebitProofInPossession) {
      missingPillars.push('Pillar 3: Genuineness (Bank Account Statement reflecting clearing transfer)');
    }

    if (missingPillars.length > 0) {
      violations.push({
        gateCategory: 'CASH_CREDIT_SECTION_68',
        severity: 'STRICT_HALT_REFUSAL',
        conditionId: 'SECTION_68_TRIPLE_TEST_FAILED',
        missingParameterName: missingPillars.join('; '),
        legalRationale: 'Supreme Court jurisprudence (CIT v. P. Mohanakala, CIT v. Lovely Exports) mandates establishing Identity, Creditworthiness, and Genuineness. Incomplete proof triggers punitive taxation.',
        statutoryCitation: 'Section 68 read with Section 115BBE of Income-tax Act, 1961',
        remedialDocumentNeeded: '3-Pillar Evidentiary Dossier: Confirmatory Affidavit, Lender Audited Financials, ITR-V, and Bank Statement.',
        penalRiskIfIgnored: 'Punitive addition taxed at 78% effective rate (60% tax + 25% surcharge + 4% cess) under Section 115BBE with no loss set-off.'
      });
    }
  }

  // --------------------------------------------------------------------------
  // GATE 3: GST SECTION 16 INPUT TAX CREDIT GATE
  // --------------------------------------------------------------------------
  private static evaluateGstItcGate(facts: FactPayload, violations: StatutoryGateViolation[]): void {
    if (facts.hasTaxInvoice === false) {
      violations.push({
        gateCategory: 'GST_ITC_SECTION_16',
        severity: 'STRICT_HALT_REFUSAL',
        conditionId: 'GST_NO_TAX_INVOICE',
        missingParameterName: 'hasTaxInvoice',
        legalRationale: 'Possession of a tax invoice or debit note issued by a registered supplier is a mandatory condition precedent under Section 16(2)(a).',
        statutoryCitation: 'Section 16(2)(a), Central Goods and Services Tax Act, 2017',
        remedialDocumentNeeded: 'Valid Tax Invoice complying with Rule 46 of CGST Rules, 2017.',
        penalRiskIfIgnored: 'Absolute disallowance of ITC with 18% interest under Section 50 and penalty under Section 122.'
      });
    }

    if (facts.invoiceAppearsInGstr2B === false) {
      violations.push({
        gateCategory: 'GST_ITC_SECTION_16',
        severity: 'REQUISITION_REQUIRED',
        conditionId: 'GST_GSTR2B_MISMATCH',
        missingParameterName: 'invoiceAppearsInGstr2B',
        legalRationale: 'Section 16(2)(aa) statutorily prohibits ITC availment unless invoice details have been furnished by supplier in GSTR-1 and reflected in GSTR-2B.',
        statutoryCitation: 'Section 16(2)(aa) CGST Act r/w Rule 37A CGST Rules',
        remedialDocumentNeeded: 'GSTR-2B JSON or Excel extract from GSTN portal for the relevant tax period.',
        penalRiskIfIgnored: 'Automated demand notice in Form DRC-01C / DRC-01 with interest and penalty.'
      });
    }
  }

  // --------------------------------------------------------------------------
  // GATE 4: COMPANIES ACT SECTION 185 LOANS TO DIRECTORS
  // --------------------------------------------------------------------------
  private static evaluateSection185Gate(facts: FactPayload, violations: StatutoryGateViolation[]): void {
    if (facts.borrowerIsDirectorOrRelative) {
      if (!facts.specialResolutionPassedUnder185_2 || !facts.borrowerPrincipalBusinessEndUseCertified) {
        violations.push({
          gateCategory: 'CORPORATE_LOAN_SECTION_185',
          severity: 'STRICT_HALT_REFUSAL',
          conditionId: 'SEC_185_SPECIAL_RESOLUTION_MISSING',
          missingParameterName: 'specialResolutionPassedUnder185_2 & borrowerPrincipalBusinessEndUseCertified',
          legalRationale: 'Loans to entities in which directors are interested are permissible only pursuant to a Special Resolution and certified end-use for principal business activities.',
          statutoryCitation: 'Section 185(2) and Section 185(4), Companies Act, 2013',
          remedialDocumentNeeded: 'Certified True Copy of Form MGT-14 filed with ROC, Notice of General Meeting with Explanatory Statement, and End-Use Auditor Certificate.',
          penalRiskIfIgnored: 'Criminal prosecution of directors, fine up to INR 25 Lakhs, and imprisonment up to 6 months.'
        });
      }
    }
  }

  // --------------------------------------------------------------------------
  // GATE 5: NOTICE JURISDICTION & DIN GATE
  // --------------------------------------------------------------------------
  private static evaluateNoticeJurisdictionGate(facts: FactPayload, violations: StatutoryGateViolation[]): void {
    if (facts.noticeHasDin === false) {
      if (!facts.manualIssuanceHasPriorCcitApproval) {
        violations.push({
          gateCategory: 'NOTICE_JURISDICTION_DIN',
          severity: 'STRICT_HALT_REFUSAL',
          conditionId: 'NOTICE_DIN_ABSENT_WITHOUT_APPROVAL',
          missingParameterName: 'manualIssuanceHasPriorCcitApproval',
          legalRationale: 'CBDT Circular No. 19/2019 Paragraph 3 requires written prior approval of CCIT/DGIT for any manual communication without DIN. Absent approval, notice is void ab initio.',
          statutoryCitation: 'CBDT Circular No. 19/2019; Supreme Court in CIT v. Brandix Mauritius Holdings (2023)',
          remedialDocumentNeeded: 'Inspection of Assessing Officer case file to ascertain whether CCIT written approval order exists.',
          penalRiskIfIgnored: 'Submitting substantive defense without raising jurisdictional challenge waives threshold legal objection.'
        });
      }
    }
  }
}
