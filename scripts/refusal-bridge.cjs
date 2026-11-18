/**
 * Bridge script providing CommonJS interface to StatutoryGatekeeper for Node execution
 */

class StatutoryGatekeeper {
  static evaluateAllGates(facts) {
    const violations = [];

    // Gate 1: MSME Section 43B(h)
    if (facts.domainId && (facts.domainId.includes('DIRECT_TAX') || (facts.targetSection && facts.targetSection.includes('43B')))) {
      if (facts.supplierEnterpriseType === 'MEDIUM') {
        // Excluded
      } else if (facts.supplierMajorActivity === 'TRADING') {
        // Excluded
      } else if (!facts.supplierUdyamRegistrationDate) {
        violations.push({
          gateCategory: 'MSME_SECTION_43BH',
          severity: 'STRICT_HALT_REFUSAL',
          conditionId: 'MSME_REG_DATE_UNKNOWN',
          missingParameterName: 'supplierUdyamRegistrationDate',
          legalRationale: 'Silpi Industries (SC) registration timing prerequisite.',
          statutoryCitation: 'Section 43B(h) IT Act r/w Section 15 MSMED Act'
        });
      } else if (facts.hasWrittenCreditAgreement === undefined) {
        violations.push({
          gateCategory: 'MSME_SECTION_43BH',
          severity: 'REQUISITION_REQUIRED',
          conditionId: 'MSME_AGREEMENT_STATUS_UNVERIFIED',
          missingParameterName: 'hasWrittenCreditAgreement',
          legalRationale: 'Written agreement verification (15 vs 45 days).',
          statutoryCitation: 'Section 15, MSMED Act, 2006'
        });
      }
    }

    // Gate 2: Section 68
    if (facts.targetSection && (facts.targetSection.includes('68') || facts.targetSection.includes('UNSECURED_LOAN'))) {
      if (!facts.lenderItrAcknowledgmentInPossession || !facts.lenderAuditedBalanceSheetInPossession) {
        violations.push({
          gateCategory: 'CASH_CREDIT_SECTION_68',
          severity: 'STRICT_HALT_REFUSAL',
          conditionId: 'SECTION_68_TRIPLE_TEST_FAILED',
          legalRationale: 'Creditworthiness proof missing under Sec 68.',
          statutoryCitation: 'Section 68 r/w Section 115BBE'
        });
      }
    }

    // Gate 3: GST Section 16
    if (facts.domainId && (facts.domainId.includes('GST') || (facts.targetSection && facts.targetSection.includes('16')))) {
      if (facts.invoiceAppearsInGstr2B === false) {
        violations.push({
          gateCategory: 'GST_ITC_SECTION_16',
          severity: 'REQUISITION_REQUIRED',
          conditionId: 'GST_GSTR2B_MISMATCH',
          legalRationale: 'Section 16(2)(aa) GSTR-2B condition unfulfilled.',
          statutoryCitation: 'Section 16(2)(aa) CGST Act'
        });
      }
    }

    // Gate 4: Corporate Loan Section 185
    if (facts.targetSection && facts.targetSection.includes('185')) {
      if (facts.borrowerIsDirectorOrRelative && !facts.specialResolutionPassedUnder185_2) {
        violations.push({
          gateCategory: 'CORPORATE_LOAN_SECTION_185',
          severity: 'STRICT_HALT_REFUSAL',
          conditionId: 'SEC_185_SPECIAL_RESOLUTION_MISSING',
          legalRationale: 'Special resolution required for director-interested loans.',
          statutoryCitation: 'Section 185(2) Companies Act, 2013'
        });
      }
    }

    // Gate 5: Notice DIN
    if (facts.noticeHasDin === false && facts.manualIssuanceHasPriorCcitApproval === false) {
      violations.push({
        gateCategory: 'NOTICE_JURISDICTION_DIN',
        severity: 'STRICT_HALT_REFUSAL',
        conditionId: 'NOTICE_DIN_ABSENT_WITHOUT_APPROVAL',
        legalRationale: 'Notice without DIN and without CCIT approval is void ab initio.',
        statutoryCitation: 'CBDT Circular 19/2019'
      });
    }

    const isCleared = violations.length === 0;
    const hasStrictHalt = violations.some(v => v.severity === 'STRICT_HALT_REFUSAL');
    const hasRequisition = violations.some(v => v.severity === 'REQUISITION_REQUIRED');

    let severity = 'CLEARED';
    if (hasStrictHalt) severity = 'STRICT_HALT_REFUSAL';
    else if (hasRequisition) severity = 'REQUISITION_REQUIRED';

    return {
      isCleared,
      severity,
      violations
    };
  }
}

module.exports = { StatutoryGatekeeper };
