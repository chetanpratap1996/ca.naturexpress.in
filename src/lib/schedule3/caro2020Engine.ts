// ============================================================================
// CARO 2020 (COMPANIES (AUDITOR'S REPORT) ORDER, 2020) VERIFICATION ENGINE
// Order under Section 143(11) of the Companies Act, 2013 & ICAI Guidance Note
// ============================================================================

export type CaroClauseCategory = 
  | "PPE_AND_ASSETS"
  | "INVENTORIES_AND_WORKING_CAPITAL"
  | "LOANS_AND_INVESTMENTS"
  | "REGULATORY_COMPLIANCE"
  | "STATUTORY_DUES"
  | "BORROWINGS_AND_DEFAULT"
  | "FRAUD_AND_GOVERNANCE"
  | "FINANCIAL_HEALTH_AND_GOING_CONCERN"
  | "GROUP_AND_CFS";

export type CaroClauseStatus = 
  | "COMPLIANT_UNQUALIFIED" 
  | "QUALIFIED_ATTENTION_REQUIRED" 
  | "ADVERSE_REMARK" 
  | "NOT_APPLICABLE";

export interface CaroClauseSubItem {
  subClauseKey: string; // e.g. "i(a)(A)", "ii(b)", "vii(a)"
  subClauseTitle: string;
  requirement: string;
  status: CaroClauseStatus;
  findingDetails: string;
  auditorRemarks: string;
  isAutomatedRule: boolean;
  workpaperRef?: string;
  dataSchedule?: any;
}

export interface CaroClauseReport {
  clauseNumber: string; // e.g. "Clause (i)", "Clause (ii)"
  title: string;
  category: CaroClauseCategory;
  statutoryRef: string;
  primaryRequirement: string;
  status: CaroClauseStatus;
  partnerSignedOff: boolean;
  signedOffBy?: string;
  signedOffAt?: string;
  subItems: CaroClauseSubItem[];
  synthesizedReportingText: string;
}

export interface CaroAuditEngineResult {
  clientName: string;
  cin: string;
  financialYear: string;
  assessmentYear: string;
  isConsolidated: boolean;
  totalClauses: number;
  unqualifiedCount: number;
  qualifiedCount: number;
  adverseCount: number;
  notApplicableCount: number;
  partnerSignOffProgress: number; // percentage 0-100
  overallRiskRating: "LOW" | "MEDIUM" | "HIGH_ATTENTION_REQUIRED";
  clauses: CaroClauseReport[];
  annexureDraftMarkdown: string;
}

export interface QuarterlyBankStatementItem {
  quarter: "Q1_JUN" | "Q2_SEP" | "Q3_DEC" | "Q4_MAR";
  quarterLabel: string;
  lendingBank: string;
  sanctionedLimitInr: number;
  bookStockInr: number;
  statementStockInr: number;
  bookDebtorsInr: number;
  statementDebtorsInr: number;
  varianceInr: number;
  variancePercent: number;
  isDiscrepancyMaterial: boolean; // > 5% or > ₹10 Lakhs
  explanationByManagement: string;
  auditorRemarks: string;
}

export interface UndisputedStatutoryDueItem {
  statutoryHead: string; // e.g. "GST", "PF", "ESI", "Income Tax (TDS)", "Customs Duty"
  amountInr: number;
  dueSinceDate: string;
  statutoryDueDate: string;
  delayMonths: number;
  isExceeding6Months: boolean;
  forumOrAuthority: string;
  isDisputed: boolean;
}

