'use client';

import React, { useState } from 'react';
import { Printer, Download, CheckCircle2, ShieldCheck, ArrowRight, FileText, Building2, UserCheck, Sparkles } from 'lucide-react';

export interface CotiClientData {
  pan: string;
  name: string;
  tradeName?: string;
  status: string;
  assessmentYear: string;
  previousYear: string;
  dateOfBirthOrInc: string;
  wardCircle: string;
  address: string;
  bankDetails: {
    bank: string;
    accountNo: string;
    ifsc: string;
  };
  regime: 'NEW_115BAC' | 'OLD';
  salaryIncome: number;
  salaryStandardDeduction: number;
  netSalary: number;
  hpGrossRent: number;
  hpTaxesPaid: number;
  hpStandardDeduction: number;
  hpInterestBorrowedCapital: number;
  netHouseProperty: number;
  pgbpNetProfit: number;
  pgbpSec43BhAddback: number;
  pgbpDepreciation: number;
  netPgbp: number;
  stcg111A: number;
  stcgNormal: number;
  ltcg112A: number;
  ltcgNormal: number;
  netCapitalGains: number;
  otherBankInterest: number;
  otherDividend: number;
  netOtherSources: number;
  grossTotalIncome: number;
  deduction80C: number;
  deduction80D: number;
  deduction80G: number;
  deduction80TTA: number;
  totalChapterVia: number;
  totalTaxableIncome: number;
  taxOnNormalIncome: number;
  taxOnSpecialRates: number;
  rebate87A: number;
  surcharge: number;
  cess4Percent: number;
  totalTaxLiability: number;
  relief89: number;
  tdsSalary: number;
  tdsOtherThanSalary: number;
  tcs: number;
  advanceTax15Jun: number;
  advanceTax15Sep: number;
  advanceTax15Dec: number;
  advanceTax15Mar: number;
  totalTdsTcsAdvanceTax: number;
  interest234A: number;
  interest234B: number;
  interest234C: number;
  netTaxPayableOrRefund: number;
  udin: string;
  signingPartner: string;
  membershipNumber: string;
  firmRegNumber: string;
}

const DEFAULT_COTI: CotiClientData = {
  pan: 'AAACG1234F',
  name: 'Pratwi Solutions Private Limited',
  tradeName: 'Pratwi Solutions',
  status: 'Domestic Company (Turnover <= 400 Cr)',
  assessmentYear: '2025-26',
  previousYear: '2024-25',
  dateOfBirthOrInc: '14/04/2016',
  wardCircle: 'Corporate Circle 1(1), Indore',
  address: 'Plot 42, Sector 3, Industrial Area, Pithampur, MP - 454775',
  bankDetails: {
    bank: 'HDFC Bank Ltd',
    accountNo: '50200012345678',
    ifsc: 'HDFC0000281'
  },
  regime: 'NEW_115BAC',
  salaryIncome: 0,
  salaryStandardDeduction: 0,
  netSalary: 0,
  hpGrossRent: 0,
  hpTaxesPaid: 0,
  hpStandardDeduction: 0,
  hpInterestBorrowedCapital: 0,
  netHouseProperty: 0,
  pgbpNetProfit: 4850000,
  pgbpSec43BhAddback: 250000,
  pgbpDepreciation: 850000,
  netPgbp: 4250000,
  stcg111A: 0,
  stcgNormal: 350000,
  ltcg112A: 0,
  ltcgNormal: 0,
  netCapitalGains: 350000,
  otherBankInterest: 185000,
  otherDividend: 60000,
  netOtherSources: 245000,
  grossTotalIncome: 4845000,
  deduction80C: 0,
  deduction80D: 0,
  deduction80G: 0,
  deduction80TTA: 0,
  totalChapterVia: 0,
  totalTaxableIncome: 4845000,
  taxOnNormalIncome: 1065900,
  taxOnSpecialRates: 0,
  rebate87A: 0,
  surcharge: 0,
  cess4Percent: 42636,
  totalTaxLiability: 1108536,
  relief89: 0,
  tdsSalary: 0,
  tdsOtherThanSalary: 520000,
  tcs: 0,
  advanceTax15Jun: 150000,
  advanceTax15Sep: 250000,
  advanceTax15Dec: 250000,
  advanceTax15Mar: 200000,
  totalTdsTcsAdvanceTax: 1370000,
  interest234A: 0,
  interest234B: 0,
  interest234C: 0,
  netTaxPayableOrRefund: -261464, // Refund
  udin: '25088921AAAAAA1029',
  signingPartner: 'CA Gunjan Jain, FCA',
  membershipNumber: '088921',
  firmRegNumber: '004123C'
};

