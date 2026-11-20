/**
 * Multi-Window MDI (Multiple Document Interface) Tabbed Desktop Manager
 * 
 * Capability:
 * - Allows Chartered Accountants to multitask across multiple client engagements simultaneously
 * - Maintains active form state, scroll position, and open subtabs in memory without page refreshes
 * - Provides fast hotkey switching (Alt+1, Alt+2, Alt+3) and split-screen viewing
 */

export interface MdiClientTab {
  id: string;
  clientPan: string;
  clientName: string;
  module: 'TAX_AUDIT_3CD' | 'GSTR_3B_IMS' | 'MCA_ROC_AOC4' | 'BANK_AUDIT_LFAR' | 'TALLY_SYNC_BRIDGE';
  title: string;
  isDirty: boolean; // Has unsaved changes
  lastActiveTimestamp: number;
  draftState: Record<string, any>;
}

export class MdiDesktopManager {
  /**
   * Initializes default MDI tabs for a busy CA firm session
   */
  public static getInitialTabs(): MdiClientTab[] {
    return [
      {
        id: 'TAB-01',
        clientPan: 'AABCP9182K',
        clientName: 'Pratwi Solutions Private Limited',
        module: 'TAX_AUDIT_3CD',
        title: 'Pratwi Solutions - Form 3CD Audit',
        isDirty: true,
        lastActiveTimestamp: Date.now(),
        draftState: {
          activeClause: 'Clause 44 (GST Breakdown)',
          unreconciledDifference: 145000
        }
      },
      {
        id: 'TAB-02',
        clientPan: 'AALCS9182F',
        clientName: 'Singhania Logistics Ltd',
        module: 'GSTR_3B_IMS',
        title: 'Singhania Logistics - GST IMS Desk',
        isDirty: false,
        lastActiveTimestamp: Date.now() - 15 * 60 * 1000,
        draftState: {
          pendingInvoicesCount: 14,
          itcEligible: 840500
        }
      },
      {
        id: 'TAB-03',
        clientPan: 'AALCA8912P',
        clientName: 'Apex Machinery Distributors Pvt Ltd',
        module: 'MCA_ROC_AOC4',
        title: 'Apex Machinery - AOC-4 XBRL Filing',
        isDirty: false,
        lastActiveTimestamp: Date.now() - 45 * 60 * 1000,
        draftState: {
          srnNumber: 'SRN-MCA-V3-918204'
        }
      }
    ];
  }
}
