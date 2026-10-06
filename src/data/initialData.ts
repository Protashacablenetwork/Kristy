import { Member, SystemSettings, CollectionRecord } from '../types';
import { DEFAULT_SHEET_CSV_URL, DEFAULT_APPS_SCRIPT_URL } from '../utils/googleSheetSync';

export const INITIAL_SETTINGS: SystemSettings = {
  somitiName: 'দশ তারা সমবায় সমিতি',
  tagline: '',
  collectorName: 'মোঃ শিপন',
  phone: '01982-972228',
  address: 'টানা ব্রীজ আনন্দ বাজার, ইসলামপুর,জামালপুর',
  themeColor: 'blue',
  isDarkMode: false,
  googleSheetUrl: DEFAULT_SHEET_CSV_URL,
  googleAppsScriptUrl: DEFAULT_APPS_SCRIPT_URL,
  lastSyncedAt: 'এখনই'
};

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'Sel001',
    name: 'মোঃ লানজু',
    phone: '01906381800',
    address: 'দত্তপাড়া',
    joinMonth: 4, // May 2026
    joinYear: 2026,
    startMonth: 5, // June 2026
    startYear: 2026,
    joinDate: 'May 2026',
    taka: 100000,
    profitRate: 0.2,
    tenureMonths: 10,
    photo: 'https://i.postimg.cc/m2CRPwmD/670832F113F7439C9509C482FE654E12-jshdhd.jpg',
    months: {
      'June 2026': 12000,
      'July 2026': 12000,
      'August 2026': 12000
    },
    notes: 'গুগল স্প্রেডশিট সদস্য'
  },
  {
    id: 'Sel0003',
    name: 'মো:বেলাল',
    phone: '01922791556',
    address: 'দও পাড়া',
    joinMonth: 5, // June 2026
    joinYear: 2026,
    startMonth: 6, // July 2026
    startYear: 2026,
    joinDate: 'Jun 2026',
    taka: 30000,
    profitRate: 0.2,
    tenureMonths: 10,
    months: {
      'July 2026': 3600,
      'August 2026': 3600
    },
    notes: 'গুগল স্প্রেডশিট সদস্য'
  },
  {
    id: 'Sel0004',
    name: 'মো:কাদির',
    phone: '',
    address: 'কুশলনগর',
    joinMonth: 5, // June 2026
    joinYear: 2026,
    startMonth: 6, // July 2026
    startYear: 2026,
    joinDate: 'Jun 2026',
    taka: 50000,
    profitRate: 0.2,
    tenureMonths: 10,
    months: {
      'July 2026': 6000,
      'August 2026': 6000
    },
    notes: 'গুগল স্প্রেডশিট সদস্য'
  },
  {
    id: 'Sel0005',
    name: 'শী বীরবল',
    phone: '01732764091',
    address: 'চরশিমুল চড়া',
    joinMonth: 7, // August 2026
    joinYear: 2026,
    startMonth: 8, // September 2026
    startYear: 2026,
    joinDate: 'Aug 2026',
    taka: 30000,
    profitRate: 0.2,
    tenureMonths: 10,
    months: {},
    notes: 'গুগল স্প্রেডশিট সদস্য'
  },
  {
    id: 'Sel0006',
    name: 'মো: সোহেল',
    phone: '01908016265',
    address: 'কুশলনগর',
    joinMonth: 7, // August 2026
    joinYear: 2026,
    startMonth: 8, // September 2026
    startYear: 2026,
    joinDate: 'Aug 2026',
    taka: 70000,
    profitRate: 0.2,
    tenureMonths: 10,
    months: {},
    notes: 'গুগল স্প্রেডশিট সদস্য'
  }
];

export const INITIAL_COLLECTIONS: CollectionRecord[] = [
  {
    id: 'col-sheet-Sel001-12',
    receiptNo: 'REC-SHEET-Sel001-12',
    memberId: 'Sel001',
    memberName: 'মোঃ লানজু',
    monthKey: 'June 2026',
    amount: 12000,
    date: '2026-06-15',
    paymentMethod: 'Cash',
    collectorName: 'মোঃ শিপন',
    notes: 'গুগল স্প্রেডশিট কিস্তি'
  },
  {
    id: 'col-sheet-Sel001-13',
    receiptNo: 'REC-SHEET-Sel001-13',
    memberId: 'Sel001',
    memberName: 'মোঃ লানজু',
    monthKey: 'July 2026',
    amount: 12000,
    date: '2026-07-15',
    paymentMethod: 'Cash',
    collectorName: 'মোঃ শিপন',
    notes: 'গুগল স্প্রেডশিট কিস্তি'
  },
  {
    id: 'col-sheet-Sel001-14',
    receiptNo: 'REC-SHEET-Sel001-14',
    memberId: 'Sel001',
    memberName: 'মোঃ লানজু',
    monthKey: 'August 2026',
    amount: 12000,
    date: '2026-08-15',
    paymentMethod: 'Cash',
    collectorName: 'মোঃ শিপন',
    notes: 'গুগল স্প্রেডশিট কিস্তি'
  },
  {
    id: 'col-sheet-Sel0003-13',
    receiptNo: 'REC-SHEET-Sel0003-13',
    memberId: 'Sel0003',
    memberName: 'মো:বেলাল',
    monthKey: 'July 2026',
    amount: 3600,
    date: '2026-07-15',
    paymentMethod: 'Cash',
    collectorName: 'মোঃ শিপন',
    notes: 'গুগল স্প্রেডশিট কিস্তি'
  },
  {
    id: 'col-sheet-Sel0003-14',
    receiptNo: 'REC-SHEET-Sel0003-14',
    memberId: 'Sel0003',
    memberName: 'মো:বেলাল',
    monthKey: 'August 2026',
    amount: 3600,
    date: '2026-08-15',
    paymentMethod: 'Cash',
    collectorName: 'মোঃ শিপন',
    notes: 'গুগল স্প্রেডশিট কিস্তি'
  },
  {
    id: 'col-sheet-Sel0004-13',
    receiptNo: 'REC-SHEET-Sel0004-13',
    memberId: 'Sel0004',
    memberName: 'মো:কাদির',
    monthKey: 'July 2026',
    amount: 6000,
    date: '2026-07-15',
    paymentMethod: 'Cash',
    collectorName: 'মোঃ শিপন',
    notes: 'গুগল স্প্রেডশিট কিস্তি'
  },
  {
    id: 'col-sheet-Sel0004-14',
    receiptNo: 'REC-SHEET-Sel0004-14',
    memberId: 'Sel0004',
    memberName: 'মো:কাদির',
    monthKey: 'August 2026',
    amount: 6000,
    date: '2026-08-15',
    paymentMethod: 'Cash',
    collectorName: 'মোঃ শিপন',
    notes: 'গুগল স্প্রেডশিট কিস্তি'
  }
];

