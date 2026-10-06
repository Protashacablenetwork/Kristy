import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Clock,
  Image as ImageIcon,
  Check,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Upload
} from 'lucide-react';
import { BannerConfig, BannerItem } from '../types';
import { DEFAULT_BANNERS } from '../data/defaultBanners';

interface BannerManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bannerConfig: BannerConfig;
  onSaveConfig: (newConfig: BannerConfig) => void;
}

const GRADIENT_PRESETS = [
  { id: 'from-[#B50058] to-[#80003E]', label: 'বিকাশ মেজেন্টা', bg: 'bg-[#B50058]' },
  { id: 'from-[#C40C64] to-[#7B003A]', label: 'উজ্জ্বল পিংক', bg: 'bg-[#C40C64]' },
  { id: 'from-[#8C0044] to-[#4F0026]', label: 'গাঢ় মেরুন', bg: 'bg-[#8C0044]' },
  { id: 'from-blue-700 via-indigo-800 to-slate-900', label: 'নীল ও গাঢ় ব্লু', bg: 'bg-blue-600' },
  { id: 'from-emerald-600 via-teal-700 to-slate-900', label: 'সবুজ ও টিল', bg: 'bg-emerald-600' },
  { id: 'from-amber-600 via-orange-700 to-slate-900', label: 'সোনালী ও কমলা', bg: 'bg-amber-600' }
];

