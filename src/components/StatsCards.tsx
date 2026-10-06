import React from 'react';
import {
  Coins,
  TrendingDown,
  TrendingUp,
  Users,
  Calendar,
  Award,
  ArrowRight
} from 'lucide-react';
import { formatTaka } from '../utils/calculations';

interface StatsCardsProps {
  currentMonthCollection: number;
  totalLoansDisbursed: number;
  totalCollectedAllTime: number;
  totalOverdue: number;
  totalProfit: number;
  memberCount: number;
  onFilterClick: (type: 'monthlyPaid' | 'today' | 'total' | 'due' | 'members' | 'profit') => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  currentMonthCollection,
  totalLoansDisbursed,
  totalCollectedAllTime,
  totalOverdue,
  totalProfit,
  memberCount,
  onFilterClick
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* 1. মাসিক কিস্তি (Today / Current Month Collection) */}
      <div
        onClick={() => onFilterClick('monthlyPaid')}
        className="group bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition cursor-pointer relative overflow-hidden active:scale-[0.99]"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">মাসিক কিস্তি</span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition shrink-0">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
          {formatTaka(currentMonthCollection)}
        </div>
        <div className="flex items-center justify-between mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] sm:text-[11px] text-emerald-600 font-bold">
          <span className="truncate">জমা তালিকা</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition shrink-0 ml-1" />
        </div>
      </div>

      {/* 2. মোট জমা (Total Collected Across All Months) */}
      <div
        onClick={() => onFilterClick('total')}
        className="group bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition cursor-pointer relative overflow-hidden active:scale-[0.99]"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">মোট জমা</span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center group-hover:scale-110 transition shrink-0">
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
          {formatTaka(totalCollectedAllTime)}
        </div>
        <div className="flex items-center justify-between mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] sm:text-[11px] text-blue-600 font-bold">
          <span className="truncate">সকল জমা</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition shrink-0 ml-1" />
        </div>
      </div>

      {/* 3. বকেয়া কিস্তি (Total Due Overdue) */}
      <div
        onClick={() => onFilterClick('due')}
        className="group bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition cursor-pointer relative overflow-hidden active:scale-[0.99]"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">বকেয়া কিস্তি</span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center group-hover:scale-110 transition shrink-0">
            <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-base sm:text-2xl font-black text-rose-600 tracking-tight truncate">
          {formatTaka(totalOverdue)}
        </div>
        <div className="flex items-center justify-between mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] sm:text-[11px] text-rose-600 font-bold">
          <span className="truncate">বকেয়া তালিকা</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition shrink-0 ml-1" />
        </div>
      </div>

      {/* 4. সদস্য (Member Count) */}
      <div
        onClick={() => onFilterClick('members')}
        className="group bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition cursor-pointer relative overflow-hidden active:scale-[0.99]"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">সদস্য</span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center group-hover:scale-110 transition shrink-0">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
          {memberCount} জন
        </div>
        <div className="flex items-center justify-between mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] sm:text-[11px] text-purple-600 font-bold">
          <span className="truncate">সদস্য তালিকা</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition shrink-0 ml-1" />
        </div>
      </div>
    </div>
  );
};
