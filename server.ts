import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, setLogLevel } from 'firebase/firestore';

const ROOT_DIR = process.cwd();

// Silence Firestore internal verbose logs
try {
  setLogLevel('silent');
} catch {}

// Initialize Firebase for optional cloud backup
let firestoreDb: any = null;
try {
  const configPath = path.join(ROOT_DIR, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const fbApp = initializeApp(config);
    firestoreDb = getFirestore(fbApp, config.firestoreDatabaseId || undefined);
  }
} catch (e) {
  console.warn('[Server] Firebase init warning:', e);
}

const DATA_DIR = path.join(ROOT_DIR, 'data');
const STORE_FILE = path.join(DATA_DIR, 'somiti_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface SomitiStoreData {
  members: any[];
  collections: any[];
  settings: any;
  users: any[];
  bannerConfig?: any;
  deletedMemberIds?: string[];
  deletedCollectionIds?: string[];
  updatedAt: number;
}

const DEFAULT_MEMBERS: any[] = [
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

const DEFAULT_COLLECTIONS: any[] = [
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

const DEFAULT_STORE: SomitiStoreData = {
  members: DEFAULT_MEMBERS,
  collections: DEFAULT_COLLECTIONS,
  settings: {
    somitiName: 'দশ তারা সমবায় সমিতি',
    tagline: 'কিস্তি ম্যানেজমেন্ট',
    collectorName: 'মোঃ শিপন',
    phone: '01982-972228',
    address: 'টানা ব্রীজ আনন্দ বাজার, ইসলামপুর,জামালপুর',
    themeColor: 'blue',
    isDarkMode: false,
    googleSheetUrl: 'https://docs.google.com/spreadsheets/d/13-pQ1jv8DACdfRLnfOVrBAkCCNV3Bz5L5OllWMad2s4/export?format=csv',
    googleAppsScriptUrl: 'https://script.google.com/macros/s/AKfycby5Wj3U96X1e0sVIFD7Hck0kH13uSgQneLsNp6mpvmMCBwZX1cT3a0Yp33XbYgqCceI/exec',
    lastSyncedAt: 'এখনই'
  },
  users: [
    {
      id: 'usr-admin',
      username: 'admin',
      password: 'admin812',
      name: 'ম্যানেজার (অ্যাডমিন)',
      phone: '01711223344',
      role: 'admin',
      isOnline: true,
      lastActive: new Date().toISOString(),
      createdAt: '2026-01-01'
    },
    {
      id: 'usr-collector1',
      username: 'shipon',
      password: '123456',
      name: 'মোঃ শিপন (ফিল্ড অফিসার)',
      phone: '01812345678',
      role: 'user',
      isOnline: false,
      lastActive: new Date().toISOString(),
      createdAt: '2026-01-10'
    },
    {
      id: 'usr-viewer1',
      username: 'viewer',
      password: '123456',
      name: 'সাধারণ পর্যবেক্ষক (ভিউয়ার)',
      phone: '01900000000',
      role: 'viewer',
      isOnline: false,
      lastActive: new Date().toISOString(),
      createdAt: '2026-02-01'
    }
  ],
  deletedMemberIds: [],
  deletedCollectionIds: ['col-1789713444780'],
  updatedAt: Date.now()
};

function isOldTestRecord(m: any): boolean {
  if (!m) return true;
  const idStr = String(m?.id || '').trim();
  const nameStr = String(m?.name || '').trim();
  if (!idStr && !nameStr) return true;

  const combined = (idStr + ' ' + nameStr).toLowerCase();
  if (
    combined.includes('font-family') ||
    combined.includes('color:') ||
    combined.includes('background') ||
    combined.includes('light-dark') ||
    combined.includes('rgba(') ||
    combined.includes('border:') ||
    combined.includes('sessionstorage') ||
    combined.includes('postmessage') ||
    combined.includes('warmup') ||
    combined.includes('helvetica') ||
    combined.includes('arial') ||
    combined.includes('persists') ||
    combined.includes('reload') ||
    combined.includes('iframe') ||
    combined.includes('issue during') ||
    idStr.startsWith('//') ||
    idStr.includes(';') ||
    idStr.includes('{') ||
    idStr.includes('}') ||
    nameStr.includes(';') ||
    nameStr.includes('{') ||
    nameStr.includes('}') ||
    nameStr.startsWith('#')
  ) {
    return true;
  }

  // Filter out invalid test/dummy record Sel0007 / া্বাব
  if (idStr.toLowerCase() === 'sel0007' || nameStr.includes('া্বাব')) return true;

  // Filter out legacy dummy demo members Mel24456...
  if (/^mel24456\d*/i.test(idStr)) return true;

  // Sel... are the real authentic members from Google Sheet!
  if (/^sel\d+/i.test(idStr)) return false;

  if (/^178971\d+$/i.test(idStr)) return true;
  if (['test_dummy', 'dummy_member'].includes(idStr.toLowerCase())) return true;
  return false;
}

function isOldTestCollectionRecord(c: any): boolean {
  if (!c) return true;
  const idStr = String(c?.id || '').trim();
  const memIdStr = String(c?.memberId || '').trim();
  const nameStr = String(c?.memberName || '').trim();
  const recStr = String(c?.receiptNo || '').trim();

  // Filter out invalid test/dummy record Sel0007 / া্বাব
  if (memIdStr.toLowerCase() === 'sel0007' || nameStr.includes('া্বাব')) {
    return true;
  }

  // Filter out legacy Mel244 collections
  if (memIdStr.toLowerCase().startsWith('mel244') || idStr.toLowerCase().includes('mel244') || recStr.toLowerCase().includes('mel244')) {
    return true;
  }

  // Sel collections are valid
  if (memIdStr.toLowerCase().startsWith('sel')) {
    return false;
  }

  const combined = `${idStr} ${memIdStr} ${nameStr} ${recStr}`.toLowerCase();
  if (
    combined.includes('font-family') ||
    combined.includes('color:') ||
    combined.includes('light-dark') ||
    combined.includes('background') ||
    combined.includes('{') ||
    combined.includes('}') ||
    combined.includes(';') ||
    /^178971\d+$/i.test(idStr)
  ) {
    return true;
  }
  return false;
}

function isValidGoogleSheetCsv(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (
    trimmed.startsWith('<') ||
    trimmed.includes('<!DOCTYPE') ||
    trimmed.includes('<html') ||
    trimmed.includes('<head>') ||
    trimmed.includes('<body') ||
    trimmed.includes('<script') ||
    trimmed.includes('<style>') ||
    trimmed.includes('warmup_start_time') ||
    trimmed.includes('font-family:') ||
    trimmed.includes('light-dark(')
  ) {
    return false;
  }
  if (!trimmed.includes(',')) return false;
  const firstLine = trimmed.split('\n')[0] || '';
  return /memberid|id|name|নাম|ফোন|phone|ঋণ|loan|ঠিকানা|address|join|taka/i.test(firstLine);
}

function parseJoinDate(rawDate: string): { joinMonth: number; joinYear: number } {
  let joinMonth = 4; // May default
  let joinYear = 2026;

  if (!rawDate) return { joinMonth, joinYear };

  const normalized = rawDate.replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString()).trim();
  const lower = normalized.toLowerCase();

  const isoMatch = normalized.match(/^(\d{4})-(\d{1,2})/);
  if (isoMatch) {
    const yr = parseInt(isoMatch[1], 10);
    const mo = parseInt(isoMatch[2], 10) - 1;
    if (!isNaN(yr) && yr >= 2020) joinYear = yr;
    if (!isNaN(mo) && mo >= 0 && mo <= 11) joinMonth = mo;
    return { joinMonth, joinYear };
  }

  const monthAbbrs = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  for (let i = 0; i < monthAbbrs.length; i++) {
    if (lower.startsWith(monthAbbrs[i]) || lower.includes(monthAbbrs[i])) {
      joinMonth = i;
      break;
    }
  }

  const bnMonths = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
  for (let i = 0; i < bnMonths.length; i++) {
    if (lower.includes(bnMonths[i])) {
      joinMonth = i;
      break;
    }
  }

  const yrMatch = normalized.match(/\b(20[2-4][0-9])\b/);
  if (yrMatch) {
    joinYear = parseInt(yrMatch[1], 10);
  }

  return { joinMonth, joinYear };
}

function getApproxDateForMonthKey(monthKey: string): string {
  const match = monthKey.match(/([a-zA-Z]+|\S+)\s+(\d{4})/);
  if (match) {
    const moName = match[1].toLowerCase();
    const yr = match[2];
    const monthAbbrs = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const idx = monthAbbrs.findIndex(m => moName.startsWith(m));
    if (idx !== -1) {
      return `${yr}-${String(idx + 1).padStart(2, '0')}-01`;
    }
  }
  return '2026-06-01';
}

function normalizeGoogleSheetCsvUrl(rawUrl: string): string {
  let url = (rawUrl || '').trim();
  if (!url) return DEFAULT_STORE.settings.googleSheetUrl;

  const standardMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (standardMatch && !url.includes('/spreadsheets/d/e/')) {
    const sheetId = standardMatch[1];
    if (!sheetId.startsWith('2PACX-')) {
      return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    }
  }

  if (url.includes('/spreadsheets/d/2PACX-') && !url.includes('/spreadsheets/d/e/2PACX-')) {
    url = url.replace('/spreadsheets/d/2PACX-', '/spreadsheets/d/e/2PACX-');
  }

  if (url.includes('/pub') && !url.includes('output=csv')) {
    url += (url.includes('?') ? '&' : '?') + 'output=csv';
  }

  return url;
}

function parseCSV(text: string): string[][] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean);
  const rows: string[][] = [];

  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += c;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }
  return rows;
}

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function normalizeMonthKey(raw: string): string {
  if (!raw) return '';
  const normalized = String(raw).replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString()).trim();
  const lower = normalized.toLowerCase();
  
  let monthIdx = -1;
  const monthAbbrs = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  for (let i = 0; i < monthAbbrs.length; i++) {
    if (lower.includes(monthAbbrs[i])) {
      monthIdx = i;
      break;
    }
  }
  if (monthIdx === -1) {
    const bnMonths = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
    for (let i = 0; i < bnMonths.length; i++) {
      if (lower.includes(bnMonths[i])) {
        monthIdx = i;
        break;
      }
    }
  }
  
  let year = 2026;
  const yrMatch = normalized.match(/\b(20[2-4][0-9])\b/);
  if (yrMatch) {
    year = parseInt(yrMatch[1], 10);
  }
  
  if (monthIdx !== -1) {
    return `${MONTH_NAMES_EN[monthIdx]} ${year}`;
  }
  return raw.trim();
}