export const BannerManagerModal: React.FC<BannerManagerModalProps> = ({
  isOpen,
  onClose,
  bannerConfig,
  onSaveConfig
}) => {
  const [banners, setBanners] = useState<BannerItem[]>(bannerConfig.banners);
  const [intervalSeconds, setIntervalSeconds] = useState<number>(bannerConfig.intervalSeconds || 4);
  const [autoPlay, setAutoPlay] = useState<boolean>(bannerConfig.autoPlay ?? true);

  // New Banner Form State
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newBadge, setNewBadge] = useState('বিশেষ অফার');
  const [newButtonText, setNewButtonText] = useState('ট্যাপ করুন');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newBgGradient, setNewBgGradient] = useState(GRADIENT_PRESETS[0].id);
  const [isImageOnlyBanner, setIsImageOnlyBanner] = useState(false);
  const [newLinkType, setNewLinkType] = useState<BannerItem['linkType']>('todayPaid');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle local file image upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইটের মধ্যে হতে হবে।');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setNewImageUrl(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isImageOnlyBanner && !newTitle.trim()) {
      alert('অনুগ্রহ করে ব্যানারের শিরোনাম দিন অথবা পূর্ণাঙ্গ ছবি ব্যানার নির্বাচন করুন');
      return;
    }
    if (isImageOnlyBanner && !newImageUrl.trim()) {
      alert('অনুগ্রহ করে পূর্ণাঙ্গ ব্যানার ছবি আপলোড করুন');
      return;
    }

    const newBanner: BannerItem = {
      id: 'banner_' + Date.now(),
      title: newTitle.trim() || 'বিশেষ বিজ্ঞাপন',
      subtitle: newSubtitle.trim() || undefined,
      badge: newBadge.trim() || undefined,
      buttonText: newButtonText.trim() || 'ট্যাপ করুন',
      imageUrl: newImageUrl.trim() || undefined,
      isImageBanner: isImageOnlyBanner,
      bgGradient: newBgGradient,
      linkType: newLinkType,
      isActive: true
    };

    const updated = [newBanner, ...banners];
    setBanners(updated);
    setIsAddingNew(false);
    // Reset form
    setNewTitle('');
    setNewSubtitle('');
    setNewImageUrl('');
    setNewBadge('বিশেষ অফার');
    setNewButtonText('ট্যাপ করুন');
    setIsImageOnlyBanner(false);
  };

  const handleToggleActive = (id: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
    );
  };

  const handleDeleteBanner = (id: string) => {
    if (confirm('আপনি কি এই ব্যানারটি মুছে ফেলতে চান?')) {
      setBanners((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const copy = [...banners];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    setBanners(copy);
  };

  const handleMoveDown = (index: number) => {
    if (index === banners.length - 1) return;
    const copy = [...banners];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    setBanners(copy);
  };

  const handleResetDefault = () => {
    if (confirm('সকল ব্যানার কি মূল ডিফল্ট ব্যানারে ফিরিয়ে নিতে চান?')) {
      setBanners(DEFAULT_BANNERS);
      setIntervalSeconds(4);
      setAutoPlay(true);
    }
  };

  const handleSaveAll = () => {
    onSaveConfig({
      intervalSeconds,
      autoPlay,
      banners
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#B50058] text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                ব্যানার অ্যাড ও স্লাইডার পরিচালনা (অ্যাডমিন)
              </h3>
              <p className="text-xs text-slate-500">
                বিজ্ঞাপন ছবি যোগ, সক্রিয়/নিষ্ক্রিয় ও স্লাইড গতি নিয়ন্ত্রণ করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scroll space-y-6 flex-1">
          {/* 1. Timer / Speed Control */}
          <div className="p-4 rounded-2xl bg-pink-50/60 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#B50058]" />
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  ব্যানার পরিবর্তন গতি (কত সেকেন্ড পরপর স্লাইড হবে):
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-[#B50058] text-white font-mono font-bold text-xs">
                {intervalSeconds} সেকেন্ড
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              {[2, 3, 4, 5, 6, 8, 10].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setIntervalSeconds(sec)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    intervalSeconds === sec
                      ? 'bg-[#B50058] text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {sec} সেকেন্ড
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 text-xs text-slate-600 dark:text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                  className="rounded text-[#B50058] focus:ring-[#B50058] w-4 h-4"
                />
                <span className="font-semibold">স্বয়ংক্রিয়ভাবে স্লাইড চালু রাখুন (Auto Play)</span>
              </label>
            </div>
          </div>

          {/* 2. Add New Banner Section */}
          <div>
            {!isAddingNew ? (
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-[#B50058]/50 hover:bg-pink-50/50 dark:hover:bg-pink-950/20 text-[#B50058] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ব্যানার ছবি বা বিজ্ঞাপন যোগ করুন</span>
              </button>
            ) : (
              <form
                onSubmit={handleAddBanner}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-[#B50058]" />
                    <span>নতুন ব্যানার তৈরি করুন</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                  >
                    বাতিল
                  </button>
                </div>

                {/* Banner Mode Toggle: Complete Designed Image vs Text + Background */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      পূর্ণাঙ্গ গ্রাফিক্স ব্যানার ছবি (যেমন বিকাশ অফার)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      সরাসরি ডিজাইন করা ব্যানার ছবি হলে লেখা বা বাটনের ওভারলে থাকবে না
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isImageOnlyBanner}
                    onChange={(e) => setIsImageOnlyBanner(e.target.checked)}
                    className="w-4 h-4 text-[#B50058] rounded focus:ring-[#B50058]"
                  />
                </div>

                {/* Image Upload or URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ব্যানার ছবি (ডিভাইস থেকে ফাইল আপলোড বা সরাসরি ইমেজ লিঙ্ক) *
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#B50058]" />
                        <span>ছবি আপলোড করুন</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                      <span className="text-[11px] text-slate-500">অথবা ছবির সরাসরি লিংক পেস্ট করুন</span>
                    </div>

                    <input
                      type="url"
                      placeholder="https://... ছবির URL লিংক"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#B50058] focus:outline-none"
                    />

                    {newImageUrl && (
                      <div className="relative h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group mt-2">
                        <img
                          src={newImageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setNewImageUrl('')}
                          className="absolute top-2 right-2 p-1 rounded-lg bg-rose-600 text-white text-xs hover:bg-rose-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {!isImageOnlyBanner && (
                  <>
                    {/* Banner Title */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        ব্যানারের মূল শিরোনাম *
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: কার্ড টু বিকাশ আরো সহজ ও নিরাপদ..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-[#B50058] focus:outline-none"
                      />
                    </div>

                    {/* Subtitle */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        সাবটাইটেল / বিবরণ
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: সাথে ৩০০ টাকা পর্যন্ত আকর্ষণীয় অফার..."
                        value={newSubtitle}
                        onChange={(e) => setNewSubtitle(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-[#B50058] focus:outline-none"
                      />
                    </div>

                    {/* Badge and Button Text */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          ব্যাজ ট্যাগ
                        </label>
                        <input
                          type="text"
                          placeholder="যেমন: অফার, বিশেষ বার্তা..."
                          value={newBadge}
                          onChange={(e) => setNewBadge(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#B50058] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          বাটনের লেখা (হলুদ পিল বাটন)
                        </label>
                        <input
                          type="text"
                          placeholder="ট্যাপ করুন"
                          value={newButtonText}
                          onChange={(e) => setNewButtonText(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#B50058] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Color Theme Presets */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        ব্যাকগ্রাউন্ড রঙ
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {GRADIENT_PRESETS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setNewBgGradient(p.id)}
                            className={`h-9 rounded-xl ${p.bg} flex items-center justify-center text-white transition border ${
                              newBgGradient === p.id ? 'ring-2 ring-[#B50058] border-white scale-105' : 'border-transparent opacity-80 hover:opacity-100'
                            }`}
                            title={p.label}
                          >
                            {newBgGradient === p.id && <Check className="w-4 h-4 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Click Navigation Link */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ক্লিক করলে অ্যাপের কোন পেইজে যাবে
                  </label>
                  <select
                    value={newLinkType}
                    onChange={(e) => setNewLinkType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#B50058] focus:outline-none"
                  >
                    <option value="none">কোনো লিংক নেই</option>
                    <option value="todayPaid">আজকের কিস্তি সংগ্রহ</option>
                    <option value="calculator">ঋণ ক্যালকুলেটর</option>
                    <option value="reports">মাসিক রিপোর্ট ও গ্রাফ</option>
                    <option value="members">সদস্য তালিকা</option>
                    <option value="profit">লাভের হিসাব</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#B50058] hover:bg-[#8C0044] text-white text-xs font-bold shadow-md transition"
                  >
                    ব্যানার যুক্ত করুন
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 3. Existing Banners List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                বিদ্যমান ব্যানারসমূহ ({banners.length} টি)
              </h4>
              <button
                type="button"
                onClick={handleResetDefault}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#B50058] font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>মূল ব্যানারে রিসেট</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {banners.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                    item.isActive
                      ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-xs'
                      : 'bg-slate-100/60 dark:bg-slate-900/60 border-dashed border-slate-300 dark:border-slate-800 opacity-60'
                  }`}
                >
                  {/* Thumbnail */}
                  <div
                    className={`w-16 h-12 rounded-xl shrink-0 overflow-hidden relative flex items-center justify-center bg-gradient-to-br ${
                      item.bgGradient || 'from-[#B50058] to-[#80003E]'
                    }`}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-white/50" />
                    )}
                    <span className="absolute bottom-0.5 right-0.5 text-[9px] font-bold px-1 rounded bg-black/60 text-white font-mono">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Title & Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-xs">
                        {item.title}
                      </h5>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-100 text-[#B50058] dark:bg-pink-950 dark:text-pink-300 shrink-0">
                          {item.badge}
                        </span>
                      )}
                      {item.isImageBanner && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 shrink-0">
                          ফুল গ্রাফিক্স
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Order Up / Down */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === banners.length - 1}
                      onClick={() => handleMoveDown(index)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Toggle Active */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item.id)}
                    title={item.isActive ? 'সাময়িক বন্ধ করুন' : 'সক্রিয় করুন'}
                    className={`p-2 rounded-xl transition shrink-0 ${
                      item.isActive
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100'
                        : 'text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteBanner(item.id)}
                    title="ব্যানার ডিলিট করুন"
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-6 py-2.5 rounded-xl bg-[#B50058] hover:bg-[#8C0044] text-white text-xs sm:text-sm font-bold shadow-md transition"
          >
            পরিবর্তন সংরক্ষণ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
