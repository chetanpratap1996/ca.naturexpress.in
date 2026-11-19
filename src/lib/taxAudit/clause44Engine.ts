/**
 * Brains & Taxes — Enterprise Form 3CD Clause 44 (GST Expenditure Breakdown) Engine
 * 
 * Statutory Authority:
 * - Clause 44 of Form 3CD under Section 44AB of the Income-tax Act, 1961
 * - ICAI Guidance Note on Tax Audit under Section 44AB (Revised Edition 2023)
 * - Schedule III to the Central Goods and Services Tax Act, 2017: Activities which shall be treated neither as supply of goods nor services
 */

export interface ExpenseLedgerItem {
  id: string;
  ledgerName: string;
  accountHead: string; // e.g. "Raw Materials", "Freight", "Salaries", "Depreciation", "Legal Fees"
  totalExpenditureInr: number;
  
  // Statutory Attributes
  vendorGstin?: string;
  vendorTradeName?: string;
  gstRegistrationType: "REGISTERED_REGULAR" | "COMPOSITION" | "EXEMPT_NIL_RATED" | "UNREGISTERED" | "NON_SUPPLY_ICAI_EXCLUSION";
  isSalaryOrStaffWelfare?: boolean;  // Schedule III CGST non-supply
  isDepreciationOrProvision?: boolean; // Book entry / non-expenditure
  isDirectTaxOrStatutoryDuty?: boolean; // Direct tax
  hsnOrSacCode?: string;
}

export interface Clause44Row {
  sNo: number;
  natureOfExpenditure: string;
  totalExpenditureInr_Col2: number;
  exemptSuppliesInr_Col3: number;
  compositionEntitiesInr_Col4: number;
  otherRegisteredEntitiesInr_Col5: number;
  totalRegisteredEntitiesInr_Col6: number; // Col 3 + Col 4 + Col 5
  unregisteredEntitiesInr_Col7: number;
  reconciliationNotes: string;
}

export interface Clause44Report {
  assesseeName: string;
  pan: string;
  financialYear: string;
  assessmentYear: string;
  
  summary: {
    totalGrossBookExpenditureInr: number;
    totalIcaiGuidanceExclusionsInr: number; // Salaries + Depreciation + Provisions
    totalQualifyingOperatingExpenditure_Col2: number;
    
    totalExemptSupplies_Col3: number;
    totalComposition_Col4: number;
    totalStandardRegistered_Col5: number;
    totalRegisteredEntities_Col6: number;
    totalUnregisteredEntities_Col7: number;
    
    percentageGstRegistered: number; // Col 6 / Col 2
    percentageUnregistered: number;  // Col 7 / Col 2
    isMathematicallyBalanced: boolean; // Col 6 + Col 7 == Col 2
  };

  icaiExclusionBreakdown: {
    salariesAndWagesScheduleIIIInr: number;
    depreciationAndAmortizationInr: number;
    provisionsAndBadDebtsInr: number;
    directTaxesInr: number;
  };

  rows: Clause44Row[];
}