// ----------------------------------------------------------------------------
// DEFAULT 21 CARO 2020 CLAUSES MASTER MATRIX WITH ICAI REPORTING TEMPLATES
// ----------------------------------------------------------------------------
export const DEFAULT_CARO_2020_CLAUSES: CaroClauseReport[] = [
  // --------------------------------------------------------------------------
  // CLAUSE (i): Property, Plant & Equipment and Intangible Assets
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (i)",
    title: "Property, Plant & Equipment and Intangible Assets",
    category: "PPE_AND_ASSETS",
    statutoryRef: "CARO 2020 Paragraph 3(i) & Section 143(11)",
    primaryRequirement: "Records, physical verification, title deeds not held in company name, revaluation, and Benami property proceedings.",
    status: "COMPLIANT_UNQUALIFIED",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "i(a)(A)",
        subClauseTitle: "Proper Records of PP&E",
        requirement: "Whether company is maintaining proper records showing full particulars, including quantitative details and situation of PP&E.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Fixed Asset Register maintained in ERP with asset tags, unique identifiers, location codes, and historical cost reconciliations.",
        auditorRemarks: "The Company has maintained proper records showing full particulars, including quantitative details and situation of Property, Plant and Equipment.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-01A-FAR"
      },
      {
        subClauseKey: "i(a)(B)",
        subClauseTitle: "Proper Records of Intangibles",
        requirement: "Whether company is maintaining proper records showing full particulars of intangible assets.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Intangibles schedule verified: Enterprise ERP software licenses and patented design blueprints documented with finite useful lives.",
        auditorRemarks: "The Company has maintained proper records showing full particulars of intangible assets.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-01B-INTANG"
      },
      {
        subClauseKey: "i(b)",
        subClauseTitle: "Physical Verification Program",
        requirement: "Whether PP&E have been physically verified by management at reasonable intervals; whether any material discrepancies were noticed.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Management conducted 100% physical verification of plant machinery and vehicles in January 2026. Discrepancies were nominal (<0.1%) and written off in P&L.",
        auditorRemarks: "PP&E have been physically verified by the management pursuant to a phased program covering all assets over a period of three years, which in our opinion is reasonable. No material discrepancies were noticed on such verification.",
        isAutomatedRule: false,
        workpaperRef: "WP-CARO-01C-PV-REPORT"
      },
      {
        subClauseKey: "i(c)",
        subClauseTitle: "Title Deeds of Immovable Property",
        requirement: "Whether title deeds of all immovable properties (other than properties where company is lessee and lease agreements are duly executed) disclosed in financial statements are held in the name of the company.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Freehold factory land at Pithampur (Khasra No 412/1) registered in name of company. Registered sale deed verified with certified land registry search report.",
        auditorRemarks: "According to the information and explanations given to us and on the basis of our examination of the records of the Company, the title deeds of all immovable properties disclosed in the financial statements are held in the name of the Company.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-01D-TITLE-DEEDS"
      },
      {
        subClauseKey: "i(d)",
        subClauseTitle: "Revaluation of PP&E by Registered Valuer",
        requirement: "Whether company has revalued its PP&E (including ROU assets) or intangible assets; whether revaluation is based on Registered Valuer valuation; specify amount of change if >= 10%.",
        status: "NOT_APPLICABLE",
        findingDetails: "Company has opted for Cost Model under AS 10 / Ind AS 16. No revaluation undertaken during the financial year.",
        auditorRemarks: "The Company has not revalued its Property, Plant and Equipment (including Right of Use assets) or intangible assets during the year. Accordingly, the reporting under Clause 3(i)(d) is not applicable.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-01E-REVAL"
      },
      {
        subClauseKey: "i(e)",
        subClauseTitle: "Benami Property Proceedings",
        requirement: "Whether any proceedings have been initiated or are pending against the company for holding any benami property under Prohibition of Benami Property Transactions Act, 1988.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Written representation obtained from Board of Directors. No notices received u/s 24 of PBPT Act 1988 from Initiating Officer / Adjudicating Authority.",
        auditorRemarks: "Based on the information and explanations provided and representations obtained, no proceedings have been initiated or are pending against the Company for holding any benami property under the Prohibition of Benami Property Transactions Act, 1988 and rules made thereunder.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-01F-BENAMI-REP"
      }
    ],
    synthesizedReportingText: "In our opinion and according to the information and explanations given to us, the Company has maintained proper records of PP&E and intangible assets. Physical verification was conducted by the management at reasonable intervals and no material discrepancies were noticed. The title deeds of immovable properties are held in the name of the Company. The Company has not revalued its assets, and no proceedings are initiated or pending under the Benami Transactions Act."
  },

  // --------------------------------------------------------------------------
  // CLAUSE (ii): Inventory & Working Capital
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (ii)",
    title: "Inventory & Working Capital Quarterly Statements",
    category: "INVENTORIES_AND_WORKING_CAPITAL",
    statutoryRef: "CARO 2020 Paragraph 3(ii) & Schedule III",
    primaryRequirement: "Physical verification of inventory coverage, discrepancies >= 10%, and reconciliation of quarterly bank statements for facilities > ₹5 Crore.",
    status: "COMPLIANT_UNQUALIFIED",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "ii(a)",
        subClauseTitle: "Physical Verification of Inventory",
        requirement: "Whether physical verification of inventory has been conducted at reasonable intervals by management; whether coverage and procedure of such verification is appropriate; whether discrepancies >= 10% in aggregate for each class.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Year-end physical count of raw materials, WIP, and finished goods attended by audit team at main plant. Discrepancy observed was 0.42% (below 10% threshold).",
        auditorRemarks: "The inventory has been physically verified by the management during the year. In our opinion, the coverage and procedure of such verification is appropriate. No discrepancies of 10% or more in the aggregate for each class of inventory were noticed on physical verification.",
        isAutomatedRule: false,
        workpaperRef: "WP-CARO-02A-INVENTORY-PV"
      },
      {
        subClauseKey: "ii(b)",
        subClauseTitle: "Quarterly Returns/Statements to Banks (> ₹5 Cr Limit)",
        requirement: "Whether company has been sanctioned working capital limits in excess of five crore rupees from banks or FIs on security of current assets; whether quarterly statements filed match books of account.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Working capital facility of ₹12.50 Cr sanctioned by HDFC Bank Consortium against hypothecation of stock and book debts. All 4 quarterly statements reconciled with books; net variances were <1.5% due to cut-off timing differences.",
        auditorRemarks: "The Company has been sanctioned working capital limits in excess of ₹5 crore in aggregate from banks on the basis of security of current assets. The quarterly returns/statements filed by the Company with such banks are in agreement with the books of account of the Company.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-02B-BANK-STMT-REC"
      }
    ],
    synthesizedReportingText: "In our opinion, inventory has been physically verified at reasonable intervals with appropriate procedures, and discrepancies did not exceed 10%. The quarterly statements filed with banks for sanctioned working capital limits exceeding ₹5 crore are in agreement with the audited books of account."
  },

  // --------------------------------------------------------------------------
  // CLAUSE (iii): Loans, Investments, Guarantees & Securities Granted
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (iii)",
    title: "Investments, Guarantees, Securities, Loans & Advances",
    category: "LOANS_AND_INVESTMENTS",
    statutoryRef: "CARO 2020 Paragraph 3(iii) & Section 189",
    primaryRequirement: "Investments, guarantees, securities, loans or advances granted; terms not prejudicial; overdue > 90 days; renewals/evergreening; loans repayable on demand.",
    status: "COMPLIANT_UNQUALIFIED",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "iii(a)",
        subClauseTitle: "Aggregate Amount & Balance of Loans/Guarantees",
        requirement: "Reporting of aggregate amount granted during the year and balance outstanding at balance sheet date to subsidiaries/JVs/associates and to other parties.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Inter-corporate deposit of ₹45,00,000 granted to wholly-owned subsidiary Apex Engineering Components Ltd at 9.5% p.a. interest. Closing balance: ₹45,00,000.",
        auditorRemarks: "The Company has granted unsecured loans to its subsidiary during the year: Aggregate amount granted during year: ₹45.00 Lakhs; Balance outstanding as at 31st March: ₹45.00 Lakhs. No loans were granted to parties other than subsidiaries.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-03A-LOANS-SCHEDULE"
      },
      {
        subClauseKey: "iii(b)",
        subClauseTitle: "Terms and Conditions not Prejudicial",
        requirement: "Whether investments made, guarantees provided, security given and terms and conditions of grant of all loans are not prejudicial to company's interest.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Interest rate charged (9.50% p.a.) is higher than SBI 1-year MCLR + 150 bps. Repayment terms structured with quarterly interest servicing.",
        auditorRemarks: "In our opinion and according to the information and explanations given to us, the terms and conditions of the grant of loans are not prejudicial to the Company's interest.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-03B-TERMS-TEST"
      },
      {
        subClauseKey: "iii(c)",
        subClauseTitle: "Schedule of Repayment & Regularity",
        requirement: "In respect of loans and advances in the nature of loans, whether schedule of repayment of principal and payment of interest has been stipulated and repayments or receipts are regular.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Loan agreement stipulates bullet repayment after 24 months with monthly interest servicing. All monthly interest debits cleared on time.",
        auditorRemarks: "The schedule of repayment of principal and payment of interest has been stipulated and repayments or receipts are regular.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-03C-REPAYMENT-SCHED"
      },
      {
        subClauseKey: "iii(d)",
        subClauseTitle: "Overdue Amount Exceeding 90 Days",
        requirement: "If the amount is overdue, whether it is more than ninety days, and whether reasonable steps have been taken by the company for recovery.",
        status: "NOT_APPLICABLE",
        findingDetails: "No amounts are overdue in respect of loans or advances granted. All accounts current.",
        auditorRemarks: "There are no overdue amounts in respect of loans or advances in the nature of loans granted. Accordingly, reporting under Clause 3(iii)(d) is not applicable.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-03D-OVERDUE-CHECK"
      },
      {
        subClauseKey: "iii(e)",
        subClauseTitle: "Renewal, Extension or Evergreening of Loans",
        requirement: "Whether any loan granted has fallen due during the year, has been renewed or extended or fresh loans granted to settle the overdues of existing loans.",
        status: "NOT_APPLICABLE",
        findingDetails: "No loans fell due for repayment during the year that were renewed or evergreen.",
        auditorRemarks: "No loan or advance in the nature of loan granted by the Company has fallen due during the year and has been renewed, extended or fresh loans granted to settle overdues.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-03E-RENEWALS"
      },
      {
        subClauseKey: "iii(f)",
        subClauseTitle: "Loans Repayable on Demand / Without Terms",
        requirement: "Whether company has granted any loans or advances in the nature of loans either repayable on demand or without specifying any terms or period of repayment; specify percentage to total loans.",
        status: "NOT_APPLICABLE",
        findingDetails: "All loans granted have stipulated maturity dates and interest terms. Zero demand loans.",
        auditorRemarks: "The Company has not granted any loans or advances in the nature of loans either repayable on demand or without specifying any terms or period of repayment.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-03F-DEMAND-LOANS"
      }
    ],
    synthesizedReportingText: "The Company has granted an unsecured loan of ₹45.00 Lakhs to its subsidiary. The terms and conditions are not prejudicial to the interest of the Company. Repayments and receipts of interest are regular, with no overdue amounts exceeding 90 days. No loans were renewed, extended, or granted repayable on demand."
  },

  // --------------------------------------------------------------------------
  // CLAUSE (iv): Compliance with Sections 185 and 186
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (iv)",
    title: "Loans to Directors & Investments (Sec 185 & 186)",
    category: "REGULATORY_COMPLIANCE",
    statutoryRef: "Sections 185 & 186 of Companies Act, 2013",
    primaryRequirement: "Compliance with Section 185 (prohibition/restrictions on loans to directors) and Section 186 (limits and conditions for loans, guarantees, and investments).",
    status: "COMPLIANT_UNQUALIFIED",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "iv(a)",
        subClauseTitle: "Section 185 Compliance",
        requirement: "No loans, advances, guarantees, or security given directly or indirectly to directors or entities in which directors are interested, except under statutory exemptions.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "No loans or guarantees granted to directors or firms/companies where directors hold 25%+ voting power. Statutory register MBP-2 verified.",
        auditorRemarks: "In our opinion and according to the information and explanations given to us, the Company has complied with the provisions of Section 185 of the Act.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-04A-SEC185"
      },
      {
        subClauseKey: "iv(b)",
        subClauseTitle: "Section 186 Limits & Approvals",
        requirement: "Loans, guarantees, and securities within limits of 60% of paid-up capital + free reserves or 100% of free reserves; special resolution passed if exceeding limits.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Aggregate loans & investments: ₹1.85 Cr, which is within the 60% limit of ₹4.20 Cr. Board resolution passed unanimously u/s 186(5).",
        auditorRemarks: "The Company has complied with the provisions of Section 186 of the Companies Act, 2013 in respect of loans, investments, guarantees and securities.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-04B-SEC186"
      }
    ],
    synthesizedReportingText: "In our opinion and according to the information and explanations given to us, the Company has complied with the provisions of Sections 185 and 186 of the Companies Act, 2013 in respect of loans, investments, guarantees and security."
  },

  // --------------------------------------------------------------------------
  // CLAUSE (v): Deposits & Deemed Deposits (Sections 73 to 76)
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (v)",
    title: "Deposits from Public & Deemed Deposits",
    category: "REGULATORY_COMPLIANCE",
    statutoryRef: "Sections 73 to 76 of Companies Act, 2013 & RBI Directives",
    primaryRequirement: "Compliance with directives of RBI, Sections 73 to 76, and rules framed thereunder; orders passed by CLB/NCLT/RBI/Court.",
    status: "COMPLIANT_UNQUALIFIED",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "v(a)",
        subClauseTitle: "Deposits & Deemed Deposits Compliance",
        requirement: "Whether company has accepted any deposits or amounts deemed to be deposits under Companies (Acceptance of Deposits) Rules, 2014.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Form DPT-3 filed annually with ROC. Director unsecured loans documented with non-borrowed declaration under Rule 2(1)(c)(viii). No customer advances aged > 365 days.",
        auditorRemarks: "The Company has not accepted any deposits or amounts which are deemed to be deposits within the meaning of Sections 73 to 76 of the Act and the rules framed thereunder. No order has been passed by Company Law Board, NCLT, RBI or any court.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-05-DEPOSITS-DPT3"
      }
    ],
    synthesizedReportingText: "The Company has not accepted any deposits or amounts which are deemed to be deposits from the public within the meaning of Sections 73 to 76 of the Act. Accordingly, the provisions of Clause 3(v) of the Order are not applicable."
  },

  // --------------------------------------------------------------------------
  // CLAUSE (vi): Maintenance of Cost Records u/s 148(1)
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (vi)",
    title: "Maintenance of Cost Records u/s 148(1)",
    category: "REGULATORY_COMPLIANCE",
    statutoryRef: "Section 148(1) of Companies Act, 2013 & Cost Audit Rules",
    primaryRequirement: "Whether maintenance of cost records has been specified by Central Govt u/s 148(1); whether such accounts and records have been made and maintained.",
    status: "COMPLIANT_UNQUALIFIED",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "vi(a)",
        subClauseTitle: "Cost Accounting Records Verification",
        requirement: "Maintenance of cost records in Form CRA-1 pursuant to Companies (Cost Records and Audit) Rules, 2014 for auto-component manufacturing.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Turnover of ₹48.5 Cr from auto parts exceeds the ₹35 Cr threshold under Table B (Non-regulated sectors). Company has maintained cost books in Form CRA-1.",
        auditorRemarks: "We have broadly reviewed the books of account maintained by the Company pursuant to the rules made by the Central Government for the maintenance of cost records under Section 148(1) of the Act, and are of the opinion that prima facie, the prescribed accounts and records have been made and maintained.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-06-COST-RECORDS"
      }
    ],
    synthesizedReportingText: "We have broadly reviewed the books of account maintained by the Company pursuant to the rules made by the Central Government for the maintenance of cost records under Section 148(1) of the Companies Act, 2013, and are of the opinion that prima facie, the prescribed accounts and records have been made and maintained."
  },

  // --------------------------------------------------------------------------
  // CLAUSE (vii): Statutory Dues (Undisputed & Disputed)
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (vii)",
    title: "Statutory Dues (Undisputed > 6 Months & Disputed)",
    category: "STATUTORY_DUES",
    statutoryRef: "CARO 2020 Paragraph 3(vii)",
    primaryRequirement: "Regularity in deposit of undisputed statutory dues (PF, ESI, IT, GST, Customs); undisputed arrears > 6 months; details of disputed dues with forum.",
    status: "COMPLIANT_UNQUALIFIED",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "vii(a)",
        subClauseTitle: "Undisputed Statutory Dues > 6 Months",
        requirement: "Whether undisputed statutory dues including Goods and Services Tax, provident fund, employees' state insurance, income-tax, sales-tax, service tax, duty of customs, duty of excise, value added tax, cess have been regularly deposited; arrears outstanding for > 6 months.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "All statutory dues for FY 2025-26 were deposited on or before due dates. Nil arrears outstanding for > 6 months from the date they became payable as on 31st March 2026.",
        auditorRemarks: "The Company is regular in depositing undisputed statutory dues including Goods and Services Tax, provident fund, employees' state insurance, income-tax, duty of customs, cess and other statutory dues with appropriate authorities. No undisputed amounts were outstanding as at 31 March 2026 for a period of more than six months from the date they became payable.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-07A-STAT-DUES-AGEING"
      },
      {
        subClauseKey: "vii(b)",
        subClauseTitle: "Disputed Statutory Dues",
        requirement: "Where statutory dues have not been deposited on account of any dispute, the amounts involved and the forum where dispute is pending shall be mentioned.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Income Tax demand of ₹8,42,000 for AY 2021-22 contested before CIT(Appeals), Bhopal u/s 250. 20% pre-deposit of ₹1,68,400 deposited under protest.",
        auditorRemarks: "Details of statutory dues which have not been deposited as on 31 March 2026 on account of disputes are as follows: Income Tax Act, 1961 - Demand of ₹8.42 Lakhs for AY 2021-22 pending before Commissioner of Income Tax (Appeals), Bhopal.",
        isAutomatedRule: false,
        workpaperRef: "WP-CARO-07B-DISPUTED-DUES"
      }
    ],
    synthesizedReportingText: "According to the records of the Company, undisputed statutory dues including GST, Provident Fund, ESI, Income-tax and Customs duty have been regularly deposited with the appropriate authorities. No undisputed amounts were outstanding as at 31 March 2026 for a period of more than six months from the date they became payable. Details of disputed statutory dues are disclosed in the audit workpapers."
  },

  // --------------------------------------------------------------------------
  // CLAUSE (viii): Unrecorded Transactions Surrendered
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (viii)",
    title: "Unrecorded Transactions Surrendered / Disclosed",
    category: "REGULATORY_COMPLIANCE",
    statutoryRef: "CARO 2020 Paragraph 3(viii) & Income Tax Act",
    primaryRequirement: "Whether any transactions not recorded in the books of account have been surrendered or disclosed as income during the year in tax assessments under Income Tax Act, 1961.",
    status: "COMPLIANT_UNQUALIFIED",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "viii(a)",
        subClauseTitle: "Tax Search / Survey Income Surrender",
        requirement: "Whether previously unrecorded income has been properly recorded in the books of account during the year.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "No search u/s 132 or survey u/s 133A conducted. Assessment orders for past years verified; zero undisclosed income surrendered.",
        auditorRemarks: "There were no transactions relating to previously unrecorded income that have been surrendered or disclosed as income during the year in the tax assessments under the Income Tax Act, 1961.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-08-TAX-SURRENDER"
      }
    ],
    synthesizedReportingText: "According to the information and explanations given to us and representation obtained, there were no transactions relating to previously unrecorded income that have been surrendered or disclosed as income during the year in the tax assessments under the Income Tax Act, 1961."
  },

  // --------------------------------------------------------------------------
  // CLAUSE (ix): Default in Repayment of Borrowings
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (ix)",
    title: "Borrowings: Repayment Default, Wilful Defaulter & Fund Diversion",
    category: "BORROWINGS_AND_DEFAULT",
    statutoryRef: "CARO 2020 Paragraph 3(ix)",
    primaryRequirement: "Defaults in repayment of loans/borrowings, wilful defaulter declaration, application of term loans, short-term funds for long-term purposes, funds for subsidiaries.",
    status: "COMPLIANT_UNQUALIFIED",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "ix(a)",
        subClauseTitle: "Default in Repayment to Lenders",
        requirement: "Whether company has defaulted in repayment of loans or other borrowings or in the payment of interest thereon to any lender.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Bank statement audit confirms all term loan EMIs and credit facility interest paid on or before monthly debit dates. Nil default.",
        auditorRemarks: "The Company has not defaulted in repayment of loans or other borrowings or in the payment of interest thereon to any lender.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-09A-DEFAULTS"
      },
      {
        subClauseKey: "ix(b)",
        subClauseTitle: "Wilful Defaulter Declaration",
        requirement: "Whether company is declared wilful defaulter by any bank or financial institution or other lender.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "RBI Wilful Defaulters list and CIBIL Commercial database checked. Company and directors are not declared wilful defaulters.",
        auditorRemarks: "The Company has not been declared a wilful defaulter by any bank or financial institution or other lender.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-09B-WILFUL-DEFAULTER"
      },
      {
        subClauseKey: "ix(c)",
        subClauseTitle: "Application of Term Loans",
        requirement: "Whether term loans were applied for the purpose for which the loans were obtained.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "₹3.50 Cr Machinery Term Loan from SIDBI disbursed directly to CNC machine manufacturer against commercial invoice and proof of installation.",
        auditorRemarks: "In our opinion and according to the information and explanations given to us, the term loans were applied for the purpose for which the loans were obtained.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-09C-TERM-LOAN-USE"
      },
      {
        subClauseKey: "ix(d)",
        subClauseTitle: "Short-Term Funds Used for Long-Term Purposes",
        requirement: "Whether funds raised on short-term basis have been utilized for long-term purposes; specify nature and amount.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Balance Sheet Net Working Capital is positive (+₹6.15 Cr). Current Assets exceed Current Liabilities. No short-term debt diverted to long-term capital assets.",
        auditorRemarks: "On an overall examination of the financial statements of the Company, funds raised on short-term basis have, prima facie, not been utilized for long-term purposes.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-09D-FUND-FLOW"
      },
      {
        subClauseKey: "ix(e)",
        subClauseTitle: "Funds Borrowed to Meet Obligations of Subsidiaries",
        requirement: "Whether company has taken any funds from any entity or person on account of or to meet obligations of its subsidiaries, associates or joint ventures.",
        status: "NOT_APPLICABLE",
        findingDetails: "Company has not borrowed funds specifically to meet subsidiary obligations.",
        auditorRemarks: "The Company has not taken any funds from any entity or person on account of or to meet the obligations of its subsidiaries, associates or joint ventures.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-09E-SUBSIDIARY-DEBT"
      },
      {
        subClauseKey: "ix(f)",
        subClauseTitle: "Loans Raised on Pledge of Securities in Subsidiaries",
        requirement: "Whether company has raised loans during the year on the pledge of securities held in its subsidiaries, joint ventures or associate companies.",
        status: "NOT_APPLICABLE",
        findingDetails: "No loans raised on pledge of subsidiary shares.",
        auditorRemarks: "The Company has not raised any loans during the year on the pledge of securities held in its subsidiaries, joint ventures or associate companies.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-09F-PLEDGE-SECURITIES"
      }
    ],
    synthesizedReportingText: "In our opinion and according to the information given to us, the Company has not defaulted in repayment of loans or interest to lenders and has not been declared a wilful defaulter. Term loans were applied for their sanctioned purpose, and short-term funds were not utilized for long-term purposes."
  },

  // --------------------------------------------------------------------------
  // CLAUSE (x): Moneys Raised (IPO, FPO, Preferential Allotment)
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (x)",
    title: "Moneys Raised: Public Offers & Preferential Allotments",
    category: "REGULATORY_COMPLIANCE",
    statutoryRef: "CARO 2020 Paragraph 3(x) & Sections 42, 62",
    primaryRequirement: "Moneys raised by IPO/FPO and preferential allotment or private placement of shares or convertible debentures.",
    status: "NOT_APPLICABLE",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "x(a)",
        subClauseTitle: "Application of IPO / FPO Proceeds",
        requirement: "Whether moneys raised by way of initial public offer or further public offer (including debt instruments) during the year were applied for purposes obtained.",
        status: "NOT_APPLICABLE",
        findingDetails: "Private limited company. No public offers made during the year.",
        auditorRemarks: "The Company has not raised any money by way of initial public offer or further public offer (including debt instruments) during the year.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-10A-IPO"
      },
      {
        subClauseKey: "x(b)",
        subClauseTitle: "Preferential Allotment / Private Placement (Sec 42/62)",
        requirement: "Whether company has made any preferential allotment or private placement of shares or convertible debentures; compliance with Sec 42 and 62.",
        status: "NOT_APPLICABLE",
        findingDetails: "No preferential allotment or private placement undertaken during FY 2025-26. Share capital remained unchanged.",
        auditorRemarks: "The Company has not made any preferential allotment or private placement of shares or convertible debentures during the year.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-10B-PREF-ALLOT"
      }
    ],
    synthesizedReportingText: "The Company has not raised any money by way of initial public offer or further public offer, nor made any preferential allotment or private placement of shares or convertible debentures during the year. Clause 3(x) is not applicable."
  },

  // --------------------------------------------------------------------------
  // CLAUSE (xi): Fraud by Company or on Company
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (xi)",
    title: "Fraud Reporting (Notice, Form ADT-4 & Whistle-Blower)",
    category: "FRAUD_AND_GOVERNANCE",
    statutoryRef: "CARO 2020 Paragraph 3(xi) & Section 143(12)",
    primaryRequirement: "Fraud noticed or reported; reporting u/s 143(12) in Form ADT-4 to Central Govt; whistle-blower complaints received and considered.",
    status: "COMPLIANT_UNQUALIFIED",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "xi(a)",
        subClauseTitle: "Fraud Noticed or Reported",
        requirement: "Whether any fraud by the company or any fraud on the company has been noticed or reported during the year; if yes, specify nature and amount.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Management representations, board minutes, and audit inquiry indicate no fraud by or on the company noticed or reported during FY 2025-26.",
        auditorRemarks: "No fraud by the Company or any fraud on the Company has been noticed or reported during the year.",
        isAutomatedRule: false,
        workpaperRef: "WP-CARO-11A-FRAUD-INQUIRY"
      },
      {
        subClauseKey: "xi(b)",
        subClauseTitle: "Form ADT-4 Reporting u/s 143(12)",
        requirement: "Whether any report under sub-section (12) of Section 143 of the Companies Act has been filed by the auditors in Form ADT-4 with the Central Government.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "No offenses involving fraud u/s 143(12) identified. Nil Form ADT-4 filings.",
        auditorRemarks: "No report under sub-section (12) of Section 143 of the Companies Act has been filed by the auditors in Form ADT-4 with the Central Government.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-11B-ADT4"
      },
      {
        subClauseKey: "xi(c)",
        subClauseTitle: "Whistle-Blower Complaints",
        requirement: "Whether auditor has considered whistle-blower complaints, if any, received during the year by the company.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Audit committee / ombudsman register reviewed. Zero whistle-blower complaints received during the year.",
        auditorRemarks: "As represented to us by the management, there were no whistle-blower complaints received by the Company during the year.",
        isAutomatedRule: false,
        workpaperRef: "WP-CARO-11C-WHISTLE-BLOWER"
      }
    ],
    synthesizedReportingText: "No fraud by the Company or on the Company has been noticed or reported during the year. No report under Section 143(12) in Form ADT-4 has been filed, and no whistle-blower complaints were received by the Company."
  },

  // --------------------------------------------------------------------------
  // CLAUSE (xii): Nidhi Company Compliances
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (xii)",
    title: "Nidhi Company Rules Compliance",
    category: "REGULATORY_COMPLIANCE",
    statutoryRef: "CARO 2020 Paragraph 3(xii) & Nidhi Rules, 2014",
    primaryRequirement: "Net Owned Funds to Deposits ratio 1:20 and 10% unencumbered term deposits.",
    status: "NOT_APPLICABLE",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "xii(a)",
        subClauseTitle: "Nidhi Company Status",
        requirement: "Compliance with Net Owned Funds to Deposits ratio and unencumbered deposits.",
        status: "NOT_APPLICABLE",
        findingDetails: "Entity is a manufacturing company, not a Nidhi company.",
        auditorRemarks: "The Company is not a Nidhi company. Accordingly, reporting under Clause 3(xii) of the Order is not applicable.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-12-NIDHI"
      }
    ],
    synthesizedReportingText: "The Company is not a Nidhi company as defined in Section 406 of the Companies Act, 2013. Accordingly, Clause 3(xii) is not applicable."
  },

  // --------------------------------------------------------------------------
  // CLAUSE (xiii): Related Party Transactions (Sections 177 & 188)
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (xiii)",
    title: "Related Party Transactions (Sec 177, 188 & AS 18)",
    category: "FRAUD_AND_GOVERNANCE",
    statutoryRef: "Sections 177 & 188 of Companies Act, 2013 & AS 18 / Ind AS 24",
    primaryRequirement: "Whether all transactions with related parties are in compliance with Sections 177 and 188 where applicable and details disclosed in financial statements.",
    status: "COMPLIANT_UNQUALIFIED",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "xiii(a)",
        subClauseTitle: "RPT Compliance & Financial Disclosures",
        requirement: "Transactions in ordinary course of business at arm's length; Board approval obtained; disclosed in Note 28 per AS 18 / Ind AS 24.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Purchases of ₹1.24 Cr from related entity Apex Components LLP backed by benchmarked transfer pricing study and omnibus board approval.",
        auditorRemarks: "In our opinion and according to the information and explanations given to us, all transactions with related parties are in compliance with Sections 177 and 188 of the Act where applicable and the details have been disclosed in the Financial Statements as required by the applicable accounting standards.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-13-RPT-AS18"
      }
    ],
    synthesizedReportingText: "In our opinion and according to the information and explanations given to us, the Company has complied with Sections 177 and 188 of the Act in respect of transactions with related parties, and appropriate disclosures have been made in the Financial Statements as required by the applicable accounting standards."
  },

  // --------------------------------------------------------------------------
  // CLAUSE (xiv): Internal Audit System
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (xiv)",
    title: "Internal Audit System & Auditor Reports",
    category: "FRAUD_AND_GOVERNANCE",
    statutoryRef: "Section 138 of Companies Act, 2013 & CARO 2020",
    primaryRequirement: "Whether company has an internal audit system commensurate with size and nature of business; whether statutory auditor considered internal audit reports.",
    status: "COMPLIANT_UNQUALIFIED",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "xiv(a)",
        subClauseTitle: "Internal Audit System Commensurate with Size",
        requirement: "Internal audit system commensurate with the size and nature of its business.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Internal audit conducted quarterly by independent chartered accountant firm M/s Mehta & Associates.",
        auditorRemarks: "In our opinion, the Company has an internal audit system commensurate with the size and nature of its business.",
        isAutomatedRule: false,
        workpaperRef: "WP-CARO-14A-INTERNAL-AUDIT"
      },
      {
        subClauseKey: "xiv(b)",
        subClauseTitle: "Consideration of Internal Audit Reports",
        requirement: "Whether reports of the Internal Auditor for the period under audit were considered by statutory auditor.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Quarterly internal audit reports for Q1 to Q4 reviewed. Key recommendations on inventory tagging were verified as implemented.",
        auditorRemarks: "We have considered the internal audit reports of the Company issued till date for the period under audit.",
        isAutomatedRule: false,
        workpaperRef: "WP-CARO-14B-IA-REPORTS"
      }
    ],
    synthesizedReportingText: "In our opinion, the Company has an internal audit system commensurate with the size and nature of its business. We have considered the internal audit reports of the Company issued for the year under audit."
  },

  // --------------------------------------------------------------------------
  // CLAUSE (xv): Non-Cash Transactions with Directors (Section 192)
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (xv)",
    title: "Non-Cash Transactions with Directors (Section 192)",
    category: "REGULATORY_COMPLIANCE",
    statutoryRef: "Section 192 of Companies Act, 2013",
    primaryRequirement: "Whether company has entered into non-cash transactions with directors or persons connected with him; compliance with Section 192.",
    status: "NOT_APPLICABLE",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "xv(a)",
        subClauseTitle: "Section 192 Compliance",
        requirement: "Restrictions on non-cash transactions involving directors or connected persons.",
        status: "NOT_APPLICABLE",
        findingDetails: "No assets or non-cash consideration transferred to or from directors during the financial year.",
        auditorRemarks: "In our opinion and according to the information and explanations given to us, during the year the Company has not entered into any non-cash transactions with its directors or persons connected with them. Accordingly, provisions of Section 192 of the Act are not applicable.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-15-NON-CASH-DIR"
      }
    ],
    synthesizedReportingText: "According to the information and explanations given to us, the Company has not entered into any non-cash transactions with its directors or persons connected with them as referred to in Section 192 of the Companies Act, 2013."
  },

  // --------------------------------------------------------------------------
  // CLAUSE (xvi): Registration u/s 45-IA of RBI Act, 1934 (NBFC 50-50 Principle)
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (xvi)",
    title: "Registration under Section 45-IA of RBI Act, 1934",
    category: "REGULATORY_COMPLIANCE",
    statutoryRef: "Section 45-IA of Reserve Bank of India Act, 1934",
    primaryRequirement: "Whether company is required to be registered under Section 45-IA of RBI Act, 1934; whether registration obtained; whether company is a Core Investment Company (CIC).",
    status: "COMPLIANT_UNQUALIFIED",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "xvi(a)",
        subClauseTitle: "NBFC Registration Requirement (50-50 Test)",
        requirement: "Whether financial assets constitute more than 50% of total assets and income from financial assets constitutes more than 50% of gross income.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Financial assets are 4.8% of total assets (threshold: 50%). Financial income is 1.2% of gross income (threshold: 50%). Entity is not an NBFC.",
        auditorRemarks: "The Company is not required to be registered under Section 45-IA of the Reserve Bank of India Act, 1934. Accordingly, reporting under Clause 3(xvi)(a), (b), (c) and (d) is not applicable.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-16-50-50-NBFC-TEST"
      }
    ],
    synthesizedReportingText: "The Company is not required to be registered under Section 45-IA of the Reserve Bank of India Act, 1934. The Company is not a Core Investment Company (CIC) as defined in the regulations made by the RBI."
  },

  // --------------------------------------------------------------------------
  // CLAUSE (xvii): Cash Losses Incurred in FY & Preceding FY
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (xvii)",
    title: "Cash Losses in Current FY & Preceding FY",
    category: "FINANCIAL_HEALTH_AND_GOING_CONCERN",
    statutoryRef: "CARO 2020 Paragraph 3(xvii) & ICAI Guidance Note",
    primaryRequirement: "Whether company has incurred cash losses in the financial year and in the immediately preceding financial year; specify amount.",
    status: "COMPLIANT_UNQUALIFIED",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "xvii(a)",
        subClauseTitle: "Cash Loss Computation",
        requirement: "Cash Loss = Profit After Tax (PAT) - Non-cash expenses (Depreciation/Amortization) - Other non-cash credits.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Current FY PAT: +₹2,84,50,000 (Depreciation: ₹48,20,000 -> Cash Profit: ₹3,32,70,000). Preceding FY PAT: +₹2,18,00,000 (Cash Profit: ₹2,62,50,000). Nil cash loss in both years.",
        auditorRemarks: "The Company has not incurred cash losses in the financial year covered by our audit and in the immediately preceding financial year.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-17-CASH-LOSS-CALC"
      }
    ],
    synthesizedReportingText: "The Company has not incurred cash losses in the financial year covered by our audit and in the immediately preceding financial year."
  },

  // --------------------------------------------------------------------------
  // CLAUSE (xviii): Resignation of Statutory Auditors
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (xviii)",
    title: "Resignation of Statutory Auditors During the Year",
    category: "FRAUD_AND_GOVERNANCE",
    statutoryRef: "CARO 2020 Paragraph 3(xviii) & Section 140",
    primaryRequirement: "Whether there has been any resignation of the statutory auditors during the year; whether auditor has taken into consideration the issues, objections or concerns raised by outgoing auditors.",
    status: "NOT_APPLICABLE",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "xviii(a)",
        subClauseTitle: "Auditor Resignation & Outgoing Auditor Issues",
        requirement: "Whether any resignation occurred; consideration of Form ADT-3 and outgoing auditor representations.",
        status: "NOT_APPLICABLE",
        findingDetails: "No resignation of statutory auditors during the year. Existing auditors reappointed at AGM.",
        auditorRemarks: "There has been no resignation of the statutory auditors during the year. Accordingly, reporting under Clause 3(xviii) is not applicable.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-18-AUDITOR-RESIGN"
      }
    ],
    synthesizedReportingText: "There has been no resignation of the statutory auditors during the year. Accordingly, Clause 3(xviii) of the Order is not applicable."
  },

  // --------------------------------------------------------------------------
  // CLAUSE (xix): Material Uncertainty on Going Concern (SA 570)
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (xix)",
    title: "Material Uncertainty on Going Concern (SA 570)",
    category: "FINANCIAL_HEALTH_AND_GOING_CONCERN",
    statutoryRef: "CARO 2020 Paragraph 3(xix) & Standard on Auditing (SA) 570 (Revised)",
    primaryRequirement: "Auditor evaluation of financial ratios, ageing of assets/liabilities, Board plans to form opinion on capability to meet liabilities existing at balance sheet date within 1 year.",
    status: "COMPLIANT_UNQUALIFIED",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "xix(a)",
        subClauseTitle: "Going Concern Ratio & Liquidity Analysis",
        requirement: "Evaluation of Current Ratio (1.68), Debt-Equity (0.58), Positive Net Working Capital (₹6.15 Cr), and Projected 12-Month Operating Cash Flows.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Healthy liquidity metrics. Current assets exceed current liabilities. Debt service coverage ratio is 2.45x. No adverse going concern indicators.",
        auditorRemarks: "On the basis of the financial ratios, ageing and expected dates of realization of financial assets and payment of financial liabilities, other information accompanying the financial statements, our knowledge of the Board of Directors and management plans and based on our examination of the evidence supporting the assumptions, nothing has come to our attention, which causes us to believe that any material uncertainty exists as on the date of the audit report that Company is not capable of meeting its liabilities existing at the date of balance sheet as and when they fall due within a period of one year from the balance sheet date. We, however, state that this is not an assurance as to the future viability of the Company.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-19-SA570-GOING-CONCERN"
      }
    ],
    synthesizedReportingText: "On the basis of the financial ratios, ageing and expected dates of realization of financial assets and payment of financial liabilities, other information accompanying the financial statements, our knowledge of the Board of Directors and management plans, nothing has come to our attention which causes us to believe that any material uncertainty exists as on the date of the audit report that the Company is not capable of meeting its liabilities existing at the date of balance sheet as and when they fall due within a period of one year from the balance sheet date."
  },

  // --------------------------------------------------------------------------
  // CLAUSE (xx): Corporate Social Responsibility (CSR) Compliance (Section 135)
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (xx)",
    title: "Corporate Social Responsibility (CSR) Compliance (Sec 135)",
    category: "REGULATORY_COMPLIANCE",
    statutoryRef: "Section 135 of Companies Act, 2013 & Companies (CSR Policy) Rules",
    primaryRequirement: "Transfer of unspent amounts to Fund specified in Schedule VII within 6 months or to Special Unspent CSR Account within 30 days.",
    status: "COMPLIANT_UNQUALIFIED",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "xx(a)",
        subClauseTitle: "Transfer of Other than Ongoing CSR Amount (Sec 135(5))",
        requirement: "Whether unspent amount has been transferred to a Fund specified in Schedule VII to the Act within a period of six months of the expiry of the financial year.",
        status: "COMPLIANT_UNQUALIFIED",
        findingDetails: "Net profit u/s 198 averaged ₹3.80 Cr -> Mandatory CSR obligation: ₹7.60 Lakhs. Company disbursed ₹8.00 Lakhs directly to PM National Relief Fund before 31st March 2026. Nil unspent balance.",
        auditorRemarks: "There are no unspent amounts remaining in respect of other than ongoing projects under Section 135(5) of the Companies Act, 2013. Accordingly, reporting under Clause 3(xx)(a) is not applicable.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-20A-CSR-DISBURSED"
      },
      {
        subClauseKey: "xx(b)",
        subClauseTitle: "Transfer of Ongoing CSR Project Amount (Sec 135(6))",
        requirement: "Whether any amount remaining unspent under Section 135(6) has been transferred to special account within a period of thirty days from end of financial year.",
        status: "NOT_APPLICABLE",
        findingDetails: "Company has no ongoing CSR projects. Full annual budget expended during the year.",
        auditorRemarks: "The Company does not have any ongoing CSR projects. Accordingly, reporting under Clause 3(xx)(b) is not applicable.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-20B-CSR-ONGOING"
      }
    ],
    synthesizedReportingText: "In our opinion and according to the information and explanations given to us, the Company has fully spent its mandatory CSR obligation during the year. There are no unspent amounts requiring transfer under Section 135(5) or 135(6) of the Companies Act, 2013."
  },

  // --------------------------------------------------------------------------
  // CLAUSE (xxi): Qualifications or Adverse Remarks in Group CARO Reports
  // --------------------------------------------------------------------------
  {
    clauseNumber: "Clause (xxi)",
    title: "Consolidated Financial Statements: Group CARO Qualifications",
    category: "GROUP_AND_CFS",
    statutoryRef: "CARO 2020 Paragraph 3(xxi) & Standard on Auditing (SA) 600",
    primaryRequirement: "Whether there have been any qualifications or adverse remarks by the respective auditors in the CARO reports of the companies included in the consolidated financial statements; details of paragraph numbers.",
    status: "NOT_APPLICABLE",
    partnerSignedOff: true,
    signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
    signedOffAt: "2026-09-15",
    subItems: [
      {
        subClauseKey: "xxi(a)",
        subClauseTitle: "Subsidiary / Associate CARO Remarks",
        requirement: "Details of company name, CIN, relationship, and paragraph numbers of CARO report containing adverse remarks/qualifications.",
        status: "NOT_APPLICABLE",
        findingDetails: "Stand-alone audit report. Consolidated audit report under preparation separately; subsidiary auditor report had nil qualifications.",
        auditorRemarks: "This report is issued on the Standalone Financial Statements of the Company. Accordingly, reporting under Clause 3(xxi) of the Order is not applicable.",
        isAutomatedRule: true,
        workpaperRef: "WP-CARO-21-CFS-REMARKS"
      }
    ],
    synthesizedReportingText: "This report is issued on the Standalone Financial Statements of the Company. Accordingly, Clause 3(xxi) of the Order is not applicable."
  }
];

