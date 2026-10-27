// ============================================================================
// SCHEDULE III STATUTORY TAXONOMY & HEURISTIC ENGINE (Companies Act, 2013)
// Supports Division I (Non-IndAS for Indian SMEs/Mid-caps) and Division II (IndAS)
// ============================================================================

export type Schedule3Division = "DIVISION_I" | "DIVISION_II";

export type Schedule3StatementType = "BALANCE_SHEET" | "PROFIT_AND_LOSS";

export type Schedule3Category = 
  | "EQUITY"
  | "NON_CURRENT_LIABILITIES"
  | "CURRENT_LIABILITIES"
  | "NON_CURRENT_ASSETS"
  | "CURRENT_ASSETS"
  | "REVENUE"
  | "EXPENSES"
  | "TAX_EXPENSE";

export interface Schedule3HeadDefinition {
  id: string;
  code: string; // e.g. "BS-EQ-01"
  statement: Schedule3StatementType;
  category: Schedule3Category;
  title: string;
  noteNumber: number;
  noteTitle: string;
  expectedBalance: "DEBIT" | "CREDIT" | "EITHER";
  tallyParentHints: string[];
  keywords: string[];
  mcaRowOrder: number;
  isSubTotal?: boolean;
}

export const SCHEDULE3_HEADS: Schedule3HeadDefinition[] = [
  // --------------------------------------------------------------------------
  // I. EQUITY AND LIABILITIES
  // --------------------------------------------------------------------------
  {
    id: "share_capital",
    code: "BS-EQ-01",
    statement: "BALANCE_SHEET",
    category: "EQUITY",
    title: "Share Capital",
    noteNumber: 1,
    noteTitle: "Share Capital & Shareholding Pattern",
    expectedBalance: "CREDIT",
    tallyParentHints: ["Capital Account", "Share Capital"],
    keywords: ["share capital", "equity share capital", "preference share capital", "paid up capital", "authorized capital"],
    mcaRowOrder: 10
  },
  {
    id: "reserves_and_surplus",
    code: "BS-EQ-02",
    statement: "BALANCE_SHEET",
    category: "EQUITY",
    title: "Reserves and Surplus",
    noteNumber: 2,
    noteTitle: "Reserves & Surplus (Securities Premium, General Reserve & P&L)",
    expectedBalance: "CREDIT",
    tallyParentHints: ["Reserves & Surplus", "Retained Earnings"],
    keywords: ["reserve", "surplus", "general reserve", "securities premium", "capital reserve", "retained earnings", "profit & loss a/c", "opening p&l"],
    mcaRowOrder: 20
  },
  {
    id: "money_against_share_warrants",
    code: "BS-EQ-03",
    statement: "BALANCE_SHEET",
    category: "EQUITY",
    title: "Money received against share warrants",
    noteNumber: 0,
    noteTitle: "Share Warrants",
    expectedBalance: "CREDIT",
    tallyParentHints: ["Capital Account"],
    keywords: ["share warrant", "warrant money"],
    mcaRowOrder: 30
  },
  // Non-Current Liabilities
  {
    id: "long_term_borrowings",
    code: "BS-NCL-01",
    statement: "BALANCE_SHEET",
    category: "NON_CURRENT_LIABILITIES",
    title: "Long-Term Borrowings",
    noteNumber: 3,
    noteTitle: "Long-Term Borrowings (Term Loans, Debentures & Directors Loans)",
    expectedBalance: "CREDIT",
    tallyParentHints: ["Secured Loans", "Unsecured Loans", "Loans (Liability)", "Term Loan"],
    keywords: ["term loan", "car loan", "vehicle loan", "machinery loan", "hdfc term loan", "sbi term loan", "director loan", "unsecured loan - promoter", "debenture", "mortgage"],
    mcaRowOrder: 40
  },
  {
    id: "deferred_tax_liabilities_net",
    code: "BS-NCL-02",
    statement: "BALANCE_SHEET",
    category: "NON_CURRENT_LIABILITIES",
    title: "Deferred Tax Liabilities (Net)",
    noteNumber: 4,
    noteTitle: "Deferred Tax Liabilities / (Assets) (Net)",
    expectedBalance: "CREDIT",
    tallyParentHints: ["Duties & Taxes", "Provisions"],
    keywords: ["deferred tax liability", "dtl", "deferred tax"],
    mcaRowOrder: 50
  },
  {
    id: "other_long_term_liabilities",
    code: "BS-NCL-03",
    statement: "BALANCE_SHEET",
    category: "NON_CURRENT_LIABILITIES",
    title: "Other Long-Term Liabilities",
    noteNumber: 5,
    noteTitle: "Other Long-Term Liabilities (Security Deposits Received)",
    expectedBalance: "CREDIT",
    tallyParentHints: ["Current Liabilities", "Deposits (Liability)"],
    keywords: ["security deposit received", "retention money", "dealer deposit", "long term deposit"],
    mcaRowOrder: 60
  },
  {
    id: "long_term_provisions",
    code: "BS-NCL-04",
    statement: "BALANCE_SHEET",
    category: "NON_CURRENT_LIABILITIES",
    title: "Long-Term Provisions",
    noteNumber: 6,
    noteTitle: "Long-Term Provisions (Gratuity & Leave Encashment)",
    expectedBalance: "CREDIT",
    tallyParentHints: ["Provisions"],
    keywords: ["provision for gratuity", "gratuity payable", "provision for leave encashment", "long term provision"],
    mcaRowOrder: 70
  },
  // Current Liabilities
  {
    id: "short_term_borrowings",
    code: "BS-CL-01",
    statement: "BALANCE_SHEET",
    category: "CURRENT_LIABILITIES",
    title: "Short-Term Borrowings",
    noteNumber: 7,
    noteTitle: "Short-Term Borrowings (Cash Credit, Overdraft & Working Capital Loans)",
    expectedBalance: "CREDIT",
    tallyParentHints: ["Bank OD A/c", "Bank OCC A/c", "Loans (Liability)", "Current Liabilities"],
    keywords: ["cash credit", "cc a/c", "od a/c", "overdraft", "working capital loan", "hdfc cc", "icici od", "sbi cash credit", "packing credit"],
    mcaRowOrder: 80
  },
  {
    id: "trade_payables_msme",
    code: "BS-CL-02A",
    statement: "BALANCE_SHEET",
    category: "CURRENT_LIABILITIES",
    title: "Trade Payables - Micro & Small Enterprises (MSME)",
    noteNumber: 8,
    noteTitle: "Trade Payables (MSME Dues under Section 43B(h) & MSMED Act)",
    expectedBalance: "CREDIT",
    tallyParentHints: ["Sundry Creditors"],
    keywords: ["msme creditor", "micro enterprise", "small enterprise", "udyam creditor", "sundry creditors - msme"],
    mcaRowOrder: 90
  },
  {
    id: "trade_payables_others",
    code: "BS-CL-02B",
    statement: "BALANCE_SHEET",
    category: "CURRENT_LIABILITIES",
    title: "Trade Payables - Others",
    noteNumber: 8,
    noteTitle: "Trade Payables (Creditors other than Micro & Small)",
    expectedBalance: "CREDIT",
    tallyParentHints: ["Sundry Creditors"],
    keywords: ["sundry creditor", "trade payable", "vendor", "supplier", "purchases payable", "creditor for goods"],
    mcaRowOrder: 95
  },
  {
    id: "other_current_liabilities",
    code: "BS-CL-03",
    statement: "BALANCE_SHEET",
    category: "CURRENT_LIABILITIES",
    title: "Other Current Liabilities",
    noteNumber: 9,
    noteTitle: "Other Current Liabilities (Statutory Dues, Advances from Customers & Current Maturities)",
    expectedBalance: "CREDIT",
    tallyParentHints: ["Duties & Taxes", "Current Liabilities"],
    keywords: [
      "gst payable", "output cgst", "output sgst", "output igst", "tds payable", 
      "tcs payable", "provident fund payable", "pf payable", "esic payable", 
      "advance from customer", "salary payable", "audit fees payable", "expenses payable", 
      "current maturity of long term debt", "professional tax payable"
    ],
    mcaRowOrder: 100
  },
  {
    id: "short_term_provisions",
    code: "BS-CL-04",
    statement: "BALANCE_SHEET",
    category: "CURRENT_LIABILITIES",
    title: "Short-Term Provisions",
    noteNumber: 10,
    noteTitle: "Short-Term Provisions (Tax Provision & Proposed Dividend)",
    expectedBalance: "CREDIT",
    tallyParentHints: ["Provisions"],
    keywords: ["provision for income tax", "provision for tax", "tax provision", "short term provision"],
    mcaRowOrder: 110
  },

  // --------------------------------------------------------------------------
  // II. ASSETS
  // --------------------------------------------------------------------------
  // Non-Current Assets
  {
    id: "ppe_tangible_assets",
    code: "BS-NCA-01",
    statement: "BALANCE_SHEET",
    category: "NON_CURRENT_ASSETS",
    title: "Property, Plant and Equipment (PPE)",
    noteNumber: 11,
    noteTitle: "Property, Plant & Equipment (Schedule II Companies Act Gross Block)",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Fixed Assets"],
    keywords: [
      "plant and machinery", "machinery", "computers", "laptop", "furniture and fixtures", 
      "office equipment", "building", "factory building", "land", "air conditioner", 
      "vehicles", "motor car", "electrical installation"
    ],
    mcaRowOrder: 120
  },
  {
    id: "intangible_assets",
    code: "BS-NCA-02",
    statement: "BALANCE_SHEET",
    category: "NON_CURRENT_ASSETS",
    title: "Intangible Assets",
    noteNumber: 12,
    noteTitle: "Intangible Assets (Software, Trademarks & Patents)",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Fixed Assets"],
    keywords: ["software", "trademark", "patent", "copyright", "goodwill", "erp license"],
    mcaRowOrder: 130
  },
  {
    id: "capital_wip",
    code: "BS-NCA-03",
    statement: "BALANCE_SHEET",
    category: "NON_CURRENT_ASSETS",
    title: "Capital Work-In-Progress (CWIP)",
    noteNumber: 11,
    noteTitle: "Capital Work-in-Progress Ageing",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Fixed Assets"],
    keywords: ["capital wip", "cwip", "building under construction", "machinery under erection"],
    mcaRowOrder: 140
  },
  {
    id: "non_current_investments",
    code: "BS-NCA-04",
    statement: "BALANCE_SHEET",
    category: "NON_CURRENT_ASSETS",
    title: "Non-Current Investments",
    noteNumber: 13,
    noteTitle: "Non-Current Investments (Subsidiaries, Shares & Bonds)",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Investments"],
    keywords: ["investment in shares", "shares of", "unquoted shares", "long term investment", "bonds", "subsidiary investment"],
    mcaRowOrder: 150
  },
  {
    id: "deferred_tax_assets_net",
    code: "BS-NCA-05",
    statement: "BALANCE_SHEET",
    category: "NON_CURRENT_ASSETS",
    title: "Deferred Tax Assets (Net)",
    noteNumber: 14,
    noteTitle: "Deferred Tax Assets (Net)",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Current Assets", "Provisions"],
    keywords: ["deferred tax asset", "dta"],
    mcaRowOrder: 160
  },
  {
    id: "long_term_loans_and_advances",
    code: "BS-NCA-06",
    statement: "BALANCE_SHEET",
    category: "NON_CURRENT_ASSETS",
    title: "Long-Term Loans and Advances",
    noteNumber: 15,
    noteTitle: "Long-Term Loans & Advances (Capital Advances & Electricity Deposits)",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Loans & Advances (Asset)", "Deposits (Asset)"],
    keywords: ["electricity deposit", "rent deposit", "telephone deposit", "capital advance", "security deposit given"],
    mcaRowOrder: 170
  },
  {
    id: "other_non_current_assets",
    code: "BS-NCA-07",
    statement: "BALANCE_SHEET",
    category: "NON_CURRENT_ASSETS",
    title: "Other Non-Current Assets",
    noteNumber: 16,
    noteTitle: "Other Non-Current Assets (Long-term Bank Fixed Deposits with >12m maturity)",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Investments", "Bank Accounts"],
    keywords: ["fixed deposit with bank > 12 months", "margin money > 12m"],
    mcaRowOrder: 180
  },
  // Current Assets
  {
    id: "current_investments",
    code: "BS-CA-01",
    statement: "BALANCE_SHEET",
    category: "CURRENT_ASSETS",
    title: "Current Investments",
    noteNumber: 17,
    noteTitle: "Current Investments (Mutual Funds & Liquid Treasury)",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Investments"],
    keywords: ["mutual fund", "liquid fund", "arbitrage fund", "short term fmp", "marketable securities"],
    mcaRowOrder: 190
  },
  {
    id: "inventories",
    code: "BS-CA-02",
    statement: "BALANCE_SHEET",
    category: "CURRENT_ASSETS",
    title: "Inventories",
    noteNumber: 18,
    noteTitle: "Inventories (Raw Material, WIP, Finished Goods & Stock-in-Trade)",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Stock-in-hand"],
    keywords: ["closing stock", "inventory", "raw material stock", "finished goods stock", "stock in trade", "work in progress", "packing material stock"],
    mcaRowOrder: 200
  },
  {
    id: "trade_receivables",
    code: "BS-CA-03",
    statement: "BALANCE_SHEET",
    category: "CURRENT_ASSETS",
    title: "Trade Receivables",
    noteNumber: 19,
    noteTitle: "Trade Receivables (Ageing & Undisputed/Disputed Classification)",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Sundry Debtors"],
    keywords: ["sundry debtor", "debtor", "customer", "trade receivable", "book debts"],
    mcaRowOrder: 210
  },
  {
    id: "cash_and_bank_balances",
    code: "BS-CA-04",
    statement: "BALANCE_SHEET",
    category: "CURRENT_ASSETS",
    title: "Cash and Cash Equivalents",
    noteNumber: 20,
    noteTitle: "Cash and Bank Balances (Cash on Hand, Current Accounts & Flexi FDs)",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Cash-in-hand", "Bank Accounts"],
    keywords: [
      "cash in hand", "cash a/c", "petty cash", "hdfc bank", "icici bank", 
      "sbi current account", "axis bank", "kotak bank", "bank of baroda", 
      "punjab national bank", "current account"
    ],
    mcaRowOrder: 220
  },
  {
    id: "short_term_loans_and_advances",
    code: "BS-CA-05",
    statement: "BALANCE_SHEET",
    category: "CURRENT_ASSETS",
    title: "Short-Term Loans and Advances",
    noteNumber: 21,
    noteTitle: "Short-Term Loans & Advances (Advances to Suppliers, Staff Advances & Prepaid)",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Loans & Advances (Asset)", "Current Assets"],
    keywords: ["advance to supplier", "staff advance", "prepaid expense", "prepaid insurance", "loan to employee", "advance to vendor"],
    mcaRowOrder: 230
  },
  {
    id: "other_current_assets",
    code: "BS-CA-06",
    statement: "BALANCE_SHEET",
    category: "CURRENT_ASSETS",
    title: "Other Current Assets",
    noteNumber: 22,
    noteTitle: "Other Current Assets (GST Input Credits, Advance Tax & TDS Receivables)",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Duties & Taxes", "Current Assets"],
    keywords: [
      "gst input", "input cgst", "input sgst", "input igst", "tds receivable", 
      "tcs receivable", "advance tax", "it refund receivable", "accrued interest", 
      "interest accrued but not due", "electronic cash ledger"
    ],
    mcaRowOrder: 240
  },

  // --------------------------------------------------------------------------
  // PART II. STATEMENT OF PROFIT AND LOSS
  // --------------------------------------------------------------------------
  // Revenue
  {
    id: "revenue_from_operations",
    code: "PL-REV-01",
    statement: "PROFIT_AND_LOSS",
    category: "REVENUE",
    title: "Revenue from Operations",
    noteNumber: 23,
    noteTitle: "Revenue from Operations (Gross Sales & Services Less Returns/GST)",
    expectedBalance: "CREDIT",
    tallyParentHints: ["Sales Accounts", "Direct Incomes"],
    keywords: [
      "sales", "sales - domestic", "sales - export", "service revenue", 
      "professional fees received", "job work charges received", "contract revenue", 
      "consultancy charges billed", "turnover"
    ],
    mcaRowOrder: 250
  },
  {
    id: "other_income",
    code: "PL-REV-02",
    statement: "PROFIT_AND_LOSS",
    category: "REVENUE",
    title: "Other Income",
    noteNumber: 24,
    noteTitle: "Other Income (Interest, Discounts Received, Dividend & Forex Gain)",
    expectedBalance: "CREDIT",
    tallyParentHints: ["Indirect Incomes"],
    keywords: [
      "interest on fd", "interest on income tax refund", "interest received", 
      "discount received", "dividend received", "scrap sales", "forex gain", 
      "profit on sale of assets", "miscellaneous income", "commission received"
    ],
    mcaRowOrder: 260
  },
  // Expenses
  {
    id: "cost_of_materials_consumed",
    code: "PL-EXP-01",
    statement: "PROFIT_AND_LOSS",
    category: "EXPENSES",
    title: "Cost of Materials Consumed",
    noteNumber: 25,
    noteTitle: "Cost of Materials Consumed (Raw Material + Purchases - Closing)",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Purchase Accounts", "Direct Expenses"],
    keywords: ["raw material purchase", "raw material consumed", "purchase of raw material", "direct purchase"],
    mcaRowOrder: 270
  },
  {
    id: "purchases_of_stock_in_trade",
    code: "PL-EXP-02",
    statement: "PROFIT_AND_LOSS",
    category: "EXPENSES",
    title: "Purchases of Stock-in-Trade",
    noteNumber: 25,
    noteTitle: "Purchases of Stock-in-Trade (Traded Goods)",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Purchase Accounts"],
    keywords: ["purchase - traded goods", "purchase of finished goods", "stock purchase"],
    mcaRowOrder: 280
  },
  {
    id: "changes_in_inventories",
    code: "PL-EXP-03",
    statement: "PROFIT_AND_LOSS",
    category: "EXPENSES",
    title: "Changes in Inventories of Finished Goods, WIP and Stock-in-Trade",
    noteNumber: 25,
    noteTitle: "Changes in Inventories",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Direct Expenses"],
    keywords: ["change in inventory", "opening stock less closing stock", "inventory adjustment"],
    mcaRowOrder: 290
  },
  {
    id: "employee_benefits_expense",
    code: "PL-EXP-04",
    statement: "PROFIT_AND_LOSS",
    category: "EXPENSES",
    title: "Employee Benefits Expense",
    noteNumber: 26,
    noteTitle: "Employee Benefits (Salaries, Director Remuneration, PF & Gratuity)",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Direct Expenses", "Indirect Expenses"],
    keywords: [
      "salary", "salaries", "wages", "director remuneration", "staff welfare", 
      "provident fund employer contribution", "pf contribution", "esic contribution", 
      "bonus", "gratuity expense", "leave encashment expense", "stipend"
    ],
    mcaRowOrder: 300
  },
  {
    id: "finance_costs",
    code: "PL-EXP-05",
    statement: "PROFIT_AND_LOSS",
    category: "EXPENSES",
    title: "Finance Costs",
    noteNumber: 27,
    noteTitle: "Finance Costs (Interest on Term Loans/CC, Bank Charges & Loan Processing)",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Indirect Expenses"],
    keywords: [
      "interest on cc", "interest on term loan", "interest on car loan", 
      "bank charges", "loan processing fees", "interest on unsecured loan", 
      "lc charges", "bank guarantee charges", "interest on tds/tax"
    ],
    mcaRowOrder: 310
  },
  {
    id: "depreciation_and_amortization",
    code: "PL-EXP-06",
    statement: "PROFIT_AND_LOSS",
    category: "EXPENSES",
    title: "Depreciation and Amortization Expense",
    noteNumber: 28,
    noteTitle: "Depreciation & Amortization (As per Schedule II Useful Life)",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Indirect Expenses"],
    keywords: ["depreciation", "amortisation", "depreciation on machinery", "depreciation on building"],
    mcaRowOrder: 320
  },
  {
    id: "other_expenses",
    code: "PL-EXP-07",
    statement: "PROFIT_AND_LOSS",
    category: "EXPENSES",
    title: "Other Expenses",
    noteNumber: 29,
    noteTitle: "Other Expenses (Audit Fees, Rent, Rates, Repairs, Legal & Marketing)",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Indirect Expenses", "Direct Expenses"],
    keywords: [
      "rent", "office rent", "audit fees", "statutory audit fees", "legal charges", 
      "professional fees paid", "printing & stationery", "travelling & conveyance", 
      "electricity expense", "power & fuel", "repairs & maintenance", "insurance", 
      "freight outward", "advertisement & marketing", "courier & postage", "telephone & internet", 
      "rates & taxes", "software subscription", "security service charges", "cleaning expense"
    ],
    mcaRowOrder: 330
  },
  {
    id: "current_tax_expense",
    code: "PL-TAX-01",
    statement: "PROFIT_AND_LOSS",
    category: "TAX_EXPENSE",
    title: "Current Tax",
    noteNumber: 30,
    noteTitle: "Current Tax Expense (MAT / Section 115BAA Regular Tax)",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Provisions"],
    keywords: ["current tax", "tax expense", "provision for income tax (p&l)"],
    mcaRowOrder: 340
  },
  {
    id: "deferred_tax_expense",
    code: "PL-TAX-02",
    statement: "PROFIT_AND_LOSS",
    category: "TAX_EXPENSE",
    title: "Deferred Tax Charge / (Credit)",
    noteNumber: 30,
    noteTitle: "Deferred Tax Charge / (Credit)",
    expectedBalance: "DEBIT",
    tallyParentHints: ["Indirect Expenses"],
    keywords: ["deferred tax charge", "deferred tax credit"],
    mcaRowOrder: 350
  }
];

// Helper to look up head definition
export function getSchedule3HeadById(headId: string): Schedule3HeadDefinition | undefined {
  return SCHEDULE3_HEADS.find((h) => h.id === headId);
}
