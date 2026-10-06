import React from 'react';
import {
  Menu,
  HandCoins,
  Sun,
  Moon,
  RotateCcw
} from 'lucide-react';
import { SystemSettings, UserSession } from '../types';

interface HeaderProps {
  settings: SystemSettings;
  user: UserSession;
  isSyncing?: boolean;
  onOpenDrawer: () => void;
  onToggleTheme: () => void;
  onRefresh?: () => void;
  onOpenCollectModal: () => void;
  onOpenLogin?: () => void;
  onOpenLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  user,
  isSyncing = false,
  onOpenDrawer,
  onToggleTheme,
  onRefresh,
  onOpenCollectModal,
  onOpenLogin,
  onOpenLogout
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Left: Hamburger & Somiti Title */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <button
            onClick={onOpenDrawer}
            className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none shrink-0"
            title="মেনু খুলুন"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm sm:text-lg shadow-md shrink-0">
              ১০
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-sm sm:text-lg text-slate-900 dark:text-white leading-tight whitespace-nowrap">
                  {settings.somitiName}
                </h1>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                আদায়কারী: <span className="font-semibold text-slate-700 dark:text-slate-200">{settings.collectorName}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Theme Toggle, Refresh Button & Collect Button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 font-semibold text-xs"
            title={settings.isDarkMode ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন'}
          >
            {settings.isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden xs:inline">লাইট</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600" />
                <span className="hidden xs:inline">ডার্ক</span>
              </>
            )}
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="p-1.5 sm:p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 transition shrink-0 flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 font-semibold text-xs active:scale-95"
            title="ক্লাউড ডাটাবেস থেকে তথ্য রিফ্রেশ করুন"
          >
            <RotateCcw className={`w-4 h-4 text-blue-600 dark:text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">রিফ্রেশ</span>
          </button>

          {/* Quick Collect CTA */}
          <button
            onClick={onOpenCollectModal}
            className="hidden sm:flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition transform active:scale-95 shrink-0"
          >
            <HandCoins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>কিস্তি জমা</span>
          </button>
        </div>
      </div>
    </header>
  );
};
