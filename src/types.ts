export interface Member {
  id: string | number;
  name: string;
  phone: string;
  address: string;
  nid?: string;
  joinMonth: number; // 0-11
  joinYear: number;
  startMonth?: number; // 0-11 (Installment start month - can be different per member)
  startYear?: number;  // Installment start year
  joinDate: string;
  taka: number; // Principal loan amount
  profitRate?: number; // Default 0.20 (20%)
  tenureMonths?: number; // Default 10
  photo?: string;
  months: Record<string, number | null>; // e.g. "June 2026": 12000
  notes?: string;
}

export interface CollectionRecord {
  id: string;
  memberId: string | number;
  memberName: string;
  monthKey: string;
  amount: number;
  date: string;
  paymentMethod: 'Cash' | 'bKash' | 'Nagad' | 'Bank';
  collectorName: string;
  receiptNo: string;
  notes?: string;
}

export interface LoanCalculation {
  principal: number;
  profitRate: number;
  tenureMonths: number;
  profit: number;
  totalPayable: number;
  monthlyInstallment: number;
}

export type ThemeColor = 'blue' | 'green' | 'purple' | 'rose' | 'amber' | 'teal';

export interface SystemSettings {
  somitiName: string;
  tagline: string;
  collectorName: string;
  phone: string;
  address: string;
  themeColor: ThemeColor;
  isDarkMode: boolean;
  googleSheetUrl: string;
  googleAppsScriptUrl?: string;
  lastSyncedAt?: string;
}

export interface BannerItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  imageUrl?: string;
  buttonText?: string;
  isImageBanner?: boolean;
  linkType?: 'none' | 'todayPaid' | 'dailyReport' | 'reports' | 'calculator' | 'members' | 'profit' | 'custom';
  customLink?: string;
  bgGradient?: string;
  textColor?: string;
  isActive: boolean;
}

export interface BannerConfig {
  intervalSeconds: number;
  autoPlay: boolean;
  banners: BannerItem[];
}

export type UserRole = 'admin' | 'user' | 'viewer';

export interface AppUser {
  id: string;
  username: string;
  password?: string;
  name: string;
  phone?: string;
  role: UserRole;
  isOnline?: boolean;
  lastActive?: string;
  createdAt?: string;
}

export interface UserSession {
  username: string;
  name: string;
  role: UserRole;
  isLoggedIn: boolean;
  id?: string;
}
