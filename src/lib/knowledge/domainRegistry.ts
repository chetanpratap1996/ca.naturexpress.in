/**
 * Brains & Taxes — Complete CA Knowledge Framework Registry
 * 
 * Formal Registry of 20 Core CA Practice Domains across the 12-Dimensional Statutory Knowledge Schema.
 * Engineered for Indian Chartered Accountants with 20+ Years Professional Experience.
 */

import { CADomainDefinition, CADomainId } from './types';

export const CA_DOMAINS_CATALOG: CADomainDefinition[] = [
  // --------------------------------------------------------------------------
  // DOMAIN 1: ACCOUNTING & FINANCIAL REPORTING
  // --------------------------------------------------------------------------
  {
    id: '1_ACCOUNTING_FINANCIAL_REPORTING',
    domainNumber: 1,
    title: 'Accounting & Financial Reporting',
    tagline: 'Ind AS, AS, Schedule III, Consolidation & True & Fair Financial Architecture',
    primaryStatutoryActs: ['Companies Act, 2013 (Section 129, 133, 134, Schedule III)', 'ICAI Accounting Standards'],
    governingRegulatoryBodies: ['ICAI (Accounting Standards Board)', 'NFRA', 'MCA'],
    seniorCaExpectation: 'Absolute mastery over GAAP convergence, Ind AS transition adjustments, deferred tax calculations, component depreciation, and statutory disclosures under Schedule III Division I, II & III.',
    subTopics: [
      'Accounting Principles and Concepts',
      'Indian Accounting Standards (Ind AS)',
      'Accounting Standards (AS)',
      'IFRS Convergence',
      'Double Entry Bookkeeping & Internal Controls',
      'Journal Entries and Ledger Management',
      'Trial Balance Scrubbing & Reconciliation',
      'Profit & Loss Account Preparation',
      'Balance Sheet Structuring',
      'Cash Flow Statements (Direct vs Indirect - Ind AS 7 / AS 3)',
      'Consolidation of Financial Statements (Ind AS 110 / AS 21)',
      'Revenue Recognition (Ind AS 115 5-Step Model vs AS 9)',
      'Depreciation and Amortisation (Schedule II Useful Life vs Technical Estimates)',
      'Provisions, Contingent Liabilities & Contingent Assets (Ind AS 37 / AS 29)',
      'Inventory Valuation (Ind AS 2 / AS 2 - Net Realisable Value)',
      'Financial Statement Analysis & Ratio Analytics',
      'Schedule III of Companies Act (Division I - AS, Division II - Ind AS, Division III - NBFC)',
      'Accounting Policies, Changes in Estimates and Errors (Ind AS 8 / AS 5)'
    ],
    dimensions: {
      applicableStatutes: [
        {
          actName: 'Companies Act, 2013',
          actYear: 2013,
          section: 'Section 129(1)',
          title: 'Financial Statements shall give a True and Fair View',
          statutoryText: 'The financial statements shall give a true and fair view of the state of affairs of the company, comply with the accounting standards notified under section 133 and be in the form provided in Schedule III.',
          isNonObstante: false,
          hasDeemingFiction: false,
          provisos: ['Nothing contained in this sub-section shall apply to insurance, banking, electricity companies governed by special acts.'],
          explanations: ['Financial statements must comply with all mandatory disclosure requirements of Schedule III.']
        }
      ],
      subordinateRules: [
        {
          parentActSection: 'Section 133 of Companies Act, 2013',
          ruleBook: 'Companies (Indian Accounting Standards) Rules, 2015',
          ruleNumber: 'Rule 4',
          ruleTitle: 'Applicability of Ind AS based on Net Worth thresholds',
          prescribedConditions: [
            'Listed companies or companies in the process of listing',
            'Unlisted companies having net worth >= INR 250 Crores',
            'Holding, subsidiary, joint venture or associate of companies covered above',
            'Once Ind AS applies, it is irrevocable.'
          ]
        }
      ],
      formsAndFilings: [
        {
          formNumber: 'AOC-4 / AOC-4 CFS / AOC-4 XBRL',
          formTitle: 'Filing of Financial Statements with Registrar of Companies',
          statutoryAuthority: 'MCA',
          portal: 'MCA21_V3',
          filingMode: 'XBRL_INSTANCE',
          verificationMode: 'DSC_CLASS_3',
          mandatoryAttachments: ['Auditors Report with CARO 2020', 'Directors Report', 'Notice of AGM', 'MGT-9 / Extract of Annual Return'],
          statutoryCertificationRequired: true
        }
      ],
      timelinesAndApplicability: [
        {
          entityTypeApplicability: ['PVT_LTD', 'PUBLIC_LTD', 'OPC'],
          recurringFrequency: 'ANNUAL',
          statutoryDueDateFormula: 'Within 30 days of the Annual General Meeting (typically by 29th October for 30th Sept AGM)',
          limitationPeriod: 'Mandatory annual requirement; late fee INR 100/day accrued continuously under Section 403.'
        }
      ],
      latestAmendments: [
        {
          amendmentSource: 'MCA Notification G.S.R. 207(E)',
          effectiveDate: '2021-04-01',
          applicableFinancialYear: 'FY 2021-22 onwards',
          isRetrospective: false,
          summaryOfChange: 'Mandatory Schedule III amendments: 11 analytical ratios with variance explanations > 25%, Benami property disclosures, aging of trade payables & receivables, undisclosed income surrendered in Tax search, crypto asset disclosures, audit trail (edit log) feature in accounting software.',
          preAmendmentPosition: 'Older condensed format without compulsory ratio variance disclosures or aging brackets.',
          postAmendmentPosition: 'Strict mandatory disclosure of trade payables (MSME vs Others, MSME dispute aging), capital WIP aging, and audit trail confirmation in directors/auditors reports.'
        }
      ],
      administrativeGuidance: [
        {
          guidanceType: 'MCA_CIRCULAR',
          referenceNumber: 'ICAI Guidance Note on Schedule III',
          issueDate: '2022-01-15',
          subject: 'Guidance Note on Division I and II of Schedule III to the Companies Act 2013',
          bindingOnRevenue: false,
          bindingOnAssesseeOrCourt: false,
          keyClarifications: [
            'Trade payables must be categorized under MSME based on supplier Udyam certificates in possession.',
            'Ratio variance calculation requires comparative computation against immediately preceding financial year.'
          ]
        }
      ],
      judicialPrecedents: [
        {
          caseTitle: 'CIT v. Woodward Governor India (P) Ltd',
          citation: '(2009) 312 ITR 254 (SC)',
          forum: 'SUPREME_COURT',
          jurisdiction: 'PAN_INDIA',
          judgmentDate: '2009-04-08',
          keyLegalIssue: 'Treatment of unrealised foreign exchange fluctuation loss at the year-end balance sheet date under AS 11.',
          ratioDecidendi: 'Loss arising from foreign exchange fluctuation on revenue account liabilities as on the balance sheet date computed under Accounting Standard 11 is an allowable business expenditure and not a notional loss.',
          isOverruled: false,
          favourability: 'FAVOUR_OF_ASSESSEE',
          practiceApplicationNotes: 'Essential precedent when department attempts to disallow MTM / year-end forex restatements under Section 37(1).'
        }
      ],
      practicalCalculations: [
        {
          calculationCode: 'CALC_SCHEDULE_III_RATIOS',
          title: 'Schedule III 11 Mandatory Analytical Ratios & Variance Trigger',
          formulaDescription: 'Compute current ratio, debt-equity, debt service coverage, return on equity, inventory turnover, trade receivables turnover, trade payables turnover, net capital turnover, net profit ratio, return on capital employed, return on investment. If variance > 25%, trigger mandatory narrative disclosure.',
          mathematicalLogic: 'Variance % = ((Current Year Ratio - Previous Year Ratio) / Previous Year Ratio) * 100',
          inputVariables: [
            { name: 'Current Assets', type: 'CURRENCY', description: 'Total current assets from Balance Sheet' },
            { name: 'Current Liabilities', type: 'CURRENCY', description: 'Total current liabilities' }
          ],
          workedExample: {
            scenarioDescription: 'Unlisted manufacturing company Current Ratio dropped from 2.1 to 1.4 due to short-term supplier vendor credits.',
            sampleInputs: { pyRatio: 2.1, cyRatio: 1.4 },
            stepByStepComputation: [
              { stepNumber: 1, title: 'Compute Difference', computedValue: '-0.7', notes: '1.4 - 2.1 = -0.7' },
              { stepNumber: 2, title: 'Compute Percentage Variance', computedValue: '-33.33%', notes: '(-0.7 / 2.1) * 100 = -33.33%' }
            ],
            finalResult: 'Mandatory Schedule III note triggered: Reason is expansion of raw material credit terms from 30 to 90 days.'
          }
        }
      ],
      caseStudies: [
        {
          caseCode: 'CS_INDAS_115_REALESTATE',
          industry: 'Real Estate & Infrastructure',
          businessContext: 'Transition from percentage of completion method (POCM under Guidance Note) to completion contract method under Ind AS 115.',
          factualMatrix: 'A premier developer had recognized INR 45 Cr revenue under POCM. Under Ind AS 115, performance obligation satisfied only upon physical delivery / occupancy certificate.',
          statutoryConflictIdentified: 'Retained earnings adjustment on transition date vs revenue reversal impacting banking covenants and net worth.',
          strategicResolution: 'Applied modified retrospective transition approach to opening reserves; renegotiated debt covenants with lead banker using pro-forma EBITDA reconciliation.',
          quantifiedSavingsOrRiskAvoidanceInr: 120000000,
          deliverablesProduced: ['Ind AS 115 Transition Working Paper', 'Banker Information Memorandum', 'CARO 2020 Restatement Note']
        }
      ],
      commonErrorsAndTraps: [
        {
          errorCode: 'ERR_SCH3_MSME_CLASSIFICATION',
          category: 'INCORRECT_DISCLOSURE',
          errorDescription: 'Failing to bifurcate trade payables into (a) total outstanding dues of MSME and (b) total outstanding dues of creditors other than MSME, due to lack of vendor Udyam tracking.',
          departmentTriggerRisk: 'ROC show-cause notice u/s 450; CARO 2020 Clause 3(xxi) / 3CD Clause 22 statutory non-compliance.',
          consequence: 'Director disqualification risk, audit qualification, and Section 43B(h) automatic tax scrutiny trigger.',
          preventiveChecklist: ['Run automated MSME Udyam status checker against all active vendor PANs every quarter.', 'Issue formal annual circular to vendors requesting enterprise status.'],
          rectificationMechanism: 'Restate Schedule III disclosures in next reporting period with prior-period error note under Ind AS 8 / AS 5.'
        }
      ],
      noticeAndAppellateProcedures: [
        {
          noticeSection: 'Section 206(1) of Companies Act, 2013',
          issuingAuthority: 'Registrar of Companies (ROC)',
          statutoryResponseDays: 15,
          groundsOfDefense: {
            isJurisdictionalChallenge: false,
            primaryDefenseArg: 'Financial statements comply strictly with notified accounting standards under Section 133 and Schedule III.',
            substantiveMeritsArg: 'All material disclosures, including aging schedules and MSME details, match audited books.'
          },
          proceduralChecklist: ['Verify notice DIN', 'Submit board authorized reply via MCA portal under Form GNL-1 / e-mail reply'],
          draftingStructureTemplate: ['Formal address to ROC', 'Brief facts of the company', 'Point-by-point tabular response to queries', 'Auditors certificate annexure', 'Prayer for drop of proceedings'],
          appealHierarchyPath: ['Regional Director (RD)', 'NCLT u/s 420', 'NCLAT u/s 421', 'Supreme Court of India u/s 423']
        }
      ],
      advisoryFramework: {
        opinionCategory: 'ACCOUNTING_DISCLOSURE',
        standardStructure: [
          { sectionTitle: 'Background and Factual Context', contentGuidance: 'Identify company class, turnover, applicable GAAP (AS vs Ind AS), and specific transaction.' },
          { sectionTitle: 'Statutory Framework', contentGuidance: 'Cite exact paragraphs of Ind AS/AS and Section 129/133 of Companies Act.' },
          { sectionTitle: 'Technical Accounting Analysis', contentGuidance: 'Analyze recognition, measurement, and presentation.' },
          { sectionTitle: 'Auditor & Regulatory Exposure', contentGuidance: 'State whether qualification in CARO 2020 or Audit Report is required.' },
          { sectionTitle: 'Conclusion & Actionable Steps', contentGuidance: 'Clear journal entry and disclosure text for notes to accounts.' }
        ],
        riskGradingMatrix: [
          {
            grade: 'CONSERVATIVE_SAFE',
            taxSavingsPotential: 'Neutral',
            litigationProbability: 'Near Zero',
            requiredDisclosures: ['Full footnote disclosure with quantitative sensitivity analysis']
          }
        ],
        icaiComplianceStandards: ['SQC 1', 'SA 700 Forming an Opinion and Reporting on Financial Statements', 'SA 230 Documentation'],
        boilerplateCaveatsAndDisclaimers: ['This opinion is based on accounting standards and statutory provisions prevailing as on date. Any future retrospective amendments or judicial interpretations by NFRA/Courts may impact this view.']
      }
    }
  },

  // --------------------------------------------------------------------------
  // DOMAIN 2: DIRECT TAXATION – INCOME TAX
  // --------------------------------------------------------------------------
  {
    id: '2_DIRECT_TAXATION_INCOME_TAX',
    domainNumber: 2,
    title: 'Direct Taxation – Income Tax',
    tagline: 'Income Tax Act 1961, Computational Rigor, Presumptive Taxation, Capital Gains & Anti-Avoidance',
    primaryStatutoryActs: ['Income Tax Act, 1961', 'Finance Acts (Annual Amendments)', 'Income Tax Rules, 1962'],
    governingRegulatoryBodies: ['Central Board of Direct Taxes (CBDT)', 'Ministry of Finance'],
    seniorCaExpectation: 'Exhaustive grasp of heads of income, deeming fictions (Sec 50C, 56(2)(x), 56(2)(viib), 68), business disallowances (Sec 40(a)(ia), 40A(3), 43B(h)), Section 115BAA/BAB corporate tax regimes, MAT u/s 115JB, and reassessment limits u/s 147-151.',
    subTopics: [
      'Income Tax Act, 1961 & Yearly Finance Act Amendments',
      'Residential Status & POEM (Place of Effective Management)',
      'Five Heads of Income & Intersperse Losses',
      'Salary Income, Perquisites & Standard Deduction',
      'House Property Income, Composite Rent & Interest Limits',
      'Profits and Gains of Business or Profession (PGBP - Sec 28 to 44DB)',
      'Capital Gains (Sec 45-55A, Slump Sale 50B, 112A, 111A, Indexation/Grandfathering)',
      'Income from Other Sources (Sec 56-59, Angel Tax 56(2)(viib), Gift Tax 56(2)(x))',
      'Deductions (Chapter VI-A: 80C, 80D, 80G, 80-IAC, 80JJAA)',
      'Tax Regime Comparison (Sec 115BAC Default vs Old Slabs, Sec 115BAA 22% Corporate)',
      'Tax Computation, Surcharge, Health & Education Cess, Rebate 87A',
      'Advance Tax (Sec 207-211) & Mandatory Interest (Sec 234A, 234B, 234C, 220)',
      'Self-Assessment Tax u/s 140A & Tax Audit 44AB Limits',
      'Presumptive Taxation (Sec 44AD, 44ADA, 44AE) & Cash Receipt Safeguards',
      'Set-off and Carry Forward of Losses (Sec 70-80, Inter-head vs Intra-head)',
      'Clubbing of Income (Sec 60-64)',
      'Unexplained Credits & Cash Credits (Sec 68, 69, 69A, 69B, 69C, 115BBE 78% Tax)',
      'Reassessment Proceedings (Sec 147, 148, 148A, 149 Limitation, 151 Sanctions)'
    ],
    dimensions: {
      applicableStatutes: [
        {
          actName: 'Income Tax Act, 1961',
          actYear: 1961,
          section: 'Section 43B(h)',
          title: 'Deduction for Sums Payable to Micro or Small Enterprises Beyond MSMEDA Timelines',
          statutoryText: 'Any sum payable by the assessee to a micro or small enterprise beyond the time limit specified in section 15 of the Micro, Small and Medium Enterprises Development Act, 2006 shall be allowed only in computing the income of the previous year in which such sum is actually paid.',
          isNonObstante: true,
          hasDeemingFiction: false,
          provisos: ['First proviso to section 43B (allowing payment before ITR filing due date) DOES NOT apply to clause (h).'],
          explanations: ['Applicable only to Micro and Small enterprises; Medium enterprises excluded. Traders registered under Udyam for priority sector lending excluded per OM 2/1(5)/2021-P&G/Policy dated 02.07.2021.']
        }
      ],
      subordinateRules: [
        {
          parentActSection: 'Section 43B(h)',
          ruleBook: 'Income Tax Rules, 1962',
          ruleNumber: 'Form 3CD Clause 22',
          ruleTitle: 'Reporting of Interest and Disallowance under MSMED Act, 2006',
          prescribedConditions: [
            'Obtain written verification of MSME status and Udyam certificate from suppliers',
            'Compute payment timeline: 15 days without written agreement, maximum 45 days with written agreement',
            'Disallow unpaid amount as on 31st March in computation of business income for current FY'
          ]
        }
      ],
      formsAndFilings: [
        {
          formNumber: 'ITR-1 through ITR-7',
          formTitle: 'Annual Income Tax Returns',
          statutoryAuthority: 'CBDT',
          portal: 'E_FILING_IT',
          filingMode: 'JSON_SCHEMA',
          verificationMode: 'DSC_CLASS_3',
          mandatoryAttachments: ['Form 3CA/3CB-3CD for Audit cases', 'Form 10B/10BB for Trusts', 'Form 29B for MAT'],
          statutoryCertificationRequired: true
        }
      ],
      timelinesAndApplicability: [
        {
          entityTypeApplicability: ['PVT_LTD', 'PUBLIC_LTD', 'TAX_AUDIT_ASSESSEE'],
          recurringFrequency: 'ANNUAL',
          statutoryDueDateFormula: '31st October of Assessment Year (extended from 31st July)',
          limitationPeriod: 'Belated return u/s 139(4) or Revised return u/s 139(5) allowed up to 31st December of AY; Updated return ITR-U u/s 139(8A) allowed up to 24 months from end of relevant AY with 25%/50% additional tax.'
        }
      ],
      latestAmendments: [
        {
          amendmentSource: 'Finance (No. 2) Act, 2024',
          effectiveDate: '2024-07-23',
          applicableFinancialYear: 'FY 2024-25 onwards',
          isRetrospective: false,
          summaryOfChange: 'Abolition of Angel Tax under Section 56(2)(viib); Rationalisation of Capital Gains: Long-term capital gains tax standardized at 12.5% across all asset classes with removal of indexation for properties acquired on or after 23.07.2024 (with grandfathered option for resident individuals/HUFs for pre-23.07.2024 properties); STCG under Sec 111A raised from 15% to 20%; Buyback of shares taxed as dividend in hands of shareholders.',
          preAmendmentPosition: 'Angel Tax applied to share premium over FMV for unlisted shares; LTCG on real estate had 20% with indexation; buyback tax was 20% + surcharge on company under Sec 115QA.',
          postAmendmentPosition: 'Startups and unlisted companies completely free from Section 56(2)(viib) valuation disputes; new simplified capital gains regime.'
        }
      ],
      administrativeGuidance: [
        {
          guidanceType: 'CBDT_CIRCULAR',
          referenceNumber: 'Circular No. 1/2024',
          issueDate: '2024-01-23',
          subject: 'Clarifications regarding Section 43B(h) and MSME payments',
          bindingOnRevenue: true,
          bindingOnAssesseeOrCourt: false,
          keyClarifications: [
            'Provisions apply only to purchases made on or after 01.04.2023.',
            'Outstanding dues to wholesale and retail traders registered under Udyam not hit by disallowance as their registration is limited to Priority Sector Lending.'
          ]
        }
      ],
      judicialPrecedents: [
        {
          caseTitle: 'CIT v. Excel Industries Ltd',
          citation: '(2013) 358 ITR 295 (SC)',
          forum: 'SUPREME_COURT',
          jurisdiction: 'PAN_INDIA',
          judgmentDate: '2013-10-08',
          keyLegalIssue: 'Concept of Real Income vs Hypothetical Income under the Income Tax Act.',
          ratioDecidendi: 'Income tax can be levied only on real income and not on hypothetical income. Where an amount has neither accrued nor been received, it cannot be brought to tax merely on the basis of book entries.',
          isOverruled: false,
          favourability: 'FAVOUR_OF_ASSESSEE',
          practiceApplicationNotes: 'Foundation for resisting additions based on artificial portal reconciliations, AIS discrepancies, and unrealized export incentives.'
        }
      ],
      practicalCalculations: [
        {
          calculationCode: 'CALC_INTEREST_234ABC',
          title: 'Mandatory Advance Tax Interest under Sections 234A, 234B & 234C',
          formulaDescription: '234A: 1% per month for delay in return filing after due date on net tax payable; 234B: 1% per month from 1st April of AY if advance tax paid < 90% of assessed tax; 234C: 1% per month for deferment of quarterly installments (15%, 45%, 75%, 100%).',
          mathematicalLogic: 'Simple interest @ 1% per month or part of a month on shortfall rounded down to nearest multiple of INR 100 under Rule 119A.',
          inputVariables: [
            { name: 'Assessed Tax Payable', type: 'CURRENCY', description: 'Net tax after TDS/TCS and MAT credit' },
            { name: 'Advance Tax Paid by Due Dates', type: 'CURRENCY', description: 'Installments paid on or before 15 June, 15 Sept, 15 Dec, 15 March' }
          ],
          workedExample: {
            scenarioDescription: 'Assessee tax liability INR 10 Lakhs. Paid INR 1 Lakh on 15 June, INR 2 Lakhs on 15 Sept, INR 2 Lakhs on 15 Dec, INR 3 Lakhs on 15 March.',
            sampleInputs: { totalTax: 1000000, t1: 100000, t2: 200000, t3: 200000, t4: 300000 },
            stepByStepComputation: [
              { stepNumber: 1, title: 'Quarter 1 (15%) Shortfall', computedValue: 'INR 50,000 shortfall x 1% x 3 months = INR 1,500', notes: 'Expected 1.5L, paid 1.0L' },
              { stepNumber: 2, title: 'Quarter 2 (45%) Shortfall', computedValue: 'INR 150,000 shortfall x 1% x 3 months = INR 4,500', notes: 'Expected 4.5L, cumulative paid 3.0L' }
            ],
            finalResult: 'Total Section 234C interest computed deterministically.'
          }
        }
      ],
      caseStudies: [
        {
          caseCode: 'CS_SLUMP_SALE_50B_RESTRUCTURING',
          industry: 'Automobile Components',
          businessContext: 'Business undertaking slump sale vs asset sale of loss-making tooling division.',
          factualMatrix: 'Client enterprise selling machinery division with book value INR 12 Cr for lump sum consideration of INR 28 Cr.',
          statutoryConflictIdentified: 'Application of Section 50B net worth computation vs Section 50 depreciable asset short term capital gains vs Rule 11UAE fair market value determination.',
          strategicResolution: 'Obtained CA Net Worth Certificate in Form 3CEA; applied Rule 11UAE Method 1 (book value of assets/liabilities) and Method 2 (monetary consideration); structured transaction to avail long-term capital gains indexed benefit.',
          quantifiedSavingsOrRiskAvoidanceInr: 34000000,
          deliverablesProduced: ['Form 3CEA Slump Sale Certificate', 'Business Transfer Agreement (BTA) Tax Clauses', 'Computation Working Paper']
        }
      ],
      commonErrorsAndTraps: [
        {
          errorCode: 'ERR_SEC_68_UNEXPLAINED_CREDIT',
          category: 'AUDIT_DISALLOWANCE',
          errorDescription: 'Treating unsecured loans or share application money without establishing identity, creditworthiness, and genuineness of lender under Section 68.',
          departmentTriggerRisk: 'Automated Insight / CASS flag on high-value loan receipts leading to Section 148A show cause notice.',
          consequence: 'Punitive taxation under Section 115BBE @ 60% basic tax + 25% surcharge + 4% cess = Effective 78% tax rate, plus no deduction of any expenditure.',
          preventiveChecklist: ['Mandatory 3-pillar documentation: PAN, ITR acknowledgment, audited balance sheet of lender, and bank statement evidencing banking channel transfer.', 'Confirm lender has sufficient net worth/liquidity.'],
          rectificationMechanism: 'Submit comprehensive paper book with lender confirmation and bank trail during 148A / 143(3) proceedings.'
        }
      ],
      noticeAndAppellateProcedures: [
        {
          noticeSection: 'Section 148A(b)',
          issuingAuthority: 'Faceless Assessing Officer (FAO) / Jurisdictional AO (JAO)',
          statutoryResponseDays: 14,
          groundsOfDefense: {
            isJurisdictionalChallenge: true,
            primaryDefenseArg: 'Notice issued without valid "information suggesting escapement of income" as defined in Explanation 1 to Section 148.',
            substantiveMeritsArg: 'The entire transaction is reflected in audited books and bank statements; no income has escaped assessment.',
            limitationDefense: 'Notice issued beyond 3 years from end of relevant AY where alleged escaped income is less than INR 50 Lakhs (violating Section 149(1)(a)).'
          },
          proceduralChecklist: ['Verify DIN', 'Check whether prior approval of specified authority (PCIT/CCIT) obtained u/s 151', 'Ensure portal upload within limitation window'],
          draftingStructureTemplate: ['Preliminary Legal Objections (Jurisdiction & Limitation)', 'Factual Matrix & Nature of Business', 'Rebuttal of Information / Flagged Item', 'Judicial Precedents on Non-Application of Mind', 'Prayer to drop proceedings u/s 148A(d)'],
          appealHierarchyPath: ['High Court Writ Petition under Article 226 (if jurisdictional defect fatal)', 'CIT(Appeals) / NFAC', 'ITAT', 'High Court u/s 260A', 'Supreme Court']
        }
      ],
      advisoryFramework: {
        opinionCategory: 'TRANSACTION_STRUCTURING',
        standardStructure: [
          { sectionTitle: 'Statement of Facts', contentGuidance: 'Chronological events, contracts, parties involved.' },
          { sectionTitle: 'Specific Issues for Consideration', contentGuidance: 'Formulate precise legal questions (e.g., Whether Sec 56(2)(x) applies).' },
          { sectionTitle: 'Statutory Provisions and Case Laws', contentGuidance: 'Quote exact text and binding precedents.' },
          { sectionTitle: 'Risk Analysis & Probability of Litigation', contentGuidance: 'High/Medium/Low exposure rating.' },
          { sectionTitle: 'Actionable Recommendations', contentGuidance: 'Clear execution steps and documentation safeguards.' }
        ],
        riskGradingMatrix: [
          {
            grade: 'ARGUABLE_DEFENSIBLE',
            taxSavingsPotential: 'High',
            litigationProbability: '50-60%',
            requiredDisclosures: ['Disclose in Notes to Accounts and ITR Schedule Exempt Income / Disclosures to prevent Section 270A penalty for misreporting.']
          }
        ],
        icaiComplianceStandards: ['SQC 1', 'ICAI Code of Ethics Part 1 & 2', 'Guidance Note on Tax Audit'],
        boilerplateCaveatsAndDisclaimers: ['This advice is rendered solely for the benefit of the addressee based on factual information provided. It does not constitute a warranty against adverse view by appellate authorities.']
      }
    }
  },

  // --------------------------------------------------------------------------
  // DOMAIN 3: GST – GOODS AND SERVICES TAX
  // --------------------------------------------------------------------------
  {
    id: '3_GST_GOODS_AND_SERVICES_TAX',
    domainNumber: 3,
    title: 'GST – Goods and Services Tax',
    tagline: 'CGST, SGST, IGST, ITC Optimization, E-Invoicing, Reconciliations & GSTAT Litigation',
    primaryStatutoryActs: ['Central Goods and Services Tax (CGST) Act, 2017', 'Integrated Goods and Services Tax (IGST) Act, 2017', 'State/UT GST Acts'],
    governingRegulatoryBodies: ['GST Council', 'Central Board of Indirect Taxes and Customs (CBIC)', 'State GST Directorates', 'GSTAT'],
    seniorCaExpectation: 'Exhaustive proficiency in ITC conditions (Sec 16(2)), blocked credit (Sec 17(5)), time and place of supply, reverse charge, e-invoicing JSON generation, GSTR-2B dynamic reconciliation, Section 73/74/74A limitation defense, and DRC-01 replies.',
    subTopics: [
      'CGST, SGST, IGST & UTGST Framework and Constitutional 101st Amendment',
      'GST Registration (Compulsory Sec 24 vs Threshold Sec 22, Multiple Branches, ISD)',
      'Classification of Goods and Services & HSN/SAC Coding Standards',
      'Concept of Supply (Sec 7, Schedule I, II, III Activities)',
      'Time of Supply (Goods Sec 12 vs Services Sec 13)',
      'Place of Supply (Domestic Goods Sec 10, Cross-Border Goods Sec 11, Services Sec 12 & 13)',
      'Value of Supply (Sec 15, Valuation Rules 27-35, Related Party / Distinct Person)',
      'Input Tax Credit (ITC - Sec 16, 17, 18)',
      'Blocked Credits under Section 17(5) (Motor Vehicles, Food, Works Contract, Personal Consumption)',
      'Dynamic ITC Reconciliation (Books vs GSTR-2B vs GSTR-3B & Rule 37A Supplier Default)',
      'Reverse Charge Mechanism (RCM - Sec 9(3) & 9(4), GTA, Legal Services, Director Remuneration)',
      'Composition Scheme (Sec 10) & Threshold Limits',
      'E-Invoicing Framework (IRN Generation, QR Code & Threshold Roadmaps)',
      'E-Way Bill Architecture (Rule 138, Movement of Goods, Inter-State vs Intra-State, Part A & B)',
      'GST Returns Architecture (GSTR-1 Outward, GSTR-3B Monthly Summary, GSTR-9 Annual, GSTR-9C Reconciliation)',
      'GST Refunds (Export with/without Tax, Inverted Duty Structure, Rule 89, Formula Calculations)',
      'Export and Import under GST (LUT, Zero-Rated Supply, SEZ Supplies)',
      'Job Work Provisions (Sec 143, Form ITC-04, Time Limits for Return of Goods)',
      'GST Audit, Assessment & Departmental Inquiries (Sec 59, 61, 65, 66, 67)',
      'GST Demand, Recovery, Penalties & Notices (Sec 73, 74, 74A New Unified Regime, DRC-01A, DRC-01)',
      'GST Appeals & Litigation (First Appellate Authority Sec 107, GSTAT Sec 109, High Court, Supreme Court)'
    ],
    dimensions: {
      applicableStatutes: [
        {
          actName: 'Central Goods and Services Tax Act, 2017',
          actYear: 2017,
          section: 'Section 16(2)(aa)',
          title: 'Mandatory Condition for Availing Input Tax Credit',
          statutoryText: 'No registered person shall be entitled to the credit of any input tax in respect of any supply of goods or services or both to him unless the details of the invoice or debit note has been furnished by the supplier in the statement of outward supplies and such details have been communicated to the recipient of such invoice or debit note in the manner specified under section 38.',
          isNonObstante: true,
          hasDeemingFiction: false,
          provisos: ['Where supplier has not paid tax under Section 16(2)(c), recipient must comply with Rule 37A reversal.'],
          explanations: ['Credit can be claimed strictly based on GSTR-2B generated on the 14th of the following month.']
        }
      ],
      subordinateRules: [
        {
          parentActSection: 'Section 16(2)(c) & Section 41',
          ruleBook: 'CGST Rules, 2017',
          ruleNumber: 'Rule 37A',
          ruleTitle: 'Reversal of Input Tax Credit in the Case of Non-Payment of Tax by Supplier and Re-availment Thereof',
          prescribedConditions: [
            'Supplier failed to furnish GSTR-3B by 30th September following end of FY in which ITC availed',
            'Recipient must reverse ITC in GSTR-3B on or before 30th November following end of FY',
            'If recipient fails to reverse by 30th November, interest payable under Section 50',
            'When supplier subsequently files GSTR-3B, recipient entitled to re-avail reversed credit anytime without limitation.'
          ]
        }
      ],
      formsAndFilings: [
        {
          formNumber: 'GSTR-1, GSTR-3B, GSTR-9, GSTR-9C',
          formTitle: 'Comprehensive GST Filing Suite',
          statutoryAuthority: 'CBIC',
          portal: 'GSTN',
          filingMode: 'JSON_SCHEMA',
          verificationMode: 'DSC_CLASS_3',
          mandatoryAttachments: ['Audited Financial Statements for GSTR-9C', 'HSN Summary', 'Reconciliation Statement'],
          statutoryCertificationRequired: false // Self-certified by taxpayer under post-2021 law, prepared by CA
        }
      ],
      timelinesAndApplicability: [
        {
          entityTypeApplicability: ['REGULAR_TAXPAYER'],
          recurringFrequency: 'MONTHLY',
          statutoryDueDateFormula: 'GSTR-1 by 11th; GSTR-3B by 20th of succeeding month (or 22nd/24th for QRMP)',
          limitationPeriod: 'Statutory deadline to avail omitted ITC or issue credit notes: 30th November following the end of financial year.'
        }
      ],
      latestAmendments: [
        {
          amendmentSource: 'Finance (No. 2) Act, 2024 / CGST Amendment Act 2024',
          effectiveDate: '2024-11-01',
          applicableFinancialYear: 'FY 2024-25 onwards',
          isRetrospective: false,
          summaryOfChange: 'Introduction of Section 74A: Unified statutory determination of tax not paid, short paid or erroneously refunded for both non-fraud and fraud cases for FY 2024-25 onwards, replacing separate Sec 73 and 74; Insertion of Section 128A providing waiver of interest and penalty for demand notices issued under Section 73 for FY 2017-18, 2018-19, and 2019-20 if tax paid before notified date; Retrospective relaxation of Section 16(4) for FY 2017-18 to 2020-21 allowing ITC up to 30th November 2021.',
          preAmendmentPosition: 'Section 73 had 3-year limitation; Section 74 had 5-year limitation; strict Section 16(4) time-bar caused massive litigation.',
          postAmendmentPosition: 'Section 74A has uniform 42-month show cause notice window and 12-month adjudication period; historic Section 16(4) relief codified.'
        }
      ],
      administrativeGuidance: [
        {
          guidanceType: 'CBIC_CIRCULAR',
          referenceNumber: 'Circular No. 170/02/2022-GST',
          issueDate: '2022-07-06',
          subject: 'Mandatory Reporting of ITC availment, reversal and ineligible ITC in Table 4 of GSTR-3B',
          bindingOnRevenue: true,
          bindingOnAssesseeOrCourt: false,
          keyClarifications: [
            'All ITC available in GSTR-2B must first be availed in Table 4(A).',
            'Permanent ineligible ITC under Section 17(5) must be reversed in Table 4(B)(1).',
            'Temporary reversals (e.g. Rule 37 180-day non-payment, Rule 42) must be reversed in Table 4(B)(2) and re-claimed in Table 4(A)(5) & 4(D)(1).'
          ]
        }
      ],
      judicialPrecedents: [
        {
          caseTitle: 'Union of India v. Mohit Minerals Pvt Ltd',
          citation: '(2022) 10 SCC 700 (SC)',
          forum: 'SUPREME_COURT',
          jurisdiction: 'PAN_INDIA',
          judgmentDate: '2022-05-19',
          keyLegalIssue: 'Levy of IGST on Ocean Freight under reverse charge mechanism on CIF import of goods.',
          ratioDecidendi: 'GST Council recommendations are not binding on Parliament/States; CIF contracts already suffer Customs IGST on composite value of goods including ocean freight. Separate levy on Indian importer under RCM constitutes impermissible double taxation.',
          isOverruled: false,
          favourability: 'FAVOUR_OF_ASSESSEE',
          practiceApplicationNotes: 'Assessees entitled to refund of IGST paid on ocean freight under protest, or to defend DRC-01 notices without pre-deposit.'
        }
      ],
      practicalCalculations: [
        {
          calculationCode: 'CALC_SECTION_50_INTEREST',
          title: 'Section 50(1) GST Interest on Delayed Filing',
          formulaDescription: 'Interest @ 18% per annum payable strictly on the NET TAX PAID IN CASH through Electronic Cash Ledger, not on the gross tax liability settled through Electronic Credit Ledger (proviso to Section 50(1)).',
          mathematicalLogic: 'Interest = (Cash Tax Paid in INR) * (18 / 100) * (Delay Days / 365)',
          inputVariables: [
            { name: 'Gross GST Liability', type: 'CURRENCY', description: 'Total tax liability in GSTR-3B' },
            { name: 'ITC Utilized', type: 'CURRENCY', description: 'Credit ledger offset' },
            { name: 'Cash Paid', type: 'CURRENCY', description: 'Amount debited to cash ledger' },
            { name: 'Days Delayed', type: 'DAYS', description: 'Calendar days between due date and filing date' }
          ],
          workedExample: {
            scenarioDescription: 'Taxpayer filed GSTR-3B 40 days late. Total liability INR 5 Lakhs, paid INR 4 Lakhs via ITC and INR 1 Lakh via cash.',
            sampleInputs: { totalLiability: 500000, itcPaid: 400000, cashPaid: 100000, delayDays: 40 },
            stepByStepComputation: [
              { stepNumber: 1, title: 'Identify Net Cash Liability', computedValue: 'INR 100,000', notes: 'Proviso to Sec 50(1) shields ITC portion' },
              { stepNumber: 2, title: 'Compute Interest', computedValue: 'INR 1,972.60', notes: '100,000 * 0.18 * (40 / 365)' }
            ],
            finalResult: 'Statutory interest payable is strictly INR 1,973. Demand on gross INR 5 Lakhs (INR 9,863) is legally unsustainable.'
          }
        }
      ],
      caseStudies: [
        {
          caseCode: 'CS_GSTR2B_VENDOR_DEFAULT_RECOVERY',
          industry: 'Industrial Engineering & EPC',
          businessContext: 'Defending INR 1.8 Cr ITC mismatch notice in Form DRC-01 issued by DGGI.',
          factualMatrix: 'Client availed ITC based on tax invoices and e-way bills. Supplier filed GSTR-1, but subsequently had GST registration cancelled retrospectively due to non-filing of GSTR-3B.',
          statutoryConflictIdentified: 'Department demand under Section 16(2)(c) vs bona fide purchasing dealer protection under Delhi HC *Arise India* and Calcutta HC *Suncraft Energy*.',
          strategicResolution: 'Filed comprehensive defense establishing that purchasing dealer had discharged consideration through banking channels including GST, verified active GSTIN status at time of transaction; demonstrated revenue cannot proceed against purchaser without first initiating recovery against defaulting supplier.',
          quantifiedSavingsOrRiskAvoidanceInr: 21600000,
          deliverablesProduced: ['Detailed Reply to DRC-01 with 120-page evidentiary Paper Book', 'Rule 37A reconciliation certificate']
        }
      ],
      commonErrorsAndTraps: [
        {
          errorCode: 'ERR_RCM_DIRECTOR_REMUNERATION',
          category: 'AUDIT_DISALLOWANCE',
          errorDescription: 'Failing to pay GST under Reverse Charge Mechanism (RCM) on sitting fees and commission paid to independent/non-executive directors.',
          departmentTriggerRisk: 'Automated data triangulation between Form 3CD Clause 34 / Profit & Loss statement and GSTR-3B Table 3.1(d).',
          consequence: 'Demand notice under Section 73/74 with mandatory 18% interest and 10% penalty.',
          preventiveChecklist: ['Examine director payroll vs sitting fee contracts.', 'Executive director salary subject to TDS u/s 192 is Schedule III (no GST); non-executive fees/commission subject to TDS u/s 194J requires mandatory RCM GST payment.'],
          rectificationMechanism: 'Pay via DRC-03 under RCM; simultaneously claim ITC in current month GSTR-3B subject to general eligibility.'
        }
      ],
      noticeAndAppellateProcedures: [
        {
          noticeSection: 'Section 73(1) / Section 74(1) / Section 74A',
          issuingAuthority: 'State GST Ward Officer / Central GST Range Superintendent',
          statutoryResponseDays: 30,
          groundsOfDefense: {
            isJurisdictionalChallenge: false,
            primaryDefenseArg: 'Tax liability correctly discharged; discrepancies explained through dynamic reconciliation.',
            substantiveMeritsArg: 'ITC claimed satisfies all 4 conditions of Section 16(2); payment made within 180 days.',
            limitationDefense: 'Notice barred by statutory limitation period prescribed under Section 73(10).'
          },
          proceduralChecklist: ['Check whether DRC-01A intimation was served before DRC-01', 'Verify DIN / Reference number', 'Request personal hearing under Section 75(4)'],
          draftingStructureTemplate: ['Brief overview of taxpayer business', 'Response to each query with documentary annexures', 'Affidavit of bona fides', 'Specific request for personal hearing before any adverse adjudication'],
          appealHierarchyPath: ['First Appellate Authority (Joint Commissioner / Commissioner Appeals) u/s 107', 'GST Appellate Tribunal (GSTAT) u/s 109', 'High Court u/s 117', 'Supreme Court u/s 118']
        }
      ],
      advisoryFramework: {
        opinionCategory: 'LITIGATION_EXPOSURE',
        standardStructure: [
          { sectionTitle: 'Facts & Transactional Details', contentGuidance: 'Documentary trail of invoice, dispatch, transport, and bank payment.' },
          { sectionTitle: 'Legal Question', contentGuidance: 'Applicability of GST rate, classification under HSN, or ITC entitlement.' },
          { sectionTitle: 'Detailed Statutory & Jurisprudential Analysis', contentGuidance: 'Interpret Section, Rules, Circulars, and High Court precedents.' },
          { sectionTitle: 'Practical Advisory', contentGuidance: 'Whether to pay under protest to stop interest clock or litigate.' }
        ],
        riskGradingMatrix: [
          {
            grade: 'CONSERVATIVE_SAFE',
            taxSavingsPotential: 'Optimal',
            litigationProbability: 'Low',
            requiredDisclosures: ['Disclose in GSTR-9 annual return Table 4 / Table 17 HSN summary']
          }
        ],
        icaiComplianceStandards: ['SQC 1', 'Standard on Assurance Engagements (SAE) 3400'],
        boilerplateCaveatsAndDisclaimers: ['GST jurisprudence is continually evolving through GST Council notifications and GSTAT benches. This opinion is based on the legal position as of today.']
      }
    }
  },

  // --------------------------------------------------------------------------
  // DOMAIN 4: CORPORATE LAWS & COMPANY SECRETARIAL COMPLIANCE
  // --------------------------------------------------------------------------
  {
    id: '4_CORPORATE_LAWS_SECRETARIAL',
    domainNumber: 4,
    title: 'Corporate Laws & Company Secretarial Compliance',
    tagline: 'Companies Act 2013, Board Governance, Share Capital, RPTs, CARO & MCA21 V3 Master Integrity',
    primaryStatutoryActs: ['Companies Act, 2013', 'Companies (Incorporation) Rules, 2014', 'Companies (Management and Administration) Rules, 2014'],
    governingRegulatoryBodies: ['Ministry of Corporate Affairs (MCA)', 'Registrar of Companies (ROC)', 'Regional Director (RD)', 'NCLT'],
    seniorCaExpectation: 'Holistic command over director duties, board resolution drafting, loans to directors (Sec 185), inter-corporate loans/investments (Sec 186), related party transactions (Sec 188), significant beneficial ownership (SBO), charge creation (CHG-1), and striking off (STK-2).',
    subTopics: [
      'Companies Act, 2013 Architecture & Subordinate Rules',
      'Incorporation of Companies (SPICe+ Part A & B, AGILE-PRO-S, MoA, AoA)',
      'Types of Corporate Vehicles (Pvt Ltd, Public Ltd, OPC, Section 8, Small Company Criteria)',
      'Directors and KMP (DIN, DIR-3 KYC, Disqualification Sec 164, Vacation Sec 167)',
      'Board Meetings (SS-1, 7 Days Notice, Quorum, Video Conferencing)',
      'General Meetings (SS-2, AGM within 6 Months, EGM, Postal Ballot, Voting Rights)',
      'ROC Filings & Compliance Calendars (AOC-4, MGT-7/7A, DPT-3, DIR-12, INC-22)',
      'Share Capital & Corporate Actions (Rights Issue Sec 62, Private Placement PAS-3, Bonus Sec 63, Buyback Sec 68)',
      'Loans to Directors & Entities in which Directors Interested (Sec 185 Prohibitions & Exemptions)',
      'Inter-Corporate Loans, Guarantees & Investments (Sec 186 60%/100% Limits & Special Resolutions)',
      'Related Party Transactions (Sec 188 Ordinary Course vs Arms Length, Form AOC-2 Disclosures)',
      'Corporate Governance & Internal Financial Controls (IFCoFR)',
      'Registration & Satisfaction of Charges (Sec 77-87, Form CHG-1, CHG-4, Condonation of Delay)',
      'Dividend Declaration & Compliance (Sec 123-127, IEPF Transfers)',
      'Corporate Social Responsibility (CSR - Sec 135, Schedule VII, Unspent CSR Account)',
      'Significant Beneficial Ownership (SBO - Sec 90, Form BEN-1, BEN-2)',
      'Company Strike-Off (Sec 248, Fast Track Exit STK-2) & Revival before NCLT (Sec 252)',
      'MCA21 V3 Portal Operations, Webforms, Resubmissions & Penalty Shielding'
    ],
    dimensions: {
      applicableStatutes: [
        {
          actName: 'Companies Act, 2013',
          actYear: 2013,
          section: 'Section 185',
          title: 'Loans to Directors, etc.',
          statutoryText: 'No company shall, directly or indirectly, advance any loan, including any loan represented by a book debt, or give any guarantee or provide any security in connection with any loan taken by him or such other person, to any of its directors or to any other person in whom the director is interested, except in accordance with sub-sections (2) and (3).',
          isNonObstante: false,
          hasDeemingFiction: true,
          provisos: ['Loans may be given to MD/WTD as part of conditions of service extended to all employees, or pursuant to any scheme approved by special resolution.'],
          explanations: ['Sub-section (2) permits loans to entities in which director is interested provided special resolution is passed and loans are utilised by borrowing company for principal business activities.']
        }
      ],
      subordinateRules: [
        {
          parentActSection: 'Section 73 & 76',
          ruleBook: 'Companies (Acceptance of Deposits) Rules, 2014',
          ruleNumber: 'Rule 16 (Form DPT-3)',
          ruleTitle: 'Return of Deposits and Transactions not Considered as Deposits',
          prescribedConditions: [
            'Mandatory annual filing by 30th June for every company other than government company',
            'Disclose all outstanding money or loan received by company but not considered as deposit under Rule 2(1)(c)',
            'Include loans from directors, bank borrowings, inter-corporate advances'
          ]
        }
      ],
      formsAndFilings: [
        {
          formNumber: 'DPT-3',
          formTitle: 'Return of Deposits and Particulars of Transactions Not Considered as Deposits',
          statutoryAuthority: 'MCA',
          portal: 'MCA21_V3',
          filingMode: 'WEB_FORM_DIRECT',
          verificationMode: 'DSC_CLASS_3',
          mandatoryAttachments: ['Auditor Certificate (compulsory when reporting deposits)', 'Breakup of loan categories'],
          statutoryCertificationRequired: true
        }
      ],
      timelinesAndApplicability: [
        {
          entityTypeApplicability: ['PVT_LTD', 'PUBLIC_LTD', 'OPC'],
          recurringFrequency: 'ANNUAL',
          statutoryDueDateFormula: '30th June of each financial year for preceding financial year ended 31st March',
          limitationPeriod: 'Failure attracts penalty of INR 50,000 to INR 5,00,000 on company and officer in default under Section 450.'
        }
      ],
      latestAmendments: [
        {
          amendmentSource: 'Companies (Amendment) Act, Decriminalisation of Offences',
          effectiveDate: '2020-12-21',
          applicableFinancialYear: 'FY 2020-21 onwards',
          isRetrospective: false,
          summaryOfChange: 'Decriminalisation of 46 compoundable offences into an In-House Adjudication Mechanism (IAM); replacement of criminal prosecution with monetary civil penalties imposed directly by Registrar of Companies / Adjudicating Officer u/s 454; revision of definition of Small Company under Section 2(85) to Paid-up Capital <= INR 4 Cr and Turnover <= INR 40 Cr.',
          preAmendmentPosition: 'Heavy magistrate court criminal complaints for minor clerical filing delays; strict small company caps (INR 50L / 2Cr).',
          postAmendmentPosition: 'Small companies exempted from cash flow statement, CARO reporting, mandatory rotation of auditors, and enjoy halved ROC penalties under Section 446B.'
        }
      ],
      administrativeGuidance: [
        {
          guidanceType: 'MCA_CIRCULAR',
          referenceNumber: 'General Circular No. 09/2023',
          issueDate: '2023-09-25',
          subject: 'Clarification on holding AGMs and EGMs through Video Conferencing (VC) or OAVM',
          bindingOnRevenue: true,
          bindingOnAssesseeOrCourt: true,
          keyClarifications: [
            'Companies permitted to conduct AGMs through VC/OAVM subject to registered email notice and recorded transcript archiving.',
            'Physical venue deemed to be registered office.'
          ]
        }
      ],
      judicialPrecedents: [
        {
          caseTitle: 'Tata Consultancy Services Ltd. v. Cyrus Investments Pvt. Ltd.',
          citation: '(2021) 9 SCC 449 (SC)',
          forum: 'SUPREME_COURT',
          jurisdiction: 'PAN_INDIA',
          judgmentDate: '2021-03-26',
          keyLegalIssue: 'Oppression and Mismanagement under Section 241/242 and removal of Chairman/Director.',
          ratioDecidendi: 'Removal of a director cannot by itself be characterized as oppression or mismanagement unless it is demonstrated to be part of a larger design to prejudice public interest or oppressive to minority shareholders. Principle of quasi-partnership does not automatically apply to large corporate conglomerates.',
          isOverruled: false,
          favourability: 'FAVOUR_OF_ASSESSEE',
          practiceApplicationNotes: 'Crucial authority in structuring minority protection clauses, promoter voting arrangements, and defending NCLT oppression petitions.'
        }
      ],
      practicalCalculations: [
        {
          calculationCode: 'CALC_SECTION_186_LIMITS',
          title: 'Section 186 Inter-Corporate Loan & Investment Threshold',
          formulaDescription: 'Board can approve loans/investments without special resolution up to the higher of: (a) 60% of (Paid-up Share Capital + Free Reserves + Securities Premium) OR (b) 100% of (Free Reserves + Securities Premium).',
          mathematicalLogic: 'Limit = Max(0.60 * (PaidUp + Reserves + SecPrem), 1.00 * (Reserves + SecPrem))',
          inputVariables: [
            { name: 'Paid-up Capital', type: 'CURRENCY', description: 'Total equity + preference share capital' },
            { name: 'Free Reserves', type: 'CURRENCY', description: 'P&L surplus + general reserve' },
            { name: 'Securities Premium', type: 'CURRENCY', description: 'Securities premium account balance' }
          ],
          workedExample: {
            scenarioDescription: 'Company has Capital INR 2 Cr, Free Reserves INR 5 Cr, Securities Premium INR 3 Cr.',
            sampleInputs: { capital: 20000000, freeReserves: 50000000, secPrem: 30000000 },
            stepByStepComputation: [
              { stepNumber: 1, title: '60% Test', computedValue: 'INR 6.00 Crores', notes: '60% of (2 + 5 + 3 = 10 Cr)' },
              { stepNumber: 2, title: '100% Test', computedValue: 'INR 8.00 Crores', notes: '100% of (5 + 3 = 8 Cr)' }
            ],
            finalResult: 'Permissible Board limit without shareholder Special Resolution is INR 8.00 Crores (the higher limit).'
          }
        }
      ],
      caseStudies: [
        {
          caseCode: 'CS_SECTION_185_REMEDIAL_RESTRUCTURING',
          industry: 'Healthcare & Diagnostics',
          businessContext: 'Private Limited company advanced INR 3.5 Cr to director-owned diagnostic centre partnership firm.',
          factualMatrix: 'Statutory auditor flagged potential breach of Section 185 punishable with imprisonment and fine up to INR 25 Lakhs on director.',
          statutoryConflictIdentified: 'Partnership firm is not a corporate body covered by Section 185(2) special resolution route.',
          strategicResolution: 'Restructured transaction: converted partnership firm into a Private Limited corporate entity; passed unanimous shareholder special resolution under Section 185(2); ensured borrowing entity utilised funds solely for purchasing medical MRI machinery (principal business); created valid charge on assets.',
          quantifiedSavingsOrRiskAvoidanceInr: 25000000,
          deliverablesProduced: ['Form MGT-14 Special Resolution filing', 'Loan Agreement with Section 185(2) covenants', 'Auditor Clean Verification Note']
        }
      ],
      commonErrorsAndTraps: [
        {
          errorCode: 'ERR_CHG1_LIMITATION_MISSED',
          category: 'LIMITATION_MISSED',
          errorDescription: 'Failing to register bank loan charge in Form CHG-1 within 30 days of sanction/mortgage creation.',
          departmentTriggerRisk: 'Automated bank CIBIL / MCA portal cross-check; unregistered charge void against liquidator/creditors under Section 77.',
          consequence: 'Additional fees escalate drastically up to 60 days; beyond 60 days requires ad-valorem fee; beyond 120 days requires filing Form CHG-8 petition before Regional Director (RD) for condonation of delay.',
          preventiveChecklist: ['Track all bank sanction letters and mortgage deed execution dates.', 'File CHG-1 immediately upon receipt of signed sanction pack.'],
          rectificationMechanism: 'File petition under Section 87 in Form CHG-8 with Regional Director along with affidavit and fee.'
        }
      ],
      noticeAndAppellateProcedures: [
        {
          noticeSection: 'Section 454 Notice by Adjudicating Officer (ROC)',
          issuingAuthority: 'Registrar of Companies',
          statutoryResponseDays: 30,
          groundsOfDefense: {
            isJurisdictionalChallenge: false,
            primaryDefenseArg: 'Default was purely inadvertent technical delay; entity qualifies as Small Company under Section 2(85).',
            substantiveMeritsArg: 'Filing has now been completed; no loss caused to public or exchequer.',
            limitationDefense: 'Benefit of Section 446B (halved penalty for start-ups and small companies) must be granted.'
          },
          proceduralChecklist: ['File reply in physical and e-form', 'Attend video hearing if called by Adjudicating Officer'],
          draftingStructureTemplate: ['Entity credentials and Small Company status', 'Reason for delay (e.g. V3 portal technical glitches with SRN tickets)', 'Prayer for minimum penalty or warning under Section 454'],
          appealHierarchyPath: ['Regional Director (RD) under Section 454(5) within 60 days in Form ADJ', 'NCLT', 'High Court (Writ)']
        }
      ],
      advisoryFramework: {
        opinionCategory: 'TRANSACTION_STRUCTURING',
        standardStructure: [
          { sectionTitle: 'Corporate Governance Overview', contentGuidance: 'Charter documents (MoA/AoA) powers and restrictions.' },
          { sectionTitle: 'Statutory Limits & Permissions', contentGuidance: 'Sections 179, 180, 185, 186, 188 applicability.' },
          { sectionTitle: 'Procedural Roadmap', contentGuidance: 'Draft Board Resolution, Notice of EGM, Explanatory Statement u/s 102.' },
          { sectionTitle: 'Penal Consequences of Non-Compliance', contentGuidance: 'Sections 447, 448, 450 exposures.' }
        ],
        riskGradingMatrix: [
          {
            grade: 'CONSERVATIVE_SAFE',
            taxSavingsPotential: 'N/A',
            litigationProbability: 'Zero',
            requiredDisclosures: ['Disclose in Board Report under Section 134(3) and Form AOC-2']
          }
        ],
        icaiComplianceStandards: ['ICSI Secretarial Standards SS-1 and SS-2', 'SQC 1'],
        boilerplateCaveatsAndDisclaimers: ['This legal opinion is based on the Companies Act, 2013 and rules thereunder. Any alteration in capital structure or shareholding requires fresh evaluation.']
      }
    }
  },

  // --------------------------------------------------------------------------
  // DOMAINS 5 TO 20 REGISTRY HEADERS & METADATA
  // --------------------------------------------------------------------------
  {
    id: '5_TAX_AUDIT_STATUTORY_AUDIT',
    domainNumber: 5,
    title: 'Tax Audit & Statutory Audit',
    tagline: 'Section 44AB, Form 3CA/3CB/3CD, CARO 2020, Standards on Auditing (SA 200-700) & NFRA',
    primaryStatutoryActs: ['Income Tax Act, 1961 (Section 44AB)', 'Companies Act, 2013 (Section 138-147)', 'Chartered Accountants Act, 1949'],
    governingRegulatoryBodies: ['ICAI (Auditing and Assurance Standards Board)', 'NFRA', 'CBDT', 'MCA'],
    seniorCaExpectation: 'Uncompromising execution of Form 3CD (all 44 clauses), CARO 2020 (all 21 clauses), Standards on Auditing compliance, UDIN generation, workpaper documentation under SA 230, and fraud reporting under Section 143(12) in Form ADT-4.',
    subTopics: [
      'Tax Audit Applicability & Thresholds under Section 44AB (1 Cr vs 10 Cr 95% Digital Rule)',
      'Statutory Audit of Companies (Appointment ADT-1, Rotation, Resignation ADT-3, Powers & Duties)',
      'Internal Audit (Sec 138 Applicability & Scopes)',
      'Concurrent Audit of Commercial Banks & Lending Portfolios',
      'Stock Audit & Physical Verification Working Papers',
      'Bank Branch Statutory Audit (LFAR, NPA Classification, IRAC Norms, Provisioning)',
      'Revenue Audit & Leakage Detection',
      'Forensic Audit & Investigating Financial Crimes',
      'Audit Planning & Strategy (SA 300)',
      'Audit Documentation & Permanent/Current Files (SA 230)',
      'Audit Evidence & External Confirmations (SA 500, SA 505)',
      'Materiality and Audit Risk Assessment (SA 320)',
      'Internal Financial Controls over Financial Reporting (IFCoFR)',
      'Audit Sampling Techniques (SA 530)',
      'Auditors Reports & Modified Opinions (SA 700, 705, 706)',
      'Companies (Auditor Report) Order, 2020 (CARO 2020 - 21 Clauses)',
      'Form 3CA, 3CB and Form 3CD Exhaustive Clause Analysis (Clause 1 to 44)',
      'Clause 44 Disclosures (Break-up of Total Expenditure into Registered vs Unregistered GST)',
      'Clause 21 Disallowances (40(a), 40A(3), 40A(7), 40A(9))',
      'Clause 31 Loans and Deposits (Sec 269SS and 269T Violations)',
      'Fraud Detection and Reporting to Central Government in Form ADT-4 (Sec 143(12))',
      'Related Party Auditing (SA 550 & CARO Clause 3(xiii))',
      'Standards on Quality Management & SQC 1',
      'NFRA Inspection Requirements & Disciplinary Precedents'
    ],
    dimensions: {
      applicableStatutes: [],
      subordinateRules: [],
      formsAndFilings: [],
      timelinesAndApplicability: [],
      latestAmendments: [],
      administrativeGuidance: [],
      judicialPrecedents: [],
      practicalCalculations: [],
      caseStudies: [],
      commonErrorsAndTraps: [],
      noticeAndAppellateProcedures: [],
      advisoryFramework: { opinionCategory: 'ACCOUNTING_DISCLOSURE', standardStructure: [], riskGradingMatrix: [], icaiComplianceStandards: [], boilerplateCaveatsAndDisclaimers: [] }
    }
  },

  {
    id: '6_TDS_TCS_WITHHOLDING_TAX',
    domainNumber: 6,
    title: 'TDS, TCS & Withholding Tax',
    tagline: 'Chapter XVII-B, Section 194C/J/I/Q vs 206C(1H), 206AB Higher Rates, TRACES & Form 26Q/24Q/27Q',
    primaryStatutoryActs: ['Income Tax Act, 1961 (Chapter XVII-B & XVII-BB)', 'Income Tax Rules, 1962'],
    governingRegulatoryBodies: ['CBDT (Directorate of Income Tax - Systems / TRACES)'],
    seniorCaExpectation: 'Precision in deduction, deposit, quarterly returns, handling 194Q vs 206C(1H) hierarchy, lower deduction certificates u/s 197, and clearing TRACES short-deduction defaults.',
    subTopics: [
      'TDS Sections Spectrum (192, 194A, 194C, 194H, 194I, 194IA, 194IB, 194J, 194Q, 194R, 194S)',
      'TDS Rate Charts & Annual Threshold Limits',
      'Section 194Q (Purchase of Goods) vs Section 206C(1H) (Sale of Goods) Priority Hierarchy',
      'Section 194R TDS on Benefit or Perquisite in respect of Business/Profession',
      'Section 206AB & 206CCA Special Higher Withholding Rates for Non-Filers',
      'TDS Deduction Timelines and Monthly Deposit Challan (ITNS 281)',
      'Quarterly TDS Returns (Form 24Q Salary, Form 26Q Non-Salary, Form 27Q NRI, Form 27EQ TCS)',
      'Certificates of TDS (Form 16 Annual Salary, Form 16A Quarterly Non-Salary, Form 16B/16C)',
      'TRACES Portal Operations (Justification Report, Conso Files, Online Corrections)',
      'TDS Defaults (Short Deduction, Non-Deduction, Late Deduction, Late Deposit)',
      'Section 201(1A) Interest (1% per month for late deduction, 1.5% for late deposit)',
      'Section 234E Late Filing Fee (INR 200/day up to total TDS amount)',
      'TDS 26AS & AIS Reconciliation Workpapers',
      'Lower Deduction or Nil Deduction Certificates under Section 197 (Form 13)',
      'TCS Spectrum (Scrap 206C(1), Motor Vehicles 206C(1F), LRS & Tour Packages 206C(1G))'
    ],
    dimensions: {
      applicableStatutes: [],
      subordinateRules: [],
      formsAndFilings: [],
      timelinesAndApplicability: [],
      latestAmendments: [],
      administrativeGuidance: [],
      judicialPrecedents: [],
      practicalCalculations: [],
      caseStudies: [],
      commonErrorsAndTraps: [],
      noticeAndAppellateProcedures: [],
      advisoryFramework: { opinionCategory: 'TRANSACTION_STRUCTURING', standardStructure: [], riskGradingMatrix: [], icaiComplianceStandards: [], boilerplateCaveatsAndDisclaimers: [] }
    }
  },

  {
    id: '7_FINANCIAL_MANAGEMENT_CORPORATE_FINANCE',
    domainNumber: 7,
    title: 'Financial Management & Corporate Finance',
    tagline: 'Working Capital, CMA Preparation, DCF Business Valuation, M&A, Financial Modeling & Due Diligence',
    primaryStatutoryActs: ['Companies Act, 2013', 'SEBI Regulations', 'Insolvency and Bankruptcy Code (IBC), 2016'],
    governingRegulatoryBodies: ['RBI', 'SEBI', 'IBBI', 'Banks & Financial Institutions'],
    seniorCaExpectation: 'Corporate strategy acumen in structuring debt/equity, credit monitoring arrangements (CMA), DCF models with WACC and terminal value, buy-side/sell-side financial due diligence, and capital budgeting.',
    subTopics: [
      'Strategic Financial Planning & Capital Structure Optimization',
      'Working Capital Assessment & Operating Cycle Analysis',
      'Credit Monitoring Arrangement (CMA) Data for Consortium Banking',
      'Cash Flow Forecasting & Liquidity Stress Testing',
      'Budgeting, Variance Analysis & Zero-Based Budgeting',
      'Financial Modelling (Three-Statement Integrated Financial Models)',
      'Business Valuation Methodologies (DCF, Comparable Companies, Net Asset Value)',
      'Valuation under Rule 11UA of Income Tax and Section 247 of Companies Act',
      'Cost of Capital (WACC, CAPM Model, Cost of Equity & Debt)',
      'Capital Budgeting Decisions (NPV, IRR, MIRR, Payback, Profitability Index)',
      'Debt vs Equity Structuring & Hybrid Instruments (CCPS, CCD)',
      'Comprehensive Financial Ratio Analysis (DuPont Analysis, Altman Z-Score)',
      'Fundraising (Series A/B venture equity, Term Loans, Working Capital Lines)',
      'Financial & Tax Due Diligence (QoE - Quality of Earnings, Net Debt adjustments)',
      'Mergers, Acquisitions, Amalgamations & Demergers (Sec 230-232)',
      'Financial Restructuring & One-Time Settlement (OTS) with Banks',
      'Business Performance Dashboards & KPI Architecture'
    ],
    dimensions: {
      applicableStatutes: [],
      subordinateRules: [],
      formsAndFilings: [],
      timelinesAndApplicability: [],
      latestAmendments: [],
      administrativeGuidance: [],
      judicialPrecedents: [],
      practicalCalculations: [],
      caseStudies: [],
      commonErrorsAndTraps: [],
      noticeAndAppellateProcedures: [],
      advisoryFramework: { opinionCategory: 'M_AND_A_TAX_DUEDILIGENCE', standardStructure: [], riskGradingMatrix: [], icaiComplianceStandards: [], boilerplateCaveatsAndDisclaimers: [] }
    }
  },

  {
    id: '8_RBI_BANKING_FINANCIAL_REGULATIONS',
    domainNumber: 8,
    title: 'RBI, Banking & Financial Regulations',
    tagline: 'FEMA, FDI/ODI, ECB, LRS, NBFC Governance, Master Directions & Banking Compliance',
    primaryStatutoryActs: ['Foreign Exchange Management Act (FEMA), 1999', 'Reserve Bank of India Act, 1934', 'Banking Regulation Act, 1949', 'SARFAESI Act, 2002'],
    governingRegulatoryBodies: ['Reserve Bank of India (RBI)', 'Authorised Dealer (AD) Category-I Banks', 'ED (Enforcement Directorate)'],
    seniorCaExpectation: 'Expertise in cross-border capital flows, FC-GPR/FC-TRS filings on FIRMS portal, Overseas Direct Investment (ODI) regulations, ECB guidelines, Liberalised Remittance Scheme (LRS), and NBFC scale-based regulations.',
    subTopics: [
      'FEMA Architecture (Current Account vs Capital Account Transactions)',
      'Foreign Direct Investment (FDI - Automatic vs Approval Route, Prohibited Sectors)',
      'External Commercial Borrowings (ECB - Framework, End-Use Restrictions, Form ECB)',
      'Overseas Direct Investment (ODI - Non-Debt Instruments Rules 2022, Form FC)',
      'Liberalised Remittance Scheme (LRS - USD 250,000 Annual Cap & TCS Rates)',
      'Foreign Inward & Outward Remittances (Form 15CA & 15CB CA Certification)',
      'Import and Export Compliance (EDPMS and IDPMS Regularization, Write-offs)',
      'Non-Banking Financial Company (NBFC - Base, Middle, Upper, Top Layer Regulations)',
      'Banking Credit Documentation & Security Creation',
      'NPA Classification & IRAC Norms (SMA-0, SMA-1, SMA-2, Sub-Standard, Doubtful, Loss)',
      'SARFAESI Act Enforcement (Section 13(2) Notice, Section 13(4) Possession, DRT Litigation)',
      'Bank Statutory Branch Audit (LFAR Preparation, System Audit, Stress Testing)'
    ],
    dimensions: {
      applicableStatutes: [],
      subordinateRules: [],
      formsAndFilings: [],
      timelinesAndApplicability: [],
      latestAmendments: [],
      administrativeGuidance: [],
      judicialPrecedents: [],
      practicalCalculations: [],
      caseStudies: [],
      commonErrorsAndTraps: [],
      noticeAndAppellateProcedures: [],
      advisoryFramework: { opinionCategory: 'TRANSACTION_STRUCTURING', standardStructure: [], riskGradingMatrix: [], icaiComplianceStandards: [], boilerplateCaveatsAndDisclaimers: [] }
    }
  },

  {
    id: '9_LLP_PARTNERSHIP_PROPRIETORSHIP',
    domainNumber: 9,
    title: 'LLP, Partnership & Proprietorship Compliance',
    tagline: 'LLP Act 2008, Indian Partnership Act 1932, Partner Remuneration Sec 40(b), Firm Taxation & Closures',
    primaryStatutoryActs: ['Limited Liability Partnership Act, 2008', 'Indian Partnership Act, 1932', 'Income Tax Act, 1961 (Section 40(b), 184, 185)'],
    governingRegulatoryBodies: ['MCA (ROC)', 'Registrar of Firms (ROF)', 'CBDT'],
    seniorCaExpectation: 'Sound structuring of partnership deeds, partner remuneration limits under Section 40(b), interest on capital (12%), LLP Form 8 (Statement of Account & Solvency) and Form 11 (Annual Return), and firm dissolution/conversions.',
    subTopics: [
      'LLP Act 2008 & Decriminalisation Amendment 2021',
      'LLP Incorporation (RUN-LLP, FiLLiP, LLP Agreement Form 3)',
      'LLP Annual Compliance (Form 8 Solvency by 30th Oct, Form 11 Annual Return by 30th May)',
      'Partnership Act 1932 Principles & ROF Registration',
      'Drafting Partnership & LLP Agreements (Profit Sharing, Capital, Dispute Clauses)',
      'Proprietorship Accounting & Capital Account Reconciliations',
      'Firm Taxation (Flat 30% Tax, AMT u/s 115JC, No Dividend Distribution Tax on Share of Profit)',
      'Partner Remuneration Computations under Section 40(b) on Book Profits',
      'Partner Interest on Capital (12% Cap under Section 40(b))',
      'LLP Audit Requirements (Turnover > 40 Lakhs or Contribution > 25 Lakhs)',
      'Conversion of Partnership/Proprietorship to LLP or Private Limited Company (Chapter XXI)',
      'Dissolution, Winding Up and Closure of LLPs (Form 24) and Partnership Firms'
    ],
    dimensions: {
      applicableStatutes: [],
      subordinateRules: [],
      formsAndFilings: [],
      timelinesAndApplicability: [],
      latestAmendments: [],
      administrativeGuidance: [],
      judicialPrecedents: [],
      practicalCalculations: [],
      caseStudies: [],
      commonErrorsAndTraps: [],
      noticeAndAppellateProcedures: [],
      advisoryFramework: { opinionCategory: 'TRANSACTION_STRUCTURING', standardStructure: [], riskGradingMatrix: [], icaiComplianceStandards: [], boilerplateCaveatsAndDisclaimers: [] }
    }
  },

  {
    id: '10_LABOUR_LAWS_EMPLOYMENT',
    domainNumber: 10,
    title: 'Labour Laws & Employment Compliance',
    tagline: 'EPFO, ESIC, Professional Tax, Gratuity, Bonus, Code on Wages & Payroll Tax Architecture',
    primaryStatutoryActs: ['Employees Provident Funds & MP Act, 1952', 'ESI Act, 1948', 'Payment of Gratuity Act, 1972', 'Payment of Bonus Act, 1965', '4 New Labour Codes'],
    governingRegulatoryBodies: ['EPFO', 'ESIC', 'State Labour Departments', 'Ministry of Labour & Employment'],
    seniorCaExpectation: 'Designing compliant CTC compensation structures, calculating PF on basic + allowances per Supreme Court *Vivekananda Vidyamandir*, ESI coverage caps (INR 21,000), Gratuity actuarial valuations, and Labour Codes transition.',
    subTopics: [
      'EPF Act (12% Employer/Employee, Statutory Wage Ceiling INR 15,000 vs Higher Pension)',
      'ESI Act (0.75% Employee, 3.25% Employer, Gross Wage Ceiling INR 21,000)',
      'Professional Tax (State-Specific PT Slabs, Monthly PT Returns & Annual Assessment)',
      'Labour Welfare Fund (LWF) Contributions & Deadlines',
      'Payment of Gratuity Act (15/26 Formula, 5 Years Continuous Service, Actuarial Valuation AS 15 / Ind AS 19)',
      'Payment of Bonus Act (Allocable Surplus, 8.33% Min to 20% Max, Eligibility Limits)',
      'Minimum Wages Act & Revision of VDA (Variable Dearness Allowance)',
      'End-to-End Payroll Processing & Compliance Calendars',
      'Tax-Optimised CTC Salary Structuring (HRA, LTA, NPS u/s 80CCD(2), Standard Deduction)',
      '4 New Labour Codes (Code on Wages, Social Security, IR, OSH - 50% Basic Pay Rule)',
      'Payroll TDS (Section 192 Computations, New vs Old Regime Tax declarations)',
      'Full and Final (F&F) Settlement Computations & Leave Encashment Rules'
    ],
    dimensions: {
      applicableStatutes: [],
      subordinateRules: [],
      formsAndFilings: [],
      timelinesAndApplicability: [],
      latestAmendments: [],
      administrativeGuidance: [],
      judicialPrecedents: [],
      practicalCalculations: [],
      caseStudies: [],
      commonErrorsAndTraps: [],
      noticeAndAppellateProcedures: [],
      advisoryFramework: { opinionCategory: 'TRANSACTION_STRUCTURING', standardStructure: [], riskGradingMatrix: [], icaiComplianceStandards: [], boilerplateCaveatsAndDisclaimers: [] }
    }
  },

  {
    id: '11_IP_AND_BUSINESS_REGISTRATIONS',
    domainNumber: 11,
    title: 'Intellectual Property & Business Registrations',
    tagline: 'MSME/Udyam, Startup India DPIIT, Section 80-IAC, IEC, Trademark Classification & FSSAI',
    primaryStatutoryActs: ['MSMED Act, 2006', 'Trade Marks Act, 1999', 'Foreign Trade (Development and Regulation) Act, 1992'],
    governingRegulatoryBodies: ['Ministry of MSME', 'DPIIT', 'DGFT', 'CGPDTM (Controller General of Patents, Designs & Trade Marks)'],
    seniorCaExpectation: 'Leveraging government incentive ecosystems, securing Section 80-IAC 3-year tax holidays for eligible startups, Udyam dynamic categorization, and safeguarding intellectual property assets.',
    subTopics: [
      'MSME / Udyam Registration (Composite Criteria: Investment in Plant & Machinery + Turnover)',
      'Startup India / DPIIT Recognition & IMB Approval Process',
      'Section 80-IAC 100% Tax Holiday for Startups (3 Consecutive Years out of 10 Years)',
      'Angel Tax Relief Mechanisms under DPIIT Notifications',
      'Import Export Code (IEC) from DGFT & Annual Verification',
      'Trademark Registration (Classes 1-45, Trademark Search, TM-A Filing, Opposition Defense)',
      'Patent & Copyright Fundamentals for Corporate Commercial Assets',
      'Shops and Establishments Registration (State-Specific Gumasta / Trade License)',
      'FSSAI Registration & State/Central Licensing for Food Enterprises',
      'Professional Practice Licenses & Regulatory Sanctions',
      'Optimal Legal Entity Structuring for Seed and Growth Stage Ventures',
      'Government Subsidies, PLI Schemes (Production Linked Incentive) & Capital Grants'
    ],
    dimensions: {
      applicableStatutes: [],
      subordinateRules: [],
      formsAndFilings: [],
      timelinesAndApplicability: [],
      latestAmendments: [],
      administrativeGuidance: [],
      judicialPrecedents: [],
      practicalCalculations: [],
      caseStudies: [],
      commonErrorsAndTraps: [],
      noticeAndAppellateProcedures: [],
      advisoryFramework: { opinionCategory: 'TRANSACTION_STRUCTURING', standardStructure: [], riskGradingMatrix: [], icaiComplianceStandards: [], boilerplateCaveatsAndDisclaimers: [] }
    }
  },

  {
    id: '12_INTERNATIONAL_TAX_GLOBAL_COMPLIANCE',
    domainNumber: 12,
    title: 'International Taxation & Global Compliance',
    tagline: 'DTAA, Transfer Pricing (Form 3CEB), BEPS Pillars 1 & 2, Permanent Establishment, Form 15CB & FATCA',
    primaryStatutoryActs: ['Income Tax Act, 1961 (Chapter X Transfer Pricing, Section 90/90A DTAA)', 'OECD Model Tax Convention', 'UN Model Convention'],
    governingRegulatoryBodies: ['CBDT (International Taxation & Transfer Pricing Wings)', 'OECD / G20 Inclusive Framework'],
    seniorCaExpectation: 'Handling cross-border multinational transactions, Arm’s Length Price (ALP) determination, economic benchmarking in Prowess/Capitaline, Form 3CEB certification, PE risk mitigation, and Foreign Tax Credit (Form 67).',
    subTopics: [
      'Double Taxation Avoidance Agreements (DTAA - Tie-Breaker Rules, Business Profits Art 7, FTS/Royalty Art 12)',
      'Section 90 vs Section 91 (Bilateral vs Unilateral Double Taxation Relief)',
      'Transfer Pricing Regulations (Sec 92 to 92F, Associated Enterprises Sec 92A, International Transactions Sec 92B)',
      'Specified Domestic Transactions (SDT - Section 92BA Threshold INR 20 Cr)',
      'Transfer Pricing Methods (CUP, Resale Price, Cost Plus, Profit Split, TNMM)',
      'Form 3CEB CA Certification & Transfer Pricing Study Documentation (Rule 10D)',
      'Master File (Form 3CEAA) and Country-by-Country Reporting (CbCR - Form 3CEAD)',
      'Safe Harbour Rules (Rule 10TA-10TG) & Advance Pricing Agreements (APA)',
      'Base Erosion and Profit Shifting (BEPS) 15 Action Plans & Multilateral Instrument (MLI)',
      'Pillar One (Nexus & Profit Allocation) and Pillar Two (Global Anti-Base Erosion 15% Minimum Tax - GloBE)',
      'Permanent Establishment (PE - Fixed Place, Service PE, Agency PE, Dependent Agent PE)',
      'Equalisation Levy (2% E-Commerce Supply of Services, 6% Specified Digital Advertisement)',
      'Foreign Tax Credit (FTC - Section 90/91, Rule 128 & Form 67 Procedural Timelines)',
      'Withholding Tax on Cross-Border Payments (Section 195, Form 15CA & 15CB CA Certificate)',
      'Expatriate Taxation & Global Mobility (Secondment Agreements, Double Social Security Totalization)',
      'Foreign Account Tax Compliance Act (FATCA) and Common Reporting Standard (CRS) Reporting'
    ],
    dimensions: {
      applicableStatutes: [],
      subordinateRules: [],
      formsAndFilings: [],
      timelinesAndApplicability: [],
      latestAmendments: [],
      administrativeGuidance: [],
      judicialPrecedents: [],
      practicalCalculations: [],
      caseStudies: [],
      commonErrorsAndTraps: [],
      noticeAndAppellateProcedures: [],
      advisoryFramework: { opinionCategory: 'M_AND_A_TAX_DUEDILIGENCE', standardStructure: [], riskGradingMatrix: [], icaiComplianceStandards: [], boilerplateCaveatsAndDisclaimers: [] }
    }
  },

  {
    id: '13_LITIGATION_NOTICES_REPRESENTATION',
    domainNumber: 13,
    title: 'Litigation, Notices & Legal Representation',
    tagline: 'Faceless Assessment, Section 148A Reassessment, DRC-01 Defense, CIT(A), ITAT & GSTAT Advocacy',
    primaryStatutoryActs: ['Income Tax Act, 1961', 'CGST Act, 2017', 'Code of Civil Procedure (Procedural Principles)'],
    governingRegulatoryBodies: ['National Faceless Assessment Centre (NFAC)', 'CIT(Appeals)', 'ITAT', 'GSTAT', 'High Courts', 'Supreme Court'],
    seniorCaExpectation: 'Senior courtroom-grade drafting of legal replies, attacking jurisdictional defects (lack of DIN, absence of statutory approval, limitation bar), leading evidence under Rule 46A, and arguing substantial questions of law.',
    subTopics: [
      'Income Tax Assessment Schemes (Sec 143(1) Intimation, Sec 143(3) Scrutiny, Sec 144 Best Judgment, Sec 147 Reassessment)',
      'Faceless Assessment & Faceless Appeals Regime Protocols',
      'Reassessment Overhaul under Finance Act 2021 (Sec 148, 148A Inquiry, Limitation Sec 149)',
      'Search, Seizure & Survey Proceedings (Sec 132, 133A, Panchnama, Statement on Oath u/s 132(4))',
      'Summons & Production of Accounts under Section 131',
      'Art of Drafting Winning Legal Submissions & Objections',
      'Preparing the Appellate Paper Book (Rule 18 ITAT Rules, Indexing, Case Law Compilation)',
      'First Appellate Proceedings before CIT(Appeals) / NFAC (Form 35, Statement of Facts, Grounds of Appeal)',
      'Appellate Advocacy before Income Tax Appellate Tribunal (ITAT - Form 36, Cross-Objections Form 36A)',
      'GST Adjudication & Appeals (Form GST DRC-01, DRC-06, Form GST APL-01 before Commissioner Appeals)',
      'GST Appellate Tribunal (GSTAT) Procedures & Pre-Deposit Requirements',
      'High Court & Supreme Court Tax Jurisprudence (Substantial Questions of Law u/s 260A, SLP Art 136, Writs Art 226)',
      'Rectification Applications (Sec 154 IT Act, Sec 161 CGST Act)',
      'Demand Stay Petitions & Section 220(6) 20% Pre-Deposit Standards (CBDT Office Memorandums)'
    ],
    dimensions: {
      applicableStatutes: [],
      subordinateRules: [],
      formsAndFilings: [],
      timelinesAndApplicability: [],
      latestAmendments: [],
      administrativeGuidance: [],
      judicialPrecedents: [],
      practicalCalculations: [],
      caseStudies: [],
      commonErrorsAndTraps: [],
      noticeAndAppellateProcedures: [],
      advisoryFramework: { opinionCategory: 'LITIGATION_EXPOSURE', standardStructure: [], riskGradingMatrix: [], icaiComplianceStandards: [], boilerplateCaveatsAndDisclaimers: [] }
    }
  },

  {
    id: '14_GOVERNMENT_PORTALS_DIGITAL',
    domainNumber: 14,
    title: 'Government Portals & Digital Compliance',
    tagline: 'E-Filing, GSTN, MCA21 V3, TRACES, ICEGATE, DGFT, ERP Integration & XBRL Taxonomies',
    primaryStatutoryActs: ['Information Technology Act, 2000', 'Companies Act (XBRL Rules)'],
    governingRegulatoryBodies: ['Infosys / IT E-Filing', 'GSTN / NIC', 'TCS / MCA21 V3', 'Directorate of Systems'],
    seniorCaExpectation: 'Diagnosing schema validation errors, resolving DSC signer token drivers, navigating MCA21 V3 webform glitches, automated ERP-to-portal sync, and XBRL tagging under Ind AS/AS taxonomy.',
    subTopics: [
      'Income Tax E-Filing 2.0 Portal Architecture & JSON Schemas',
      'GSTN Portal Operations (GSTR-1/3B APIs, Offline Tool, Ledger Mismatches)',
      'MCA21 V3 Portal (V2 to V3 Migration, Webforms, Business User Roles, SRN Tracking)',
      'TRACES Portal (TDS Returns, Form 16/16A Generation, Conso Files, Justification Reports)',
      'ICEGATE & Custom EDI Systems (Bill of Entry, Shipping Bill, E-Sanchit)',
      'RBI FIRMS Portal & Single Master Form (SMF - Form FC-GPR, FC-TRS, FLA Return)',
      'EPFO Unified Member & Employer Portals (ECR Generation, DSC Signing)',
      'ESIC Portal Operations (Monthly IP Filing, Medical Cards, Online Challans)',
      'DGFT Portal (IEC Issuance, RoDTEP, Advance Authorisation, EPCG Licences)',
      'MSME Udyam Portal (Registration, Annual Information Update, Classification Drift)',
      'Tally Prime, Zoho Books & SAP ERP Data Extraction & Tally XML Parsing',
      'Advanced Excel for Chartered Accountants (Power Query, Dynamic Arrays, Reconciliation Macros)',
      'XBRL Filing Architecture (MCA XBRL Taxonomy, Instance Document Validation, Tagging Notes)'
    ],
    dimensions: {
      applicableStatutes: [],
      subordinateRules: [],
      formsAndFilings: [],
      timelinesAndApplicability: [],
      latestAmendments: [],
      administrativeGuidance: [],
      judicialPrecedents: [],
      practicalCalculations: [],
      caseStudies: [],
      commonErrorsAndTraps: [],
      noticeAndAppellateProcedures: [],
      advisoryFramework: { opinionCategory: 'ACCOUNTING_DISCLOSURE', standardStructure: [], riskGradingMatrix: [], icaiComplianceStandards: [], boilerplateCaveatsAndDisclaimers: [] }
    }
  },

  {
    id: '15_BUSINESS_ADVISORY_STRATEGY',
    domainNumber: 15,
    title: 'Business Advisory & Strategic Consulting',
    tagline: 'Virtual CFO, Business Structuring, Cost Reduction, Process Automation & Succession Planning',
    primaryStatutoryActs: ['Commercial Laws', 'Companies Act, 2013', 'Indian Trust Act, 1882'],
    governingRegulatoryBodies: ['ICAI', 'Industry Bodies (CII, FICCI)'],
    seniorCaExpectation: 'Acting as a trusted Board-level advisor, implementing Virtual CFO frameworks, financial health diagnostics, EBITDA expansion, family business succession planning, and private family trusts.',
    subTopics: [
      'Entity Structuring & Promoter Holding Company Architectures',
      'Commercial Tax Optimisation & Legal Tax Planning',
      'Startup Advisory (Cap Table Modeling, ESOP Structuring, SAFE / Convertible Notes)',
      'SME Growth & Transformation Consulting',
      'Financial Health Diagnostic Audits & Working Capital Unlocking',
      'Business Expansion Planning & Capital Allocation Strategies',
      'Strategic Cost Reduction & Activity Based Costing (ABC)',
      'Gross Margin & Profitability Deep-Dive Analytics',
      'Designing Robust Internal Control Systems & Standard Operating Procedures (SOPs)',
      'Accounting & Compliance Process Automation via Technology',
      'Virtual CFO Service Models (Board Reporting, Cash Flow Governance, MIS)',
      'Business Succession Planning & Family Business Governance Charters',
      'Private Family Trusts (Discretionary vs Specific Trusts for Asset Protection)',
      'Exit Planning, Promoter Buyouts & Strategic Divestitures',
      'Investor Pitch Decks & Data Room Management for Due Diligence'
    ],
    dimensions: {
      applicableStatutes: [],
      subordinateRules: [],
      formsAndFilings: [],
      timelinesAndApplicability: [],
      latestAmendments: [],
      administrativeGuidance: [],
      judicialPrecedents: [],
      practicalCalculations: [],
      caseStudies: [],
      commonErrorsAndTraps: [],
      noticeAndAppellateProcedures: [],
      advisoryFramework: { opinionCategory: 'TRANSACTION_STRUCTURING', standardStructure: [], riskGradingMatrix: [], icaiComplianceStandards: [], boilerplateCaveatsAndDisclaimers: [] }
    }
  },

  {
    id: '16_PROFESSIONAL_ETHICS_ICAI',
    domainNumber: 16,
    title: 'Professional Ethics & ICAI Regulations',
    tagline: 'Chartered Accountants Act 1949, Code of Ethics 2020, UDIN Mandate, Peer Review & Disciplinary Rules',
    primaryStatutoryActs: ['Chartered Accountants Act, 1949 (First & Second Schedules)', 'ICAI Regulations, 1988'],
    governingRegulatoryBodies: ['Institute of Chartered Accountants of India (ICAI)', 'ICAI Disciplinary Directorate', 'Peer Review Board', 'Quality Review Board'],
    seniorCaExpectation: 'Strict adherence to independence requirements, NOCLAR (Responding to Non-Compliance with Laws and Regulations), UDIN verification, fee sharing prohibitions, advertising guidelines, and peer review workpapers.',
    subTopics: [
      'Chartered Accountants Act, 1949 Overview & Historical Framework',
      'ICAI Code of Ethics 2020 (Fundamental Principles: Integrity, Objectivity, Competence, Confidentiality, Behaviour)',
      'First Schedule Misconduct (Part I Practice, Part II Service, Part III General, Part IV Other)',
      'Second Schedule Misconduct (Part I Gross Negligence, Part II Council Guidelines, Part III Other)',
      'Auditor Independence Standards & Threats (Self-Interest, Self-Review, Advocacy, Familiarity, Intimidation)',
      'Prohibition on Offering Non-Audit Services under Section 144 of Companies Act, 2013',
      'Conflict of Interest Identification & Safeguards',
      'Client Confidentiality & Exceptions (Statutory Duty to Disclose)',
      'NOCLAR (Non-Compliance with Laws and Regulations) Implementation',
      'Unique Document Identification Number (UDIN) Rules, Revocation & Penalties',
      'ICAI Peer Review Framework (Mandatory Phases 1 to 4 for Audit Firms)',
      'Quality Review Board (QRB) Inspections & Reporting',
      'Continuing Professional Education (CPE) Credit Hours Monitoring',
      'Practice Management Guidelines (Website Guidelines, Visiting Cards, Firm Logos)',
      'Standard Engagement Letters (SA 210) & Limitation of Liability'
    ],
    dimensions: {
      applicableStatutes: [],
      subordinateRules: [],
      formsAndFilings: [],
      timelinesAndApplicability: [],
      latestAmendments: [],
      administrativeGuidance: [],
      judicialPrecedents: [],
      practicalCalculations: [],
      caseStudies: [],
      commonErrorsAndTraps: [],
      noticeAndAppellateProcedures: [],
      advisoryFramework: { opinionCategory: 'ACCOUNTING_DISCLOSURE', standardStructure: [], riskGradingMatrix: [], icaiComplianceStandards: [], boilerplateCaveatsAndDisclaimers: [] }
    }
  },

  {
    id: '17_SPECIALISED_INDUSTRIES',
    domainNumber: 17,
    title: 'Specialised Industry Knowledge',
    tagline: 'Sectoral Nuances: Real Estate (RERA/Sec 43CA), Healthcare, Manufacturing, E-Commerce & Trusts (Sec 12AB)',
    primaryStatutoryActs: ['Real Estate (Regulation and Development) Act (RERA), 2016', 'Income Tax Act (Sec 11-13 Trusts, Sec 43CA, Sec 50C)'],
    governingRegulatoryBodies: ['RERA Authorities', 'CBIC / CBDT Sectoral Wings', 'Charity Commissioners'],
    seniorCaExpectation: 'Mastering vertical-specific tax and accounting quirks: RERA separate bank account 70% rule, JDA taxation u/s 45(5A), Section 43CA stamp duty safe harbor (10%), healthcare GST exemptions, Section 12AB charitable registrations.',
    subTopics: [
      'Real Estate and Construction (RERA Audit, Sec 43CA/50C 10% Band, JDA Sec 45(5A), GST 1%/5% without ITC)',
      'Manufacturing & Industrial Operations (Job Work Sec 143, Yield Loss Analysis, Scrap TCS 206C(1))',
      'Automobile Dealerships (Demo Car Depreciation, OEM Target Incentives GST, Stock Audits)',
      'Healthcare and Hospitals (GST Exemptions for Clinical Establishments vs Taxable Medicines/Implants)',
      'E-Commerce Operators & Marketplace Sellers (TCS u/s 52 GST, TDS u/s 194-O IT Act)',
      'IT & Software SaaS Companies (Software Export LUT, STPI / SEZ Compliance, ESOP Taxation)',
      'NGOs, Charitable & Religious Trusts (Registration u/s 12AB, 80G, Form 10B/10BB, 85% Application Rule, Corpus)',
      'Educational Institutions (Sec 10(23C) Approvals, Commercial vs Educational Activity Segregation)',
      'Banking & Financial Services (IRAC Norms, Priority Sector Lending Certificates - PSLC, Treasury Operations)',
      'Agriculture & Agro-Processing (Agricultural Income Sec 10(1) vs Business Income Rule 7/8)',
      'Export and Import Businesses (Duty Drawback, RoDTEP, Advance License, Star Export House Criteria)',
      'Hospitality and Restaurants (GST 5% without ITC vs 18% with ITC in Star Hotels, FSSAI)'
    ],
    dimensions: {
      applicableStatutes: [],
      subordinateRules: [],
      formsAndFilings: [],
      timelinesAndApplicability: [],
      latestAmendments: [],
      administrativeGuidance: [],
      judicialPrecedents: [],
      practicalCalculations: [],
      caseStudies: [],
      commonErrorsAndTraps: [],
      noticeAndAppellateProcedures: [],
      advisoryFramework: { opinionCategory: 'TRANSACTION_STRUCTURING', standardStructure: [], riskGradingMatrix: [], icaiComplianceStandards: [], boilerplateCaveatsAndDisclaimers: [] }
    }
  },

  {
    id: '18_ADVANCED_PROFESSIONAL_JUDGEMENT',
    domainNumber: 18,
    title: 'Advanced Professional Judgement',
    tagline: 'Complex Statutory Interpretation, GAAR, Substance over Form, Ratio Analysis & Written Opinions',
    primaryStatutoryActs: ['Income Tax Act (Chapter X-A General Anti-Avoidance Rule - GAAR)', 'General Clauses Act, 1897', 'Constitution of India (Articles 141, 226, 265)'],
    governingRegulatoryBodies: ['Courts of Record', 'ICAI Council'],
    seniorCaExpectation: 'The hallmark of a 20+ year practitioner: reconciling contradictory High Court rulings, assessing commercial substance, drafting non-hedged professional opinions, and advising on multi-scenario risk outcomes.',
    subTopics: [
      'Principles of Statutory Interpretation (Literal Rule, Purposive Construction, Harmonious Construction)',
      'Interpretation of Non-Obstante Clauses ("Notwithstanding") and Deeming Fictions',
      'General Anti-Avoidance Rule (GAAR - Chapter X-A, Impermissible Avoidance Arrangements - IAA)',
      'Substance Over Form Doctrine (*McDowell*, *Vodafone*, *Azadi Bachao Andolan*)',
      'Conflicting Case Law Analysis & Resolving Inter-Bench High Court Splits',
      'Risk-Weighted Decision Matrices in Ambiguous Tax Scenarios',
      'Tax Litigation Strategy Formulation (Writ vs Statutory Appellate Route)',
      'Structuring Complex Multi-Tier Transactions without Violating Anti-Abuse Provisions',
      'Detecting Fraud, Benami Transactions (PBPT Act) and Shell Company Indicators',
      'Quantifying Financial Exposure & Assessing Worst-Case Scenario Penalties',
      'Drafting Definitive Senior CA Legal Opinions with Substantiated Authorities'
    ],
    dimensions: {
      applicableStatutes: [],
      subordinateRules: [],
      formsAndFilings: [],
      timelinesAndApplicability: [],
      latestAmendments: [],
      administrativeGuidance: [],
      judicialPrecedents: [],
      practicalCalculations: [],
      caseStudies: [],
      commonErrorsAndTraps: [],
      noticeAndAppellateProcedures: [],
      advisoryFramework: { opinionCategory: 'TRANSACTION_STRUCTURING', standardStructure: [], riskGradingMatrix: [], icaiComplianceStandards: [], boilerplateCaveatsAndDisclaimers: [] }
    }
  },

  {
    id: '19_KNOWLEDGE_SOURCES_LEGAL_RESEARCH',
    domainNumber: 19,
    title: 'Knowledge Sources & Legal Research',
    tagline: 'Primary Acts, Hierarchy of Precedents, Article 141 Binding Precedent, Circulars & Technical Guides',
    primaryStatutoryActs: ['Constitution of India (Article 141, 142, 227)', 'General Clauses Act, 1897'],
    governingRegulatoryBodies: ['Supreme Court of India', 'Law Commission of India', 'ICAI Research Committee'],
    seniorCaExpectation: 'Rigorous legal research methodologies: isolating Ratio Decidendi from Obiter Dicta, validating whether High Court decision is jurisdictional or persuasive, and verifying legislative history.',
    subTopics: [
      'Bare Acts & Legislative Intent (Statements of Objects and Reasons, Parliamentary Debates)',
      'Subordinate Rules vs Parent Act (Ultra Vires Doctrine)',
      'CBDT Circulars (Section 119 - Binding on Revenue, Benevolent Circulars, Assessee Rights)',
      'CBIC Circulars and Instructions (Section 168 CGST Act)',
      'Statutory Notifications vs Departmental Press Releases (Legal Enforceability)',
      'ICAI Guidance Notes and Technical Guides (Mandatory Status vs Recommendatory Weight)',
      'Supreme Court Precedents under Article 141 (Law of the Land, Prospective Overruling)',
      'High Court Jurisdictional Authority & Persuasive Weight in Other States',
      'Tribunal Benches Precedence (Larger Bench / Special Bench Binding on Division Bench)',
      'Authority for Advance Rulings (AAR) & Binding Nature Limited to Applicant',
      'MCA Notifications, Companies (Rules) and General Circulars',
      'RBI Master Directions, Master Circulars and FAQs (Enforceability under Banking Law)',
      'Finance Bills, Memorandum Explaining Provisions & Budget Enactments'
    ],
    dimensions: {
      applicableStatutes: [],
      subordinateRules: [],
      formsAndFilings: [],
      timelinesAndApplicability: [],
      latestAmendments: [],
      administrativeGuidance: [],
      judicialPrecedents: [],
      practicalCalculations: [],
      caseStudies: [],
      commonErrorsAndTraps: [],
      noticeAndAppellateProcedures: [],
      advisoryFramework: { opinionCategory: 'TRANSACTION_STRUCTURING', standardStructure: [], riskGradingMatrix: [], icaiComplianceStandards: [], boilerplateCaveatsAndDisclaimers: [] }
    }
  },

  {
    id: '20_PRACTICE_MANAGEMENT_CLIENT_HANDLING',
    domainNumber: 20,
    title: 'Practice Management & Client Handling',
    tagline: 'Client Onboarding, KYC, Engagement Letters (SA 210), Fee Realization, Pay-to-Release & Quality Control',
    primaryStatutoryActs: ['Chartered Accountants Act, 1949', 'ICAI Statement on Standard Auditing Practices (SQC 1)'],
    governingRegulatoryBodies: ['ICAI Quality Review Board', 'Peer Review Board'],
    seniorCaExpectation: 'Firm institutionalization: risk-graded client onboarding KYC, rigorous Engagement Letters under SA 210, automated compliance calendars, digital DSC custody registers, WIP tracking, Pay-to-Release fee realization, and article assistant training.',
    subTopics: [
      'Client Onboarding Protocol & Know Your Customer (KYC) Verification',
      'Communication with Previous Auditor under ICAI Code of Ethics (Clause 8 Part I First Schedule)',
      'Engagement Letters & Terms of Audit Engagements (SA 210 Drafting)',
      'Fee Structuring Models (Fixed Retainers, Success Fees Prohibitions, Advisory Value Pricing)',
      'Client Communication Protocols & Audit Trail Preservations',
      'Statutory Compliance Calendars & Deadline Management Systems',
      'Document Vault Security & Client Records Confidentiality',
      'Notice Tracking & Limitation Bar Safeguards',
      'Client Advisory Dossiers & Executive Briefings',
      'Professional Indemnity Insurance & Risk Management',
      'Digital Signature (DSC) Custody Registers & Misuse Safeguards',
      'Firm Talent Management, Article Assistant Training & Work Allocation',
      'Audit Workpaper Review & Multi-Tier Quality Control (SQC 1)'
    ],
    dimensions: {
      applicableStatutes: [],
      subordinateRules: [],
      formsAndFilings: [],
      timelinesAndApplicability: [],
      latestAmendments: [],
      administrativeGuidance: [],
      judicialPrecedents: [],
      practicalCalculations: [],
      caseStudies: [],
      commonErrorsAndTraps: [],
      noticeAndAppellateProcedures: [],
      advisoryFramework: { opinionCategory: 'ACCOUNTING_DISCLOSURE', standardStructure: [], riskGradingMatrix: [], icaiComplianceStandards: ['SQC 1', 'SA 210', 'SA 220'], boilerplateCaveatsAndDisclaimers: [] }
    }
  }
];

/**
 * Helper to fetch a domain definition by its ID or number
 */
export function getCADomainById(id: CADomainId): CADomainDefinition | undefined {
  return CA_DOMAINS_CATALOG.find(d => d.id === id);
}

export function getCADomainByNumber(domainNum: number): CADomainDefinition | undefined {
  return CA_DOMAINS_CATALOG.find(d => d.domainNumber === domainNum);
}
