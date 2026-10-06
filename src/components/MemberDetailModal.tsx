import React from 'react';
import {
  X,
  Printer,
  HandCoins,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coins,
  Award,
  CreditCard,
  User,
  Trash2,
  Edit3
} from 'lucide-react';
import { Member } from '../types';
import {
  formatTaka,
  getMemberMetrics,
  getMemberInstallmentMonths,
  getPaidAmountForMonth,
  MONTH_NAMES_BN,
  MONTH_NAMES_EN
} from '../utils/calculations';

interface MemberDetailModalProps {
  member: Member | null;
  isAdmin?: boolean;
  onClose: () => void;
  onCollect: (member: Member) => void;
  onEditMember?: (member: Member) => void;
  onDeleteMember?: (memberId: string | number) => void;
  onPreviewImage?: (member: Member) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  isAdmin = false,
  onClose,
  onCollect,
  onEditMember,
  onDeleteMember,
  onPreviewImage
}) => {
  if (!member) return null;

  const metrics = getMemberMetrics(member);
  const tenure = member.tenureMonths || 10;

  // Generate 10-month schedule
  const installmentMonths = getMemberInstallmentMonths(member);
  const schedule = installmentMonths.map((m, index) => {
    const monthKey = m.key;
    const monthBn = `${MONTH_NAMES_BN[m.monthIndex]} ${m.year}`;
    const paidAmount = getPaidAmountForMonth(member.months, monthKey);

    const isPaid = paidAmount !== null && paidAmount >= metrics.monthlyInstallment;
    const isPartial = paidAmount !== null && paidAmount > 0 && paidAmount < metrics.monthlyInstallment;
    const isDue = paidAmount === null || paidAmount === 0;

    return {
      installmentNo: index + 1,
      monthKey,
      monthBn,
      paidAmount,
      isPaid,
      isPartial,
      isDue,
      dueAmount: isPaid ? 0 : isPartial ? metrics.monthlyInstallment - (paidAmount || 0) : metrics.monthlyInstallment
    };
  });

  const fullPaidList = schedule.filter((s) => s.isPaid);
  const partialPaidList = schedule.filter((s) => s.isPartial);
  const dueList = schedule.filter((s) => s.isDue);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 flex flex-col max-h-[92vh] my-auto animate-scale-up">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white flex items-start justify-between relative shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div
              onClick={() => onPreviewImage && onPreviewImage(member)}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center text-white text-xl sm:text-2xl font-bold overflow-hidden shadow-inner shrink-0 cursor-pointer hover:ring-2 hover:ring-white/80 transition-all group/photo relative"
              title="ছবি বড় করে দেখুন"
            >
              {member.photo ? (
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full h-full object-cover group-hover/photo:scale-110 transition duration-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-6 h-6 sm:w-8 sm:h-8" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-base sm:text-2xl font-black truncate">{member.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold bg-white/20 text-white border border-white/20 shrink-0">
                  #{member.id}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-blue-200 flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                {member.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>{member.phone}</span>
                  </span>
                )}
                {member.address && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="truncate">{member.address}</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition shrink-0 ml-1"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 custom-scroll">
          {/* Key Loan Statistics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] sm:text-[11px] text-slate-400 block font-bold uppercase tracking-wider truncate">মূল ঋণ</span>
              <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate block">
                {formatTaka(member.taka)}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 block truncate">১০ মাস মেয়াদে</span>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/40 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-blue-100 dark:border-blue-900/60">
              <span className="text-[10px] sm:text-[11px] text-blue-700 dark:text-blue-300 block font-bold uppercase tracking-wider truncate">মাসিক কিস্তি</span>
              <span className="text-base sm:text-lg font-extrabold text-blue-600 dark:text-blue-400 truncate block">
                {formatTaka(metrics.monthlyInstallment)}
              </span>
              <span className="text-[9px] sm:text-[10px] text-blue-600/70 block truncate">প্রতি মাসে প্রদেয়</span>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-emerald-100 dark:border-emerald-900/60">
              <span className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-300 block font-bold uppercase tracking-wider truncate">মোট পরিশোধ</span>
              <span className="text-base sm:text-lg font-extrabold text-emerald-600 truncate block">
                {formatTaka(metrics.totalPaid)}
              </span>
              <span className="text-[9px] sm:text-[10px] text-emerald-600/70 block truncate">{metrics.monthsPaid}/১০ কিস্তি</span>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-rose-100 dark:border-rose-900/60">
              <span className="text-[10px] sm:text-[11px] text-rose-700 dark:text-rose-300 block font-bold uppercase tracking-wider truncate">মোট বকেয়া</span>
              <span className="text-base sm:text-lg font-extrabold text-rose-600 truncate block">
                {formatTaka(metrics.totalDue)}
              </span>
              <span className="text-[9px] sm:text-[10px] text-rose-600/70 block truncate">{dueList.length} মাস বাকি</span>
            </div>
          </div>

          {/* Grouped Month Lists (as in user's original code) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. পূর্ণ পরিশোধিত মাস */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> পূর্ণ পরিশোধিত
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px]">
                  {fullPaidList.length} মাস
                </span>
              </div>
              <div className="space-y-1 text-xs">
                {fullPaidList.length === 0 ? (
                  <p className="text-slate-400 text-[11px] italic">এখনো কোনো মাস পূর্ণ হয়নি</p>
                ) : (
                  fullPaidList.map((s) => (
                    <div key={`full-${s.monthKey}`} className="flex justify-between py-1 border-b border-emerald-100 dark:border-emerald-900/40">
                      <span>{s.monthBn}</span>
                      <strong className="text-emerald-600 font-bold">{formatTaka(s.paidAmount || 0)}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. আংশিক পরিশোধিত মাস */}
            <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> আংশিক জমা
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-[10px]">
                  {partialPaidList.length} মাস
                </span>
              </div>
              <div className="space-y-1 text-xs">
                {partialPaidList.length === 0 ? (
                  <p className="text-slate-400 text-[11px] italic">কোনো আংশিক জমা নেই</p>
                ) : (
                  partialPaidList.map((s) => (
                    <div key={`part-${s.monthKey}`} className="flex justify-between py-1 border-b border-amber-100 dark:border-amber-900/40">
                      <span>{s.monthBn}</span>
                      <strong className="text-amber-600 font-bold">{formatTaka(s.paidAmount || 0)}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. বকেয়া মাস */}
            <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-300">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> বকেয়া মাস
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 text-[10px]">
                  {dueList.length} মাস
                </span>
              </div>
              <div className="space-y-1 text-xs">
                {dueList.length === 0 ? (
                  <p className="text-emerald-600 text-[11px] font-bold">সব কিস্তি পরিশোধিত!</p>
                ) : (
                  dueList.map((s) => (
                    <div key={`due-${s.monthKey}`} className="flex justify-between py-1 border-b border-rose-100 dark:border-rose-900/40">
                      <span>{s.monthBn}</span>
                      <strong className="text-rose-600 font-bold">{formatTaka(s.dueAmount)} বাকি</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Full 10 Months Repayment Schedule Table */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex flex-wrap items-center justify-between gap-1">
              <span>📋 ১০ মাসের পূর্ণাঙ্গ কিস্তি স্টেটমেন্ট</span>
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-normal">ঋণ গ্রহণের মাস: {member.joinDate}</span>
            </h4>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm min-w-[500px]">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px] sm:text-[11px] tracking-wider">
                  <tr>
                    <th className="py-2 px-2.5 sm:px-3 text-center whitespace-nowrap">কিস্তি নং</th>
                    <th className="py-2 px-2.5 sm:px-3 whitespace-nowrap">মাস</th>
                    <th className="py-2 px-2.5 sm:px-3 text-right whitespace-nowrap">নির্ধারিত</th>
                    <th className="py-2 px-2.5 sm:px-3 text-right whitespace-nowrap">আদায়কৃত</th>
                    <th className="py-2 px-2.5 sm:px-3 text-right whitespace-nowrap">বকেয়া</th>
                    <th className="py-2 px-2.5 sm:px-3 text-center whitespace-nowrap">অবস্থা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-xs">
                  {schedule.map((row) => (
                    <tr key={row.installmentNo} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-2.5 sm:px-3 text-center font-bold text-slate-500 whitespace-nowrap">
                        {row.installmentNo}
                      </td>
                      <td className="py-2 px-2.5 sm:px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {row.monthBn}
                      </td>
                      <td className="py-2 px-2.5 sm:px-3 text-right text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono">
                        {formatTaka(metrics.monthlyInstallment)}
                      </td>
                      <td className="py-2 px-2.5 sm:px-3 text-right font-bold text-emerald-600 whitespace-nowrap font-mono">
                        {row.paidAmount !== null && row.paidAmount > 0 ? formatTaka(row.paidAmount) : '—'}
                      </td>
                      <td className="py-2 px-2.5 sm:px-3 text-right font-bold text-rose-600 whitespace-nowrap font-mono">
                        {row.dueAmount > 0 ? formatTaka(row.dueAmount) : '০'}
                      </td>
                      <td className="py-2 px-2.5 sm:px-3 text-center whitespace-nowrap">
                        {row.isPaid && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            পরিশোধিত
                          </span>
                        )}
                        {row.isPartial && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            আংশিক
                          </span>
                        )}
                        {row.isDue && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            বকেয়া
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm hover:bg-slate-100 transition shadow-sm"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>প্রিন্ট</span>
            </button>

            {isAdmin && onEditMember && (
              <button
                onClick={() => {
                  onClose();
                  onEditMember(member);
                }}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300 font-semibold text-xs sm:text-sm hover:bg-blue-100 transition"
                title="সদস্যের তথ্য সম্পাদন করুন"
              >
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>এডিট</span>
              </button>
            )}

            {isAdmin && onDeleteMember && (
              <button
                onClick={() => onDeleteMember(member.id)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 font-semibold text-xs sm:text-sm hover:bg-rose-100 transition"
                title="সদস্য স্থায়ীভাবে ডিলিট করুন"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>ডিলিট</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm hover:bg-slate-300 transition"
            >
              বন্ধ করুন
            </button>

            <button
              onClick={() => {
                onClose();
                onCollect(member);
              }}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition"
            >
              <HandCoins className="w-4 h-4" />
              <span>কিস্তি জমা নিন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