// ----------------------------------------------------------------------------
// AUTOMATED CARO EVALUATION ENGINE
// Evaluates Trial Balance & Supplementary Financial Inputs
// ----------------------------------------------------------------------------
export class Caro2020Engine {
  public static evaluateTrialBalance(
    clientName: string,
    cin: string,
    fy: string,
    ay: string,
    metrics: {
      patCY: number;
      depreciationCY: number;
      patPY: number;
      depreciationPY: number;
      sanctionedWorkingCapitalLimitInr: number;
      currentAssetsCY: number;
      currentLiabilitiesCY: number;
      debtEquityRatio: number;
      hasWilfulDefaulterRemark?: boolean;
      undisputedStatutoryDuesOver6Months?: number;
      isCostRecordsApplicable?: boolean;
      hasUnrecordedTaxSurrender?: boolean;
    }
  ): CaroAuditEngineResult {
    const clauses = JSON.parse(JSON.stringify(DEFAULT_CARO_2020_CLAUSES)) as CaroClauseReport[];

    // 1. Evaluate Clause (xvii) - Cash Losses
    const cashProfitCY = metrics.patCY + metrics.depreciationCY;
    const cashProfitPY = metrics.patPY + metrics.depreciationPY;
    const cashLossClause = clauses.find(c => c.clauseNumber === "Clause (xvii)");
    if (cashLossClause) {
      if (cashProfitCY < 0 || cashProfitPY < 0) {
        cashLossClause.status = "QUALIFIED_ATTENTION_REQUIRED";
        const sub = cashLossClause.subItems[0];
        sub.status = "QUALIFIED_ATTENTION_REQUIRED";
        sub.findingDetails = `Cash Loss incurred: CY Cash Loss: ₹${Math.abs(cashProfitCY).toLocaleString('en-IN')}; PY Cash Loss: ₹${Math.abs(cashProfitPY).toLocaleString('en-IN')}.`;
        sub.auditorRemarks = `The Company has incurred cash losses of ₹${Math.abs(cashProfitCY).toLocaleString('en-IN')} in the financial year and ₹${Math.abs(cashProfitPY).toLocaleString('en-IN')} in the immediately preceding financial year.`;
        cashLossClause.synthesizedReportingText = sub.auditorRemarks;
      }
    }

    // 2. Evaluate Clause (ii)(b) - Sanctioned Limit > 5 Cr
    const inventoryClause = clauses.find(c => c.clauseNumber === "Clause (ii)");
    if (inventoryClause && inventoryClause.subItems[1]) {
      if (metrics.sanctionedWorkingCapitalLimitInr <= 50000000) {
        inventoryClause.subItems[1].status = "NOT_APPLICABLE";
        inventoryClause.subItems[1].findingDetails = `Sanctioned working capital limits (₹${(metrics.sanctionedWorkingCapitalLimitInr/100000).toFixed(2)} Lakhs) do not exceed statutory threshold of ₹500 Lakhs.`;
        inventoryClause.subItems[1].auditorRemarks = `The Company has not been sanctioned working capital limits in excess of ₹5 crore in aggregate from banks or financial institutions on the basis of security of current assets.`;
      }
    }

    // 3. Evaluate Clause (vii)(a) - Undisputed Statutory Dues > 6 Months
    const duesClause = clauses.find(c => c.clauseNumber === "Clause (vii)");
    if (duesClause && metrics.undisputedStatutoryDuesOver6Months && metrics.undisputedStatutoryDuesOver6Months > 0) {
      duesClause.status = "QUALIFIED_ATTENTION_REQUIRED";
      if (duesClause.subItems[0]) {
        duesClause.subItems[0].status = "QUALIFIED_ATTENTION_REQUIRED";
        duesClause.subItems[0].findingDetails = `Arrears of statutory dues exceeding 6 months outstanding as on 31st March: ₹${metrics.undisputedStatutoryDuesOver6Months.toLocaleString('en-IN')}.`;
        duesClause.subItems[0].auditorRemarks = `According to the records of the Company, undisputed statutory dues amounting to ₹${metrics.undisputedStatutoryDuesOver6Months.toLocaleString('en-IN')} were in arrears as at 31 March for a period of more than six months from the date they became payable.`;
        duesClause.synthesizedReportingText = duesClause.subItems[0].auditorRemarks;
      }
    }

    // 4. Evaluate Clause (xix) - Going Concern SA 570
    const goingConcernClause = clauses.find(c => c.clauseNumber === "Clause (xix)");
    if (goingConcernClause) {
      const currentRatio = metrics.currentLiabilitiesCY > 0 ? (metrics.currentAssetsCY / metrics.currentLiabilitiesCY) : 2.0;
      if (currentRatio < 1.0 || metrics.debtEquityRatio > 3.0) {
        goingConcernClause.status = "QUALIFIED_ATTENTION_REQUIRED";
        if (goingConcernClause.subItems[0]) {
          goingConcernClause.subItems[0].status = "QUALIFIED_ATTENTION_REQUIRED";
          goingConcernClause.subItems[0].findingDetails = `Current ratio (${currentRatio.toFixed(2)}) is below parity. High financial leverage (Debt-equity: ${metrics.debtEquityRatio.toFixed(2)}x). SA 570 alert triggered.`;
          goingConcernClause.subItems[0].auditorRemarks = `Financial ratios indicate that current liabilities exceed current assets. A material uncertainty exists regarding the company's capability to meet obligations within 12 months without additional promoter funding.`;
          goingConcernClause.synthesizedReportingText = goingConcernClause.subItems[0].auditorRemarks;
        }
      }
    }

    // Tally clause counts
    let unqualified = 0;
    let qualified = 0;
    let adverse = 0;
    let na = 0;
    let signedOff = 0;

    clauses.forEach(c => {
      if (c.status === "COMPLIANT_UNQUALIFIED") unqualified++;
      else if (c.status === "QUALIFIED_ATTENTION_REQUIRED") qualified++;
      else if (c.status === "ADVERSE_REMARK") adverse++;
      else if (c.status === "NOT_APPLICABLE") na++;

      if (c.partnerSignedOff) signedOff++;
    });

    const partnerProgress = Math.round((signedOff / clauses.length) * 100);
    const overallRisk = adverse > 0 || qualified >= 2 ? "HIGH_ATTENTION_REQUIRED" : qualified === 1 ? "MEDIUM" : "LOW";

    // Generate ICAI Markdown Annexure
    const annexureMarkdown = this.generateAnnexureDraftMarkdown({
      clientName,
      cin,
      financialYear: fy,
      assessmentYear: ay,
      clauses
    });

    return {
      clientName,
      cin,
      financialYear: fy,
      assessmentYear: ay,
      isConsolidated: false,
      totalClauses: clauses.length,
      unqualifiedCount: unqualified,
      qualifiedCount: qualified,
      adverseCount: adverse,
      notApplicableCount: na,
      partnerSignOffProgress: partnerProgress,
      overallRiskRating: overallRisk,
      clauses,
      annexureDraftMarkdown: annexureMarkdown
    };
  }

