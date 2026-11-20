/**
 * Firm Billing, Pure Agent Disbursements & Pay-to-Release File Lock Sentinel
 * 
 * Statutory Authority:
 * - Rule 33 of CGST Rules, 2017: Value of supply of services in case of pure agent (disbursements like ROC challans, stamp duty exempt from GST)
 * - Section 194J Income Tax Act, 1961: TDS on professional fees (10% / 2%)
 * - Pay-to-Release File Lock Sentinel: Encrypts/locks client report downloads if professional fees are unpaid past statutory due date
 */

export interface BillableWipItem {
  id: string;
  clientName: string;
  clientPan: string;
  engagementType: 'STATUTORY_AUDIT' | 'TAX_AUDIT_44AB' | 'GSTR_9_9C' | 'COMPANY_ROC_AOC4' | 'LITIGATION_APPEAL';
  partnerHours: number;
  partnerRatePerHour: number;
  managerHours: number;
  managerRatePerHour: number;
  articleHours: number;
  articleRatePerHour: number;
  pureAgentDisbursements: {
    description: string;
    challanOrGovtReceiptNo: string;
    amount: number;
  }[];
  invoiceRaised: boolean;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  paymentStatus: 'PAID' | 'PAYMENT_PENDING' | 'OVERDUE_LOCKED';
  fileLockActive: boolean;
  lockedDocumentRefs: string[];
}

export interface ComputedInvoiceBreakdown {
  professionalFees: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGst: number;
  pureAgentDisbursementsTotal: number;
  grossInvoiceValue: number;
  tdsDeductibleSec194J: number; // 10% on professional fees
  netReceivableFromClient: number;
  isInterState: boolean;
}

export class FirmBillingRecoveryEngine {
  /**
   * Computes GST (18%) and Rule 33 Pure Agent breakdown
   */
  public static computeInvoice(
    wip: BillableWipItem,
    isInterState: boolean = false,
    tdsRatePct: number = 10
  ): ComputedInvoiceBreakdown {
    const profFees = 
      (wip.partnerHours * wip.partnerRatePerHour) +
      (wip.managerHours * wip.managerRatePerHour) +
      (wip.articleHours * wip.articleRatePerHour);

    const disbursements = wip.pureAgentDisbursements.reduce((sum, d) => sum + d.amount, 0);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
      igst = Math.round(profFees * 0.18);
    } else {
      cgst = Math.round(profFees * 0.09);
      sgst = Math.round(profFees * 0.09);
    }
    const totalGst = isInterState ? igst : (cgst + sgst);

    const grossValue = profFees + totalGst + disbursements;
    const tdsAmount = Math.round(profFees * (tdsRatePct / 100));
    const netReceivable = grossValue - tdsAmount;

    return {
      professionalFees: profFees,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      totalGst,
      pureAgentDisbursementsTotal: disbursements,
      grossInvoiceValue: grossValue,
      tdsDeductibleSec194J: tdsAmount,
      netReceivableFromClient: netReceivable,
      isInterState
    };
  }

  /**
   * Evaluates Pay-to-Release Sentinel: Locks file downloads if payment is overdue
   */
  public static evaluatePayToReleaseLocks(
    items: BillableWipItem[],
    asOfDateStr: string = '2026-11-20'
  ): {
    totalWipValue: number;
    totalReceivable: number;
    lockedDocumentsCount: number;
    overdueInvoicesCount: number;
  } {
    const asOf = new Date(asOfDateStr);
    let totalWip = 0;
    let totalRec = 0;
    let lockedCount = 0;
    let overdueCount = 0;

    items.forEach(item => {
      const breakdown = this.computeInvoice(item);
      totalWip += breakdown.professionalFees;
      if (item.paymentStatus !== 'PAID') {
        totalRec += breakdown.netReceivableFromClient;
      }

      if (item.dueDate && item.paymentStatus !== 'PAID') {
        const due = new Date(item.dueDate);
        if (asOf.getTime() > due.getTime()) {
          item.paymentStatus = 'OVERDUE_LOCKED';
          item.fileLockActive = true;
          overdueCount++;
          lockedCount += item.lockedDocumentRefs.length;
        } else {
          item.fileLockActive = false;
        }
      } else {
        item.fileLockActive = false;
      }
    });

    return {
      totalWipValue: totalWip,
      totalReceivable: totalRec,
      lockedDocumentsCount: lockedCount,
      overdueInvoicesCount: overdueCount
    };
  }
}

export const SAMPLE_WIP_ITEMS: BillableWipItem[] = [
  {
    id: 'WIP-01',
    clientName: 'Pratwi Solutions Private Limited',
    clientPan: 'AABCP9182K',
    engagementType: 'STATUTORY_AUDIT',
    partnerHours: 12,
    partnerRatePerHour: 5000,
    managerHours: 35,
    managerRatePerHour: 2000,
    articleHours: 85,
    articleRatePerHour: 600,
    pureAgentDisbursements: [
      {
        description: 'MCA ROC Annual Filing Fee (Form AOC-4 / MGT-7)',
        challanOrGovtReceiptNo: 'MCA-SRN-T81920194',
        amount: 1200
      },
      {
        description: 'Independent Actuarial Valuation Certificate Fee',
        challanOrGovtReceiptNo: 'INV-ACT-2026-08',
        amount: 25000
      }
    ],
    invoiceRaised: true,
    invoiceNumber: 'INV-2026-042',
    invoiceDate: '2026-10-15',
    dueDate: '2026-11-05', // Past due -> OVERDUE_LOCKED!
    paymentStatus: 'OVERDUE_LOCKED',
    fileLockActive: true,
    lockedDocumentRefs: [
      'Statutory_Audit_Report_Signed_FY2526.pdf',
      'Form_3CD_Tax_Audit_Report_Final.xml',
      'Schedule_III_Audited_Financials.xlsx'
    ]
  },
  {
    id: 'WIP-02',
    clientName: 'Singhania Logistics Ltd',
    clientPan: 'AALCS9182F',
    engagementType: 'GSTR_9_9C',
    partnerHours: 8,
    partnerRatePerHour: 5000,
    managerHours: 20,
    managerRatePerHour: 2000,
    articleHours: 40,
    articleRatePerHour: 600,
    pureAgentDisbursements: [
      {
        description: 'GST DRC-03 Voluntary Payment Challan u/s 73(5)',
        challanOrGovtReceiptNo: 'GSTN-CPIN-991820192',
        amount: 45000
      }
    ],
    invoiceRaised: true,
    invoiceNumber: 'INV-2026-048',
    invoiceDate: '2026-11-10',
    dueDate: '2026-11-30', // Not yet overdue
    paymentStatus: 'PAYMENT_PENDING',
    fileLockActive: false,
    lockedDocumentRefs: [
      'GSTR9C_Audit_Certification_Pack.pdf'
    ]
  },
  {
    id: 'WIP-03',
    clientName: 'Apex Machinery Distributors Pvt Ltd',
    clientPan: 'AALCA8912P',
    engagementType: 'TAX_AUDIT_44AB',
    partnerHours: 10,
    partnerRatePerHour: 5000,
    managerHours: 25,
    managerRatePerHour: 2000,
    articleHours: 60,
    articleRatePerHour: 600,
    pureAgentDisbursements: [],
    invoiceRaised: true,
    invoiceNumber: 'INV-2026-039',
    invoiceDate: '2026-09-30',
    dueDate: '2026-10-20',
    paymentStatus: 'PAID',
    fileLockActive: false,
    lockedDocumentRefs: []
  }
];
