/**
 * Brains & Taxes — CBDT Insight Scrutiny Notice Forecaster & AIS Feedback Engine
 * 
 * Statutory Authority:
 * - Section 143(1)(a) of Income-tax Act, 1961: Automated prima facie adjustments based on 26AS/AIS
 * - Section 148 / 148A of Income-tax Act, 1961: Notice for reassessment where income has escaped assessment
 * - Section 133C of Income-tax Act, 1961: Automated e-Verification of mismatches via CBDT Insight Portal
 * - Section 270A of Income-tax Act, 1961: Penalty for under-reporting (50%) or misreporting (200%) of income
 */

export type AisFeedbackOption =
  | "INFO_CORRECT"
  | "INFO_PARTIALLY_CORRECT"
  | "INFO_DENIED"
  | "INFO_DUPLICATE"
  | "INFO_OTHER_PAN";

export interface AisPortalFeedbackPayload {
  pan: string;
  financialYear: string;
  assessmentYear: string;
  informationCode: string;
  reportingEntity: string;
  reportedAmount: number;
  feedbackOption: AisFeedbackOption;
  explanationRemarks: string;
  modifiedAmount?: number;
  timestamp: string;
}

export interface ScrutinyForecastResult {
  pan: string;
  assessmentYear: string;
  rmsScrutinyScore: number; // 0 to 100
  scrutinyRiskTier: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  sec143_1_AdjustmentRisk: boolean;
  sec143_1_PotentialDemandInr: number;
  sec148_ReopeningRisk: boolean;
  sec148_EscapedIncomeEstimateInr: number;
  primaryRiskDrivers: string[];
  feedbackPayloads: AisPortalFeedbackPayload[];
  statutoryReplyLetterText: string;
  statutoryReplyLetterHtml: string;
}

