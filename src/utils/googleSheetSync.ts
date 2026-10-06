import { Member, CollectionRecord } from '../types';
import { MONTH_NAMES_EN, normalizeMonthKey } from './calculations';

export const DEFAULT_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/13-pQ1jv8DACdfRLnfOVrBAkCCNV3Bz5L5OllWMad2s4/export?format=csv';

export const DEFAULT_DEPLOYMENT_ID =
  'AKfycbwqFbxPKdgtMvj4UvHhb8LV-74LMqOl-fpFt07i4o1J7n_Ey-qCByBJvErhaS6SJrHq';

export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwqFbxPKdgtMvj4UvHhb8LV-74LMqOl-fpFt07i4o1J7n_Ey-qCByBJvErhaS6SJrHq/exec';

/**
 * Normalizes user-provided Google Sheet publish or sharing URL.
 * Automatically handles standard edit/sharing links as well as published CSV links.
 */
export function normalizeGoogleSheetCsvUrl(rawUrl: string): string {
  let url = (rawUrl || '').trim();
  if (!url) return DEFAULT_SHEET_CSV_URL;

  // Handle standard Google Sheets links: https://docs.google.com/spreadsheets/d/{ID}/edit... -> /export?format=csv
  const standardMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (standardMatch && !url.includes('/spreadsheets/d/e/')) {
    const sheetId = standardMatch[1];
    if (!sheetId.startsWith('2PACX-')) {
      return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    }
  }

  // Fix common mistake: missing "/e/" in published URL (/spreadsheets/d/2PACX-... -> /spreadsheets/d/e/2PACX-...)
  if (url.includes('/spreadsheets/d/2PACX-') && !url.includes('/spreadsheets/d/e/2PACX-')) {
    url = url.replace('/spreadsheets/d/2PACX-', '/spreadsheets/d/e/2PACX-');
  }

  // Ensure output=csv parameter for published URLs
  if (url.includes('/pub') && !url.includes('output=csv')) {
    url += (url.includes('?') ? '&' : '?') + 'output=csv';
  }

  return url;
}

export function parseCSV(text: string): string[][] {
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

export function isCorruptedOrCssRow(id: string, name: string): boolean {
  const idStr = String(id || '').trim();
  const nameStr = String(name || '').trim();
  if (!idStr && !nameStr) return true;
  if (idStr.toLowerCase() === 'sel0007' || nameStr.includes('া্বাব')) return true;
  if (/^sel\d+/i.test(idStr)) return false;
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
  return false;
}

export function isValidGoogleSheetCsv(text: string): boolean {
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

export function parseJoinDate(rawDate: string): { joinMonth: number; joinYear: number } {
  let joinMonth = 4; // May default
  let joinYear = 2026;

  if (!rawDate) return { joinMonth, joinYear };

  // Convert Bengali numerals to English
  const normalized = rawDate.replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString()).trim();
  const lower = normalized.toLowerCase();

  // 1. Try ISO date matching: YYYY-MM-DD or YYYY-MM
  const isoMatch = normalized.match(/^(\d{4})-(\d{1,2})/);
  if (isoMatch) {
    const yr = parseInt(isoMatch[1], 10);
    const mo = parseInt(isoMatch[2], 10) - 1; // 0-based
    if (!isNaN(yr) && yr >= 2020) joinYear = yr;
    if (!isNaN(mo) && mo >= 0 && mo <= 11) joinMonth = mo;
    return { joinMonth, joinYear };
  }

  // 2. Match month names in English & Bengali
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

  // 3. Match 4-digit year (2020 to 2049)
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

export function parseGoogleSheetCsv(csvText: string): {
  members: Member[];
  collections: CollectionRecord[];
} {
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
  let lastSeenYear = 2026;
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].trim();
    if (/\b20[2-4][0-9]\b/.test(h) || /january|february|march|april|may|june|july|august|september|october|november|december|জানুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর/i.test(h)) {
      let cleanName = normalizeMonthKey(h);
      const yrMatch = h.match(/\b(20[2-4][0-9])\b/);
      if (yrMatch) {
        lastSeenYear = parseInt(yrMatch[1], 10);
      }
      monthCols.push({ index: i, headerName: cleanName });
    }
  }

  const members: Member[] = [];
  const collections: CollectionRecord[] = [];

  for (let r = startRow; r < parsed.length; r++) {
    const row = parsed[r];
    if (!row || row.length === 0) continue;

    const rawId = (idIdx !== -1 && row[idIdx]) ? row[idIdx].trim() : (row[0] || `Sel${String(r).padStart(4, '0')}`);
    let name = (nameIdx !== -1 && row[nameIdx]) ? row[nameIdx].trim() : '';
    if (!name && row.length > 1) {
      name = row[1] || row[0] || '';
    }
    if (!name || name.includes('া্বাব') || rawId.toLowerCase() === 'sel0007' || isCorruptedOrCssRow(rawId, name)) continue;

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
        } else if (months[headerName] === undefined) {
          months[headerName] = null;
        }
      } else if (months[headerName] === undefined) {
        months[headerName] = null;
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
      photo: photo.trim() || undefined,
      months,
      notes: 'গুগল স্প্রেডশিট সদস্য'
    });
  }

  return { members, collections };
}