  // --------------------------------------------------------------------------
  // SYNTHESIZE OFFICIAL ICAI CARO 2020 INDEPENDENT AUDITOR'S REPORT ANNEXURE
  // --------------------------------------------------------------------------
  public static generateAnnexureDraftMarkdown(data: {
    clientName: string;
    cin: string;
    financialYear: string;
    assessmentYear: string;
    clauses: CaroClauseReport[];
  }): string {
    const lines: string[] = [];
    lines.push(`# ANNEXURE "A" TO THE INDEPENDENT AUDITOR'S REPORT`);
    lines.push(`*(Referred to in Paragraph 1 under 'Report on Other Legal and Regulatory Requirements' section of our report to the members of ${data.clientName} of even date)*`);
    lines.push(``);
    lines.push(`**Entity:** ${data.clientName} | **CIN:** ${data.cin}`);
    lines.push(`**Period Covered:** ${data.financialYear} (${data.assessmentYear})`);
    lines.push(`---`);
    lines.push(``);
    lines.push(`To the best of our information and according to the explanations provided to us by the Company and the books of account and records examined by us in the normal course of audit, we state that:`);
    lines.push(``);

    data.clauses.forEach(clause => {
      lines.push(`### ${clause.clauseNumber}: ${clause.title}`);
      lines.push(`**Statutory Reference:** ${clause.statutoryRef}`);
      lines.push(``);
      clause.subItems.forEach(sub => {
        lines.push(`- **(${sub.subClauseKey})** ${sub.auditorRemarks}`);
      });
      lines.push(``);
    });

    lines.push(`---`);
    lines.push(`**For and on behalf of:**`);
    lines.push(`**M/s AGGARWAL SHUKLA & CO.**`);
    lines.push(`Chartered Accountants (FRN: 014285C)`);
    lines.push(``);
    lines.push(`**CA Rajesh Aggarwal, FCA**`);
    lines.push(`Partner | Membership No. 054891`);
    lines.push(`UDIN: 26054891BGTA8829`);
    lines.push(`Date: 15th September 2026 | Place: Indore`);

    return lines.join("\n");
  }
}
