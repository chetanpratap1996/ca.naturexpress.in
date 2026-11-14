/**
 * Brains & Taxes — Consultative Advisory & Statutory Docket Generator
 * White-Label & Multi-Tenant Aware.
 * 
 * Generates institutional-grade, zero-spam compliance assessments
 * formatted for 1-Click WhatsApp dispatch and Executive Email dockets.
 * 
 * Psychology: Never pitch "We sell CA services."
 * Pitch: "Statutory Compliance Risk Diagnostic for [Company Name]."
 */

import { TargetEntityLead, AdvisoryDocketOutput } from "../types";
import { FirmBrandingConfig, DEFAULT_FIRM_BRANDING } from "../../config/branding";

export function generateAdvisoryDocket(
  lead: TargetEntityLead,
  firmConfig: FirmBrandingConfig = DEFAULT_FIRM_BRANDING
): AdvisoryDocketOutput {
  const companyName = lead.legalName;
  const criticalPoints = lead.painPoints.filter((p) => p.severity === "CRITICAL" || p.severity === "HIGH");
  const directorName = lead.directors.length > 0 ? lead.directors[0].name : "Director";

  // Build Checklist
  const statutoryChecklist: AdvisoryDocketOutput["statutoryChecklist"] = lead.painPoints.map((p) => {
    let authority: 'MCA' | 'GSTN' | 'CBDT' | 'BANK' = 'MCA';
    if (p.ruleCode.startsWith('GST')) authority = 'GSTN';
    else if (p.ruleCode.startsWith('CHARGE')) authority = 'BANK';
    else if (p.ruleCode.startsWith('SEC_43')) authority = 'CBDT';

    return {
      formName: p.title.split('(')[1]?.split(')')[0] || p.title.slice(0, 25),
      authority,
      dueDate: p.statutoryDeadline,
      status: p.daysRemaining < 0 ? 'OVERDUE' : p.daysRemaining <= 7 ? 'CRITICAL' : 'PENDING',
      statutoryCost: p.penaltyInr > 0 ? `₹${p.penaltyInr.toLocaleString('en-IN')}` : 'Statutory Timelines Apply',
    };
  });

  // --------------------------------------------------------------------------
  // 1-Click WhatsApp Advisory Text (Optimized for Mobile Attention)
  // --------------------------------------------------------------------------
  let waText = `*CONFIDENTIAL STATUTORY COMPLIANCE MEMO*\n`;
  waText += `To: The Board of Directors / ${directorName}\n`;
  waText += `Entity: *${companyName}*\n`;
  if (lead.cin) waText += `CIN: \`${lead.cin}\`\n`;
  if (lead.gstin) waText += `GSTIN: \`${lead.gstin}\`\n`;
  waText += `Jurisdiction: ${lead.rocJurisdiction || lead.state}\n\n`;

  waText += `Dear ${directorName},\n`;
  waText += `This is a formal compliance status alert from *${firmConfig.firmName}* (*${firmConfig.companyName}*).\n\n`;

  if (lead.totalPenaltyExposureInr > 0) {
    waText += `⚠️ *Identified Statutory Exposure: ₹${lead.totalPenaltyExposureInr.toLocaleString("en-IN")}*\n\n`;
  }

  waText += `*Key Statutory Triggers & Deadlines Requiring Action:*\n`;
  lead.painPoints.forEach((point, idx) => {
    const icon = point.severity === "CRITICAL" ? "🔴" : point.severity === "HIGH" ? "🟠" : "🔵";
    waText += `${icon} *${idx + 1}. ${point.title}*\n`;
    waText += `   • *Legal Basis:* ${point.legalBasis}\n`;
    waText += `   • *Consequence:* ${point.commercialImpact}\n`;
    waText += `   • *Recommended Action:* ${point.actionPlan}\n\n`;
  });

  waText += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  waText += `🏛️ *Prepared by:* ${firmConfig.managingPartner}\n`;
  waText += `Practice: ${firmConfig.firmName} (ICAI FRN: ${firmConfig.frn})\n`;
  waText += `Registered Office: ${firmConfig.headOffice}\n`;
  waText += `Direct Advisory Helpline: ${firmConfig.partnerPhone}\n`;
  waText += `Reply *'RESOLVE'* or connect on this chat for the complete compliance docket.`;

  // --------------------------------------------------------------------------
  // Formal Executive Email (Subject + Clean HTML)
  // --------------------------------------------------------------------------
  const emailSubject = `Statutory Compliance Risk Diagnostic — ${companyName} (${lead.cin || lead.gstin || "MCA Record"})`;

  let emailBodyHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 680px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0f172a; padding: 24px; color: #ffffff;">
        <h2 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">${firmConfig.firmName}</h2>
        <p style="margin: 0; font-size: 13px; color: #94a3b8;">${firmConfig.companyName} &bull; Practice FRN: ${firmConfig.frn} &bull; CIN: ${firmConfig.cin}</p>
      </div>

      <div style="padding: 24px;">
        <div style="border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
          <span style="display: inline-block; padding: 4px 10px; background-color: #eff6ff; color: #1d4ed8; font-size: 11px; font-weight: 700; border-radius: 9999px; text-transform: uppercase;">Statutory Diagnostic Brief</span>
          <h3 style="margin: 10px 0 4px 0; font-size: 18px; color: #0f172a;">Entity: ${companyName}</h3>
          <p style="margin: 0; font-size: 13px; color: #64748b;">CIN: ${lead.cin || "N/A"} &bull; Location: ${lead.city}, ${lead.state} &bull; Cluster: ${lead.industrialCluster || "Commercial Zone"}</p>
        </div>

        <p style="font-size: 14px; margin-bottom: 16px;">Dear Board of Directors / ${directorName},</p>
        <p style="font-size: 14px; margin-bottom: 20px; color: #334155;">
          Our regulatory surveillance engine has mapped the statutory timeline for <strong>${companyName}</strong> against current MCA21 and GSTN portal records. Below is a factual breakdown of impending obligations and potential commercial friction points.
        </p>

        ${lead.totalPenaltyExposureInr > 0 ? `
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 16px; margin-bottom: 24px; border-radius: 0 6px 6px 0;">
            <div style="font-weight: 700; color: #991b1b; font-size: 14px;">Total Estimated Statutory Exposure: ₹${lead.totalPenaltyExposureInr.toLocaleString('en-IN')}</div>
            <div style="font-size: 12px; color: #b91c1c; margin-top: 2px;">Calculated based on Section 403 / Section 147 compounding daily penalties under Indian corporate law.</div>
          </div>
        ` : ''}

        <h4 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569;">Actionable Findings</h4>
        
        <div style="margin-bottom: 24px;">
          ${lead.painPoints.map((point) => `
            <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; margin-bottom: 12px; background-color: #fafafa;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <strong style="color: #0f172a; font-size: 14px;">${point.title}</strong>
              </div>
              <p style="margin: 6px 0; font-size: 13px; color: #475569;"><strong>Statutory Authority:</strong> ${point.legalBasis}</p>
              <p style="margin: 6px 0; font-size: 13px; color: #dc2626;"><strong>Commercial Consequence:</strong> ${point.commercialImpact}</p>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #0284c7;"><strong>Recommended Action:</strong> ${point.actionPlan}</p>
            </div>
          `).join('')}
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-top: 24px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #0f172a;">Next Steps with ${firmConfig.firmShortName}</h4>
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #475569;">
            To resolve these statutory flags and secure your company's banking and GST credentials, you can coordinate directly with our managing partner desk:
          </p>
          <p style="margin: 0; font-size: 13px; color: #0f172a;">
            <strong>${firmConfig.managingPartner}</strong> &bull; Direct: ${firmConfig.partnerPhone} &bull; Email: ${firmConfig.email}
          </p>
        </div>
      </div>

      <div style="background-color: #f1f5f9; padding: 16px 24px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 4px 0;">This communication is an informational statutory audit report by ${firmConfig.companyName} in technical collaboration with ${firmConfig.firmName}.</p>
        <p style="margin: 0;">Registered Office: ${firmConfig.headOffice}</p>
      </div>
    </div>
  `;

  return {
    leadId: lead.id,
    companyName,
    whatsappAdvisoryText: waText,
    emailSubject,
    emailBodyHtml,
    statutoryChecklist,
  };
}