function parseServerGoogleSheetCsv(csvText: string): { members: any[]; collections: any[] } {
  if (!isValidGoogleSheetCsv(csvText)) {
    return { members: [], collections: [] };
  }

  const parsed = parseCSV(csvText);
  if (parsed.length === 0) {
    return { members: [], collections: [] };
  }

  const headers = parsed[0] || [];
  let startRow = 1;

  let idIdx = headers.findIndex((h) => /memberid|id|আইডি|কোড|ক্রমিক|sl|sel/i.test(h));
  let nameIdx = headers.findIndex((h) => /name|নাম|গ্রাহক|সদস্য|ব্যক্তি/i.test(h));
  let phoneIdx = headers.findIndex((h) => /phone|মোবাইল|ফোন|মোবাইল নং|contact/i.test(h));
  let addressIdx = headers.findIndex((h) => /address|ঠিকানা|গ্রাম|এলাকা|স্থান/i.test(h));
  let joinIdx = headers.findIndex((h) => /join|তারিখ|মাস|ভর্তি|গ্রহন|সময়/i.test(h));
  let takaIdx = headers.findIndex((h) => /loan|taka|টাকা|পরিমাণ|ঋণ|মূলধন|এমাউন্ট/i.test(h));
  let photoIdx = headers.findIndex((h) => /photo|ছবি|পিকচার|image|img/i.test(h));

  if (nameIdx === -1 && parsed.length > 0) {
    const firstRow = parsed[0];
    if (firstRow && firstRow.some((cell) => /[ক-হঅ-ঔা-ৌংঃঁ]/i.test(cell) || /sel|m-/i.test(cell))) {
      startRow = 0;
      nameIdx = 1;
      idIdx = 0;
      takaIdx = 2;
    } else {
      nameIdx = 1;
      idIdx = 0;
    }
  }

  const monthCols: { index: number; headerName: string }[] = [];
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].trim();
    if (/\b20[2-4][0-9]\b/.test(h) || /january|february|march|april|may|june|july|august|september|october|november|december|জানুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর/i.test(h)) {
      monthCols.push({ index: i, headerName: normalizeMonthKey(h) });
    }
  }

  const members: any[] = [];
  const collections: any[] = [];

  for (let r = startRow; r < parsed.length; r++) {
    const row = parsed[r];
    if (!row || row.length === 0) continue;

    const rawId = (idIdx !== -1 && row[idIdx]) ? row[idIdx].trim() : (row[0] || `Sel${String(r).padStart(4, '0')}`);
    let name = (nameIdx !== -1 && row[nameIdx]) ? row[nameIdx].trim() : '';
    if (!name && row.length > 1) {
      name = row[1] || row[0] || '';
    }
    if (!name || name.includes('া্বাব') || rawId.toLowerCase() === 'sel0007' || isOldTestRecord({ id: rawId, name })) continue;

    const phone = (phoneIdx !== -1 && row[phoneIdx]) ? row[phoneIdx].trim() : (row.find(c => /^01[3-9]\d{8}$/.test(c)) || '');
    const address = (addressIdx !== -1 && row[addressIdx]) ? row[addressIdx].trim() : '';
    const rawJoin = (joinIdx !== -1 && row[joinIdx]) ? row[joinIdx].trim() : 'May 2026';
    const { joinMonth, joinYear } = parseJoinDate(rawJoin);

    let taka = 0;
    if (takaIdx !== -1 && row[takaIdx]) {
      const normalizedTaka = String(row[takaIdx]).replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString());
      taka = parseInt(normalizedTaka.replace(/[^0-9]/g, ''), 10) || 0;
    } else {
      const numCell = row.find(c => {
        const normalized = String(c).replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString());
        const n = parseInt(normalized.replace(/[^0-9]/g, ''), 10);
        return !isNaN(n) && n >= 5000;
      });
      if (numCell) {
        const normalized = String(numCell).replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString());
        taka = parseInt(normalized.replace(/[^0-9]/g, ''), 10) || 0;
      }
    }

    const photo = (photoIdx !== -1 && row[photoIdx]) ? row[photoIdx].trim() : '';

    if (taka <= 0 && !phone && !address && !photo) continue;

    const months: Record<string, number | null> = {};

    monthCols.forEach(({ index, headerName }) => {
      const rawVal = row[index];
      if (rawVal && rawVal.trim()) {
        const normalizedVal = String(rawVal).replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString());
        const num = parseInt(normalizedVal.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num) && num > 0) {
          months[headerName] = (months[headerName] || 0) + num;

          collections.push({
            id: `col-sheet-${rawId}-${index}`,
            receiptNo: `REC-SHEET-${rawId}-${index}`,
            memberId: rawId,
            memberName: name,
            monthKey: headerName,
            amount: num,
            date: getApproxDateForMonthKey(headerName),
            paymentMethod: 'Cash',
            collectorName: 'মোঃ শিপন',
            notes: 'গুগল স্প্রেডশিট থেকে আমদানি'
          });
        }
      }
    });

    const nextMonthDate = new Date(joinYear, joinMonth + 1, 1);
    const startMonth = nextMonthDate.getMonth();
    const startYear = nextMonthDate.getFullYear();

    members.push({
      id: rawId,
      name,
      phone,
      address,
      joinMonth,
      joinYear,
      startMonth,
      startYear,
      joinDate: rawJoin,
      taka,
      profitRate: 0.20,
      tenureMonths: 10,
      photo: photo || undefined,
      months,
      notes: 'গুগল স্প্রেডশিট সদস্য'
    });
  }

  return { members, collections };
}