export async function fetchFromGoogleSheet(
  url = DEFAULT_SHEET_CSV_URL,
  appsScriptUrl?: string
): Promise<{
  members: Member[];
  collections: CollectionRecord[];
}> {
  // ১. সর্বপ্রথম ব্যবহারকারীর মূল গুগল স্প্রেডশিটের লাইভ CSV থেকে ডাটা লোড করা
  // এর মাধ্যমে শীটের সকল সদস্য (Sel001, Sel0003, Sel0004, Sel0005, Sel0006, Sel0007...) ও তাদের ঋণের তথ্য সরাসরি আসে
  try {
    const targetCsvUrl = normalizeGoogleSheetCsvUrl(url || DEFAULT_SHEET_CSV_URL);
    let csvText = '';

    // ১.১ সর্বপ্রথম ব্যাকএন্ড প্রক্সি (/api/google-sheet/csv) দিয়ে চেষ্টা করা (ব্রাউজারের CORS এরর এড়িয়ে সম্পূর্ণ সুরক্ষিত লোডিং)
    try {
      const proxyUrl = `/api/google-sheet/csv?url=${encodeURIComponent(targetCsvUrl)}&t=${Date.now()}`;
      const proxyRes = await fetch(proxyUrl, {
        cache: 'no-store',
        headers: { 'Accept': 'text/csv, text/plain, */*' }
      });
      if (proxyRes.ok) {
        const text = await proxyRes.text();
        if (isValidGoogleSheetCsv(text)) {
          csvText = text;
        }
      }
    } catch (proxyErr) {
      console.warn('Proxy CSV fetch error, trying direct fetch:', proxyErr);
    }

    // ১.২ যদি প্রক্সি না পাওয়া যায় বা ব্যর্থ হয়, তবে সরাসরি গুগল শিট লিঙ্ক থেকে লোড করার চেষ্টা করা
    if (!csvText) {
      const cacheBustUrl = targetCsvUrl + (targetCsvUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
      const response = await fetch(cacheBustUrl, {
        cache: 'no-store',
        headers: { 'Accept': 'text/csv, text/plain, */*' }
      });
      if (response.ok) {
        const directText = await response.text();
        if (isValidGoogleSheetCsv(directText)) {
          csvText = directText;
        }
      }
    }

    if (csvText) {
      const sheetData = parseGoogleSheetCsv(csvText);

      if (sheetData.members.length > 0) {
        // যদি কাস্টম Apps Script ওয়েব অ্যাপ সেট করা থাকে, তবে সেখান থেকে 'আদায়_লগ' শিটের রসিদ তথ্য মিলিয়ে সমৃদ্ধ করা
        if (appsScriptUrl && appsScriptUrl.startsWith('http') && appsScriptUrl !== DEFAULT_APPS_SCRIPT_URL) {
          try {
            const apiUrl = appsScriptUrl + (appsScriptUrl.includes('?') ? '&' : '?') + 'action=get_data&t=' + Date.now();
            const res = await fetch(apiUrl, { cache: 'no-store' });
            if (res.ok) {
              const json = await res.json();
              if (json && json.status === 'success' && Array.isArray(json.collections) && json.collections.length > 0) {
                return {
                  members: sheetData.members,
                  collections: json.collections.map((c: any, idx: number) => ({
                    id: c.id || `col-${c.memberId}-${idx}`,
                    receiptNo: c.receiptNo || `REC-${idx + 1}`,
                    memberId: String(c.memberId),
                    memberName: String(c.memberName || ''),
                    amount: Number(c.amount) || 0,
                    monthKey: String(c.monthKey || ''),
                    date: String(c.date || '২০২৬'),
                    paymentMethod: (c.paymentMethod || 'Cash') as any,
                    collectorName: String(c.collectorName || 'মোঃ শিপন'),
                    notes: String(c.notes || '')
                  }))
                };
              }
            }
          } catch (scriptErr) {
            console.warn('Apps Script collections enrichment warning:', scriptErr);
          }
        }

        return sheetData;
      }
    }
  } catch (csvErr) {
    console.warn('Google Sheet CSV load error, trying Apps Script fallback:', csvErr);
  }

  // ২. ফলব্যাক: Google Apps Script Web App থেকে পড়ার চেষ্টা
  const targetScript = appsScriptUrl || DEFAULT_APPS_SCRIPT_URL;
  if (targetScript && targetScript.startsWith('http')) {
    try {
      const apiUrl = targetScript + (targetScript.includes('?') ? '&' : '?') + 'action=get_data&t=' + Date.now();
      const res = await fetch(apiUrl, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.status === 'success' && Array.isArray(json.members) && json.members.length > 0) {
          const members: Member[] = json.members.map((m: any) => {
            const rawJoin = m.joinDate || 'May 2026';
            const { joinMonth, joinYear } = parseJoinDate(rawJoin);
            return {
              id: String(m.id),
              name: String(m.name || ''),
              phone: String(m.phone || ''),
              address: String(m.address || ''),
              joinMonth: m.joinMonth !== undefined ? m.joinMonth : joinMonth,
              joinYear: m.joinYear !== undefined ? m.joinYear : joinYear,
              joinDate: rawJoin,
              taka: Number(m.taka) || 0,
              profitRate: 0.20,
              tenureMonths: 10,
              photo: m.photo || undefined,
              months: m.months || {},
              notes: m.notes || 'গুগল স্প্রেডশিট সদস্য'
            };
          });

          const collections: CollectionRecord[] = Array.isArray(json.collections) ? json.collections.map((c: any, idx: number) => ({
            id: c.id || `col-${c.memberId}-${idx}`,
            receiptNo: c.receiptNo || `REC-${idx + 1}`,
            memberId: String(c.memberId),
            memberName: String(c.memberName || ''),
            amount: Number(c.amount) || 0,
            monthKey: String(c.monthKey || ''),
            date: String(c.date || '২০২৬'),
            paymentMethod: (c.paymentMethod || 'Cash') as any,
            collectorName: String(c.collectorName || 'মোঃ শিপন'),
            notes: String(c.notes || '')
          })) : [];

          return { members, collections };
        }
      }
    } catch (scriptErr) {
      console.warn('Apps Script direct get_data error:', scriptErr);
    }
  }

  return { members: [], collections: [] };
}

/**
 * Sends newly collected installment to user's Google Apps Script Webhook
 * Sends via POST (no-cors) with fallback parameters to ensure delivery
 */
export async function postCollectionToGoogleSheet(
  arg1: string | CollectionRecord,
  arg2?: string | CollectionRecord
): Promise<boolean> {
  let webhookUrl = DEFAULT_APPS_SCRIPT_URL;
  let record: CollectionRecord | null = null;

  if (typeof arg1 === 'string') {
    webhookUrl = arg1 || DEFAULT_APPS_SCRIPT_URL;
    record = (arg2 as CollectionRecord) || null;
  } else if (typeof arg1 === 'object' && arg1 !== null) {
    record = arg1 as CollectionRecord;
    if (typeof arg2 === 'string') {
      webhookUrl = arg2 || DEFAULT_APPS_SCRIPT_URL;
    }
  }

  if (!record) return false;
  const targetUrl = webhookUrl || DEFAULT_APPS_SCRIPT_URL;
  if (!targetUrl || !targetUrl.startsWith('http')) return false;

  const payload = {
    action: 'collect',
    deploymentId: DEFAULT_DEPLOYMENT_ID,
    memberId: record.memberId,
    memberName: record.memberName,
    amount: record.amount,
    monthKey: record.monthKey,
    date: record.date,
    paymentMethod: record.paymentMethod,
    collectorName: record.collectorName,
    receiptNo: record.receiptNo,
    notes: record.notes || '',
    timestamp: new Date().toISOString()
  };

  try {
    // 1. Try POST (text/plain)
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    // 2. Fallback to GET if POST throws
    try {
      const params = new URLSearchParams({
        action: 'collect',
        memberId: String(record.memberId),
        memberName: String(record.memberName),
        amount: String(record.amount),
        monthKey: String(record.monthKey),
        date: String(record.date),
        paymentMethod: String(record.paymentMethod),
        collectorName: String(record.collectorName),
        receiptNo: String(record.receiptNo),
        notes: String(record.notes || ''),
        t: String(Date.now())
      });
      const getUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + params.toString();
      await fetch(getUrl, { mode: 'no-cors', cache: 'no-store' });
      return true;
    } catch {
      return false;
    }
  }
}

export interface UpdateCollectionPayload {
  updatedRecord: CollectionRecord;
  oldRecord: CollectionRecord;
  newTotalForNewMonth: number;
  newTotalForOldMonth: number;
}

/**
 * এডমিন কর্তৃক কিস্তি সংশোধন: গুগল স্প্রেডশিটে পূর্বের টাকার সাথে যোগ না করে
 * সরাসরি নতুন পরিমাণ টাকা বা নতুন ব্যালেন্স প্রতিস্থাপন (Update) করা
 */
