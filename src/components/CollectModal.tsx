import React, { useState, useEffect } from 'react';
import {
  X,
  HandCoins,
  Check,
  CreditCard,
  User,
  Calendar,
  Sparkles,
  Receipt
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Member, CollectionRecord } from '../types';
import {
  getMemberMetrics,
  getMemberInstallmentMonths,
  formatTaka,
  MONTH_NAMES_BN
} from '../utils/calculations';

interface CollectModalProps {
  isOpen: boolean;
  members: Member[];
  preSelectedMember?: Member | null;
  collectorName: string;
  onClose: () => void;
  onSubmit: (collection: CollectionRecord) => void;
}

const ORDINAL_BN = ['১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম', '১১দশ', '১২দশ'];

export const CollectModal: React.FC<CollectModalProps> = ({
  isOpen,
  members,
  preSelectedMember,
  collectorName,
  onClose,
  onSubmit
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string | number>(
    preSelectedMember?.id || members[0]?.id || ''
  );
  const currentMember = members.find((m) => String(m.id) === String(selectedMemberId)) || members[0];
  const memberMonthsList = currentMember ? getMemberInstallmentMonths(currentMember) : [];

  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [amount, setAmount] = useState<number>(6000);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'bKash' | 'Nagad' | 'Bank'>('Cash');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (preSelectedMember) {
      setSelectedMemberId(preSelectedMember.id);
    }
  }, [preSelectedMember, isOpen]);

  useEffect(() => {
    if (currentMember) {
      const metrics = getMemberMetrics(currentMember);
      setAmount(metrics.monthlyInstallment);

      // Auto pick first unpaid installment month (starts month after join)
      const list = getMemberInstallmentMonths(currentMember);
      const monthsMap = currentMember.months || {};
      const unpaid = list.find((m) => !(monthsMap[m.key] && (monthsMap[m.key] || 0) >= metrics.monthlyInstallment));
      if (unpaid) {
        setSelectedMonth(unpaid.key);
      } else if (list.length > 0) {
        setSelectedMonth(list[0].key);
      }
    }
  }, [selectedMemberId, isOpen]);

  if (!isOpen || !currentMember) return null;

  const metrics = getMemberMetrics(currentMember);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount) || 0;
    if (numericAmount <= 0) return;

    // Trigger celebration safely
    try {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      // ignore
    }

    const receiptNo = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord: CollectionRecord = {
      id: `col-${Date.now()}`,
      memberId: currentMember.id,
      memberName: currentMember.name,
      monthKey: selectedMonth,
      amount: numericAmount,
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
      collectorName: collectorName || 'আদায়কারী',
      receiptNo,
      notes: notes || ''
    };

    onSubmit(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-3.5 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">আজকের কিস্তি সংগ্রহ</h3>
              <p className="text-[11px] sm:text-xs text-emerald-100">জয়েন মাসের পরের মাস থেকে কিস্তি শুরু</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Member Installment Quick Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-200">
          <span>সদস্য যোগদান: {currentMember.joinDate || '২০২৬-০১-১৫'}</span>
          <span>নির্ধারিত মাসিক কিস্তি: {formatTaka(metrics.monthlyInstallment)}</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
          {/* Member Selection */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>সদস্য নির্বাচন করুন</span>
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (#{m.id}) • ঋণ: {formatTaka(m.taka)} (কিস্তি: {formatTaka(getMemberMetrics(m).monthlyInstallment)})
                </option>
              ))}
            </select>
          </div>

          {/* Month Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>কিস্তির মাস (১ম-১০ম)</span>
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {memberMonthsList.map((m, idx) => {
                  const ordinal = ORDINAL_BN[idx] || `${idx + 1}ম`;
                  const paidVal = currentMember.months?.[m.key] || 0;
                  const isPaid = paidVal >= metrics.monthlyInstallment;
                  return (
                    <option key={m.key} value={m.key}>
                      {ordinal} কিস্তি: {MONTH_NAMES_BN[m.monthIndex]} {m.year} {isPaid ? `(আদায়কৃত)` : '(বকেয়া)'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>পরিশোধের মাধ্যম</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Cash">নগদ (Cash)</option>
                <option value="bKash">বিকাশ (bKash)</option>
                <option value="Nagad">নগদ (Nagad)</option>
                <option value="Bank">ব্যাংক ডিপোজিট</option>
              </select>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                আদায়ের পরিমাণ (টাকা)
              </label>
              <span className="text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                নির্ধারিত: {formatTaka(metrics.monthlyInstallment)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2 text-slate-400 font-bold text-base sm:text-lg">৳</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                min="1"
                step="any"
                className="w-full pl-8 pr-4 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            {/* Quick preset buttons */}
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                type="button"
                onClick={() => setAmount(metrics.monthlyInstallment)}
                className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 transition"
              >
                পূর্ণ কিস্তি ({formatTaka(metrics.monthlyInstallment)})
              </button>
              <button
                type="button"
                onClick={() => setAmount(metrics.monthlyInstallment / 2)}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 transition"
              >
                অর্ধেক কিস্তি ({formatTaka(metrics.monthlyInstallment / 2)})
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              বিশেষ নোট / মন্তব্য (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: ফিল্ড অফিসার বিকাশ মারফত নিয়েছেন"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs sm:text-sm transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              <span>কিস্তি জমা ও রসিদ তৈরি</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