export class InsightNoticeForecaster {
  /**
   * Evaluates CBDT Risk Management System (RMS) scrutiny notice exposure
   */
  public static forecastNoticeExposure(params: {
    pan: string;
    taxpayerName: string;
    financialYear: string;
    assessmentYear: string;
    totalUnreportedIncomeInr: number;
    totalDiscrepancyAmountInr: number;
    hasUnexplainedCashSft: boolean;
    unexplainedCashAmountInr: number;
    unclaimedTdsInr: number;
    discrepantItems: {
      code: string;
      entity: string;
      reportedAmount: number;
      description: string;
    }[];
  }): ScrutinyForecastResult {
    let score = 0;
    const drivers: string[] = [];
    const payloads: AisPortalFeedbackPayload[] = [];

    // 1. Unexplained Cash Deposits (Section 68 / 69A)
    if (params.hasUnexplainedCashSft && params.unexplainedCashAmountInr > 0) {
      const cashPenalty = Math.min(45, Math.ceil(params.unexplainedCashAmountInr / 500000) * 15);
      score += cashPenalty;
      drivers.push(`HIGH SCRUTINY: SFT cash deposits of INR ${params.unexplainedCashAmountInr.toLocaleString('en-IN')} unverified in books. Trigger for Section 68 additions @ 78% special tax.`);
    }

    // 2. Unreported Income Discrepancies
    if (params.totalUnreportedIncomeInr > 0) {
      score += 30;
      drivers.push(`PRIMA FACIE ADJUSTMENT: INR ${params.totalUnreportedIncomeInr.toLocaleString('en-IN')} in AIS omitted from ITR. Automatic Section 143(1)(a)(vi) addition trigger.`);
    }

    // 3. TDS Mismatches
    if (params.totalDiscrepancyAmountInr > 50000) {
      score += 15;
      drivers.push(`TDS RECONCILIATION DEFECT: Discrepancies totaling INR ${params.totalDiscrepancyAmountInr.toLocaleString('en-IN')} between gross receipts and 26AS.`);
    }

    // Cap score at 100
    const finalScore = Math.min(100, score);

    let riskTier: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "LOW";
    if (finalScore >= 75) riskTier = "CRITICAL";
    else if (finalScore >= 45) riskTier = "HIGH";
    else if (finalScore >= 20) riskTier = "MODERATE";

    const sec143_1_Risk = params.totalUnreportedIncomeInr > 0 || params.totalDiscrepancyAmountInr > 20000;
    const sec143_1_Demand = Math.round((params.totalUnreportedIncomeInr + params.totalDiscrepancyAmountInr) * 0.312); // 30% tax + 4% cess

    const sec148_Risk = (params.unexplainedCashAmountInr + params.totalUnreportedIncomeInr) >= 5000000;
    const sec148_Escaped = params.unexplainedCashAmountInr + params.totalUnreportedIncomeInr;

    // Generate Pre-Filled AIS Feedback Payloads
    for (const item of params.discrepantItems) {
      let option: AisFeedbackOption = "INFO_CORRECT";
      let remarks = "Offered to tax in ITR computation.";

      if (item.code.includes("SFT-004") || item.code.includes("SFT-001")) {
        option = "INFO_PARTIALLY_CORRECT";
        remarks = "Cash deposits represent business turnover deposited in bank account, duly included in gross receipts of P&L account.";
      } else if (item.code.includes("SFT-017")) {
        option = "INFO_PARTIALLY_CORRECT";
        remarks = "Reported value represents gross sales turnover by stockbroker. Net capital gains computed and returned under Schedule CG.";
      } else if (item.code.includes("194")) {
        option = "INFO_CORRECT";
        remarks = "Income accounted for in Schedule OS / Business income and tax credit claimed in Schedule TDS.";
      }

      payloads.push({
        pan: params.pan,
        financialYear: params.financialYear,
        assessmentYear: params.assessmentYear,
        informationCode: item.code,
        reportingEntity: item.entity,
        reportedAmount: item.reportedAmount,
        feedbackOption: option,
        explanationRemarks: remarks,
        timestamp: new Date().toISOString()
      });
    }

    // Generate Legal Explanation Reply Letter Text & HTML
    const letterDate = new Date().toLocaleDateString("en-IN");
    const letterRef = `CA/RECO/AIS/${params.pan}/${params.assessmentYear.replace(/\s+/g, "_")}`;

    const replyPlainText = `
TO,
THE ASSESSING OFFICER / INVESTIGATION WING,
DIRECTORATE OF SYSTEMS (CBDT INSIGHT PORTAL),
INCOME TAX DEPARTMENT, INDIA.

Subject: Submission of Reconciliation & Clarification in response to Information / e-Verification query in Annual Information Statement (AIS) for Assessment Year ${params.assessmentYear} — In the case of ${params.taxpayerName} (PAN: ${params.pan}).

Respected Sir / Madam,

Reference is made to the information reflected on the AIS / Insight Portal for Assessment Year ${params.assessmentYear}. On behalf of our assessee client, we submit the following factual and legal reconciliation:

1. COMPLIANCE & DECLARATION IN RETURN OF INCOME:
The assessee has maintained proper books of account and disclosed all taxable receipts in accordance with the provisions of the Income-tax Act, 1961. The financial data reflected in the AIS has been audited and reconciled with the financial statements.

2. SPECIFIC RECONCILIATION OF REPORTED TRANSACTIONS:
${params.discrepantItems.map((item, idx) => `
   (${idx + 1}) Information Code: ${item.code} | Reporting Entity: ${item.entity}
       Reported Amount: INR ${item.reportedAmount.toLocaleString('en-IN')}
       Assessee Response: ${item.code.includes("SFT-017") ? "Gross turnover represents share trading transactions. Respective STCG/LTCG computed under Section 111A/112A in Schedule CG." : item.code.includes("SFT-001") || item.code.includes("SFT-004") ? "Cash deposits reflect verified business receipts and past cash balance accounted in regular cash book." : "Income duly considered under Schedule OS / P&L in the Return of Income."}
`).join("")}

3. NO ESCAPEMENT OF INCOME:
In view of the above audited reconciliation, no taxable income has escaped assessment. The reported information stands completely explained and accounted for. We request that the e-Verification query be treated as closed and no adverse inference be drawn under Section 143(1)(a) or Section 148.

Yours faithfully,
For and on behalf of the Assessee,
Authorised Representative / Chartered Accountants
Date: ${letterDate}
Ref: ${letterRef}
    `.trim();

    const replyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; color: #0f172a; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 20px 24px; color: #ffffff;">
          <h2 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #f8fafc;">LEGAL RECONCILIATION IN RESPONSE TO CBDT AIS / E-VERIFICATION QUERY</h2>
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">Ref: ${letterRef} | Date: ${letterDate} | AY: ${params.assessmentYear}</p>
        </div>

        <div style="padding: 24px;">
          <p style="margin: 0 0 16px 0; font-size: 13px;">
            <strong>To,</strong><br/>
            The Assessing Officer / Directorate of Systems (CBDT Insight Portal),<br/>
            Income Tax Department, India.
          </p>

          <p style="margin: 0 0 16px 0; font-size: 13px;">
            <strong>Subject:</strong> Clarification and statutory reconciliation in respect of AIS / 26AS data for <strong>${params.taxpayerName}</strong> (PAN: <code>${params.pan}</code>) for <strong>${params.assessmentYear}</strong>.
          </p>

          <p style="margin: 0 0 16px 0; font-size: 13px; color: #334155;">Respected Sir / Madam,</p>

          <p style="margin: 0 0 16px 0; font-size: 13px; color: #334155;">
            In response to the automated information reflected on the Annual Information Statement (AIS) for the subject assessment year, we respectfully submit the following factual and statutory workpapers:
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align: left;">
                <th style="padding: 8px 10px; border: 1px solid #cbd5e1;">Code</th>
                <th style="padding: 8px 10px; border: 1px solid #cbd5e1;">Reporting Entity</th>
                <th style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right;">Reported (₹)</th>
                <th style="padding: 8px 10px; border: 1px solid #cbd5e1;">Reconciliation &amp; Portal Feedback</th>
              </tr>
            </thead>
            <tbody>
              ${params.discrepantItems.map(item => `
                <tr>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: 700;">${item.code}</td>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${item.entity}</td>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${item.reportedAmount.toLocaleString('en-IN')}</td>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #475569;">${item.code.includes("SFT-017") ? "Gross turnover; net capital gains offered in Schedule CG" : item.code.includes("SFT-004") ? "Substantiated with cash book & past withdrawals" : "Duly offered to tax under Schedule OS / BP"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; margin-bottom: 20px; font-size: 12px; color: #166534;">
            <strong>STATUTORY PRAYER:</strong> All income transactions stand completely explained, reconciled with bank records, and declared in the Return of Income. No income has escaped assessment. We request that the e-Verification inquiry be recorded as satisfactorily explained.
          </div>

          <p style="margin: 20px 0 0 0; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 14px;">
            Submitted by:<br/>
            <strong>Chartered Accountants / Authorized Tax Counsel</strong><br/>
            <em>Digitally verified via Brains &amp; Taxes Practice OS</em>
          </p>
        </div>
      </div>
    `;

    return {
      pan: params.pan,
      assessmentYear: params.assessmentYear,
      rmsScrutinyScore: finalScore,
      scrutinyRiskTier: riskTier,
      sec143_1_AdjustmentRisk: sec143_1_Risk,
      sec143_1_PotentialDemandInr: sec143_1_Demand,
      sec148_ReopeningRisk: sec148_Risk,
      sec148_EscapedIncomeEstimateInr: sec148_Escaped,
      primaryRiskDrivers: drivers,
      feedbackPayloads: payloads,
      statutoryReplyLetterText: replyPlainText,
      statutoryReplyLetterHtml: replyHtml
    };
  }
}
