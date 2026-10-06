import { Member, LoanCalculation } from '../types';

export const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_NAMES_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export const MONTH_NAMES_BN_SHORT = [
  'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'
];

// Bangla digit converter
export function toBengaliNumber(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
}

// Format currency
export function formatTaka(amount: number, useBengali = false): string {
  const formatted = Math.round(amount).toLocaleString('en-IN');
  if (useBengali) {
    return `৳ ${toBengaliNumber(formatted)}`;
  }
  return `৳ ${formatted}`;
}

export function getMonthKey(monthIndex: number, year: number): string {
  return `${MONTH_NAMES_EN[monthIndex]} ${year}`;
}

export function normalizeMonthKey(raw: string): string {
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

export function getPaidAmountForMonth(
  monthsMap: Record<string, number | null | undefined> | undefined,
  targetKey: string
): number | null {
  if (!monthsMap) return null;
  if (monthsMap[targetKey] !== undefined && monthsMap[targetKey] !== null) {
    const val = Number(monthsMap[targetKey]);
    return isNaN(val) ? null : val;
  }
  const normalizedTarget = normalizeMonthKey(targetKey);
  for (const [k, val] of Object.entries(monthsMap)) {
    if (val !== undefined && val !== null && normalizeMonthKey(k) === normalizedTarget) {
      const num = Number(val);
      return isNaN(num) ? null : num;
    }
  }
  return null;
}

export function calcLoan(principal: number, tenureMonths = 10, rate = 0.20): LoanCalculation {
  const profit = Math.round(principal * rate);
  const totalPayable = principal + profit;
  const monthlyInstallment = Math.round(totalPayable / tenureMonths);
  return {
    principal,
    profitRate: rate,
    tenureMonths,
    profit,
    totalPayable,
    monthlyInstallment
  };
}

export function getMemberInstallmentMonths(member: Member): { monthIndex: number; year: number; key: string }[] {
  const tenure = member.tenureMonths || 10;
  // If startMonth and startYear are specified for this member, use them. Otherwise default to month after joinMonth.
  let baseMonth: number;
  let baseYear: number;

  if (member.startMonth !== undefined && member.startYear !== undefined) {
    baseMonth = member.startMonth;
    baseYear = member.startYear;
  } else {
    // Start from the month after the join month
    const joinDate = new Date(member.joinYear, member.joinMonth, 1);
    joinDate.setMonth(joinDate.getMonth() + 1);
    baseMonth = joinDate.getMonth();
    baseYear = joinDate.getFullYear();
  }

  const monthsList = [];
  for (let i = 0; i < tenure; i++) {
    const installmentDate = new Date(baseYear, baseMonth + i, 1);
    const mi = installmentDate.getMonth();
    const yi = installmentDate.getFullYear();
    monthsList.push({
      monthIndex: mi,
      year: yi,
      key: getMonthKey(mi, yi)
    });
  }
  return monthsList;
}

export interface MemberMetrics {
  totalPaid: number;
  totalDue: number;
  monthsPaid: number;
  remainingMonths: number;
  progressPercent: number;
  status: 'paid' | 'due' | 'partial';
  monthlyInstallment: number;
  totalPayable: number;
  totalProfit: number;
}

export function getMemberMetrics(member: Member): MemberMetrics {
  const tenure = member.tenureMonths || 10;
  const rate = member.profitRate || 0.20;
  const principal = member.taka || 0;
  const calc = calcLoan(principal, tenure, rate);
  const monthly = calc.monthlyInstallment;

  let totalPaid = 0;
  let monthsPaid = 0;
  let totalDue = 0;

  const monthsMap = member.months || {};
  const installmentMonths = getMemberInstallmentMonths(member);
  installmentMonths.forEach(({ key }) => {
    const paid = getPaidAmountForMonth(monthsMap, key);
    if (paid !== null && paid > 0) {
      totalPaid += paid;
      if (paid >= monthly) {
        monthsPaid++;
      } else {
        totalDue += (monthly - paid);
      }
    } else {
      totalDue += monthly;
    }
  });

  // Account for any payments in months outside standard 10-month schedule
  const scheduledKeySet = new Set(installmentMonths.map(m => normalizeMonthKey(m.key)));
  Object.entries(monthsMap).forEach(([k, val]) => {
    if (!scheduledKeySet.has(normalizeMonthKey(k)) && val && Number(val) > 0) {
      const num = Number(val);
      totalPaid += num;
      if (num >= monthly) {
        monthsPaid++;
      }
    }
  });

  const remainingMonths = Math.max(0, tenure - monthsPaid);
  const totalPayable = calc.totalPayable || 1;
  const progressPercent = Math.min(100, Math.round((monthsPaid / tenure) * 100));
  
  let status: 'paid' | 'due' | 'partial' = 'due';
  if (monthsPaid >= tenure && totalPaid >= calc.totalPayable) {
    status = 'paid';
  } else if (monthsPaid > 0 || totalPaid > 0) {
    status = 'partial';
  } else {
    status = 'due';
  }

  return {
    totalPaid,
    totalDue,
    monthsPaid,
    remainingMonths,
    progressPercent,
    status,
    monthlyInstallment: monthly,
    totalPayable: calc.totalPayable,
    totalProfit: calc.profit
  };
}

export function calculateProfitForMonth(members: Member[], monthIndex: number, year: number): {
  collectedTaka: number;
  profitEarned: number;
  expectedTaka: number;
  activeCount: number;
} {
  const key = getMonthKey(monthIndex, year);
  let collectedTaka = 0;
  let profitEarned = 0;
  let expectedTaka = 0;
  let activeCount = 0;

  members.forEach((m) => {
    const tenure = m.tenureMonths || 10;
    const rate = m.profitRate || 0.20;
    const calc = calcLoan(m.taka, tenure, rate);

    const installmentMonths = getMemberInstallmentMonths(m);
    const inRange = installmentMonths.some(im => im.monthIndex === monthIndex && im.year === year);

    if (inRange) {
      activeCount++;
      expectedTaka += calc.monthlyInstallment;
      const monthsMap = m.months || {};
      const paid = monthsMap[key];
      if (paid !== null && paid !== undefined && paid > 0) {
        collectedTaka += paid;
        const profitPerInstallment = calc.profit / tenure;
        const ratio = Math.min(1, paid / calc.monthlyInstallment);
        profitEarned += profitPerInstallment * ratio;
      }
    }
  });

  return {
    collectedTaka,
    profitEarned: Math.round(profitEarned),
    expectedTaka,
    activeCount
  };
}

// ==========================================
// 2026-2030+ Dynamic Year System & Extensions
// ==========================================
export const BASE_SYSTEM_YEARS = [2025, 2026, 2027, 2028, 2029, 2030];

export function getCustomExtendedYears(): number[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('somiti_custom_years_v1') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(Number).filter((n) => !isNaN(n) && n >= 2020 && n <= 2099);
      }
    }
  } catch {}
  return [];
}

