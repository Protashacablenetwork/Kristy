import React from 'react';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  HandCoins
} from 'lucide-react';
import { Member } from '../types';
import { formatTaka, getMemberMetrics } from '../utils/calculations';

interface MemberCardProps {
  member: Member;
  onSelect: (member: Member) => void;
  onQuickCollect: (member: Member) => void;
  onPreviewImage?: (member: Member) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  onSelect,
  onQuickCollect,
  onPreviewImage
}) => {
  const metrics = getMemberMetrics(member);
  const remainingMonths = 10 - metrics.monthsPaid;

  const handlePhotoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPreviewImage) {
      onPreviewImage(member);
    } else {
      onSelect(member);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-3 sm:space-y-4 group">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div
            onClick={handlePhotoClick}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 font-extrabold flex items-center justify-center text-sm sm:text-base overflow-hidden border border-blue-100 dark:border-blue-900/60 shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all relative group/photo"
            title="ছবি বড় করে দেখতে চাপ দিন"
          >
            {member.photo ? (
              <img
                src={member.photo}
                alt={member.name}
                className="w-full h-full object-cover group-hover/photo:scale-110 transition duration-300"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <span>{member.name.charAt(0)}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(member);
              }}
              className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-blue-600 transition cursor-pointer flex items-center gap-1.5 leading-tight whitespace-nowrap"
              title={member.name}
            >
              <span className="whitespace-nowrap font-bold">{member.name}</span>
              <span className="text-[10px] font-mono font-normal text-slate-400 shrink-0">
                (#{member.id})
              </span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 whitespace-nowrap truncate">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{member.address || 'ঠিকানা দেওয়া হয়নি'}</span>
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">
          {metrics.status === 'paid' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3" />
              <span>পরিশোধিত</span>
            </span>
          ) : metrics.status === 'partial' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200 dark:border-amber-800">
              <Clock className="w-3 h-3" />
              <span>আংশিক</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-3 h-3" />
              <span>বকেয়া</span>
            </span>
          )}
        </div>
      </div>

      {/* Financial Details */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800/80 text-xs">
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">মূল ঋন</span>
          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
            {formatTaka(member.taka)}
          </span>
        </div>
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">মাসিক কিস্তি</span>
          <span className="font-bold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
            {formatTaka(metrics.monthlyInstallment)}
          </span>
        </div>
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">পরিশোধ</span>
          <span className="font-bold text-emerald-600 text-xs sm:text-sm">
            {formatTaka(metrics.totalPaid)}
          </span>
        </div>
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">বকেয়া</span>
          <span className="font-bold text-rose-600 text-xs sm:text-sm">
            {formatTaka(metrics.totalDue)}
          </span>
        </div>
      </div>

      {/* 10-Month Repayment Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>
            পরিশোধিত কিস্তি: <strong className="text-emerald-600 font-bold">{metrics.monthsPaid}/১০ টি</strong>
          </span>
          <span className="text-blue-600 dark:text-blue-400 font-bold">
            {metrics.progressPercent}%
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              metrics.progressPercent === 100
                ? 'bg-emerald-500'
                : metrics.progressPercent > 50
                ? 'bg-blue-600'
                : 'bg-amber-500'
            }`}
            style={{ width: `${metrics.progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-medium pt-0.5">
          <span className="text-slate-500">
            বাকি কিস্তি: <strong className="text-rose-500 font-bold">{remainingMonths} টি</strong>
          </span>
          <span className="text-slate-400 text-[10px]">
            মোট ১০টি কিস্তি
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(member);
          }}
          className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1 py-1"
        >
          <span>বিস্তারিত দেখুন</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onQuickCollect(member)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
        >
          <HandCoins className="w-3.5 h-3.5" />
          <span>কিস্তি জমা</span>
        </button>
      </div>
    </div>
  );
};