export class Clause44Engine {
  /**
   * Classifies ledgers and generates official Form 3CD Clause 44 report
   */
  public static generateClause44(params: {
    assesseeName: string;
    pan: string;
    financialYear: string;
    assessmentYear: string;
    ledgers: ExpenseLedgerItem[];
  }): Clause44Report {
    let grossBookExp = 0;
    let salaryExcl = 0;
    let deprExcl = 0;
    let provExcl = 0;
    let taxExcl = 0;

    let col2Total = 0;
    let col3Total = 0;
    let col4Total = 0;
    let col5Total = 0;
    let col7Total = 0;

    const rows: Clause44Row[] = [];

    // Group ledgers by Account Head
    const grouped = new Map<string, ExpenseLedgerItem[]>();
    for (const l of params.ledgers) {
      grossBookExp += l.totalExpenditureInr;

      // Check ICAI Guidance Note Exclusions
      if (l.isSalaryOrStaffWelfare || l.accountHead.toLowerCase().includes("salary") || l.accountHead.toLowerCase().includes("wages")) {
        salaryExcl += l.totalExpenditureInr;
        continue;
      }
      if (l.isDepreciationOrProvision || l.accountHead.toLowerCase().includes("depreciation") || l.accountHead.toLowerCase().includes("amortisation")) {
        deprExcl += l.totalExpenditureInr;
        continue;
      }
      if (l.accountHead.toLowerCase().includes("provision") || l.accountHead.toLowerCase().includes("bad debt") || l.accountHead.toLowerCase().includes("forex loss")) {
        provExcl += l.totalExpenditureInr;
        continue;
      }
      if (l.isDirectTaxOrStatutoryDuty || l.accountHead.toLowerCase().includes("income tax") || l.accountHead.toLowerCase().includes("advance tax")) {
        taxExcl += l.totalExpenditureInr;
        continue;
      }

      if (!grouped.has(l.accountHead)) {
        grouped.set(l.accountHead, []);
      }
      grouped.get(l.accountHead)!.push(l);
    }

    let sNo = 1;
    for (const [head, items] of grouped.entries()) {
      let headTotal = 0;
      let headCol3 = 0;
      let headCol4 = 0;
      let headCol5 = 0;
      let headCol7 = 0;

      for (const item of items) {
        headTotal += item.totalExpenditureInr;

        if (item.gstRegistrationType === "EXEMPT_NIL_RATED") {
          headCol3 += item.totalExpenditureInr;
        } else if (item.gstRegistrationType === "COMPOSITION") {
          headCol4 += item.totalExpenditureInr;
        } else if (item.gstRegistrationType === "REGISTERED_REGULAR") {
          headCol5 += item.totalExpenditureInr;
        } else {
          // Default unregistered
          headCol7 += item.totalExpenditureInr;
        }
      }

      const headCol6 = headCol3 + headCol4 + headCol5;

      col2Total += headTotal;
      col3Total += headCol3;
      col4Total += headCol4;
      col5Total += headCol5;
      col7Total += headCol7;

      rows.push({
        sNo: sNo++,
        natureOfExpenditure: head,
        totalExpenditureInr_Col2: Math.round(headTotal * 100) / 100,
        exemptSuppliesInr_Col3: Math.round(headCol3 * 100) / 100,
        compositionEntitiesInr_Col4: Math.round(headCol4 * 100) / 100,
        otherRegisteredEntitiesInr_Col5: Math.round(headCol5 * 100) / 100,
        totalRegisteredEntitiesInr_Col6: Math.round(headCol6 * 100) / 100,
        unregisteredEntitiesInr_Col7: Math.round(headCol7 * 100) / 100,
        reconciliationNotes: headCol6 === headTotal 
          ? "100% procured from GST registered suppliers." 
          : headCol7 > 0 
          ? `INR ${headCol7.toLocaleString('en-IN')} procured from unregistered vendors.`
          : "Reconciled with purchase vouchers."
      });
    }

    const col6Total = col3Total + col4Total + col5Total;
    const totalExclusions = salaryExcl + deprExcl + provExcl + taxExcl;
    const pctRegistered = col2Total > 0 ? Math.round((col6Total / col2Total) * 10000) / 100 : 0;
    const pctUnregistered = col2Total > 0 ? Math.round((col7Total / col2Total) * 10000) / 100 : 0;
    const isBalanced = Math.abs((col6Total + col7Total) - col2Total) < 0.01;

    return {
      assesseeName: params.assesseeName,
      pan: params.pan,
      financialYear: params.financialYear,
      assessmentYear: params.assessmentYear,
      summary: {
        totalGrossBookExpenditureInr: Math.round(grossBookExp * 100) / 100,
        totalIcaiGuidanceExclusionsInr: Math.round(totalExclusions * 100) / 100,
        totalQualifyingOperatingExpenditure_Col2: Math.round(col2Total * 100) / 100,
        totalExemptSupplies_Col3: Math.round(col3Total * 100) / 100,
        totalComposition_Col4: Math.round(col4Total * 100) / 100,
        totalStandardRegistered_Col5: Math.round(col5Total * 100) / 100,
        totalRegisteredEntities_Col6: Math.round(col6Total * 100) / 100,
        totalUnregisteredEntities_Col7: Math.round(col7Total * 100) / 100,
        percentageGstRegistered: pctRegistered,
        percentageUnregistered: pctUnregistered,
        isMathematicallyBalanced: isBalanced
      },
      icaiExclusionBreakdown: {
        salariesAndWagesScheduleIIIInr: Math.round(salaryExcl * 100) / 100,
        depreciationAndAmortizationInr: Math.round(deprExcl * 100) / 100,
        provisionsAndBadDebtsInr: Math.round(provExcl * 100) / 100,
        directTaxesInr: Math.round(taxExcl * 100) / 100
      },
      rows
    };
  }
}