export function saveCustomExtendedYear(newYear: number): number[] {
  const current = getCustomExtendedYears();
  if (newYear >= 2020 && newYear <= 2099 && !current.includes(newYear)) {
    const updated = [...current, newYear].sort((a, b) => a - b);
    try {
      localStorage.setItem('somiti_custom_years_v1', JSON.stringify(updated));
    } catch {}
    return updated;
  }
  return current;
}

export function getAllAvailableYears(
  members?: Member[],
  extraYears: number[] = []
): number[] {
  const currentYear = new Date().getFullYear();
  const yearSet = new Set<number>(BASE_SYSTEM_YEARS);

  // Always make sure 2026 to 2030 are included
  for (let y = 2026; y <= Math.max(2030, currentYear + 2); y++) {
    yearSet.add(y);
  }

  // Include user custom stored years
  getCustomExtendedYears().forEach((y) => yearSet.add(y));

  // Include any extra years passed as argument
  extraYears.forEach((y) => {
    if (y && !isNaN(y)) yearSet.add(Number(y));
  });

  // Automatically scan members' joinYear, startYear, and month keys
  if (members && Array.isArray(members)) {
    members.forEach((m) => {
      if (m.joinYear) yearSet.add(Number(m.joinYear));
      if (m.startYear) yearSet.add(Number(m.startYear));
      if (m.months) {
        Object.keys(m.months).forEach((k) => {
          const match = k.match(/\b(20[2-9][0-9])\b/);
          if (match) {
            yearSet.add(parseInt(match[1], 10));
          }
        });
      }
    });
  }

  return Array.from(yearSet).sort((a, b) => a - b);
}

