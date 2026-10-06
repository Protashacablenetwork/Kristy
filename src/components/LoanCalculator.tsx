import React, { useState } from 'react';
import { Calculator, ArrowRight, CheckCircle2, Coins, Calendar, Info } from 'lucide-react';
import { calcLoan, formatTaka, MONTH_NAMES_BN, getAllAvailableYears } from '../utils/calculations';

export const LoanCalculator: React.FC = () => {
  const [loanAmount, setLoanAmount] = useState<number>(50000);
  const [profitRate, setProfitRate] = useState<number>(20);
  const [tenure, setTenure] = useState<number>(10);

  // Loan Issue Month & Year State (Defaults to current running month/year)
  const currentDate = new Date();
  const [loanMonthIndex, setLoanMonthIndex] = useState<number>(currentDate.getMonth());
  const [loanYear, setLoanYear] = useState<number>(currentDate.getFullYear());

  const calc = calcLoan(loanAmount, tenure, profitRate / 100);

  // Installment 1 starts in the month AFTER loan disbursement month
  const firstInstMonthIdx = (loanMonthIndex + 1) % 12;
  const firstInstYear = loanYear + Math.floor((loanMonthIndex + 1) / 12);

  const scheduleRows = Array.from({ length: tenure }).map((_, idx) => {
    const totalMonthOffset = loanMonthIndex + 1 + idx;
    const mIdx = totalMonthOffset % 12;
    const yearOffset = Math.floor(totalMonthOffset / 12);
    const yr = loanYear + yearOffset;
    return {
      instNo: idx + 1,
      month: `${MONTH_NAMES_BN[mIdx]} ${yr}`,
      amount: calc.monthlyInstallment,
      principalPart: Math.round(loanAmount / tenure),
      profitPart: Math.round(calc.profit / tenure)
    };
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner & Inputs */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-6 h-6 text-blue-600" />
              <span>উন্নত ঋণ ও কিস্তি ক্যালকুলেটর</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              সমিতি ঋণ পরিশোধের পূর্ণাঙ্গ মাসিক কিস্তি ও লাভ নির্ধারণ
            </p>
          </div>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 border border-blue-200 dark:border-blue-900">
            {tenure} মাস মেয়াদী
          </span>
        </div>

        {/* Input sliders and boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Loan Amount */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                ঋণের পরিমাণ
              </label>
              <span className="text-sm font-extrabold text-blue-600">{formatTaka(loanAmount)}</span>
            </div>
            <input
              type="number"
              value={loanAmount}
              min="5000"
              max="500000"
              step="5000"
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <input
              type="range"
              min="10000"
              max="200000"
              step="5000"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Profit / Interest Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                লাভের হার (%)
              </label>
              <span className="text-sm font-extrabold text-emerald-600">{profitRate}%</span>
            </div>
            <input
              type="number"
              value={profitRate}
              min="5"
              max="50"
              step="1"
              onChange={(e) => setProfitRate(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <input
              type="range"
              min="10"
              max="40"
              step="1"
              value={profitRate}
              onChange={(e) => setProfitRate(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Tenure (Months) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                কিস্তির মেয়াদ (মাস)
              </label>
              <span className="text-sm font-extrabold text-indigo-600">{tenure} মাস</span>
            </div>
            <input
              type="number"
              value={tenure}
              min="2"
              max="36"
              step="1"
              onChange={(e) => setTenure(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <input
              type="range"
              min="3"
              max="24"
              step="1"
              value={tenure}
              onChange={(e) => setTenure(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Loan Disbursement Date / Running Month Selection */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                ঋণ গ্রহণের মাস ও বছর (রানিং মাস):
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                রানিং মাসে ঋণ নিলে ১ম কিস্তি পরের মাসে পরিশোধযোগ্য
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={loanMonthIndex}
              onChange={(e) => setLoanMonthIndex(Number(e.target.value))}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              {MONTH_NAMES_BN.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={loanYear}
              onChange={(e) => setLoanYear(Number(e.target.value))}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              {getAllAvailableYears(undefined, [loanYear]).map((y) => (
                <option key={y} value={y}>
                  {y} সাল
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Info Box about Next Month Payment */}
        <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/60 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 dark:text-blue-200 space-y-1">
            <p className="font-bold">
              ঋণ গ্রহণের মাস: <span className="underline">{MONTH_NAMES_BN[loanMonthIndex]} {loanYear}</span> (রানিং মাস)
            </p>
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">
              ১ম কিস্তি জমা শুরু হবে: <span className="font-bold">{MONTH_NAMES_BN[firstInstMonthIdx]} {firstInstYear}</span> তারিখে
            </p>
          </div>
        </div>

        {/* Calculation Result Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-900/50">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">মূল ঋণ</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {formatTaka(calc.principal)}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">মোট লাভ ({profitRate}%)</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatTaka(calc.profit)}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">মোট পরিশোধ্য</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {formatTaka(calc.totalPayable)}
            </span>
          </div>
          <div className="border-l border-blue-200 dark:border-blue-800 pl-3">
            <span className="text-xs text-blue-700 dark:text-blue-300 font-bold block">প্রতি মাসের কিস্তি</span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {formatTaka(calc.monthlyInstallment)}
            </span>
          </div>
        </div>
      </div>

      {/* Payback Schedule Table */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <span>{tenure} মাসের কিস্তি পরিশোধের সময়সূচি</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            ১ম কিস্তি: {MONTH_NAMES_BN[firstInstMonthIdx]} {firstInstYear}
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">কিস্তি নং</th>
                  <th className="py-3 px-4 whitespace-nowrap">পরিশোধের মাস</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">আসল অংশ</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">লাভ অংশ</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">মোট কিস্তি</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {scheduleRows.map((row) => (
                  <tr key={row.instNo} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-bold text-slate-500 whitespace-nowrap">
                      কিস্তি #{row.instNo}
                      {row.instNo === 1 && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          ১ম কিস্তি
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {row.month}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono">
                      {formatTaka(row.principalPart)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-emerald-600 whitespace-nowrap font-mono">
                      {formatTaka(row.profitPart)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-blue-600 dark:text-blue-400 whitespace-nowrap font-mono">
                      {formatTaka(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

