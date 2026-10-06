import React from 'react';
import {
  X,
  User,
  LayoutDashboard,
  Users,
  History,
  BarChart3,
  Coins,
  LogOut,
  Palette,
  CheckCircle2,
  RefreshCw,
  Sun,
  Moon,
  LogIn,
  ShieldAlert,
  Database,
  Sparkles,
  Code2
} from 'lucide-react';
import { SystemSettings, ThemeColor, UserSession } from '../types';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  user: UserSession;
  isSyncing: boolean;
  onNavigate: (tab: any) => void;
  onSelectThemeColor: (color: ThemeColor) => void;
  onToggleDarkMode: () => void;
  onSyncGoogleSheet?: () => void;
  onOpenLogin: () => void;
  onOpenLogout: () => void;
  onTestWebhook?: () => void;
  onOpenBannerManager?: () => void;
  onOpenAppsScriptModal?: () => void;
}

const THEME_OPTIONS: { id: ThemeColor; label: string; bg: string }[] = [
  { id: 'blue', label: 'নীল', bg: 'bg-blue-600' },
  { id: 'green', label: 'সবুজ', bg: 'bg-emerald-600' },
  { id: 'purple', label: 'বেগুনি', bg: 'bg-purple-600' },
  { id: 'rose', label: 'গোলাপি', bg: 'bg-rose-600' },
  { id: 'amber', label: 'অ্যাম্বার', bg: 'bg-amber-600' },
  { id: 'teal', label: 'টিল', bg: 'bg-teal-600' }
];

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  settings,
  user,
  isSyncing,
  onNavigate,
  onSelectThemeColor,
  onToggleDarkMode,
  onSyncGoogleSheet,
  onOpenLogin,
  onOpenLogout,
  onTestWebhook,
  onOpenBannerManager,
  onOpenAppsScriptModal
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Body */}
      <aside className="relative w-72 sm:w-80 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10 transition-transform duration-300">
        <div>
          {/* Header */}
          <div className="p-6 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white relative rounded-b-3xl shadow-md">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition p-1"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-inner">
              <User className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold">{user.isLoggedIn ? user.name : 'লগআউট অবস্থা'}</h2>
            <p className="text-xs text-blue-200">
              {user.isLoggedIn ? 'অ্যাডমিন একাউন্ট' : 'গেস্ট / ভিউয়ার অবস্থা'}
            </p>

            <div className="mt-3">
              {user.isLoggedIn ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>লগইনকৃত</span>
                </span>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onOpenLogin();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/20 hover:bg-white/30 text-white border border-white/30 transition shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>লগইন করুন</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <div className="p-4 space-y-1">
            <button
              onClick={() => {
                onNavigate('dashboard');
                onClose();
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition text-left"
            >
              <LayoutDashboard className="w-5 h-5 text-blue-600" />
              <span>বোর্ড (ড্যাশবোর্ড)</span>
            </button>

            <button
              onClick={() => {
                onNavigate('members');
                onClose();
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition text-left"
            >
              <Users className="w-5 h-5 text-blue-600" />
              <span>সদস্য তালিকা</span>
            </button>

            <button
              onClick={() => {
                onNavigate('history');
                onClose();
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition text-left"
            >
              <History className="w-5 h-5 text-emerald-600" />
              <span>জমার ইতিহাস</span>
            </button>

            <button
              onClick={() => {
                onNavigate('reports');
                onClose();
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition text-left"
            >
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>রিপোর্ট / গ্রাফ</span>
            </button>

            <button
              onClick={() => {
                onNavigate('profit');
                onClose();
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition text-left"
            >
              <Coins className="w-5 h-5 text-amber-500" />
              <span>লাভের হিসাব</span>
            </button>

            {user.role === 'admin' && (
              <button
                onClick={() => {
                  onNavigate('users');
                  onClose();
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-bold text-sm transition text-left border border-purple-200 dark:border-purple-800/60 my-1 bg-purple-50/50 dark:bg-purple-950/20"
              >
                <ShieldAlert className="w-5 h-5 text-purple-600" />
                <span>ইউজার ও অ্যাডমিন প্যানেল</span>
              </button>
            )}

            {user.role === 'admin' && onOpenBannerManager && (
              <button
                onClick={() => {
                  onClose();
                  onOpenBannerManager();
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-bold text-sm transition text-left border border-amber-200 dark:border-amber-800/60 my-1 bg-amber-50/50 dark:bg-amber-950/20"
              >
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>ব্যানার অ্যাড ও স্লাইডার পরিচালনা</span>
              </button>
            )}

            {onOpenAppsScriptModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAppsScriptModal();
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold text-sm transition text-left border border-emerald-200 dark:border-emerald-800/60 my-1 bg-emerald-50/50 dark:bg-emerald-950/20"
              >
                <Code2 className="w-5 h-5 text-emerald-600" />
                <span>গুগল স্প্রেডশিট লিংক ও সিঙ্ক সেটিংস</span>
              </button>
            )}



            {user.isLoggedIn ? (
              <button
                onClick={() => {
                  onClose();
                  onOpenLogout();
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold text-sm transition text-left border-t border-slate-100 dark:border-slate-800 mt-2"
              >
                <LogOut className="w-5 h-5" />
                <span>লগআউট</span>
              </button>
            ) : null}
          </div>

          {/* Theme Color Selector */}
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-blue-600" /> থিম নির্বাচন করুন
            </span>
            <div className="flex items-center gap-2.5 flex-wrap">
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelectThemeColor(t.id)}
                  title={t.label}
                  className={`w-8 h-8 rounded-full ${t.bg} transition transform hover:scale-110 flex items-center justify-center text-white ${
                    settings.themeColor === t.id ? 'ring-4 ring-blue-300 dark:ring-blue-700 scale-110 shadow-lg' : 'opacity-80'
                  }`}
                >
                  {settings.themeColor === t.id && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info & Dark Mode Toggle */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-center space-y-2.5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>সিস্টেম লাইভ ও সক্রিয়</span>
          </div>

          <div className="text-[11px] text-slate-400">
            <div>লগইন: admin / admin123</div>
            <div className="font-medium text-slate-500 dark:text-slate-400">Developer: Md Riad Mia</div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={onToggleDarkMode}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-600"
            >
              {settings.isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>লাইট মোড সক্রিয় করুন</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-600" />
                  <span>ডার্ক মোড সক্রিয় করুন</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
