import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Plus,
  Layers,
  ChevronRight,
  Info,
  X
} from 'lucide-react';
import { Member, CollectionRecord } from '../types';
import {
  formatTaka,
  MONTH_NAMES_BN,
  MONTH_NAMES_BN_SHORT,
  MONTH_NAMES_EN,
  getMemberMetrics,
  getMemberInstallmentMonths,
  getAllAvailableYears,
  saveCustomExtendedYear
} from '../utils/calculations';

interface ReportsViewProps {
  members: Member[];
  collections: CollectionRecord[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ members, collections }) => {
  // Available Years (2026 to 2030 standard + dynamic extensions)
  const [availableYears, setAvailableYears] = useState<number[]>(() => getAllAvailableYears(members));
  const [showAddYearModal, setShowAddYearModal] = useState<boolean>(false);
  const [newYearInput, setNewYearInput] = useState<string>('');

  // Monthly filter state
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // September
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [activeMonthKey, setActiveMonthKey] = useState<string>('September 2026');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'due'>('all');

  // Chart state
  const [chartYear, setChartYear] = useState<number>(2026);
  const [chartViewMode, setChartViewMode] = useState<'graph' | 'list'>('graph');
  const [activeChartMonth, setActiveChartMonth] = useState<number>(8); // Default September

  // Current running month index (e.g. September = 8 for 2026)
  const currentRunningMonthIdx = chartYear === 2026 ? 8 : (new Date().getFullYear() === chartYear ? new Date().getMonth() : 0);
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);

  const scrollToRunningMonth = (smooth = true) => {
    if (!scrollTrackRef.current) return;
    const targetEl = document.getElementById(`chart-month-col-${currentRunningMonthIdx}`);
    const container = scrollTrackRef.current;
    if (targetEl && container) {
      const targetLeft = targetEl.offsetLeft - container.offsetLeft - 8;
      container.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  useEffect(() => {
    if (chartViewMode === 'graph') {
      const timer = setTimeout(() => {
        scrollToRunningMonth(false);
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [chartYear, chartViewMode]);

  // Trigger search
  const handleSearchMonth = (monthIdx?: number, yearVal?: number) => {
    const m = monthIdx !== undefined ? monthIdx : selectedMonth;
    const y = yearVal !== undefined ? yearVal : selectedYear;
    setActiveMonthKey(`${MONTH_NAMES_EN[m]} ${y}`);
  };

  const handleAddNewYear = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(newYearInput.trim(), 10);
    if (!isNaN(val) && val >= 2020 && val <= 2099) {
      saveCustomExtendedYear(val);
      const updated = getAllAvailableYears(members, [val]);
      setAvailableYears(updated);
      setChartYear(val);
      setSelectedYear(val);
      setShowAddYearModal(false);
      setNewYearInput('');
    }
  };

  // Build report rows for the active month
  const reportRows = members
    .map((m) => {
      const metrics = getMemberMetrics(m);
      const paid = m.months?.[activeMonthKey];

      // Check tenure using member installment months helper
      const installmentMonths = getMemberInstallmentMonths(m);
      const isInTenure = installmentMonths.some((im) => im.key === activeMonthKey);

      const isPaid = paid !== null && paid !== undefined && paid >= metrics.monthlyInstallment;
      const isPartial = paid !== null && paid !== undefined && paid > 0 && paid < metrics.monthlyInstallment;
      const isDue = paid === null || paid === undefined || paid === 0;

      let status: 'paid' | 'partial' | 'due' = 'due';
      if (isPaid) status = 'paid';
      else if (isPartial) status = 'partial';

      return {
        member: m,
        isInTenure,
        expectedInstallment: metrics.monthlyInstallment,
        paidAmount: paid || 0,
        dueAmount: isPaid ? 0 : isPartial ? metrics.monthlyInstallment - (paid || 0) : metrics.monthlyInstallment,
        status
      };
    })
    .filter((row) => row.isInTenure)
    .filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          row.member.name.toLowerCase().includes(q) ||
          row.member.phone.includes(q) ||
          row.member.address.toLowerCase().includes(q)
        );
      }
      return true;
    });

  const totalExpected = reportRows.reduce((acc, r) => acc + r.expectedInstallment, 0);
  const totalPaid = reportRows.reduce((acc, r) => acc + r.paidAmount, 0);
  const totalDue = reportRows.reduce((acc, r) => acc + r.dueAmount, 0);

  // 12 Months Chart Data for chartYear (using accurate member installment months)
  const monthlyChartData = Array.from({ length: 12 }).map((_, mIdx) => {
    const mKey = `${MONTH_NAMES_EN[mIdx]} ${chartYear}`;
    let collected = 0;
    let due = 0;
    let expected = 0;
    let activeMemberCount = 0;

    members.forEach((m) => {
      const metrics = getMemberMetrics(m);
      const installmentMonths = getMemberInstallmentMonths(m);
      const inThisMonth = installmentMonths.some((im) => im.monthIndex === mIdx && im.year === chartYear);

      if (inThisMonth) {
        activeMemberCount++;
        expected += metrics.monthlyInstallment;
        const paid = m.months?.[mKey] || 0;
        collected += paid;
        if (paid < metrics.monthlyInstallment) {
          due += (metrics.monthlyInstallment - paid);
        }
      }
    });

    const rate = expected > 0 ? Math.min(100, Math.round((collected / expected) * 100)) : 0;

    return {
      monthIndex: mIdx,
      monthNameBn: MONTH_NAMES_BN[mIdx],
      monthNameShort: MONTH_NAMES_BN_SHORT[mIdx] || MONTH_NAMES_BN[mIdx].slice(0, 3),
      collected,
      due,
      expected,
      rate,
      activeMemberCount
    };
  });

  const yearTotalCollected = monthlyChartData.reduce((acc, m) => acc + m.collected, 0);
  const yearTotalDue = monthlyChartData.reduce((acc, m) => acc + m.due, 0);
  const yearTotalExpected = monthlyChartData.reduce((acc, m) => acc + m.expected, 0);
  const yearOverallRate = yearTotalExpected > 0 ? Math.min(100, Math.round((yearTotalCollected / yearTotalExpected) * 100)) : 0;
  const maxGraphVal = Math.max(...monthlyChartData.map((m) => Math.max(m.collected, m.due, m.expected)), 1);

  // Active month info for interactive card
  const activeMonthInfo = monthlyChartData[activeChartMonth] || monthlyChartData[0];

  const handleExportCSV = () => {
    const headers = ['সদস্য আইডি', 'নাম', 'ফোন', 'ঠিকানা', 'নির্ধারিত কিস্তি', 'আদায়কৃত', 'বকেয়া', 'স্ট্যাটাস'];
    const rows = reportRows.map((r) => [
      r.member.id,
      `"${r.member.name}"`,
      r.member.phone,
      `"${r.member.address}"`,
      r.expectedInstallment,
      r.paidAmount,
      r.dueAmount,
      r.status === 'paid' ? 'পরিশোধিত' : r.status === 'partial' ? 'আংশিক' : 'বকেয়া'
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `somiti_report_${activeMonthKey.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleJumpToMonthReport = (monthIdx: number) => {
    setSelectedMonth(monthIdx);
    setSelectedYear(chartYear);
    handleSearchMonth(monthIdx, chartYear);
    const el = document.getElementById('monthly-statement-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-5xl mx-auto px-1 sm:px-0">
      {/* 1. REPORT & GRAPH: Interactive Bar Chart (জমা বনাম বকেয়া) */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Card Header with Year Selector & View Mode Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-4">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600 shrink-0" />
              <span>কিস্তি জমা বনাম বকেয়া বার-গ্রাফ ({chartYear} সাল)</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              ১২ মাসের তুলনামূলক চিত্র: সবুজ (জমা) এবং লাল (বকেয়া) • ২০২৬-২০৩০+
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setChartViewMode('graph')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  chartViewMode === 'graph'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                📊 বার-গ্রাফ
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('list')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  chartViewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                📋 তালিকা
              </button>
            </div>

            {/* Year Selector (2026-2030+ Dynamic) */}
            <select
              value={chartYear}
              onChange={(e) => {
                const y = Number(e.target.value);
                setChartYear(y);
              }}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y} সাল
                </option>
              ))}
            </select>

            {/* Quick Add Future Year Button */}
            <button
              type="button"
              onClick={() => setShowAddYearModal(true)}
              className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 rounded-xl hover:bg-blue-100 transition flex items-center gap-1 text-xs font-bold"
              title="নতুন সাল যোগ করুন (যেমন: ২০৩১, ২০৩২)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">সাল যোগ</span>
            </button>
          </div>
        </div>

        {/* 4 Responsive KPI Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-emerald-50/80 dark:bg-emerald-950/30 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
            <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold block">মোট কিস্তি জমা</span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400">{formatTaka(yearTotalCollected)}</span>
          </div>
          <div className="bg-rose-50/80 dark:bg-rose-950/30 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-rose-100 dark:border-rose-900/40">
            <span className="text-[11px] text-rose-800 dark:text-rose-300 font-bold block">মোট বকেয়া</span>
            <span className="text-sm sm:text-base font-extrabold text-rose-600 dark:text-rose-400">{formatTaka(yearTotalDue)}</span>
          </div>
          <div className="bg-blue-50/80 dark:bg-blue-950/30 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-blue-100 dark:border-blue-900/40">
            <span className="text-[11px] text-blue-800 dark:text-blue-300 font-bold block">প্রত্যাশিত কিস্তি</span>
            <span className="text-sm sm:text-base font-extrabold text-blue-600 dark:text-blue-400">{formatTaka(yearTotalExpected)}</span>
          </div>
          <div className="bg-purple-50/80 dark:bg-purple-950/30 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-purple-100 dark:border-purple-900/40">
            <span className="text-[11px] text-purple-800 dark:text-purple-300 font-bold block">আদায়ের হার</span>
            <span className="text-sm sm:text-base font-extrabold text-purple-600 dark:text-purple-400">{yearOverallRate}%</span>
          </div>
        </div>

        {/* Mobile Swipe Hint */}
        {chartViewMode === 'graph' && (
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 bg-blue-50/70 dark:bg-blue-950/40 px-3 py-2 rounded-xl border border-blue-100 dark:border-blue-900/60 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-blue-600 dark:text-blue-400 font-bold">👉</span>
              <span>
                <strong>১২ মাসের গ্রাফ দেখুন ও স্পর্শ করুন:</strong> বর্তমান মাস ১ম এ (রানিং মাস আগে) এবং স্ক্রল করে আগে ও পরের মাস দেখা যাবে
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveChartMonth(currentRunningMonthIdx);
                scrollToRunningMonth(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition shrink-0 flex items-center gap-1 shadow-xs"
              title="বর্তমান রানিং মাসে যান"
            >
              <span>রানিং মাস ({MONTH_NAMES_BN[currentRunningMonthIdx]})</span>
            </button>
          </div>
        )}

        {/* GRAPH VIEW: Mobile-Optimized Horizontal Scroll Track with Single Baseline */}
        {chartViewMode === 'graph' ? (
          <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl p-2 sm:p-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div ref={scrollTrackRef} className="overflow-x-auto custom-scroll pb-2 -mx-1 px-1 scroll-smooth">
              <div className="min-w-[680px] sm:min-w-full relative">
                {/* Visual Y-Axis Guide Lines in Background */}
                <div className="absolute inset-x-0 top-0 h-40 sm:h-52 pointer-events-none flex flex-col justify-between opacity-30">
                  <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-full" />
                  <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-full" />
                  <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-full" />
                  <div className="border-b border-slate-300 dark:border-slate-700 w-full" />
                </div>

                {/* 12 Months Grid on Single Baseline (Never wraps into 2 clashing rows!) */}
                <div className="grid grid-cols-12 gap-1.5 sm:gap-2.5 pt-2 items-end h-44 sm:h-56 relative z-10">
                  {monthlyChartData.map((m) => {
                    const colHeight = maxGraphVal > 0 ? Math.round((m.collected / maxGraphVal) * 100) : 0;
                    const dueHeight = maxGraphVal > 0 ? Math.round((m.due / maxGraphVal) * 100) : 0;
                    const hasData = m.collected > 0 || m.due > 0;
                    const isSelected = activeChartMonth === m.monthIndex;
                    const isCurrentRunning = m.monthIndex === currentRunningMonthIdx;

                    return (
                      <div
                        id={`chart-month-col-${m.monthIndex}`}
                        key={m.monthIndex}
                        onClick={() => setActiveChartMonth(m.monthIndex)}
                        className={`flex flex-col items-center gap-1.5 h-full justify-end group relative cursor-pointer p-1 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-blue-100/70 dark:bg-blue-950/60 ring-2 ring-blue-500 shadow-sm'
                            : isCurrentRunning
                            ? 'bg-blue-50/50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800'
                            : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {/* Running Month Pill Badge */}
                        {isCurrentRunning && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-blue-600 text-white shadow-xs tracking-tighter whitespace-nowrap">
                            রানিং
                          </span>
                        )}
                        {/* Desktop Hover Tooltip */}
                        {hasData && (
                          <div className="absolute -top-16 z-30 hidden group-hover:block bg-slate-950 text-white text-[10px] p-2 rounded-xl whitespace-nowrap shadow-xl border border-slate-700 pointer-events-none">
                            <div className="font-bold text-slate-200 mb-0.5">{m.monthNameBn} {chartYear}</div>
                            <div className="text-emerald-400 font-semibold">জমা: {formatTaka(m.collected)}</div>
                            <div className="text-rose-400 font-semibold">বকেয়া: {formatTaka(m.due)}</div>
                            <div className="text-blue-400 font-semibold">হার: {m.rate}%</div>
                          </div>
                        )}

                        {/* Dual Bar Track */}
                        <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1.5 h-32 sm:h-40 bg-white/80 dark:bg-slate-800/80 rounded-lg sm:rounded-xl p-1 shadow-2xs">
                          {/* Collected Bar (Green) */}
                          <div
                            className="w-1/2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-400 rounded-t-sm sm:rounded-t-md transition-all duration-500"
                            style={{ height: `${Math.max(m.collected > 0 ? 8 : 2, colHeight)}%` }}
                            title={`জমা: ${formatTaka(m.collected)}`}
                          />
                          {/* Due Bar (Red) */}
                          <div
                            className="w-1/2 bg-rose-500 hover:bg-rose-600 dark:bg-rose-400 rounded-t-sm sm:rounded-t-md transition-all duration-500"
                            style={{ height: `${Math.max(m.due > 0 ? 8 : 2, dueHeight)}%` }}
                            title={`বকেয়া: ${formatTaka(m.due)}`}
                          />
                        </div>

                        {/* Month Label */}
                        <span
                          className={`text-[10px] sm:text-xs font-bold truncate transition ${
                            isSelected
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {m.monthNameShort}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Interactive Selected Month Detail Card (Touch Friendly) */}
            <div className="mt-3 p-3 bg-white dark:bg-slate-800/90 rounded-xl border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                  {activeMonthInfo.monthIndex + 1}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{activeMonthInfo.monthNameBn} {chartYear}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      সদস্য: {activeMonthInfo.activeMemberCount} জন
                    </span>
                  </h4>
                  <div className="flex items-center gap-3 text-xs mt-0.5">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">জমা: {formatTaka(activeMonthInfo.collected)}</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">বকেয়া: {formatTaka(activeMonthInfo.due)}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">হার: {activeMonthInfo.rate}%</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleJumpToMonthReport(activeMonthInfo.monthIndex)}
                className="w-full sm:w-auto px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <span>এই মাসের পূর্ণ রিপোর্ট দেখুন</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* LIST VIEW: Mobile Cards for each of the 12 Months (Zero Horizontal Scrolling) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto custom-scroll pr-1">
            {monthlyChartData.map((m) => (
              <div
                key={m.monthIndex}
                onClick={() => {
                  setActiveChartMonth(m.monthIndex);
                  handleJumpToMonthReport(m.monthIndex);
                }}
                className={`p-3 rounded-xl border transition cursor-pointer ${
                  activeChartMonth === m.monthIndex
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {m.monthNameBn} {chartYear}
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {m.rate}% আদায়
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex mb-2">
                  <div className="bg-emerald-500 h-full" style={{ width: `${m.rate}%` }} />
                  <div className="bg-rose-500 h-full" style={{ width: `${100 - m.rate}%` }} />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    জমা: {formatTaka(m.collected)}
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    বকেয়া: {formatTaka(m.due)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-2.5 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500" />
            <span className="font-semibold">কিস্তি জমা</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-rose-500" />
            <span className="font-semibold">বকেয়া কিস্তি</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] hidden sm:flex">
            <Info className="w-3 h-3" />
            <span>স্বয়ংক্রিয় সাল সাপোর্ট: ২০২৬-২০৩০+</span>
          </div>
        </div>
      </div>

      {/* 2. MONTHLY FILTER & STATEMENT TABLE */}
      <div
        id="monthly-statement-section"
        className="bg-white dark:bg-slate-900 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              <span>মাসিক কিস্তি রিপোর্ট ও স্টেটমেন্ট</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              বর্তমান প্রদর্শিত মাস: <strong className="text-slate-800 dark:text-slate-200">{activeMonthKey}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>এক্সেল / CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট</span>
            </button>
          </div>
        </div>

        {/* Filter Controls with "খুঁজুন" button */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 sm:gap-3 no-print">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">মাস</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold"
            >
              {MONTH_NAMES_BN.map((name, idx) => (
                <option key={idx} value={idx}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">সাল</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>{y} সাল</option>
              ))}
            </select>
          </div>

          <div className="sm:self-end">
            <button
              onClick={() => handleSearchMonth()}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-sm"
            >
              খুঁজুন
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">স্ট্যাটাস</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold"
            >
              <option value="all">সব সদস্য</option>
              <option value="paid">পরিশোধিত</option>
              <option value="partial">আংশিক জমা</option>
              <option value="due">বকেয়া আছে</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">নাম/মোবাইল</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 sm:p-3 rounded-xl">
            <span className="text-[11px] sm:text-xs text-slate-500 block font-medium">নির্ধারিত কিস্তি:</span>
            <strong className="text-sm sm:text-base text-slate-900 dark:text-white font-bold">{formatTaka(totalExpected)}</strong>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 sm:p-3 rounded-xl">
            <span className="text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-400 block font-medium">মোট আদায়:</span>
            <strong className="text-sm sm:text-base text-emerald-600 dark:text-emerald-400 font-bold">{formatTaka(totalPaid)}</strong>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/40 p-2.5 sm:p-3 rounded-xl">
            <span className="text-[11px] sm:text-xs text-rose-700 dark:text-rose-400 block font-medium">মোট বকেয়া:</span>
            <strong className="text-sm sm:text-base text-rose-600 dark:text-rose-400 font-bold">{formatTaka(totalDue)}</strong>
          </div>
        </div>

        {/* Table Container with smooth horizontal scroll for mobile */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-left text-xs sm:text-sm min-w-[500px]">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px] sm:text-[11px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 sm:py-3 sm:px-4">সদস্যের নাম</th>
                  <th className="py-2.5 px-3 sm:py-3 sm:px-4">মোবাইল</th>
                  <th className="py-2.5 px-3 sm:py-3 sm:px-4 text-right">নির্ধারিত কিস্তি</th>
                  <th className="py-2.5 px-3 sm:py-3 sm:px-4 text-right">আদায় হয়েছে</th>
                  <th className="py-2.5 px-3 sm:py-3 sm:px-4 text-right">বকেয়া</th>
                  <th className="py-2.5 px-3 sm:py-3 sm:px-4 text-center">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {reportRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      এই মাসের জন্য কোনো সদস্যের কিস্তি তালিকা পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  reportRows.map((row) => (
                    <tr key={row.member.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 sm:py-3 sm:px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {row.member.name}
                      </td>
                      <td className="py-2.5 px-3 sm:py-3 sm:px-4 text-slate-500 whitespace-nowrap">{row.member.phone || '—'}</td>
                      <td className="py-2.5 px-3 sm:py-3 sm:px-4 text-right text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatTaka(row.expectedInstallment)}
                      </td>
                      <td className="py-2.5 px-3 sm:py-3 sm:px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                        {row.paidAmount > 0 ? formatTaka(row.paidAmount) : '—'}
                      </td>
                      <td className="py-2.5 px-3 sm:py-3 sm:px-4 text-right font-bold text-rose-600 whitespace-nowrap">
                        {row.dueAmount > 0 ? formatTaka(row.dueAmount) : '—'}
                      </td>
                      <td className="py-2.5 px-3 sm:py-3 sm:px-4 text-center whitespace-nowrap">
                        {row.status === 'paid' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> পরিশোধিত
                          </span>
                        )}
                        {row.status === 'partial' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            <Clock className="w-3 h-3" /> আংশিক
                          </span>
                        )}
                        {row.status === 'due' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            <AlertCircle className="w-3 h-3" /> বকেয়া
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Add Custom Year Modal */}
      {showAddYearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>নতুন সাল যোগ করুন</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddYearModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewYear} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ভবিষ্যতের সাল লিখুন (যেমন: ২০৩১, ২০৩২, ২০৩৫)
                </label>
                <input
                  type="number"
                  required
                  min="2020"
                  max="2099"
                  placeholder="যেমন: 2031"
                  value={newYearInput}
                  onChange={(e) => setNewYearInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  স্বয়ংক্রিয়ভাবে ২০২৬-২০৩০ অন্তর্ভুক্ত আছে। এর পরের যেকোনো সাল এখানে লিখে সফটওয়্যারে যুক্ত করতে পারেন।
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddYearModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
                >
                  সাল সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