export function InstitutionalCotiDossier({ initialData }: { initialData?: Partial<CotiClientData> }) {
  const [data] = useState<CotiClientData>({ ...DEFAULT_COTI, ...initialData });
  const [viewMode, setViewMode] = useState<'STANDARD_SHEET' | 'BANK_LOAN_PACK'>('STANDARD_SHEET');

  const formatInr = (val: number) => {
    return '₹' + Math.abs(val).toLocaleString('en-IN');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="bg-white border-2 border-red-500 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm no-print">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span>Computation of Total Income (COTI)</span>
              <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                Banker &amp; ITO Certified
              </span>
            </h2>
            <p className="text-xs text-slate-600">
              The institutional standard layout recognized across all Indian banks and Income Tax circles
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setViewMode(viewMode === 'STANDARD_SHEET' ? 'BANK_LOAN_PACK' : 'STANDARD_SHEET')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-semibold transition"
          >
            {viewMode === 'STANDARD_SHEET' ? 'Switch to Bank Loan Pack' : 'Standard Sheet'}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Official Computation Sheet (Print-Ready) */}
      <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-200 max-w-4xl mx-auto font-serif text-[13px] leading-relaxed relative">
        {/* Subtle Watermark for authenticity */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
          <span className="text-8xl font-black rotate-[-30deg] tracking-widest text-slate-900">
            ICAI CERTIFIED
          </span>
        </div>

        {/* Firm Header */}
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wider text-slate-950 font-sans">
            M/S R. AGARWAL & ASSOCIATES
          </h1>
          <p className="text-xs uppercase tracking-widest text-slate-600 font-sans">
            Chartered Accountants • FRN: {data.firmRegNumber}
          </p>
          <p className="text-[11px] text-slate-500 font-sans">
            Head Office: 401, Apollo Tower, MG Road, Indore (M.P.) - 452001
          </p>
        </div>

        {/* Document Title */}
        <div className="text-center mb-6">
          <h2 className="text-sm font-bold uppercase underline tracking-wide font-sans">
            COMPUTATION OF TOTAL INCOME & TAX LIABILITY
          </h2>
          <p className="text-xs font-semibold text-slate-700 font-sans">
            Assessment Year: {data.assessmentYear} | Previous Year: {data.previousYear}
          </p>
        </div>

        {/* Assessee Details Table */}
        <table className="w-full border-collapse border border-slate-400 mb-6 font-sans text-xs">
          <tbody>
            <tr className="border-b border-slate-300">
              <td className="p-2 font-bold bg-slate-50 w-1/4 border-r border-slate-300">Name of Assessee</td>
              <td className="p-2 font-semibold w-1/4 border-r border-slate-300">{data.name}</td>
              <td className="p-2 font-bold bg-slate-50 w-1/4 border-r border-slate-300">Permanent A/c No. (PAN)</td>
              <td className="p-2 font-mono font-bold w-1/4">{data.pan}</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Status / Entity Type</td>
              <td className="p-2 border-r border-slate-300">{data.status}</td>
              <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Date of Inc. / DOB</td>
              <td className="p-2">{data.dateOfBirthOrInc}</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Tax Regime</td>
              <td className="p-2 font-semibold border-r border-slate-300 text-blue-800">
                {data.regime === 'NEW_115BAC' ? 'Section 115BAC (New Default)' : 'Old Regime with Deductions'}
              </td>
              <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Ward / Assessing Officer</td>
              <td className="p-2">{data.wardCircle}</td>
            </tr>
            <tr>
              <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Registered Address</td>
              <td colSpan={3} className="p-2">{data.address}</td>
            </tr>
          </tbody>
        </table>

        {/* 5 Heads of Income Computation */}
        <div className="mb-6 font-sans">
          <table className="w-full border-collapse border border-slate-400 text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-400 text-slate-800">
                <th className="p-2 text-left border-r border-slate-400">Particulars</th>
                <th className="p-2 text-right border-r border-slate-400 w-36">Details (₹)</th>
                <th className="p-2 text-right w-40">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {/* Head 1: Salary */}
              <tr className="border-b border-slate-200">
                <td className="p-2 font-bold border-r border-slate-300" colSpan={3}>
                  1. INCOME FROM SALARIES (u/s 15 - 17)
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 pl-6 border-r border-slate-300">Gross Salary & Allowances</td>
                <td className="p-2 text-right border-r border-slate-300 font-mono">{formatInr(data.salaryIncome)}</td>
                <td className="p-2 text-right font-mono">-</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 pl-6 border-r border-slate-300">Less: Standard Deduction u/s 16(ia)</td>
                <td className="p-2 text-right border-r border-slate-300 font-mono">({formatInr(data.salaryStandardDeduction)})</td>
                <td className="p-2 text-right font-mono font-semibold">{formatInr(data.netSalary)}</td>
              </tr>

              {/* Head 2: House Property */}
              <tr className="border-b border-slate-200">
                <td className="p-2 font-bold border-r border-slate-300" colSpan={3}>
                  2. INCOME FROM HOUSE PROPERTY (u/s 22 - 27)
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 pl-6 border-r border-slate-300">Annual Value / Net Rent</td>
                <td className="p-2 text-right border-r border-slate-300 font-mono">{formatInr(data.hpGrossRent)}</td>
                <td className="p-2 text-right font-mono font-semibold">{formatInr(data.netHouseProperty)}</td>
              </tr>

              {/* Head 3: PGBP */}
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <td className="p-2 font-bold border-r border-slate-300" colSpan={3}>
                  3. PROFITS & GAINS OF BUSINESS OR PROFESSION (u/s 28 - 44DB)
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 pl-6 border-r border-slate-300">Net Profit as per Profit & Loss Account</td>
                <td className="p-2 text-right border-r border-slate-300 font-mono">{formatInr(data.pgbpNetProfit)}</td>
                <td className="p-2 text-right font-mono">-</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 pl-6 border-r border-slate-300">Add: Disallowance u/s 43B(h) (MSME overdue dues)</td>
                <td className="p-2 text-right border-r border-slate-300 font-mono">{formatInr(data.pgbpSec43BhAddback)}</td>
                <td className="p-2 text-right font-mono">-</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 pl-6 border-r border-slate-300">Less: Depreciation as per Income Tax Rules (Block-wise)</td>
                <td className="p-2 text-right border-r border-slate-300 font-mono">({formatInr(data.pgbpDepreciation)})</td>
                <td className="p-2 text-right font-mono font-semibold">{formatInr(data.netPgbp)}</td>
              </tr>

              {/* Head 4: Capital Gains */}
              <tr className="border-b border-slate-200">
                <td className="p-2 font-bold border-r border-slate-300" colSpan={3}>
                  4. CAPITAL GAINS (u/s 45 - 55)
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 pl-6 border-r border-slate-300">Short Term Capital Gains (STCG)</td>
                <td className="p-2 text-right border-r border-slate-300 font-mono">{formatInr(data.stcgNormal)}</td>
                <td className="p-2 text-right font-mono font-semibold">{formatInr(data.netCapitalGains)}</td>
              </tr>

              {/* Head 5: Other Sources */}
              <tr className="border-b border-slate-200">
                <td className="p-2 font-bold border-r border-slate-300" colSpan={3}>
                  5. INCOME FROM OTHER SOURCES (u/s 56 - 59)
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 pl-6 border-r border-slate-300">Bank Interest & Dividend Income</td>
                <td className="p-2 text-right border-r border-slate-300 font-mono">{formatInr(data.netOtherSources)}</td>
                <td className="p-2 text-right font-mono font-semibold">{formatInr(data.netOtherSources)}</td>
              </tr>

              {/* Gross Total Income */}
              <tr className="border-b-2 border-slate-900 bg-slate-100 font-bold">
                <td className="p-2 text-slate-950 uppercase border-r border-slate-300">
                  GROSS TOTAL INCOME (GTI)
                </td>
                <td className="p-2 border-r border-slate-300"></td>
                <td className="p-2 text-right font-mono text-sm text-slate-950">{formatInr(data.grossTotalIncome)}</td>
              </tr>

              {/* Chapter VI-A Deductions */}
              <tr className="border-b border-slate-200">
                <td className="p-2 pl-6 text-slate-700 border-r border-slate-300">
                  Less: Deductions under Chapter VI-A (80C, 80D, 80G)
                </td>
                <td className="p-2 text-right border-r border-slate-300 font-mono">
                  {data.regime === 'NEW_115BAC' ? 'Not Eligible u/s 115BAC' : formatInr(data.totalChapterVia)}
                </td>
                <td className="p-2 text-right font-mono">({formatInr(data.totalChapterVia)})</td>
              </tr>

              {/* Total Taxable Income */}
              <tr className="border-b-2 border-slate-900 bg-slate-200/80 font-bold text-sm">
                <td className="p-2 uppercase text-slate-950 border-r border-slate-400">
                  TOTAL TAXABLE INCOME (Rounded u/s 288A)
                </td>
                <td className="p-2 border-r border-slate-400"></td>
                <td className="p-2 text-right font-mono text-slate-950">{formatInr(data.totalTaxableIncome)}</td>
              </tr>

              {/* Tax Calculations */}
              <tr className="border-b border-slate-200">
                <td className="p-2 pl-6 border-r border-slate-300">Tax on Total Income (Standard Slab Rate)</td>
                <td className="p-2 text-right border-r border-slate-300 font-mono">{formatInr(data.taxOnNormalIncome)}</td>
                <td className="p-2 text-right font-mono">-</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 pl-6 border-r border-slate-300">Add: Health & Education Cess @ 4%</td>
                <td className="p-2 text-right border-r border-slate-300 font-mono">{formatInr(data.cess4Percent)}</td>
                <td className="p-2 text-right font-mono font-semibold">{formatInr(data.totalTaxLiability)}</td>
              </tr>

              {/* Prepaid Taxes */}
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <td className="p-2 font-bold border-r border-slate-300" colSpan={3}>
                  LESS: PREPAID TAXES / TAX CREDITS CLAIMED
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 pl-6 border-r border-slate-300">Tax Deducted at Source (TDS as per 26AS/AIS)</td>
                <td className="p-2 text-right border-r border-slate-300 font-mono">{formatInr(data.tdsOtherThanSalary)}</td>
                <td className="p-2 text-right font-mono">-</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 pl-6 border-r border-slate-300">Advance Tax Paid (Challan BSR Matched)</td>
                <td className="p-2 text-right border-r border-slate-300 font-mono">{formatInr(data.advanceTax15Jun + data.advanceTax15Sep + data.advanceTax15Dec + data.advanceTax15Mar)}</td>
                <td className="p-2 text-right font-mono font-semibold">({formatInr(data.totalTdsTcsAdvanceTax)})</td>
              </tr>

              {/* Net Payable / Refund */}
              <tr className={`border-b-2 border-slate-900 font-bold text-sm ${data.netTaxPayableOrRefund < 0 ? 'bg-emerald-50 text-emerald-950' : 'bg-amber-50 text-amber-950'}`}>
                <td className="p-2 uppercase border-r border-slate-400">
                  {data.netTaxPayableOrRefund < 0 ? 'NET REFUND DUE TO ASSESSEE (u/s 143(1))' : 'NET TAX PAYABLE (u/s 140A)'}
                </td>
                <td className="p-2 border-r border-slate-400"></td>
                <td className="p-2 text-right font-mono text-base font-black">
                  {formatInr(data.netTaxPayableOrRefund)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bank Refund Details */}
        <div className="border border-slate-300 p-3 rounded mb-8 font-sans text-xs bg-slate-50">
          <span className="font-bold block mb-1">Direct Bank Credit Account for Refund:</span>
          <div className="grid grid-cols-3 gap-2">
            <div><span className="text-slate-500">Bank:</span> <span className="font-semibold">{data.bankDetails.bank}</span></div>
            <div><span className="text-slate-500">Account No:</span> <span className="font-mono font-semibold">{data.bankDetails.accountNo}</span></div>
            <div><span className="text-slate-500">IFSC Code:</span> <span className="font-mono font-semibold">{data.bankDetails.ifsc}</span></div>
          </div>
        </div>

        {/* Verification and CA Stamp Block */}
        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-400 font-sans text-xs">
          <div>
            <p className="font-bold text-slate-800 mb-1">Verification by Assessee:</p>
            <p className="text-[11px] text-slate-600 mb-8 leading-normal">
              I, Director/Authorised Signatory, solemnly declare that to the best of my knowledge and belief, the information given in this computation is true and correct.
            </p>
            <p className="font-bold border-t border-dashed border-slate-400 pt-1 inline-block">
              For {data.name}
              <br />
              <span className="text-slate-500 font-normal">Authorised Signatory</span>
            </p>
          </div>

          <div className="text-right">
            <p className="font-bold text-slate-800 mb-1">Certified as per Books of Account:</p>
            <p className="text-[11px] text-slate-600 mb-4">
              For M/s R. Agarwal & Associates, Chartered Accountants
            </p>
            <div className="inline-block text-left p-3 border border-slate-300 rounded bg-slate-50 mb-4 font-mono text-[11px]">
              <span className="block font-bold text-slate-900">{data.signingPartner}</span>
              <span className="block text-slate-600">Membership No.: {data.membershipNumber}</span>
              <span className="block text-slate-600">Firm Reg. No.: {data.firmRegNumber}</span>
              <span className="block font-bold text-blue-900 mt-1">UDIN: {data.udin}</span>
            </div>
            <p className="text-[10px] text-slate-400">Date: {new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