function readStore(): SomitiStoreData {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const data = JSON.parse(raw);
      const delMemberSet = new Set((data.deletedMemberIds || []).map(String));
      const delColSet = new Set((data.deletedCollectionIds || []).map(String));

      let rawMembers = Array.isArray(data.members) ? data.members : DEFAULT_STORE.members;
      let rawCollections = Array.isArray(data.collections) ? data.collections : DEFAULT_STORE.collections;

      // Filter out deleted members and old dummy test records
      rawMembers = rawMembers.filter((m: any) => !delMemberSet.has(String(m.id)) && !isOldTestRecord(m));
      rawCollections = rawCollections.filter((c: any) => !delColSet.has(String(c.id)) && !delMemberSet.has(String(c.memberId)) && !isOldTestCollectionRecord(c));

      // If no valid members exist in store, fallback to DEFAULT_MEMBERS
      if (rawMembers.length === 0) {
        rawMembers = DEFAULT_MEMBERS;
        rawCollections = DEFAULT_COLLECTIONS;
      }

      const loadedSettings = data.settings || DEFAULT_STORE.settings;
      if (loadedSettings) {
        if (!loadedSettings.address || loadedSettings.address.includes('দত্তপাড়া')) {
          loadedSettings.address = 'টানা ব্রীজ আনন্দ বাজার, ইসলামপুর,জামালপুর';
        }
        if (!loadedSettings.phone || loadedSettings.phone.includes('০১৯০৬')) {
          loadedSettings.phone = '01982-972228';
        }
      }

      return {
        members: rawMembers,
        collections: rawCollections,
        settings: loadedSettings,
        users: Array.isArray(data.users) && data.users.length > 0 ? data.users : DEFAULT_STORE.users,
        bannerConfig: data.bannerConfig || undefined,
        deletedMemberIds: Array.from(delMemberSet) as string[],
        deletedCollectionIds: Array.from(delColSet) as string[],
        updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now()
      };
    }
  } catch (err) {
    console.error('[Server] Failed reading somiti_store.json:', err);
  }
  return { ...DEFAULT_STORE, updatedAt: Date.now() };
}

