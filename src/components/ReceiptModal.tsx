import React from 'react';
import { X, Printer, CheckCircle2, HandCoins } from 'lucide-react';
import { CollectionRecord, SystemSettings } from '../types';
import { formatTaka } from '../utils/calculations';

interface ReceiptModalProps {
  record: CollectionRecord | null;
  settings: SystemSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  record,
  settings,
  onClose
}) => {
  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  const receiptAddress = (settings.address && !settings.address.includes('দত্তপাড়া'))
    ? settings.address
    : 'টানা ব্রীজ আনন্দ বাজার, ইসলামপুর,জামালপুর';
  const receiptPhone = (settings.phone && !settings.phone.includes('০১৯০৬'))
    ? settings.phone
    : '01982-972228';

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm sm:max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top notification bar */}
        <div className="bg-emerald-600 p-4 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold text-sm">কিস্তি জমার মানি রিসিট প্রস্তুত</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Content */}
        <div className="p-6 bg-white text-slate-900" id="printableReceipt">
          {/* Somiti Header */}
          <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-4">
            <h2 className="text-xl font-extrabold text-blue-900">{settings.somitiName}</h2>
            <p className="text-xs text-slate-600">{settings.tagline}</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">{receiptAddress}</p>
            <p className="text-[11px] text-slate-500 font-medium">মোবাইল : {receiptPhone}</p>
            <div className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 mt-2 border border-slate-200">
              কিস্তি আদায়ের অফিসিয়াল রসিদ
            </div>
          </div>

          {/* Slip Details */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">রসিদ নং:</span>
              <strong className="font-mono">{record.receiptNo}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">তারিখ:</span>
              <strong>{record.date}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">সদস্যের নাম:</span>
              <strong className="text-sm font-bold text-slate-900">{record.memberName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">সদস্য আইডি:</span>
              <strong>#{record.memberId}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">কিস্তির মাস:</span>
              <strong className="text-blue-700">{record.monthKey}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">পরিশোধের মাধ্যম:</span>
              <strong>{record.paymentMethod}</strong>
            </div>
          </div>

          {/* Amount Box */}
          <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
            <span className="text-xs text-emerald-700 font-semibold block">আদায়ের পরিমাণ</span>
            <span className="text-2xl font-extrabold text-emerald-800">{formatTaka(record.amount)}</span>
          </div>

          {/* Signatures */}
          <div className="mt-8 pt-6 border-t border-dashed border-slate-300 flex justify-between text-center text-xs">
            <div>
              <div className="w-24 border-b border-slate-400 mb-1 mx-auto" />
              <span className="text-slate-500">সদস্যের স্বাক্ষর</span>
            </div>
            <div>
              <div className="w-28 border-b border-slate-400 mb-1 mx-auto font-semibold text-[11px] text-blue-900">
                {record.collectorName}
              </div>
              <span className="text-slate-500">আদায়কারীর স্বাক্ষর</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 flex gap-2.5 no-print">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-300 transition"
          >
            বন্ধ করুন
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট রসিদ</span>
          </button>
        </div>

      </div>
    </div>
  );
};
