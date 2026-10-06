import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Coins,
  Calendar,
  Search,
  User,
  Phone,
  MapPin,
  TrendingDown,
  TrendingUp,
  Percent,
  Download,
  Edit3,
  Trash2,
  HandCoins,
  Clock,
  Plus,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { Member, CollectionRecord } from '../types';
import { formatTaka, getMemberMetrics, MONTH_NAMES_BN, MONTH_NAMES_EN } from '../utils/calculations';
import { exportCollectionsToCSV } from '../utils/googleSheetSync';

interface ViewProps {
  members: Member[];
  onBack: () => void;
  onSelectMember: (member: Member) => void;
  onQuickCollect?: (member: Member) => void;
  currentMonthKey: string;
  onPreviewImage?: (member: Member) => void;
}

// 1. মাসিক জমা (Members who paid in the current/selected month)
export const MonthlyPaidView: React.FC<ViewProps> = ({
  members,
  onBack,
  onSelectMember,
  currentMonthKey,
  onPreviewImage
}) => {
  const [search, setSearch] = useState('');

  const paidMembers = members
    .map((m) => {
      const paidThisMonth = m.months[currentMonthKey] || 0;
      const metrics = getMemberMetrics(m);
      return { member: m, paidThisMonth, metrics };
    })
    .filter((item) => item.paidThisMonth > 0)
    .filter((item) =>
      item.member.name.toLowerCase().includes(search.toLowerCase()) ||
      item.member.phone.includes(search)
    );

  const totalCollected = paidMembers.reduce((acc, item) => acc + item.paidThisMonth, 0);

  return (
    <div className="space-y-5 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>চলতি মাসের জমা তালিকা ({currentMonthKey})</span>
            </h2>
            <p className="text-xs text-slate-500">
              মোট {paidMembers.length} জন সদস্য কিস্তি জমা দিয়েছেন
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block uppercase font-bold">মোট জমা</span>
          <span className="text-lg font-extrabold text-emerald-600">
            {formatTaka(totalCollected)}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="সদস্য খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {paidMembers.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
            এই মাসে কোনো সদস্যের কিস্তি জমা পাওয়া যায়নি
          </div>
        ) : (
          paidMembers.map(({ member, paidThisMonth, metrics }) => (
            <div
              key={member.id}
              onClick={() => onSelectMember(member)}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:shadow-md cursor-pointer transition"
            >
              <div className="flex items-center gap-3">
                <div
                  onClick={(e) => {
                    if (onPreviewImage) {
                      e.stopPropagation();
                      onPreviewImage(member);
                    }
                  }}
                  className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 font-bold flex items-center justify-center overflow-hidden border border-blue-200 dark:border-blue-800 shrink-0 hover:ring-2 hover:ring-blue-500 cursor-pointer transition-all"
                  title="ছবি বড় করে দেখুন"
                >
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base whitespace-nowrap">
                    {member.name}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-2 whitespace-nowrap">
                    <span>{member.address}</span>
                    {member.phone && <span>• {member.phone}</span>}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-extrabold text-emerald-600">
                  + {formatTaka(paidThisMonth)}
                </div>
                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                  জমা হয়েছে
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 2. সকল জমা (All members deposit summary)
export const TotalPaidView: React.FC<ViewProps> = ({
  members,
  onBack,
  onSelectMember
}) => {
  const [search, setSearch] = useState('');

  const membersWithTotal = members
    .map((m) => {
      const metrics = getMemberMetrics(m);
      return { member: m, metrics };
    })
    .filter((item) =>
      item.member.name.toLowerCase().includes(search.toLowerCase()) ||
      item.member.phone.includes(search)
    );

  const grandTotalDeposited = members.reduce((acc, m) => {
    return acc + getMemberMetrics(m).totalPaid;
  }, 0);

  return (
    <div className="space-y-5 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-blue-600" />
              <span>সকল সদস্যের সর্বমোট জমা</span>
            </h2>
            <p className="text-xs text-slate-500">
              সমিতির সকল সদস্য কর্তৃক এ যাবৎ প্রদত্ত কিস্তি
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block uppercase font-bold">সর্বমোট সংগৃহীত</span>
          <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
            {formatTaka(grandTotalDeposited)}
          </span>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="সদস্য খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2.5">
        {membersWithTotal.map(({ member, metrics }) => (
          <div
            key={member.id}
            onClick={() => onSelectMember(member)}
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:shadow-md cursor-pointer transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                {member.photo ? (
                  <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base whitespace-nowrap">
                  {member.name}
                </h4>
                <p className="text-xs text-slate-500 whitespace-nowrap">
                  মূল ঋণ: {formatTaka(member.taka)} • কিস্তি: {metrics.monthsPaid}/১০ মাস
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                {formatTaka(metrics.totalPaid)}
              </div>
              <span className="text-xs text-slate-400">
                {metrics.progressPercent}% সম্পন্ন
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. বকেয়া তালিকা (Due Members list with % calculation)
export const DueListView: React.FC<ViewProps> = ({
  members,
  onBack,
  onSelectMember,
  onQuickCollect
}) => {
  const [search, setSearch] = useState('');

  const dueMembers = members
    .map((m) => {
      const metrics = getMemberMetrics(m);
      return { member: m, metrics };
    })
    .filter((item) => item.metrics.totalDue > 0)
    .filter((item) =>
      item.member.name.toLowerCase().includes(search.toLowerCase()) ||
      item.member.phone.includes(search)
    );

  const grandTotalDue = dueMembers.reduce((acc, item) => acc + item.metrics.totalDue, 0);

  return (
    <div className="space-y-5 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>বকেয়া কিস্তির তালিকা ({dueMembers.length} জন)</span>
            </h2>
            <p className="text-xs text-slate-500">
              যাদের কিস্তি এখনো পরিশোধ বাকি আছে
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block uppercase font-bold">মোট বকেয়া</span>
          <span className="text-lg font-extrabold text-rose-600">
            {formatTaka(grandTotalDue)}
          </span>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="বকেয়া সদস্য খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-rose-500"
        />
      </div>

      <div className="space-y-3">
        {dueMembers.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-emerald-600 text-sm font-bold flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8" />
            <span>অভিনন্দন! বর্তমানে কোনো সদস্যের কিস্তি বকেয়া নেই।</span>
          </div>
        ) : (
          dueMembers.map(({ member, metrics }) => {
            const paidPercent = metrics.progressPercent;
            const duePercent = 100 - paidPercent;

            return (
              <div
                key={member.id}
                className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:shadow-md transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => onSelectMember(member)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 font-bold flex items-center justify-center overflow-hidden border border-rose-200 dark:border-rose-800">
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base whitespace-nowrap">
                        {member.name}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-2 whitespace-nowrap">
                        <span>{member.address}</span>
                        {member.phone && <span>• {member.phone}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-bold">বকেয়া পরিমাণ</span>
                    <span className="text-lg font-extrabold text-rose-600">
                      {formatTaka(metrics.totalDue)}
                    </span>
                  </div>
                </div>

                {/* Progress ratio: % জমা | % বকেয়া */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-emerald-600">{paidPercent}% জমা</span>
                    <span className="text-rose-600">{duePercent}% বকেয়া</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${paidPercent}%` }}
                    />
                    <div
                      className="bg-rose-500 h-full transition-all duration-500"
                      style={{ width: `${duePercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-500">
                    বাকি কিস্তি: <strong>{10 - metrics.monthsPaid} মাস</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectMember(member)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition"
                    >
                      বিবরণ
                    </button>
                    {onQuickCollect && (
                      <button
                        onClick={() => onQuickCollect(member)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow transition"
                      >
                        কিস্তি জমা নিন
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// 4. দৈনিক রিপোর্ট (Daily Report)
export const DailyReportView: React.FC<{
  collections: CollectionRecord[];
  members?: Member[];
  isAdmin?: boolean;
  onBack: () => void;
  onViewReceipt: (record: CollectionRecord) => void;
  onEditCollection?: (record: CollectionRecord) => void;
  onDeleteCollection?: (record: CollectionRecord) => void;
  onQuickCollect?: () => void;
  onPreviewImage?: (member: Member) => void;
  initialFilter?: 'today' | 'yesterday' | 'date' | 'all';
  title?: string;
  subtitle?: string;
}> = ({
  collections,
  members = [],
  isAdmin = false,
  onBack,
  onViewReceipt,
  onEditCollection,
  onDeleteCollection,
  onQuickCollect,
  onPreviewImage,
  initialFilter = 'today',
  title,
  subtitle
}) => {
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const todayStr = getTodayStr();
  const yesterdayStr = getYesterdayStr();

  const [dateFilterMode, setDateFilterMode] = useState<'today' | 'yesterday' | 'date' | 'all'>(initialFilter);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');

  // Keep dateFilterMode in sync when initialFilter prop changes
  useEffect(() => {
    setDateFilterMode(initialFilter);
    if (initialFilter === 'today') {
      setSelectedDate(todayStr);
    } else if (initialFilter === 'yesterday') {
      setSelectedDate(yesterdayStr);
    }
  }, [initialFilter, todayStr, yesterdayStr]);

  // Helper date formatting in Bengali
  const formatDateBN = (dStr: string) => {
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const monthIdx = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return `${day} ${MONTH_NAMES_BN[monthIdx] || parts[1]} ${year}`;
      }
    } catch {}
    return dStr;
  };

  // Exact current date in Bengali with day of the week
  const getExactTodayBangla = () => {
    const today = new Date();
    const day = today.getDate();
    const month = MONTH_NAMES_BN[today.getMonth()] || `${today.getMonth() + 1}`;
    const year = today.getFullYear();
    const dayNames = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const dayName = dayNames[today.getDay()];
    return `${day} ${month} ${year}, ${dayName}`;
  };
  const exactTodayBangla = getExactTodayBangla();

  // Pre-calculate today's & yesterday's summary
  const todayRecords = collections.filter((c) => c.date && (c.date.startsWith(todayStr) || c.date.includes(todayStr)));
  const todayTotal = todayRecords.reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const yesterdayRecords = collections.filter((c) => c.date && (c.date.startsWith(yesterdayStr) || c.date.includes(yesterdayStr)));
  const yesterdayTotal = yesterdayRecords.reduce((sum, c) => sum + Number(c.amount || 0), 0);

  // Filter collections based on active mode
  let baseCollections = collections;
  let activePeriodLabel = 'সব তারিখের আদায়';

  if (dateFilterMode === 'today') {
    baseCollections = todayRecords;
    activePeriodLabel = `আজকের আদায় (${formatDateBN(todayStr)})`;
  } else if (dateFilterMode === 'yesterday') {
    baseCollections = yesterdayRecords;
    activePeriodLabel = `গতকালকের আদায় (${formatDateBN(yesterdayStr)})`;
  } else if (dateFilterMode === 'date') {
    baseCollections = collections.filter((c) => c.date && (c.date.startsWith(selectedDate) || c.date.includes(selectedDate)));
    activePeriodLabel = `${formatDateBN(selectedDate)} তারিখের আদায়`;
  }

  // Filter by search query
  const filteredCollections = baseCollections
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        c.memberName.toLowerCase().includes(q) ||
        c.receiptNo.toLowerCase().includes(q) ||
        (c.notes && c.notes.toLowerCase().includes(q)) ||
        (c.paymentMethod && c.paymentMethod.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalDaily = filteredCollections.reduce((acc, c) => acc + Number(c.amount || 0), 0);

  // Method translations
  const methodBadge = (method: string) => {
    switch (method) {
      case 'bKash':
        return <span className="px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 font-bold text-[10px]">বিকাশ</span>;
      case 'Nagad':
        return <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[10px]">নগদ</span>;
      case 'Bank':
        return <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">ব্যাংক</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">ক্যাশ</span>;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-xs"
            title="ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                <HandCoins className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                {title || (dateFilterMode === 'today' ? 'আজকের কিস্তি সংগ্রহ' : 'দৈনিক কিস্তি আদায়ের রিপোর্ট')}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold shrink-0">
                <Calendar className="w-3 h-3 text-emerald-600" />
                <span>সঠিক তারিখ: {exactTodayBangla}</span>
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                • {activePeriodLabel} • মোট {filteredCollections.length} টি আদায়
              </span>
            </div>
          </div>
        </div>

        {/* Total Amount & Action */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              {dateFilterMode === 'today' ? 'আজকের মোট আদায়' : dateFilterMode === 'yesterday' ? 'গতকালকের মোট আদায়' : 'মোট আদায়'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatTaka(totalDaily)}
            </span>
          </div>

          {isAdmin && onQuickCollect && (
            <button
              onClick={onQuickCollect}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition transform active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>কিস্তি জমা</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Filter Tabs (আজকের আদায়, কালকের আদায়, নির্দিষ্ট তারিখ, সব আদায়) */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* 1. Today */}
          <button
            onClick={() => {
              setDateFilterMode('today');
              setSelectedDate(todayStr);
            }}
            className={`p-2.5 rounded-2xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 border ${
              dateFilterMode === 'today'
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20 scale-[1.02]'
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span>আজকের আদায়</span>
            </div>
            <span className={`text-[11px] font-extrabold ${dateFilterMode === 'today' ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {todayRecords.length > 0 ? `${todayRecords.length}টি (${formatTaka(todayTotal)})` : '০ টি (৳ ০)'}
            </span>
          </button>

          {/* 2. Yesterday */}
          <button
            onClick={() => {
              setDateFilterMode('yesterday');
              setSelectedDate(yesterdayStr);
            }}
            className={`p-2.5 rounded-2xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 border ${
              dateFilterMode === 'yesterday'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.02]'
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>গতকালকের আদায়</span>
            </div>
            <span className={`text-[11px] font-extrabold ${dateFilterMode === 'yesterday' ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}>
              {yesterdayRecords.length > 0 ? `${yesterdayRecords.length}টি (${formatTaka(yesterdayTotal)})` : '০ টি (৳ ০)'}
            </span>
          </button>

          {/* 3. Specific Date Picker */}
          <button
            onClick={() => setDateFilterMode('date')}
            className={`p-2.5 rounded-2xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 border ${
              dateFilterMode === 'date'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20 scale-[1.02]'
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>নির্দিষ্ট তারিখ</span>
            </div>
            <span className={`text-[11px] font-semibold ${dateFilterMode === 'date' ? 'text-indigo-100' : 'text-slate-500'}`}>
              {formatDateBN(selectedDate)}
            </span>
          </button>

          {/* 4. All Dates */}
          <button
            onClick={() => setDateFilterMode('all')}
            className={`p-2.5 rounded-2xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 border ${
              dateFilterMode === 'all'
                ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 shadow-md scale-[1.02]'
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              <span>সব আদায়</span>
            </div>
            <span className={`text-[11px] font-semibold ${dateFilterMode === 'all' ? 'text-slate-200' : 'text-slate-500'}`}>
              মোট {collections.length} টি
            </span>
          </button>
        </div>

        {/* Date Selector input when 'date' mode is active */}
        {dateFilterMode === 'date' && (
          <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                তারিখ পরিবর্তন করুন:
              </label>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Search & Export Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="গ্রাহকের নাম, রসিদ নং অথবা ফোন দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={() =>
              exportCollectionsToCSV(
                filteredCollections.length > 0 ? filteredCollections : collections,
                `somiti_collections_${dateFilterMode}_${selectedDate}.csv`
              )
            }
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition shrink-0"
            title="এক্সেল / সিএসভি ফাইল হিসেবে ডাউনলোড করুন"
          >
            <Download className="w-3.5 h-3.5" />
            <span>এক্সেল / CSV</span>
          </button>
        </div>
      </div>

      {/* Collection Records List */}
      <div className="space-y-2.5">
        {filteredCollections.length === 0 ? (
          <div className="p-10 sm:p-14 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <HandCoins className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                {dateFilterMode === 'today'
                  ? 'আজকে এখনো কোনো কিস্তি আদায়ের রেকর্ড নেই'
                  : dateFilterMode === 'yesterday'
                  ? 'গতকাল কোনো কিস্তি আদায়ের রেকর্ড পাওয়া যায়নি'
                  : 'এই তারিখে কোনো কিস্তি সংগ্রহের রেকর্ড পাওয়া যায়নি'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {dateFilterMode === 'today'
                  ? 'আজ গ্রাহকের কাছ থেকে কিস্তি সংগ্রহ করলে নিচের বাটনে চাপ দিয়ে সরাসরি জমা রেকর্ড করতে পারেন।'
                  : 'তারিখ নির্বাচন পরিবর্তন করে অন্যান্য দিনের রিপোর্ট চেক করুন।'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {isAdmin && onQuickCollect && (
                <button
                  onClick={onQuickCollect}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন কিস্তি জমা নিন</span>
                </button>
              )}
              {dateFilterMode === 'today' && yesterdayRecords.length > 0 && (
                <button
                  onClick={() => {
                    setDateFilterMode('yesterday');
                    setSelectedDate(yesterdayStr);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 transition"
                >
                  গতকালকের আদায় দেখুন ({yesterdayRecords.length}টি)
                </button>
              )}
              {dateFilterMode !== 'all' && (
                <button
                  onClick={() => setDateFilterMode('all')}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                >
                  সব আদায় দেখুন
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredCollections.map((c) => {
            const memberObj = members.find((m) => String(m.id) === String(c.memberId));

            return (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md transition group"
              >
                {/* Member & Collection Info */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  {/* Member Photo Preview Avatar */}
                  <div
                    onClick={() => memberObj && onPreviewImage?.(memberObj)}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 font-extrabold flex items-center justify-center text-sm shrink-0 overflow-hidden border border-blue-100 dark:border-blue-900/60 cursor-pointer hover:ring-2 hover:ring-blue-500 transition relative group/avatar"
                    title={memberObj?.photo ? 'ছবি বড় করে দেখতে চাপ দিন' : c.memberName}
                  >
                    {memberObj?.photo ? (
                      <img
                        src={memberObj.photo}
                        alt={c.memberName}
                        className="w-full h-full object-cover group-hover/avatar:scale-110 transition duration-200"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span>{c.memberName.charAt(0)}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-tight whitespace-nowrap">
                        {c.memberName}
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold shrink-0">
                        #{c.memberId}
                      </span>
                      <span className="shrink-0">{methodBadge(c.paymentMethod)}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="font-medium text-slate-600 dark:text-slate-300">
                        রসিদ: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{c.receiptNo}</span>
                      </span>
                      <span>•</span>
                      <span>মাস: <strong className="text-slate-700 dark:text-slate-200">{c.monthKey}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{formatDateBN(c.date ? c.date.split('T')[0] : '')}</span>
                      </span>
                      {memberObj?.phone && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Phone className="w-3 h-3" />
                            <span>{memberObj.phone}</span>
                          </span>
                        </>
                      )}
                    </div>

                    {c.notes && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 italic">
                        নোট: {c.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                  <div className="text-left sm:text-right">
                    <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                      + {formatTaka(c.amount)}
                    </div>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      আদায়কারী: {c.collectorName || 'আদায়কারী'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onViewReceipt(c)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition shadow-2xs"
                    >
                      রসিদ
                    </button>

                    {isAdmin && onEditCollection && (
                      <button
                        onClick={() => onEditCollection(c)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-xl transition"
                        title="রসিদ পরিবর্তন/এডিট করুন"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    {isAdmin && onDeleteCollection && (
                      <button
                        onClick={() => onDeleteCollection(c)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition"
                        title="রসিদ ডিলিট করুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