function writeStore(data: Partial<SomitiStoreData>): SomitiStoreData {
  const current = readStore();

  const mergedDelMembers = Array.from(new Set([
    ...(current.deletedMemberIds || []),
    ...(data.deletedMemberIds || []).map(String)
  ]));
  const mergedDelCollections = Array.from(new Set([
    ...(current.deletedCollectionIds || []),
    ...(data.deletedCollectionIds || []).map(String)
  ]));

  const delMemberSet = new Set(mergedDelMembers);
  const delColSet = new Set(mergedDelCollections);

  const rawMembers = Array.isArray(data.members) ? data.members : current.members;
  const rawCollections = Array.isArray(data.collections) ? data.collections : current.collections;

  const cleanMembers = rawMembers.filter((m: any) => !delMemberSet.has(String(m.id)) && !isOldTestRecord(m));
  const cleanCollections = rawCollections.filter((c: any) => {
    if (delColSet.has(String(c.id)) || delMemberSet.has(String(c.memberId)) || isOldTestCollectionRecord(c)) return false;
    return true;
  });

  const updated: SomitiStoreData = {
    members: cleanMembers,
    collections: cleanCollections,
    settings: data.settings ? { ...current.settings, ...data.settings } : current.settings,
    users: Array.isArray(data.users) && data.users.length > 0 ? data.users : current.users,
    bannerConfig: data.bannerConfig !== undefined ? data.bannerConfig : current.bannerConfig,
    deletedMemberIds: mergedDelMembers,
    deletedCollectionIds: mergedDelCollections,
    updatedAt: Date.now()
  };

  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(updated, null, 2), 'utf8');
  } catch (err) {
    console.error('[Server] Failed writing somiti_store.json:', err);
  }

  // Attempt background sync to Firestore if configured
  if (firestoreDb) {
    try {
      const somitiDoc = doc(firestoreDb, 'somiti_app', 'main_data');
      setDoc(
        somitiDoc,
        {
          members: updated.members,
          collections: updated.collections,
          settings: updated.settings,
          users: updated.users,
          deletedMemberIds: updated.deletedMemberIds,
          deletedCollectionIds: updated.deletedCollectionIds,
          updatedAt: new Date(updated.updatedAt).toISOString()
        },
        { merge: true }
      ).catch(() => {
        // Non-blocking quota handling
      });
    } catch {}
  }

  return updated;
}

