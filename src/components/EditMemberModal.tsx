import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  User,
  Phone,
  MapPin,
  DollarSign,
  Calendar,
  Upload,
  Trash2,
  Image as ImageIcon,
  IdCard,
  FileText
} from 'lucide-react';
import { Member } from '../types';
import { MONTH_NAMES_BN, getAllAvailableYears } from '../utils/calculations';

interface EditMemberModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onSave: (updatedMember: Member) => void;
}

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
];

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  member,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [nid, setNid] = useState('');
  const [taka, setTaka] = useState<number>(100000);
  const [joinMonth, setJoinMonth] = useState<number>(1);
  const [joinYear, setJoinYear] = useState<number>(2026);
  const [profitRate, setProfitRate] = useState<number>(0.20);
  const [photo, setPhoto] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setPhone(member.phone || '');
      setAddress(member.address || '');
      setNid(member.nid || '');
      setTaka(member.taka || 100000);
      setJoinMonth(member.joinMonth ?? 1);
      setJoinYear(member.joinYear ?? 2026);
      setProfitRate(member.profitRate ?? 0.20);
      setPhoto(member.photo || '');
      setNotes(member.notes || '');
      setShowUrlInput(false);
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const handleDeviceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট পর্যন্ত হতে পারে।');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated: Member = {
      ...member,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      nid: nid.trim() || undefined,
      taka: Number(taka),
      joinMonth: Number(joinMonth),
      joinYear: Number(joinYear),
      profitRate: Number(profitRate),
      photo: photo.trim() ? photo.trim() : undefined,
      notes: notes.trim() || undefined
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-scale-up">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-indigo-700 to-indigo-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">গ্রাহক তথ্য ও ছবি সম্পাদনা (এডমিন)</h3>
              <p className="text-xs text-blue-200">সদস্য আইডি: #{member.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm overflow-y-auto custom-scroll flex-1">
          {/* Customer Photo Upload Section */}
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>গ্রাহকের ছবি পরিবর্তন:</span>
              </label>
              {photo ? (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60">
                  ছবি সংযুক্ত আছে
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                  কোনো ছবি নেই
                </span>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleDeviceImageUpload}
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-3.5">
              {/* Photo Preview Circle */}
              <div className="relative group shrink-0">
                <div
                  className={`w-16 h-16 rounded-2xl overflow-hidden border-2 shadow-sm flex items-center justify-center ${
                    photo
                      ? 'border-blue-600 ring-2 ring-blue-300 dark:ring-blue-800'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt={name || 'Member'}
                      className="w-full h-full object-cover"
                      onError={() => setPhoto('')}
                    />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{photo ? 'নতুন ছবি আপলোড' : 'ডিভাইস থেকে ছবি দিন'}</span>
                </button>

                {photo && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ছবি বাদ দিন</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-semibold transition"
                >
                  {showUrlInput ? 'লিংক লুকান' : 'অনলাইন লিংক'}
                </button>
              </div>

              {/* Sample Avatars */}
              <div className="w-full flex items-center gap-1.5 pt-2 border-t border-blue-100 dark:border-blue-900/30">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                  স্যাম্পল ছবি:
                </span>
                <div className="flex items-center gap-1.5">
                  {SAMPLE_AVATARS.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`avatar-${idx}`}
                      onClick={() => setPhoto(url)}
                      title="এই ছবি নির্বাচন করুন"
                      className={`w-7 h-7 rounded-full object-cover cursor-pointer border-2 transition ${
                        photo === url
                          ? 'border-blue-600 ring-2 ring-blue-300 scale-110'
                          : 'border-slate-300 dark:border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Direct URL input */}
              {showUrlInput && (
                <div className="w-full pt-1">
                  <input
                    type="url"
                    placeholder="https://... ছবির অনলাইন সরাসরি লিংক পেস্ট করুন"
                    value={photo}
                    onChange={(e) => setPhoto(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              <span>সদস্যের নাম: *</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Phone & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>মোবাইল নম্বর:</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span>ঠিকানা:</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* NID */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <IdCard className="w-4 h-4 text-purple-600" />
              <span>জাতীয় পরিচয়পত্র নম্বর (NID):</span>
            </label>
            <input
              type="text"
              value={nid}
              onChange={(e) => setNid(e.target.value)}
              placeholder="এনআইডি নম্বর (যদি থাকে)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Loan Amount */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-amber-600" />
              <span>মূল ঋণ (টাকা):</span>
            </label>
            <input
              type="number"
              required
              min="1000"
              step="1000"
              value={taka}
              onChange={(e) => setTaka(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-blue-600 dark:text-blue-400 text-base focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Issue Month & Year */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>ঋণ গ্রহণের মাস:</span>
              </label>
              <select
                value={joinMonth}
                onChange={(e) => setJoinMonth(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {MONTH_NAMES_BN.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-200">ঋণ গ্রহণের বছর:</label>
              <select
                value={joinYear}
                onChange={(e) => setJoinYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {getAllAvailableYears(undefined, [joinYear]).map((y) => (
                  <option key={y} value={y}>
                    {y} সাল
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>নোট বা মন্তব্য (ঐচ্ছিক):</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="গ্রাহক সম্পর্কে যেকোনো অতিরিক্ত তথ্য"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition transform active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>পরিবর্তন সেভ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
