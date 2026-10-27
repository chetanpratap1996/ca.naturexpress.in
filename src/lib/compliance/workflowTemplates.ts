import type { ComplianceCategory } from "@/lib/types";

/** Starter checklists for creating an engagement. Firm users should tailor each list to the engagement. */
export interface ComplianceWorkflowTemplate {
  id: string;
  label: string;
  category: ComplianceCategory;
  title: string;
  requestedDocuments: string[];
}

export const COMPLIANCE_WORKFLOW_TEMPLATES: ComplianceWorkflowTemplate[] = [
  {
    id: "GST_GSTR1",
    label: "GST · GSTR-1",
    category: "GST",
    title: "GSTR-1 preparation and filing",
    requestedDocuments: ["Sales register for the period", "Credit/debit note details", "Export and e-commerce sales details (if applicable)"],
  },
  {
    id: "GST_GSTR3B",
    label: "GST · GSTR-3B",
    category: "GST",
    title: "GSTR-3B preparation and filing",
    requestedDocuments: ["Purchase register for the period", "GSTR-2B / IMS review inputs", "Tax payment challan (if already paid)"],
  },
  {
    id: "TDS_RETURN",
    label: "TDS · Return preparation",
    category: "TDS",
    title: "TDS return preparation and filing",
    requestedDocuments: ["Deductee-wise TDS working", "Challan payment details", "PAN details for new or changed deductees"],
  },
];

export function getWorkflowTemplate(templateId: string) {
  return COMPLIANCE_WORKFLOW_TEMPLATES.find((template) => template.id === templateId);
}
