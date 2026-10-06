import React, { useState, useEffect } from 'react';
import { X, Edit3, Save, DollarSign, Calendar, CreditCard, User, AlertCircle, RotateCcw } from 'lucide-react';
import { CollectionRecord, Member } from '../types';
import { getMemberInstallmentMonths, getMemberMetrics, formatTaka, MONTH_NAMES_BN } from '../utils/calculations';

interface EditCollectionModalProps {
  isOpen: boolean;
  record: CollectionRecord | null;
  members: Member[];
  onClose: () => void;
  onSave: (updatedRecord: CollectionRecord) => void;
}

export const EditCollectionModal: React.FC<EditCollectionModalProps> = ({
  isOpen,
  record,
  members,
  onClose,
  onSave
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string | number>('');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('');
  const [amount, setAmount] = useState<string | number>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [date, setDate] = useState<string>('');
  const [collectorName, setCollectorName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (record) {
      setSelectedMemberId(record.memberId);
      setSelectedMonthKey(record.monthKey);
      setAmount(record.amount !== undefined ? record.amount : '');
      setPaymentMethod(record.paymentMethod || 'Cash');
      setDate(record.date || new Date().toISOString().split('T')[0]);
      setCollectorName(record.collectorName || 'মোঃ শিপন');
      setNotes(record.notes || '');
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const currentMember = members.find((m) => String(m.id) === String(selectedMemberId)) || members[0];
  const metrics = currentMember ? getMemberMetrics(currentMember) : null;
  const memberMonthsList = currentMember ? getMemberInstallmentMonths(currentMember) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      alert('অনুগ্রহ করে সঠিক কিস্তির পরিমাণ লিখুন (টাকা ০ বা তার বেশি যেকোনো পরিমাণ হতে পারে)!');
      return;
    }

    const targetMember = members.find((m) => String(m.id) === String(selectedMemberId));

    const updated: CollectionRecord = {
      ...record,
      memberId: selectedMemberId || record.memberId,
      memberName: targetMember ? targetMember.name : record.memberName,
      monthKey: selectedMonthKey || record.monthKey,
      amount: numAmount,
      paymentMethod,
      date,
      collectorName,
      notes
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 flex flex-col my-auto animate-scale-up">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">কিস্তি সংগৃহীত রসিদ সংশোধন (এডমিন)</h3>
              <p className="text-xs text-blue-200">রসিদ নং: {record.receiptNo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
          
          {/* Member Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              <span>সদস্য নির্বাচন করুন (ভুল সদস্যের নামে হয়ে থাকলে পরিবর্তন করুন):</span>
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedMemberId(newId);
                const newMem = members.find((m) => String(m.id) === String(newId));
                if (newMem) {
                  const mList = getMemberInstallmentMonths(newMem);
                  if (mList.length > 0) setSelectedMonthKey(mList[0].key);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (#{m.id})
                </option>
              ))}
            </select>
          </div>

          {/* Month Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>কিস্তির মাস (ভুল মাস হয়ে থাকলে নির্বাচন করুন):</span>
            </label>
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-blue-700 dark:text-blue-400 focus:ring-2 focus:ring-blue-500"
            >
              {memberMonthsList.length > 0 ? (
                memberMonthsList.map((m, idx) => (
                  <option key={m.key} value={m.key}>
                    {idx + 1}ম কিস্তি: {MONTH_NAMES_BN[m.monthIndex]} {m.year} ({m.key})
                  </option>
                ))
              ) : (
                <option value={selectedMonthKey}>{selectedMonthKey}</option>
              )}
            </select>
          </div>

          {/* Amount Input - Any Custom Amount Allowed */}
          <div className="space-y-2 p-3 bg-blue-50/60 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/40">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs sm:text-sm">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>আদায়ের পরিমাণ (টাকা):</span>
              </label>
              {metrics && (
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                  নির্ধারিত কিস্তি: {formatTaka(metrics.monthlyInstallment)}
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-lg">৳</span>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="যেকোনো পরিমাণ টাকা লিখুন"
                className="w-full pl-8 pr-4 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black text-slate-900 dark:text-white text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            {/* Quick Presets for Admin Convenience */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {metrics && (
                <>
                  <button
                    type="button"
                    onClick={() => setAmount(metrics.monthlyInstallment)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 transition"
                  >
                    পূর্ণ কিস্তি ({formatTaka(metrics.monthlyInstallment)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(Math.round(metrics.monthlyInstallment / 2))}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition"
                  >
                    অর্ধেক ({formatTaka(Math.round(metrics.monthlyInstallment / 2))})
                  </button>
                </>
              )}
              {record && (
                <button
                  type="button"
                  onClick={() => setAmount(record.amount)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-50 transition"
                >
                  পূর্বে আদায় ছিল ({formatTaka(record.amount)})
                </button>
              )}
              <button
                type="button"
                onClick={() => setAmount('')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-50 transition"
              >
                মুছে নতুন লিখুন
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              ℹ️ <strong>টাকার পরিমাণ যে কোনো সংখ্যা হতে পারে:</strong> এডমিন ইচ্ছামতো যেকোনো পরিমাণ (আংশিক/পূর্ণ/অতিরিক্ত) টাকা নির্ধারণ করতে পারেন। গুগল শিটে আগের টাকার সাথে এটি যোগ হবে না, বরং সরাসরি প্রতিস্থাপিত (Update) হবে।
            </p>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>পেমেন্ট মাধ্যম:</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
            >
              <option value="Cash">নগদ (Cash)</option>
              <option value="bKash">বিকাশ (bKash)</option>
              <option value="Nagad">নগদ (Nagad)</option>
              <option value="Bank">ব্যাংক ডিপোজিট</option>
            </select>
          </div>

          {/* Collection Date & Collector */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-200">আদায়ের তারিখ:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-200">আদায়কারী:</label>
              <input
                type="text"
                value={collectorName}
                onChange={(e) => setCollectorName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-200">মন্তব্য (ঐচ্ছিক):</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: ভুল সংশোধিত"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition transform active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>পরিবর্তন সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