// Initial bootstrap from Firestore if store file does not exist yet
async function bootstrapStore() {
  if (!fs.existsSync(STORE_FILE) && firestoreDb) {
    try {
      console.log('[Server] Checking Firestore for initial seed data...');
      const somitiDoc = doc(firestoreDb, 'somiti_app', 'main_data');
      const snap = await getDoc(somitiDoc);
      if (snap.exists()) {
        const fsData = snap.data();
        const delMemberSet = new Set((fsData.deletedMemberIds || []).map(String));
        const delColSet = new Set((fsData.deletedCollectionIds || []).map(String));

        const rawMembers = Array.isArray(fsData.members) ? fsData.members : DEFAULT_STORE.members;
        const rawCollections = Array.isArray(fsData.collections) ? fsData.collections : DEFAULT_STORE.collections;

        const initialStore: SomitiStoreData = {
          members: rawMembers.filter((m: any) => !delMemberSet.has(String(m.id))),
          collections: rawCollections.filter((c: any) => !delColSet.has(String(c.id)) && !delMemberSet.has(String(c.memberId))),
          settings: fsData.settings || DEFAULT_STORE.settings,
          users: Array.isArray(fsData.users) ? fsData.users : DEFAULT_STORE.users,
          deletedMemberIds: Array.from(delMemberSet) as string[],
          deletedCollectionIds: Array.from(delColSet) as string[],
          updatedAt: fsData.updatedAt ? new Date(fsData.updatedAt).getTime() : Date.now()
        };
        fs.writeFileSync(STORE_FILE, JSON.stringify(initialStore, null, 2), 'utf8');
        console.log('[Server] Successfully bootstrapped store from Firestore data.');
        return;
      }
    } catch (e) {
      console.warn('[Server] Firestore bootstrap skipped:', e);
    }
    // Fallback write default store
    fs.writeFileSync(STORE_FILE, JSON.stringify(DEFAULT_STORE, null, 2), 'utf8');
  }
}