export async function postUpdateCollectionToGoogleSheet(
  data: UpdateCollectionPayload,
  webhookUrl?: string
): Promise<boolean> {
  const targetUrl = webhookUrl || DEFAULT_APPS_SCRIPT_URL;
  if (!targetUrl || !targetUrl.startsWith('http')) return false;

  const { updatedRecord, oldRecord, newTotalForNewMonth, newTotalForOldMonth } = data;

  const payload = {
    action: 'update_collection',
    deploymentId: DEFAULT_DEPLOYMENT_ID,
    receiptNo: updatedRecord.receiptNo,
    memberId: updatedRecord.memberId,
    memberName: updatedRecord.memberName,
    amount: updatedRecord.amount,
    monthKey: updatedRecord.monthKey,
    date: updatedRecord.date,
    paymentMethod: updatedRecord.paymentMethod,
    collectorName: updatedRecord.collectorName,
    notes: updatedRecord.notes || '',
    isEdit: true,
    overwrite: true,
    oldMemberId: oldRecord.memberId,
    oldMonthKey: oldRecord.monthKey,
    oldAmount: oldRecord.amount,
    newTotalForNewMonth,
    newTotalForOldMonth,
    timestamp: new Date().toISOString()
  };

  try {
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    console.warn('Google Sheet collection update POST failed, trying GET fallback:', err);
    try {
      const params = new URLSearchParams({
        action: 'update_collection',
        receiptNo: String(updatedRecord.receiptNo),
        memberId: String(updatedRecord.memberId),
        memberName: String(updatedRecord.memberName),
        amount: String(updatedRecord.amount),
        monthKey: String(updatedRecord.monthKey),
        date: String(updatedRecord.date),
        paymentMethod: String(updatedRecord.paymentMethod),
        collectorName: String(updatedRecord.collectorName),
        isEdit: 'true',
        overwrite: 'true',
        oldMemberId: String(oldRecord.memberId),
        oldMonthKey: String(oldRecord.monthKey),
        oldAmount: String(oldRecord.amount),
        newTotalForNewMonth: String(newTotalForNewMonth),
        newTotalForOldMonth: String(newTotalForOldMonth)
      });
      const getUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + params.toString();
      await fetch(getUrl, { mode: 'no-cors' });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * কিস্তি রসিদ গুগল শিট থেকে মুছে ফেলা
 */
export async function postDeleteCollectionToGoogleSheet(
  record: CollectionRecord,
  newTotalForMonth: number,
  webhookUrl?: string
): Promise<boolean> {
  const targetUrl = webhookUrl || DEFAULT_APPS_SCRIPT_URL;
  if (!targetUrl || !targetUrl.startsWith('http')) return false;

  const payload = {
    action: 'delete_collection',
    deploymentId: DEFAULT_DEPLOYMENT_ID,
    receiptNo: record.receiptNo,
    memberId: record.memberId,
    monthKey: record.monthKey,
    amount: record.amount,
    newTotalForMonth,
    timestamp: new Date().toISOString()
  };

  try {
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    try {
      const params = new URLSearchParams({
        action: 'delete_collection',
        receiptNo: String(record.receiptNo),
        memberId: String(record.memberId),
        monthKey: String(record.monthKey),
        amount: String(record.amount),
        newTotalForMonth: String(newTotalForMonth)
      });
      const getUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + params.toString();
      await fetch(getUrl, { mode: 'no-cors' });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Tests Google Apps Script webhook connection and checks for Google Login redirect issues
 */
export async function testGoogleSheetWebhookConnection(webhookUrl: string): Promise<{ success: boolean; message: string }> {
  try {
    const targetUrl = webhookUrl || DEFAULT_APPS_SCRIPT_URL;
    const testUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=test&t=' + Date.now();
    const res = await fetch(testUrl, { redirect: 'follow' });
    const text = await res.text();
    if (
      text.includes('accounts.google.com') ||
      text.includes('signin') ||
      text.includes('g-recaptcha') ||
      text.includes('You need access') ||
      text.includes('request-access-icon')
    ) {
      return {
        success: false,
        message: 'সতর্কতা: আপনার Apps Script লিংকটি পারমিশন ("You need access") বা গুগল লগইন চাচ্ছে। সমাধান: Apps Script এ Deploy > Manage deployments > Edit এ গিয়ে "Who has access" অপশনে অবশ্যই "Anyone" (যেকোনো ব্যক্তি) নির্বাচন করে সেভ বা নতুন ডিপ্লয়মেন্ট করুন।'
      };
    }
    return {
      success: true,
      message: 'অভিনন্দন! গুগল শিট ওয়েব হুক সঠিকভাবে সংযুক্ত ও সক্রিয় আছে।'
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'কানেকশন টেস্ট ব্যর্থ হয়েছে: ' + (err.message || String(err))
    };
  }
}

/**
 * Sends newly added member to Google Apps Script Webhook
 */
export async function postMemberToGoogleSheet(
  member: Member,
  webhookUrl?: string
): Promise<boolean> {
  const targetUrl = webhookUrl || DEFAULT_APPS_SCRIPT_URL;
  if (!targetUrl || !targetUrl.startsWith('http')) return false;

  // 1. Primary: Direct GET via URLSearchParams (proven reliable on Google Apps Script)
  const params = new URLSearchParams({
    action: 'add_member',
    memberId: String(member.id),
    name: String(member.name || ''),
    phone: String(member.phone || ''),
    address: String(member.address || ''),
    joinDate: String(member.joinDate || 'May 2026'),
    taka: String(member.taka || 30000),
    t: String(Date.now())
  });

  const getUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + params.toString();

  try {
    await fetch(getUrl, { mode: 'no-cors', cache: 'no-store' });
  } catch (err) {
    console.warn('Google Sheet GET add_member ping failed:', err);
  }

  // 2. Secondary: POST text/plain
  try {
    const payload = {
      action: 'add_member',
      deploymentId: DEFAULT_DEPLOYMENT_ID,
      memberId: member.id,
      name: member.name,
      phone: member.phone || '',
      address: member.address || '',
      joinDate: member.joinDate || 'May 2026',
      taka: member.taka || 30000,
      photo: member.photo || '',
      timestamp: new Date().toISOString()
    };
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
    return true;
  } catch {
    return true;
  }
}

/**
 * সদস্যের সংশোধিত তথ্য গুগল স্প্রেডশিটে পাঠানো
 */
export async function postUpdateMemberToGoogleSheet(
  member: Member,
  webhookUrl?: string
): Promise<boolean> {
  const targetUrl = webhookUrl || DEFAULT_APPS_SCRIPT_URL;
  if (!targetUrl || !targetUrl.startsWith('http')) return false;

  const payload = {
    action: 'update_member',
    deploymentId: DEFAULT_DEPLOYMENT_ID,
    memberId: member.id,
    name: member.name,
    phone: member.phone || '',
    address: member.address || '',
    taka: member.taka || 30000,
    timestamp: new Date().toISOString()
  };

  try {
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    console.warn('Google Sheet member update failed, trying GET fallback:', err);
    try {
      const params = new URLSearchParams({
        action: 'update_member',
        memberId: String(member.id),
        name: String(member.name),
        phone: String(member.phone || ''),
        address: String(member.address || ''),
        taka: String(member.taka || 30000)
      });
      const getUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + params.toString();
      await fetch(getUrl, { mode: 'no-cors' });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * সদস্যকে গুগল স্প্রেডশিট থেকে মুছে ফেলার রিকোয়েস্ট পাঠানো
 */
export async function postDeleteMemberToGoogleSheet(
  memberId: string | number,
  webhookUrl?: string
): Promise<boolean> {
  const targetUrl = webhookUrl || DEFAULT_APPS_SCRIPT_URL;
  if (!targetUrl || !targetUrl.startsWith('http')) return false;

  const payload = {
    action: 'delete_member',
    deploymentId: DEFAULT_DEPLOYMENT_ID,
    memberId: String(memberId),
    timestamp: new Date().toISOString()
  };

  try {
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    try {
      const params = new URLSearchParams({
        action: 'delete_member',
        memberId: String(memberId)
      });
      const getUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + params.toString();
      await fetch(getUrl, { mode: 'no-cors' });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * সকল সদস্য ও আদায়ের তথ্য একসাথে গুগল স্প্রেডশিটে ব্যাকআপ বা সিঙ্ক করা
 */
export async function exportAllDataToGoogleSheet(
  members: Member[],
  collections: CollectionRecord[],
  webhookUrl?: string
): Promise<{ success: boolean; message: string }> {
  const targetUrl = webhookUrl || DEFAULT_APPS_SCRIPT_URL;
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return { success: false, message: 'সঠিক Apps Script URL পাওয়া যায়নি।' };
  }

  const payload = {
    action: 'backup_all',
    deploymentId: DEFAULT_DEPLOYMENT_ID,
    members: members.map(m => ({
      id: m.id,
      name: m.name,
      phone: m.phone,
      address: m.address,
      joinDate: m.joinDate,
      taka: m.taka,
      photo: m.photo,
      months: m.months
    })),
    collections: (collections || []).slice(0, 100).map(c => ({
      receiptNo: c.receiptNo,
      memberId: c.memberId,
      memberName: c.memberName,
      amount: c.amount,
      monthKey: c.monthKey,
      date: c.date,
      paymentMethod: c.paymentMethod,
      collectorName: c.collectorName,
      notes: c.notes || ''
    })),
    timestamp: new Date().toISOString()
  };

  try {
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
    return {
      success: true,
      message: 'সকল ডাটা সফলভাবে গুগল স্প্রেডশিট ব্যাকআপে পাঠানো হয়েছে!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'গুগল শিটে ব্যাকআপ পাঠাতে সমস্যা হয়েছে: ' + (err.message || String(err))
    };
  }
}

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * দশ তারা ক্ষুদ্র ব্যবসায়ী সমবায় সমিতি লিঃ - Google Apps Script (Web App)
 * স্প্রেডশিটের সাথে স্বয়ংক্রিয়ভাবে ডাটা সেভ, কিস্তি আপডেট ও লগ রাখার পূর্ণাঙ্গ স্ক্রিপ্ট
 * =========================================================================
 */

// ১. GET রিকোয়েস্ট হ্যান্ডলার (ব্রাউজার চেক ও ব্যাকআপ সিঙ্ক)
function doGet(e) {
  var data = (e && e.parameter) ? e.parameter : {};
  return handleRequest(data);
}

// ২. POST রিকোয়েস্ট হ্যান্ডলার (অ্যাপ থেকে ডাটা রিসিভ)
function doPost(e) {
  var data = {};
  if (e && e.postData && e.postData.contents) {
    try {
      data = JSON.parse(e.postData.contents);
    } catch(err) {
      data = (e && e.parameter) ? e.parameter : {};
    }
  } else if (e && e.parameter) {
    data = e.parameter;
  }
  return handleRequest(data);
}

// ৩. মূল রাউটার ফাংশন
function handleRequest(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      try {
        ss = SpreadsheetApp.openById("13-pQ1jv8DACdfRLnfOVrBAkCCNV3Bz5L5OllWMad2s4");
      } catch(e) {}
    }
    if (!ss) {
      return respondJSON({ status: "error", message: "কোনো অ্যাক্টিভ গুগল স্প্রেডশিট পাওয়া যায়নি।" });
    }

    var action = (data.action || '').toString().toLowerCase().trim();

    // কানেকশন টেস্ট
    if (action === 'test') {
      return respondJSON({ 
        status: "success", 
        message: "অভিনন্দন! আপনার গুগল শিট Apps Script ওয়েব অ্যাপ সফলভাবে কাজ করছে।",
        sheetName: ss.getName(),
        timestamp: new Date().toISOString()
      });
    }

    // নতুন সদস্য যোগ করা
    if (action === 'add_member') {
      return handleAddMember(ss, data);
    }

    // সদস্য আপডেট করা
    if (action === 'update_member') {
      return handleUpdateMember(ss, data);
    }

    // সব ডাটা একসাথে স্প্রেডশিটে ব্যাকআপ বা সিঙ্ক করা
    if (action === 'backup_all' || action === 'sync_all') {
      return handleBackupAll(ss, data);
    }

    // ডাটাবেজ থেকে সমস্ত তথ্য (সদস্য ও কিস্তির হিসাব) পড়া এবং অ্যাপে পাঠানো
    if (action === 'get_data' || action === 'read' || action === 'fetch' || action === 'load') {
      return handleGetData(ss);
    }

    // সদস্য শিট থেকে মুছে ফেলা
    if (action === 'delete_member') {
      return handleDeleteMember(ss, data);
    }

    // কিস্তি আদায় সংশোধন / এডিট (আগের টাকার সাথে যোগ না করে সরাসরি নতুন পরিমাণ বসানো)
    if (action === 'update_collection' || action === 'edit_collection' || data.isEdit === true || data.isEdit === 'true') {
      return handleUpdateCollection(ss, data);
    }

    // কিস্তি ডিলিট করা
    if (action === 'delete_collection') {
      return handleDeleteCollection(ss, data);
    }

    // কিস্তি আদায় / আপডেট (ডিফল্ট অ্যাকশন যদি memberId এবং amount থাকে)
    if (action === 'collect' || data.memberId || data.amount) {
      return handleCollect(ss, data);
    }

    // কোনো অ্যাকশন না থাকলে স্ট্যাটাস রিটার্ন
    return respondJSON({
      status: "ready",
      message: "দশ তারা সমবায় সমিতি Apps Script সার্ভার প্রস্তুত আছে।",
      spreadsheet: ss.getName()
    });

  } catch(err) {
    return respondJSON({ status: "error", message: err.toString() });
  }
}

/**
 * কিস্তি সেভ করা এবং মূল শিটের সেলে টাকা বসানো + লগ শিটে রেকর্ড রাখা
 */
function handleCollect(ss, data) {
  var memberId = (data.memberId || data.id || '').toString().trim();
  var memberName = (data.memberName || data.name || '').toString().trim();
  var amount = Number(data.amount) || 0;
  var monthKey = (data.monthKey || data.month || '').toString().trim();

  if (!memberId || amount <= 0) {
    return respondJSON({ status: "ignored", message: "সদস্য আইডি অথবা টাকার পরিমাণ পাওয়া যায়নি।" });
  }

  // ১. সব শিটে সদস্যকে খুঁজে বের করার চেষ্টা
  var targetInfo = findMemberAcrossAllSheets(ss, memberId, memberName);
  var sheet = targetInfo ? targetInfo.sheet : findMainSheet(ss);
  if (!sheet) {
    sheet = ss.getSheets()[0];
  }

  var values = targetInfo ? targetInfo.values : sheet.getDataRange().getValues();
  if (values.length < 1 || (values.length === 1 && values[0].length <= 1)) {
    var defaultHeaders = ["MemberID", "Name", "Phone", "Address", "JoinMonth / ঋন গ্রহনের মাস", "ঋনের পরিমাণ", "Photo", "January 2026", "February 2026", "March 2026", "April 2026", "May 2026", "June 2026", "July 2026", "August 2026", "September 2026", "October 2026", "November 2026", "December 2026"];
    sheet.clear();
    sheet.appendRow(defaultHeaders);
    values = sheet.getDataRange().getValues();
  }

  var headers = values[0] || [];

  // ১. সদস্য আইডি কলাম শনাক্ত করা
  var idColIdx = 0;
  for (var c = 0; c < headers.length; c++) {
    var h = headers[c].toString().toLowerCase().replace(/\\s+/g, '');
    if (h.includes('memberid') || h.includes('আইডি')) {
      idColIdx = c;
      break;
    }
  }

  // ২. নির্দিষ্ট মাসের কলাম শনাক্ত করা (যেমন: September 2026)
  var monthColIdx = -1;
  var cleanTargetMonth = monthKey.toLowerCase().replace(/\\s+/g, '');

  for (var c = 0; c < headers.length; c++) {
    var headerText = headers[c].toString().toLowerCase().replace(/\\s+/g, '');
    if (headerText === cleanTargetMonth || headerText.includes(cleanTargetMonth) || cleanTargetMonth.includes(headerText)) {
      monthColIdx = c;
      break;
    }
  }

  if (monthColIdx === -1 && monthKey) {
    var parts = monthKey.split(' ');
    if (parts.length > 0) {
      var mName = parts[0].substring(0, 3).toLowerCase();
      for (var c = 0; c < headers.length; c++) {
        var hText = headers[c].toString().toLowerCase();
        if (hText.includes(mName)) {
          monthColIdx = c;
          break;
        }
      }
    }
  }

  // যদি মাসের কলাম শিটে না থাকে, তবে নতুন কলাম যোগ করা
  if (monthColIdx === -1 && monthKey) {
    monthColIdx = headers.length;
    sheet.getRange(1, monthColIdx + 1).setValue(monthKey);
    headers.push(monthKey);
  }

  // ৩. সদস্যের রো (Row) শনাক্ত করা
  var memberRowIdx = targetInfo ? targetInfo.rowIdx : -1;
  var cleanTargetId = memberId.toLowerCase();

  if (memberRowIdx === -1) {
    for (var r = 1; r < values.length; r++) {
      var rowId = (values[r][idColIdx] || '').toString().trim().toLowerCase();
      var rowName = (values[r][1] || '').toString().trim();

      if (rowId === cleanTargetId || (memberName && rowName === memberName)) {
        memberRowIdx = r + 1; // Sheets rows are 1-based
        break;
      }
    }
  }

  // সদস্য খুঁজে না পাওয়া গেলে স্বয়ংক্রিয়ভাবে নতুন রো যোগ করা
  if (memberRowIdx === -1) {
    var newRow = new Array(headers.length).fill('');
    newRow[0] = memberId;
    newRow[1] = memberName;
    sheet.appendRow(newRow);
    memberRowIdx = sheet.getLastRow();
  }

  // ৪. মূল শিটের নির্দিষ্ট সেলে টাকা বসানো
  var cell = sheet.getRange(memberRowIdx, monthColIdx + 1);
  var prevVal = Number(cell.getValue()) || 0;
  var finalVal = amount;

  if (data.isEdit || data.overwrite || data.action === 'update_collection') {
    // এডিট হলে সরাসরি নতুন পরিমাণ অথবা মোট ব্যালেন্স বসবে, আগের টাকার সাথে যোগ হবে না
    finalVal = (data.newTotalForNewMonth !== undefined) ? Number(data.newTotalForNewMonth) : amount;
  } else {
    // নতুন আদায়ের ক্ষেত্রে পূর্বের আংশিক টাকা থাকলে তার সাথে যোগ হতে পারে
    finalVal = (prevVal > 0) ? (prevVal + amount) : amount;
  }

  if (finalVal <= 0) {
    cell.setValue('');
    cell.setBackground("#ffffff");
  } else {
    cell.setValue(finalVal);
    cell.setBackground("#d9ead3"); // হালকা সবুজ হাইলাইট
  }

  // ৫. আদায় লগ শিটে এন্ট্রি যুক্ত করা
  logCollectionRecord(ss, {
    receiptNo: data.receiptNo || ('REC-' + Date.now()),
    memberId: memberId,
    memberName: memberName || (values[memberRowIdx - 1][1] || ''),
    amount: amount,
    monthKey: monthKey,
    date: data.date || getTodayBanglaDate(),
    paymentMethod: data.paymentMethod || 'Cash',
    collectorName: data.collectorName || 'মোঃ শিপন',
    notes: data.notes || ''
  });

  SpreadsheetApp.flush(); // তাত্ক্ষণিকভাবে গুগল ক্লাউডে সেভ

  return respondJSON({
    status: "success",
    message: "কিস্তি মূল শিটে সফলভাবে সেভ হয়েছে!",
    sheetName: sheet.getName(),
    cell: cell.getA1Notation(),
    memberId: memberId,
    memberName: memberName,
    month: monthKey,
    amount: finalVal
  });
}

/**
 * কিস্তি আদায় সংশোধন (এডমিন):
 * মূল শিটের নির্দিষ্ট সেলে আগের টাকার সাথে নতুন টাকা যোগ না করে 
 * সরাসরি সংশোধিত টাকা প্রতিস্থাপন করা এবং আদায় লগ শিটে রসিদ আপডেট করা
 */
function handleUpdateCollection(ss, data) {
  var receiptNo = (data.receiptNo || '').toString().trim();
  var memberId = (data.memberId || data.id || '').toString().trim();
  var memberName = (data.memberName || data.name || '').toString().trim();
  var amount = Number(data.amount);
  if (isNaN(amount)) amount = 0;
  var monthKey = (data.monthKey || data.month || '').toString().trim();

  var oldMemberId = (data.oldMemberId || memberId).toString().trim();
  var oldMonthKey = (data.oldMonthKey || monthKey).toString().trim();
  var oldAmount = Number(data.oldAmount) || 0;

  var newTotalForNewMonth = (data.newTotalForNewMonth !== undefined) ? Number(data.newTotalForNewMonth) : amount;
  var newTotalForOldMonth = (data.newTotalForOldMonth !== undefined) ? Number(data.newTotalForOldMonth) : 0;

  // ১. আদায়_লগ শিটে রসিদ নম্বর অনুযায়ী পূর্বের রো খুঁজে আপডেট করা (ডুপ্লিকেট রো না বাড়িয়ে)
  try {
    var logSheet = ss.getSheetByName("আদায়_লগ");
    if (logSheet) {
      var logValues = logSheet.getDataRange().getValues();
      var foundRow = -1;
      for (var lr = 1; lr < logValues.length; lr++) {
        var recInLog = (logValues[lr][1] || '').toString().trim();
        if (receiptNo && recInLog === receiptNo) {
          foundRow = lr + 1;
          break;
        }
      }

      var nowStr = Utilities.formatDate(new Date(), "Asia/Dhaka", "yyyy-MM-dd HH:mm:ss");
      if (foundRow > 0) {
        logSheet.getRange(foundRow, 1).setValue(nowStr + " (সংশোধিত)");
        logSheet.getRange(foundRow, 3).setValue(memberId);
        logSheet.getRange(foundRow, 4).setValue(memberName);
        logSheet.getRange(foundRow, 5).setValue(amount);
        logSheet.getRange(foundRow, 6).setValue(monthKey);
        if (data.date) logSheet.getRange(foundRow, 7).setValue(data.date);
        if (data.paymentMethod) logSheet.getRange(foundRow, 8).setValue(data.paymentMethod);
        if (data.collectorName) logSheet.getRange(foundRow, 9).setValue(data.collectorName);
        if (data.notes !== undefined) logSheet.getRange(foundRow, 10).setValue(data.notes);
      } else {
        logCollectionRecord(ss, {
          receiptNo: receiptNo,
          memberId: memberId,
          memberName: memberName,
          amount: amount,
          monthKey: monthKey,
          date: data.date || getTodayBanglaDate(),
          paymentMethod: data.paymentMethod || 'Cash',
          collectorName: data.collectorName || 'মোঃ শিপন',
          notes: (data.notes || '') + ' (সংশোধিত)'
        });
      }
    }
  } catch(logErr) {
    Logger.log("আদায়_লগ আপডেট এরর: " + logErr.toString());
  }

  // ২. মূল শিটের নির্দিষ্ট সেলে সরাসরি টাকা প্রতিস্থাপন (পূর্বের টাকার সাথে যোগ না করে)
  var isSameMemberAndMonth = (memberId.toLowerCase() === oldMemberId.toLowerCase()) && 
    (monthKey.toLowerCase().replace(/\\s+/g, '') === oldMonthKey.toLowerCase().replace(/\\s+/g, ''));

  if (!isSameMemberAndMonth && oldMemberId && oldMonthKey) {
    // পুরাতন সদস্য/মাসের সেল থেকে টাকা কর্তন বা নতুন ব্যালেন্স বসানো
    updateSheetMonthCell(ss, oldMemberId, oldMonthKey, newTotalForOldMonth);
  }

  // নতুন সদস্য/মাসের সেলে সরাসরি সংশোধিত টাকা সেট করা
  updateSheetMonthCell(ss, memberId, monthKey, newTotalForNewMonth);

  SpreadsheetApp.flush();

  return respondJSON({
    status: "success",
    message: "কিস্তি সংশোধন সফল হয়েছে! শিটে পূর্বের টাকার সাথে যোগ না হয়ে সরাসরি নতুন পরিমাণ (" + amount + " টাকা) আপডেট হয়েছে।",
    receiptNo: receiptNo,
    memberId: memberId,
    month: monthKey,
    updatedAmount: amount,
    newTotalInCell: newTotalForNewMonth
  });
}

/**
 * কিস্তি রসিদ মুছে ফেলা
 */
function handleDeleteCollection(ss, data) {
  var receiptNo = (data.receiptNo || '').toString().trim();
  var memberId = (data.memberId || '').toString().trim();
  var monthKey = (data.monthKey || '').toString().trim();
  var newTotalForMonth = (data.newTotalForMonth !== undefined) ? Number(data.newTotalForMonth) : 0;

  try {
    var logSheet = ss.getSheetByName("আদায়_লগ");
    if (logSheet) {
      var logValues = logSheet.getDataRange().getValues();
      for (var lr = 1; lr < logValues.length; lr++) {
        if (receiptNo && (logValues[lr][1] || '').toString().trim() === receiptNo) {
          logSheet.getRange(lr + 1, 1).setValue(Utilities.formatDate(new Date(), "Asia/Dhaka", "yyyy-MM-dd HH:mm:ss") + " (মুছে ফেলা)");
          logSheet.getRange(lr + 1, 5).setValue(0);
          logSheet.getRange(lr + 1, 10).setValue("এডমিন কর্তৃক মুছে ফেলা হয়েছে");
          break;
        }
      }
    }
  } catch(e) {}

  if (memberId && monthKey) {
    updateSheetMonthCell(ss, memberId, monthKey, newTotalForMonth);
  }

  SpreadsheetApp.flush();
  return respondJSON({ status: "success", message: "কিস্তি রসিদ মুছে ফেলা হয়েছে।" });
}

/**
 * সদস্যের নির্দিষ্ট মাসের সেলে সরাসরি মান সেট করার হেল্পার
 */
function updateSheetMonthCell(ss, memberId, monthKey, targetValue) {
  var targetInfo = findMemberAcrossAllSheets(ss, memberId, '');
  var sheet = targetInfo ? targetInfo.sheet : findMainSheet(ss);
  if (!sheet) sheet = ss.getSheets()[0];

  var values = targetInfo ? targetInfo.values : sheet.getDataRange().getValues();
  if (values.length < 2) return null;

  var headers = values[0];
  var idColIdx = 0;
  for (var c = 0; c < headers.length; c++) {
    var h = headers[c].toString().toLowerCase().replace(/\\s+/g, '');
    if (h.includes('memberid') || h.includes('আইডি')) {
      idColIdx = c;
      break;
    }
  }

  var monthColIdx = -1;
  var cleanTargetMonth = monthKey.toLowerCase().replace(/\\s+/g, '');
  for (var c = 0; c < headers.length; c++) {
    var headerText = headers[c].toString().toLowerCase().replace(/\\s+/g, '');
    if (headerText === cleanTargetMonth || headerText.includes(cleanTargetMonth) || cleanTargetMonth.includes(headerText)) {
      monthColIdx = c;
      break;
    }
  }

  if (monthColIdx === -1 && monthKey) {
    var parts = monthKey.split(' ');
    if (parts.length > 0) {
      var mName = parts[0].substring(0, 3).toLowerCase();
      for (var c = 0; c < headers.length; c++) {
        if (headers[c].toString().toLowerCase().includes(mName)) {
          monthColIdx = c;
          break;
        }
      }
    }
  }

  if (monthColIdx === -1) return null;

  var memberRowIdx = targetInfo ? targetInfo.rowIdx : -1;
  if (memberRowIdx === -1) {
    var cleanTargetId = memberId.toLowerCase();
    for (var r = 1; r < values.length; r++) {
      if ((values[r][idColIdx] || '').toString().trim().toLowerCase() === cleanTargetId) {
        memberRowIdx = r + 1;
        break;
      }
    }
  }

  if (memberRowIdx === -1) return null;

  var cell = sheet.getRange(memberRowIdx, monthColIdx + 1);
  if (targetValue <= 0) {
    cell.setValue('');
    cell.setBackground('#ffffff');
  } else {
    cell.setValue(targetValue);
    cell.setBackground('#d9ead3');
  }

  return { row: memberRowIdx, col: monthColIdx + 1, value: targetValue };
}

/**
 * নতুন সদস্য গুগল শিটে যোগ করা
 */
function handleAddMember(ss, data) {
  var sheet = findMainSheet(ss);
  if (!sheet) {
    return respondJSON({ status: "error", message: "মূল সদস্য শিট পাওয়া যায়নি।" });
  }

  var memberId = (data.memberId || data.id || '').toString().trim();
  var name = (data.name || '').toString().trim();
  var phone = (data.phone || '').toString().trim();
  var address = (data.address || '').toString().trim();
  var joinDate = (data.joinDate || 'May 2026').toString().trim();
  var taka = Number(data.taka) || 30000;
  var photo = (data.photo || '').toString().trim();

  if (!memberId || !name) {
    return respondJSON({ status: "error", message: "সদস্য আইডি ও নাম প্রদান করতে হবে।" });
  }

  // চেক করা যে সদস্য আইডি ইতিমধ্যে আছে কি না
  var values = sheet.getDataRange().getValues();
  for (var r = 1; r < values.length; r++) {
    if ((values[r][0] || '').toString().trim().toLowerCase() === memberId.toLowerCase()) {
      return respondJSON({ status: "exists", message: "এই আইডিযুক্ত সদস্য ইতিমধ্যে শিটে রয়েছে।" });
    }
  }

  // কলাম হেডার অনুযায়ী সঠিক ইনডেক্স খুঁজে বের করা
  var headers = values[0] || [];
  var newRow = new Array(headers.length).fill('');
  
  var idIdx = -1, nameIdx = -1, phoneIdx = -1, addressIdx = -1, joinIdx = -1, takaIdx = -1, photoIdx = -1;
  for (var c = 0; c < headers.length; c++) {
    var h = (headers[c] || '').toString().toLowerCase();
    if (h.includes('memberid') || h === 'id' || h.includes('আইডি')) idIdx = c;
    else if (h.includes('name') || h.includes('নাম')) nameIdx = c;
    else if (h.includes('phone') || h.includes('মোবাইল') || h.includes('ফোন')) phoneIdx = c;
    else if (h.includes('address') || h.includes('ঠিকানা')) addressIdx = c;
    else if (h.includes('join') || h.includes('ঋন গ্রহনের মাস') || h.includes('ভর্তি')) joinIdx = c;
    else if (h.includes('ঋনের পরিমাণ') || h.includes('taka') || h.includes('loan') || h.includes('টাকা')) takaIdx = c;
    else if (h.includes('photo') || h.includes('ছবি')) photoIdx = c;
  }
  
  if (idIdx === -1) idIdx = 0;
  if (nameIdx === -1) nameIdx = 1;
  if (phoneIdx === -1 && headers.length > 2) phoneIdx = 2;
  if (addressIdx === -1 && headers.length > 3) addressIdx = 3;
  if (joinIdx === -1 && headers.length > 4) joinIdx = 4;
  if (takaIdx === -1 && headers.length > 5) takaIdx = 5;

  newRow[idIdx] = memberId;
  newRow[nameIdx] = name;
  if (phoneIdx !== -1 && phoneIdx < newRow.length) newRow[phoneIdx] = phone;
  if (addressIdx !== -1 && addressIdx < newRow.length) newRow[addressIdx] = address;
  if (joinIdx !== -1 && joinIdx < newRow.length) newRow[joinIdx] = joinDate;
  if (takaIdx !== -1 && takaIdx < newRow.length) newRow[takaIdx] = taka;
  if (photoIdx !== -1 && photoIdx < newRow.length) newRow[photoIdx] = photo;

  sheet.appendRow(newRow);
  SpreadsheetApp.flush();

  return respondJSON({
    status: "success",
    message: "নতুন সদস্য সফলভাবে শিটে যুক্ত হয়েছে!",
    memberId: memberId,
    name: name
  });
}

/**
 * সদস্যের তথ্য আপডেট করা
 */
function handleUpdateMember(ss, data) {
  var sheet = findMainSheet(ss);
  if (!sheet) return respondJSON({ status: "error", message: "মূল শিট পাওয়া যায়নি।" });

  var memberId = (data.memberId || data.id || '').toString().trim().toLowerCase();
  var values = sheet.getDataRange().getValues();

  for (var r = 1; r < values.length; r++) {
    var rowId = (values[r][0] || '').toString().trim().toLowerCase();
    if (rowId === memberId) {
      var rowNum = r + 1;
      if (data.name) sheet.getRange(rowNum, 2).setValue(data.name);
      if (data.phone) sheet.getRange(rowNum, 3).setValue(data.phone);
      if (data.address) sheet.getRange(rowNum, 4).setValue(data.address);
      if (data.taka) sheet.getRange(rowNum, 6).setValue(Number(data.taka));
      SpreadsheetApp.flush();
      return respondJSON({ status: "success", message: "সদস্য তথ্য সফলভাবে আপডেট হয়েছে!" });
    }
  }

  return respondJSON({ status: "error", message: "সদস্য খুঁজে পাওয়া যায়নি।" });
}

/**
 * সব ডাটা (সকল সদস্য ও সমস্ত কিস্তি) স্প্রেডশিটে একসাথে ব্যাকআপ বা সিঙ্ক করা
 */
function handleBackupAll(ss, data) {
  var members = data.members || [];
  var collections = data.collections || [];
  var sheet = findMainSheet(ss);
  if (!sheet) sheet = ss.getSheets()[0];

  var syncedMembers = 0;
  var syncedCollections = 0;

  // ১. সকল কিস্তি রেকর্ড 'আদায়_লগ' শিটে ব্যাকআপ
  if (Array.isArray(collections) && collections.length > 0) {
    for (var c = 0; c < collections.length; c++) {
      logCollectionRecord(ss, collections[c]);
      syncedCollections++;
    }
  }

  // ২. সদস্যদের তথ্য শিটে সিঙ্ক
  if (Array.isArray(members) && members.length > 0) {
    for (var m = 0; m < members.length; m++) {
      var mem = members[m];
      if (!mem || !mem.id) continue;
      
      // সদস্যের কিস্তিগুলো মূল শিটে আপডেট করা
      if (mem.months && typeof mem.months === 'object') {
        var monthKeys = Object.keys(mem.months);
        for (var k = 0; k < monthKeys.length; k++) {
          var mKey = monthKeys[k];
          var amt = Number(mem.months[mKey]) || 0;
          if (amt > 0) {
            handleCollect(ss, {
              memberId: mem.id,
              memberName: mem.name,
              amount: amt,
              monthKey: mKey,
              receiptNo: 'SYNC-' + mem.id + '-' + k
            });
          }
        }
      }
      syncedMembers++;
    }
  }

  SpreadsheetApp.flush();

  return respondJSON({
    status: "success",
    message: "সকল ডাটা সফলভাবে গুগল স্প্রেডশিটে ব্যাকআপ ও সেভ হয়েছে!",
    syncedMembers: syncedMembers,
    syncedCollections: syncedCollections,
    timestamp: new Date().toISOString()
  });
}

/**
 * স্প্রেডশিট থেকে সমস্ত তথ্য (সদস্য ও কিস্তি আদায়ের খতিয়ান) পড়া এবং অ্যাপে পাঠানো
 */
function handleGetData(ss) {
  var sheet = findMainSheet(ss);
  if (!sheet) sheet = ss.getSheets()[0];

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return respondJSON({
      status: "success",
      spreadsheet: ss.getName(),
      sheetName: sheet.getName(),
      members: [],
      collections: []
    });
  }

  var headers = values[0];
  var idIdx = -1, nameIdx = -1, phoneIdx = -1, addressIdx = -1, joinIdx = -1, takaIdx = -1, photoIdx = -1;
  var monthCols = [];

  for (var c = 0; c < headers.length; c++) {
    var h = (headers[c] || '').toString().toLowerCase().trim();
    if (h.includes('memberid') || h === 'id' || h.includes('আইডি')) idIdx = c;
    else if (h.includes('name') || h.includes('নাম')) nameIdx = c;
    else if (h.includes('phone') || h.includes('মোবাইল') || h.includes('ফোন')) phoneIdx = c;
    else if (h.includes('address') || h.includes('ঠিকানা')) addressIdx = c;
    else if (h.includes('join') || h.includes('ঋন গ্রহনের মাস')) joinIdx = c;
    else if (h.includes('ঋনের পরিমাণ') || h.includes('taka') || h.includes('loan')) takaIdx = c;
    else if (h.includes('photo') || h.includes('ছবি')) photoIdx = c;

    // Check if column header contains a 4-digit year like 2026, 2027
    if (/\\b20[2-4][0-9]\\b/.test(headers[c].toString())) {
      monthCols.push({ index: c, headerName: headers[c].toString().trim() });
    }
  }

  if (idIdx === -1) idIdx = 0;
  if (nameIdx === -1) nameIdx = 1;

  var members = [];
  var fallbackCollections = [];

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    if (!row || row.length < 2) continue;
    var rawId = (idIdx !== -1 && row[idIdx]) ? row[idIdx].toString().trim() : ('M-' + r);
    var name = (nameIdx !== -1 && row[nameIdx]) ? row[nameIdx].toString().trim() : '';
    if (!name) continue;

    var phone = (phoneIdx !== -1 && row[phoneIdx]) ? row[phoneIdx].toString().trim() : '';
    var address = (addressIdx !== -1 && row[addressIdx]) ? row[addressIdx].toString().trim() : '';
    var joinDate = (joinIdx !== -1 && row[joinIdx]) ? row[joinIdx].toString().trim() : 'May 2026';
    var taka = (takaIdx !== -1 && row[takaIdx]) ? (Number(row[takaIdx].toString().replace(/[^0-9]/g, '')) || 30000) : 30000;
    var photo = (photoIdx !== -1 && row[photoIdx]) ? row[photoIdx].toString().trim() : '';

    var months = {};
    for (var m = 0; m < monthCols.length; m++) {
      var mCol = monthCols[m];
      var cellVal = row[mCol.index];
      if (cellVal !== undefined && cellVal !== null && cellVal !== '') {
        var num = Number(cellVal.toString().replace(/[^0-9]/g, ''));
        if (!isNaN(num) && num > 0) {
          months[mCol.headerName] = num;
          fallbackCollections.push({
            id: 'col-sheet-' + r + '-' + mCol.index,
            memberId: rawId,
            memberName: name,
            monthKey: mCol.headerName,
            amount: num,
            date: '২০২৬',
            paymentMethod: 'Cash',
            collectorName: 'মোঃ শিপন',
            receiptNo: 'REC-SHEET-' + r + '-' + mCol.index,
            notes: 'স্প্রেডশিট থেকে আমদানিকৃত'
          });
        } else {
          months[mCol.headerName] = null;
        }
      } else {
        months[mCol.headerName] = null;
      }
    }

    members.push({
      id: rawId,
      name: name,
      phone: phone,
      address: address,
      joinDate: joinDate,
      taka: taka,
      photo: photo || undefined,
      months: months
    });
  }

  // আদায়_লগ শিট থেকে বিস্তারিত লেনদেন রেকর্ড পড়া
  var logCollections = [];
  try {
    var logSheet = ss.getSheetByName("আদায়_লগ");
    if (logSheet) {
      var logValues = logSheet.getDataRange().getValues();
      for (var lr = 1; lr < logValues.length; lr++) {
        var lrow = logValues[lr];
        if (!lrow || lrow.length < 5) continue;
        var recNo = (lrow[1] || '').toString().trim() || ('REC-LOG-' + lr);
        var mId = (lrow[2] || '').toString().trim();
        var mName = (lrow[3] || '').toString().trim();
        var amt = Number(lrow[4]) || 0;
        var mKey = (lrow[5] || '').toString().trim();
        var dt = (lrow[6] || '').toString().trim() || '২০২৬';
        var method = (lrow[7] || '').toString().trim() || 'Cash';
        var colName = (lrow[8] || '').toString().trim() || 'মোঃ শিপন';
        var notes = (lrow[9] || '').toString().trim() || '';

        if (amt > 0) {
          logCollections.push({
            id: 'log-' + lr + '-' + recNo,
            receiptNo: recNo,
            memberId: mId,
            memberName: mName,
            amount: amt,
            monthKey: mKey,
            date: dt,
            paymentMethod: method,
            collectorName: colName,
            notes: notes
          });
        }
      }
    }
  } catch(e) {
    Logger.log("আদায়_লগ শিট রিড এরর: " + e.toString());
  }

  var finalCollections = logCollections.length > 0 ? logCollections : fallbackCollections;

  return respondJSON({
    status: "success",
    spreadsheet: ss.getName(),
    sheetName: sheet.getName(),
    members: members,
    collections: finalCollections,
    totalMembers: members.length,
    totalCollections: finalCollections.length,
    timestamp: new Date().toISOString()
  });
}

/**
 * সদস্যকে গুগল স্প্রেডশিট থেকে মুছে ফেলা
 */
function handleDeleteMember(ss, data) {
  var sheet = findMainSheet(ss);
  if (!sheet) return respondJSON({ status: "error", message: "মূল শিট পাওয়া যায়নি।" });

  var memberId = (data.memberId || data.id || '').toString().trim().toLowerCase();
  var values = sheet.getDataRange().getValues();

  for (var r = 1; r < values.length; r++) {
    var rowId = (values[r][0] || '').toString().trim().toLowerCase();
    if (rowId === memberId) {
      sheet.deleteRow(r + 1);
      SpreadsheetApp.flush();
      return respondJSON({ status: "success", message: "সদস্য স্প্রেডশিট থেকে সফলভাবে মুছে ফেলা হয়েছে!" });
    }
  }

  return respondJSON({ status: "not_found", message: "সদস্য স্প্রেডশিটে পাওয়া যায়নি।" });
}

/**
 * আদায়কৃত কিস্তির বিস্তারিত রেকর্ড 'আদায়_লগ' শিটে সুরক্ষিত রাখা
 */
function logCollectionRecord(ss, rec) {
  try {
    var logSheet = ss.getSheetByName("আদায়_লগ");
    if (!logSheet) {
      logSheet = ss.insertSheet("আদায়_লগ");
      // হেডার তৈরি
      var headers = ["টাইমস্ট্যাম্প", "রসিদ নং", "সদস্য আইডি", "নাম", "টাকার পরিমাণ", "মাসের নাম", "তারিখ", "মাধ্যম", "আদায়কারী", "মন্তব্য"];
      logSheet.appendRow(headers);
      var headerRange = logSheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#1e40af"); // গাঢ় নীল
      headerRange.setFontColor("#ffffff");
      logSheet.setFrozenRows(1);
    }

    var nowStr = Utilities.formatDate(new Date(), "Asia/Dhaka", "yyyy-MM-dd HH:mm:ss");
    logSheet.appendRow([
      nowStr,
      rec.receiptNo,
      rec.memberId,
      rec.memberName,
      rec.amount,
      rec.monthKey,
      rec.date,
      rec.paymentMethod,
      rec.collectorName,
      rec.notes
    ]);
  } catch(e) {
    Logger.log("লগ তৈরিতে ত্রুটি: " + e.toString());
  }
}

/**
 * যেকোনো শিটে সদস্যকে খুঁজে বের করার হেল্পার
 */
function findMemberAcrossAllSheets(ss, memberId, memberName) {
  var sheets = ss.getSheets();
  var cleanTargetId = (memberId || '').toString().trim().toLowerCase();
  var cleanTargetName = (memberName || '').toString().trim().toLowerCase();

  for (var i = 0; i < sheets.length; i++) {
    var s = sheets[i];
    var sName = s.getName().toLowerCase();
    if (sName.includes("লগ") || sName === "log" || sName === "collections") continue;
    var values = s.getDataRange().getValues();
    if (values.length < 2) continue;

    for (var r = 1; r < values.length; r++) {
      var rowId = (values[r][0] || '').toString().trim().toLowerCase();
      var rowName = (values[r][1] || '').toString().trim().toLowerCase();
      if ((cleanTargetId && rowId === cleanTargetId) || (cleanTargetName && rowName && rowName === cleanTargetName)) {
        return { sheet: s, rowIdx: r + 1, values: values };
      }
    }
  }
  return null;
}

/**
 * মূল সদস্য শিট খুঁজে বের করার হেল্পার
 */
function findMainSheet(ss) {
  var sheets = ss.getSheets();
  var bestSheet = null;
  var maxRows = 0;

  for (var i = 0; i < sheets.length; i++) {
    var s = sheets[i];
    var sName = s.getName().toLowerCase();
    if (sName.includes("লগ") || sName === "collections" || sName === "log") continue;
    var rowCount = s.getLastRow();
    if (rowCount > maxRows) {
      maxRows = rowCount;
      bestSheet = s;
    }
    var vals = s.getDataRange().getValues();
    if (vals.length >= 2) {
      var h = vals[0].join(",").toLowerCase();
      if (h.includes("memberid") || h.includes("আইডি") || h.includes("ঋন") || h.includes("phone")) {
        return s;
      }
    }
  }
  return bestSheet || ss.getSheetByName("সমিতি কিস্তি ম্যানেজমেন্ট") || sheets[0];
}

/**
 * JSON রেসপন্স তৈরির হেল্পার
 */
function respondJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * আজকের বাংলা তারিখ হেল্পার
 */
function getTodayBanglaDate() {
  var d = new Date();
  var months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

// 🧪 কানেকশন টেস্ট ফাংশন: Apps Script এডিটরে সরাসরি রান করে স্প্রেডশিট লিংক যাচাই করতে পারেন
function testConnection() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findMainSheet(ss);
  Logger.log("কানেক্টেড স্প্রেডশিট: " + (ss ? ss.getName() : "পাওয়া যায়নি") + ", মূল শিট: " + (sheet ? sheet.getName() : "পাওয়া যায়নি"));
}`;

/**
 * Generates and downloads collections list as CSV (Excel compatible)
 */
export function exportCollectionsToCSV(collections: CollectionRecord[], filename = 'somiti_collections.csv') {
  const headers = ['রসিদ নং', 'সদস্য আইডি', 'সদস্যের নাম', 'টাকার পরিমাণ', 'মাসের নাম', 'তারিখ', 'মাধ্যম', 'আদায়কারী', 'মন্তব্য'];
  const rows = collections.map((c) => [
    `"${c.receiptNo}"`,
    `"${c.memberId}"`,
    `"${c.memberName}"`,
    c.amount,
    `"${c.monthKey}"`,
    `"${c.date}"`,
    `"${c.paymentMethod}"`,
    `"${c.collectorName}"`,
    `"${c.notes || ''}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
