import React, { useState, useRef } from 'react';
import {
  X,
  UserPlus,
  User,
  Phone,
  MapPin,
  IdCard,
  Banknote,
  Calendar,
  Check,
  Upload,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { Member } from '../types';
import { calcLoan, formatTaka, MONTH_NAMES_BN, getAllAvailableYears } from '../utils/calculations';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (newMember: Member) => void;
  members?: Member[];
}

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
];

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onAddMember,
  members = []
}) => {
  const getNextSuggestedId = () => {
    let maxNum = 0;
    let prefix = 'Mel';
    (members || []).forEach((m) => {
      const idStr = String(m.id || '');
      const prefixMatch = idStr.match(/^[a-zA-Z]+/);
      if (prefixMatch) {
        prefix = prefixMatch[0];
      }
      const match = idStr.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum && num < 99999999) maxNum = num;
      }
    });
    const nextNum = maxNum > 0 ? maxNum + 1 : 2445607;
    return `${prefix}${nextNum}`;
  };

  const [customId, setCustomId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('০১৭১');
  const [address, setAddress] = useState('ঢাকা, বাংলাদেশ');
  const [nid, setNid] = useState('');
  const [loanAmount, setLoanAmount] = useState(40000);
  const [tenure, setTenure] = useState(10);
  const [profitRate, setProfitRate] = useState(20);
  const [joinMonth, setJoinMonth] = useState(8); // September
  const [joinYear, setJoinYear] = useState(2026);
  const [startMonth, setStartMonth] = useState(8); // September
  const [startYear, setStartYear] = useState(2026);
  const [selectedPhoto, setSelectedPhoto] = useState('');
  const [notes, setNotes] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setCustomId(getNextSuggestedId());
    }
  }, [isOpen, members]);

  if (!isOpen) return null;

  const handleDeviceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('ছবি ৫ মেগাবাইটের মধ্যে হতে হবে।');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSelectedPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const calc = calcLoan(loanAmount, tenure, profitRate / 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const monthNum = Number(joinMonth);
    const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const joinDateStr = `${monthNamesEn[monthNum] || 'September'} ${joinYear}`;

    const finalId = customId.trim() || getNextSuggestedId();

    const newMember: Member = {
      id: finalId,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      nid: nid.trim() || undefined,
      joinMonth: Number(joinMonth),
      joinYear: Number(joinYear),
      startMonth: Number(startMonth),
      startYear: Number(startYear),
      joinDate: joinDateStr,
      taka: Number(loanAmount),
      profitRate: profitRate / 100,
      tenureMonths: Number(tenure),
      photo: selectedPhoto.trim() ? selectedPhoto.trim() : undefined,
      months: {},
      notes: notes.trim()
    };

    onAddMember(newMember);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">নতুন সদস্য ও ঋণ এন্ট্রি</h3>
              <p className="text-xs text-blue-100">সমিতি সদস্য নিবন্ধন ফরম (ছবি ছাড়াও যোগ করা যাবে)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Avatar / Photo Selection */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between flex-wrap gap-1">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>প্রোফাইল ছবি (ঐচ্ছিক)</span>
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                ছবি ছাড়াও সদস্য যোগ করা যাবে
              </span>
            </label>
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleDeviceImageUpload}
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-3">
              {/* Selected Photo Preview / No Photo Avatar */}
              <div className="relative group shrink-0">
                <div className={`w-12 h-12 rounded-2xl overflow-hidden border-2 ${selectedPhoto ? 'border-blue-600 ring-2 ring-blue-400' : 'border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-700'} shadow-sm flex items-center justify-center`}>
                  {selectedPhoto ? (
                    <img src={selectedPhoto} alt="Selected" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                  )}
                </div>
              </div>

              {/* Status Info & Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-700 dark:text-blue-300 border border-slate-300 dark:border-slate-700 text-xs font-bold transition shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>ছবি আপলোড করুন</span>
                </button>

                {selectedPhoto ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPhoto('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold transition shadow-xs"
                    title="ছবি বাদ দিয়ে ছবি ছাড়া যুক্ত করুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ছবি বাদ দিন (ছবি ছাড়া)</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    বর্তমানে: কোনো ছবি নেই (ছবি ছাড়া সেভ হবে)
                  </span>
                )}
              </div>

              {/* Sample Avatars Quick Picks */}
              <div className="w-full sm:w-auto flex items-center gap-1.5 pt-2 sm:pt-0 sm:pl-3 sm:border-l border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 font-medium shrink-0">ডেমো ছবি:</span>
                {SAMPLE_AVATARS.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    onClick={() => setSelectedPhoto(url)}
                    alt="avatar sample"
                    title="এই ডেমো ছবিটি বেছে নিন"
                    className={`w-7 h-7 rounded-full object-cover cursor-pointer border-2 transition ${
                      selectedPhoto === url
                        ? 'border-blue-600 ring-2 ring-blue-300 scale-110'
                        : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100 hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Member ID, Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <IdCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>সদস্য আইডি *</span>
                </span>
              </label>
              <input
                type="text"
                required
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                placeholder="যেমন: Sel0008"
                className="w-full px-3.5 py-2.5 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-sm font-bold text-blue-700 dark:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                অটো নির্ধারিত (পরিবর্তনযোগ্য)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>সদস্যের নাম *</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: মোঃ আল আমিন"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>মোবাইল নম্বর *</span>
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="০১৭xxxxxxxx"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Address & NID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>বর্তমান ঠিকানা</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="গ্রাম/রোড, থানা, জেলা"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <IdCard className="w-3.5 h-3.5 text-blue-600" />
                <span>জাতীয় পরিচয়পত্র (NID)</span>
              </label>
              <input
                type="text"
                value={nid}
                onChange={(e) => setNid(e.target.value)}
                placeholder="NID নম্বর"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Loan Details */}
          <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-3">
            <h4 className="font-bold text-sm text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <Banknote className="w-4 h-4" /> ঋণের বিবরণ ও হিসাব
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>ঋণের পরিমাণ (যেকোনো পরিমাণ টাকা দেওয়া যাবে) *</span>
                  <span className="text-[11px] text-blue-600 font-bold">{formatTaka(loanAmount || 0)}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">৳</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={loanAmount || ''}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    placeholder="যেকোনো টাকার অংক লিখুন (যেমন: ৫০০০, ২৫০০০, ১০০০‌০০)"
                    className="w-full pl-8 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Quick amount shortcut chips */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] text-slate-400 font-medium">দ্রুত নির্বাচন:</span>
                  {[10000, 20000, 30000, 40000, 50000, 100000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setLoanAmount(amt)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition ${
                        loanAmount === amt
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {formatTaka(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    লাভের হার (%)
                  </label>
                  <input
                    type="number"
                    value={profitRate}
                    onChange={(e) => setProfitRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    কিস্তির মেয়াদ (মাস)
                  </label>
                  <input
                    type="number"
                    value={tenure}
                    onChange={(e) => setTenure(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Instant calculated result */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-200/60 dark:border-blue-900/60 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">মোট লাভ:</span>
                <strong className="text-emerald-600 font-bold">{formatTaka(calc.profit)}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">মোট পরিশোধ:</span>
                <strong className="text-slate-900 dark:text-white font-bold">{formatTaka(calc.totalPayable)}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">মাসিক কিস্তি:</span>
                <strong className="text-blue-600 font-bold">{formatTaka(calc.monthlyInstallment)}</strong>
              </div>
            </div>
          </div>

          {/* Join Month/Year & Start Month/Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Join Date */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>ঋণ গ্রহণের মাস ও সাল (Join)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={joinMonth}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setJoinMonth(val);
                    const nextM = (val + 1) % 12;
                    setStartMonth(nextM);
                    if (val === 11) {
                      setStartYear(joinYear + 1);
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold"
                >
                  {MONTH_NAMES_BN.map((name, idx) => (
                    <option key={idx} value={idx}>{name}</option>
                  ))}
                </select>

                <select
                  value={joinYear}
                  onChange={(e) => {
                    const y = Number(e.target.value);
                    setJoinYear(y);
                    setStartYear(joinMonth === 11 ? y + 1 : y);
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold"
                >
                  {getAllAvailableYears().map((y) => (
                    <option key={y} value={y}>{y} সাল</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>কিস্তি শুরুর মাস ও সাল (Start)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold"
                >
                  {MONTH_NAMES_BN.map((name, idx) => (
                    <option key={idx} value={idx}>{name}</option>
                  ))}
                </select>

                <select
                  value={startYear}
                  onChange={(e) => setStartYear(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold"
                >
                  {getAllAvailableYears().map((y) => (
                    <option key={y} value={y}>{y} সাল</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              মন্তব্য / নোট
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="গ্যারান্টার নোট বা জামিনদার এর বিবরণ"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>সদস্য যুক্ত করুন</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
