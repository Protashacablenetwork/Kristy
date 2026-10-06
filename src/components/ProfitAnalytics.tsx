import React, { useState } from 'react';
import {
  Coins,
  TrendingUp,
  Award,
  Users,
  Calendar,
  CheckCircle2,
  PieChart,
  HelpCircle
} from 'lucide-react';
import { Member } from '../types';
import {
  formatTaka,
  MONTH_NAMES_BN,
  calculateProfitForMonth,
  getMemberMetrics,
  getAllAvailableYears
} from '../utils/calculations';

interface ProfitAnalyticsProps {
  members: Member[];
}

export const ProfitAnalytics: React.FC<ProfitAnalyticsProps> = ({ members }) => {
  const availableYears = getAllAvailableYears(members);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Calculate year's monthly metrics
  const monthlyMetrics = Array.from({ length: 12 }).map((_, monthIndex) => {
    const res = calculateProfitForMonth(members, monthIndex, selectedYear);
    return {
      monthIndex,
      monthNameBn: MONTH_NAMES_BN[monthIndex],
      ...res
    };
  });

  const totalCollectedYear = monthlyMetrics.reduce((acc, m) => acc + m.collectedTaka, 0);
  const totalProfitEarnedYear = monthlyMetrics.reduce((acc, m) => acc + m.profitEarned, 0);

  // Overall expected profit across all members
  let totalProjectedProfit = 0;
  let totalLoans = 0;
  members.forEach((m) => {
    totalLoans += m.taka;
    totalProjectedProfit += Math.round(m.taka * (m.profitRate || 0.20));
  });

  // Current month: September (index 8) or latest month with collections
  const currentMonthIdx = 8; // September
  const currentMonthProfit = monthlyMetrics[currentMonthIdx]?.profitEarned || 0;
  const currentMonthCollection = monthlyMetrics[currentMonthIdx]?.collectedTaka || 0;

  // Max value for bar chart scaling
  const maxCollection = Math.max(...monthlyMetrics.map((m) => m.collectedTaka), 1);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Profit Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Current Month Profit */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              বর্তমান মাসের লাভ ({MONTH_NAMES_BN[currentMonthIdx]} {selectedYear})
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {formatTaka(currentMonthProfit)}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            জমা পড়েছে: <strong>{formatTaka(currentMonthCollection)}</strong>
          </div>
        </div>

        {/* Total Earned Profit So Far */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {selectedYear} সালে মোট অর্জিত লাভ
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {formatTaka(totalProfitEarnedYear)}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            মোট আদায়: <strong>{formatTaka(totalCollectedYear)}</strong>
          </div>
        </div>

        {/* Projected Full Profit */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">মোট লাভ (সকল সদস্য)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
            {formatTaka(totalProjectedProfit)}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {formatTaka(totalLoans)} ঋণের ২০% মোট লাভ
          </div>
        </div>
      </div>

      {/* Month-by-Month Profit Breakdown Table (Mobile Optimized View Size) */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 sm:space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" />
              <span>মাসিক লাভের বিবরণী ({selectedYear} সাল)</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500">
              কোন মাসে কত কিস্তি আদায় হয়েছে এবং কত লাভ অর্জিত হয়েছে
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y} সাল
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Container with smooth horizontal overflow for mobile devices */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl overflow-x-auto custom-scroll shadow-sm">
          <table className="w-full text-left text-xs sm:text-sm min-w-[340px]">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px] sm:text-[11px] tracking-wider">
              <tr>
                <th className="py-2.5 px-2.5 sm:py-3 sm:px-4">মাস</th>
                <th className="py-2.5 px-2.5 sm:py-3 sm:px-4 text-right">আদায়কৃত</th>
                <th className="py-2.5 px-2.5 sm:py-3 sm:px-4 text-right">লাভ (১৬.৬৭%)</th>
                <th className="py-2.5 px-2.5 sm:py-3 sm:px-4 text-center">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {monthlyMetrics.map((m) => {
                const hasProfit = m.profitEarned > 0;
                return (
                  <tr key={m.monthIndex} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-2.5 sm:py-3 sm:px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {m.monthNameBn} {selectedYear}
                    </td>
                    <td className="py-2.5 px-2.5 sm:py-3 sm:px-4 text-right text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                      {m.collectedTaka > 0 ? formatTaka(m.collectedTaka) : '—'}
                    </td>
                    <td className="py-2.5 px-2.5 sm:py-3 sm:px-4 text-right font-extrabold text-emerald-600 whitespace-nowrap">
                      {hasProfit ? formatTaka(m.profitEarned) : '—'}
                    </td>
                    <td className="py-2.5 px-2.5 sm:py-3 sm:px-4 text-center whitespace-nowrap">
                      {hasProfit ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> লাভ হয়েছে
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rules Information Card from user's original design */}
      <div className="bg-blue-50/60 dark:bg-blue-950/30 p-5 rounded-3xl border border-blue-200/60 dark:border-blue-900/40 space-y-2 text-xs text-slate-700 dark:text-slate-300">
        <h4 className="font-bold text-sm text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>দশ তারা সমবায় সমিতির ঋণের নীতিমালা ও লাভ গণনা পদ্ধতি</span>
        </h4>
        <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 font-medium">
          <li>
            <strong>মোট সদস্য:</strong> বর্তমানে {members.length} জন সদস্য সিস্টেমে সক্রিয়।
          </li>
          <li>
            <strong>লাভের হার:</strong> মূল ঋণের উপর এককালীন ২০% লাভ নির্ধারণ করা হয়।
          </li>
          <li>
            <strong>কিস্তির মেয়াদ:</strong> ঋণ গ্রহণের পরবর্তী মাস হতে মোট ১০টি সমান মাসিক কিস্তিতে মূল ও লাভ পরিশোধযোগ্য।
          </li>
          <li>
            <strong>লাভ বণ্টন:</strong> প্রতিটি আদায়কৃত কিস্তির আনুপাতিক অংশ (১৬.৬৭%) সমিতির অর্জিত লাভ হিসেবে গণ্য হয়।
          </li>
        </ul>
      </div>
    </div>
  );
};