async function syncGoogleSheetOnServer(rawUrl?: string): Promise<SomitiStoreData> {
  const targetUrl = normalizeGoogleSheetCsvUrl(rawUrl || DEFAULT_STORE.settings.googleSheetUrl);
  try {
    console.log('[Server] Fetching Google Sheet CSV from:', targetUrl);
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'text/csv, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      redirect: 'follow'
    });

    if (response.ok) {
      const csvText = await response.text();
      const parsed = parseServerGoogleSheetCsv(csvText);
      if (parsed.members.length > 0) {
        console.log(`[Server] Parsed ${parsed.members.length} members from Google Sheet CSV.`);
        const current = readStore();
        const delMemberSet = new Set((current.deletedMemberIds || []).map(String));
        const delColSet = new Set((current.deletedCollectionIds || []).map(String));

        const sheetMemMap = new Map<string, any>();
        parsed.members.forEach((sm) => {
          sheetMemMap.set(String(sm.id).toLowerCase(), sm);
        });

        // Merge with existing members (retaining any extra fields or newer local members)
        const mergedMembers: any[] = [];
        parsed.members.forEach((sm) => {
          const existing = current.members.find(
            (m) => String(m.id).toLowerCase() === String(sm.id).toLowerCase() || m.name === sm.name
          );
          mergedMembers.push({
            ...sm,
            photo: sm.photo || existing?.photo,
            months: { ...(existing?.months || {}), ...(sm.months || {}) }
          });
        });

        // Add any newly created non-test members that are not in sheet yet
        current.members.forEach((m) => {
          if (!delMemberSet.has(String(m.id)) && !isOldTestRecord(m)) {
            const inSheet = sheetMemMap.has(String(m.id).toLowerCase()) ||
              mergedMembers.some((sm) => sm.name === m.name);
            if (!inSheet) {
              mergedMembers.push(m);
            }
          }
        });

        const mergedCols = [...(parsed.collections || [])];
        const parsedColKeys = new Set(mergedCols.map((c) => String(c.receiptNo || c.id)));
        (current.collections || []).forEach((c) => {
          if (!delColSet.has(String(c.id)) && !delMemberSet.has(String(c.memberId)) && !isOldTestCollectionRecord(c) && !parsedColKeys.has(String(c.receiptNo || c.id))) {
            mergedCols.push(c);
          }
        });

        const updated = writeStore({
          members: mergedMembers,
          collections: mergedCols
        });
        return updated;
      }
    }
  } catch (err) {
    console.warn('[Server] Sync Google Sheet warning:', err);
  }
  return readStore();
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '15mb' }));

  // 1. Health check - responds immediately for Cloud Run container healthchecks
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', serverTime: Date.now() });
  });

  // 2. Get Somiti Data (used by all clients)
  app.get('/api/somiti', (_req, res) => {
    const data = readStore();
    res.json(data);
  });

  // 3. Version / Timestamp check for fast polling across clients
  app.get('/api/somiti/version', (_req, res) => {
    const data = readStore();
    res.json({ updatedAt: data.updatedAt });
  });

  // 4. Save Somiti Data (instant update across all clients)
  app.post('/api/somiti', (req, res) => {
    const { members, collections, settings, users, deletedMemberIds, deletedCollectionIds } = req.body;
    if (!members && !collections && !settings && !users && !deletedMemberIds && !deletedCollectionIds) {
      res.status(400).json({ error: 'No data provided' });
      return;
    }
    const updated = writeStore({ members, collections, settings, users, deletedMemberIds, deletedCollectionIds });
    res.json({ success: true, updatedAt: updated.updatedAt });
  });

  // 5. Atomic Delete Member Endpoint
  app.delete('/api/somiti/members/:id', (req, res) => {
    const memberId = String(req.params.id);
    const current = readStore();
    const updated = writeStore({
      members: current.members.filter((m: any) => String(m.id) !== memberId),
      collections: current.collections.filter((c: any) => String(c.memberId) !== memberId),
      deletedMemberIds: [...(current.deletedMemberIds || []), memberId]
    });
    res.json({ success: true, updatedAt: updated.updatedAt, data: updated });
  });

  // 6. Atomic Delete Collection Endpoint
  app.delete('/api/somiti/collections/:id', (req, res) => {
    const collectionId = String(req.params.id);
    const { updatedMembers } = req.body || {};
    const current = readStore();
    const updated = writeStore({
      members: Array.isArray(updatedMembers) ? updatedMembers : current.members,
      collections: current.collections.filter((c: any) => String(c.id) !== collectionId),
      deletedCollectionIds: [...(current.deletedCollectionIds || []), collectionId]
    });
    res.json({ success: true, updatedAt: updated.updatedAt, data: updated });
  });

  // 7. Atomic Delete User Endpoint
  app.delete('/api/somiti/users/:id', (req, res) => {
    const userId = String(req.params.id);
    const current = readStore();
    const updated = writeStore({
      users: current.users.filter((u: any) => String(u.id) !== userId)
    });
    res.json({ success: true, updatedAt: updated.updatedAt, data: updated });
  });

  // 8. Reset Somiti Data
  app.post('/api/somiti/reset', (_req, res) => {
    const resetData = { ...DEFAULT_STORE, updatedAt: Date.now() };
    fs.writeFileSync(STORE_FILE, JSON.stringify(resetData, null, 2), 'utf8');
    res.json({ success: true, updatedAt: resetData.updatedAt });
  });

  // 9. Google Sheet CSV Proxy - solves client-side browser CORS completely
  app.get('/api/google-sheet/csv', async (req, res) => {
    try {
      const rawUrl = (req.query.url as string) || DEFAULT_STORE.settings.googleSheetUrl;
      const csvUrl = normalizeGoogleSheetCsvUrl(rawUrl);
      const response = await fetch(csvUrl, {
        headers: {
          'Accept': 'text/csv, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        redirect: 'follow'
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Google Sheets responded with ${response.statusText}` });
      }

      const csvText = await response.text();
      if (!isValidGoogleSheetCsv(csvText)) {
        return res.status(422).json({ error: 'Received invalid Google Sheet CSV format or HTML page' });
      }
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(csvText);
    } catch (err: any) {
      console.warn('[Server] Google Sheet CSV proxy error:', err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // 10. Direct Sync with Google Sheet CSV
  app.all('/api/google-sheet/sync', async (req, res) => {
    try {
      const targetUrl = (req.query.url as string) || (req.body && req.body.url) || DEFAULT_STORE.settings.googleSheetUrl;
      const synced = await syncGoogleSheetOnServer(targetUrl);
      res.json({
        success: true,
        memberCount: synced.members.length,
        collectionCount: synced.collections.length,
        data: synced
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // Vite middleware in dev, static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Somiti Management Server running on port ${PORT}`);
    // Non-blocking bootstrap of store in background, then sync from Google Sheet
    bootstrapStore().then(() => {
      return syncGoogleSheetOnServer();
    }).catch((err) => {
      console.warn('[Server] Initial bootstrap warning:', err);
    });
  });
}

startServer();
