import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Calculator,
  TrendingUp,
  FileText,
  Search,
  UserPlus,
  HandCoins,
  History,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  FileCode,
  Download,
  LayoutDashboard,
  Calendar,
  AlertCircle,
  Copy,
  Edit3,
  Trash2,
  Wifi,
  WifiOff,
  FileSpreadsheet
} from 'lucide-react';
import { Member, CollectionRecord, SystemSettings, ThemeColor, UserSession, AppUser, BannerConfig } from './types';
import { INITIAL_MEMBERS, INITIAL_COLLECTIONS, INITIAL_SETTINGS } from './data/initialData';
import { DEFAULT_BANNER_CONFIG } from './data/defaultBanners';
import { Header } from './components/Header';
import { Drawer } from './components/Drawer';
import { StatsCards } from './components/StatsCards';
import { BannerSlider } from './components/BannerSlider';
import { BannerManagerModal } from './components/BannerManagerModal';
import { MemberCard } from './components/MemberCard';
import { MemberDetailModal } from './components/MemberDetailModal';
import { CollectModal } from './components/CollectModal';
import { AddMemberModal } from './components/AddMemberModal';
import { ReceiptModal } from './components/ReceiptModal';
import { LoanCalculator } from './components/LoanCalculator';
import { ProfitAnalytics } from './components/ProfitAnalytics';
import { ReportsView } from './components/ReportsView';
import { MonthlyPaidView, TotalPaidView, DueListView, DailyReportView } from './components/SubPages';
import { LoginModal, LogoutModal } from './components/AuthModals';
import { UserManagement } from './components/UserManagement';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { EditCollectionModal } from './components/EditCollectionModal';
import { EditMemberModal } from './components/EditMemberModal';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { GoogleAppsScriptModal } from './components/GoogleAppsScriptModal';
import {
  fetchFromGoogleSheet,
  postCollectionToGoogleSheet,
  postUpdateCollectionToGoogleSheet,
  postDeleteCollectionToGoogleSheet,
  postMemberToGoogleSheet,
  postUpdateMemberToGoogleSheet,
  exportAllDataToGoogleSheet,
  testGoogleSheetWebhookConnection,
  DEFAULT_SHEET_CSV_URL,
  DEFAULT_APPS_SCRIPT_URL,
  normalizeGoogleSheetCsvUrl
} from './utils/googleSheetSync';
import {
  loadSomitiData,
  saveSomitiData,
  clearLocalCache,
  startMultiUserSyncPolling,
  deleteMemberFromServer,
  deleteCollectionFromServer,
  deleteUserFromServer,
  isOldTestMember,
  isOldTestCollection,
  INITIAL_USERS
} from './utils/dataStorage';
import { getMemberMetrics, formatTaka } from './utils/calculations';

type ActiveTab =
  | 'dashboard'
  | 'members'
  | 'monthlyReport'
  | 'todayPaid'
  | 'totalPaid'
  | 'dueList'
  | 'dailyReport'
  | 'calculator'
  | 'profit'
  | 'reports'
  | 'history'
  | 'users'
  | 'monthlyPaid';

export default function App() {
  // Persistence state in Google Sheets & Local Cache with local fallback
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem('somiti_members_v3');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter((m: any) => !isOldTestMember(m));
          if (clean.length > 0) return clean;
        }
      }
    } catch (e) {}
    return INITIAL_MEMBERS;
  });

  const [collections, setCollections] = useState<CollectionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('somiti_collections_v3');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((c: any) => !isOldTestCollection(c));
        }
      }
    } catch (e) {}
    return INITIAL_COLLECTIONS;
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem('somiti_settings_v3');
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_SETTINGS;
  });

  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem('somiti_users_v3');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_USERS;
  });
  const [isInitialized, setIsInitialized] = useState(false);

  const [user, setUser] = useState<UserSession>(() => {
    try {
      const saved = localStorage.getItem('somiti_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isLoggedIn) return parsed;
      }
    } catch (e) {}
    return {
      username: '',
      name: 'লগআউট অবস্থা',
      role: 'viewer',
      isLoggedIn: false
    };
  });

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'partial' | 'paid'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [collectTargetMember, setCollectTargetMember] = useState<Member | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<CollectionRecord | null>(null);
  const [previewImageMember, setPreviewImageMember] = useState<Member | null>(null);

  // Banner Advertising & Slider State
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>(() => {
    try {
      const saved = localStorage.getItem('somiti_banner_config_v1');
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_BANNER_CONFIG;
  });
  const [isBannerManagerOpen, setIsBannerManagerOpen] = useState(false);
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState(false);

  // Edit Collection, Edit Member & Delete Confirmation Modal State
  const [editingCollection, setEditingCollection] = useState<CollectionRecord | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    itemName?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });

  // Keep track of modals for popstate handling
  const modalsRef = useRef({
    selectedMember,
    isCollectModalOpen,
    isAddMemberOpen,
    activeReceipt,
    isDrawerOpen,
    isLoginOpen,
    isLogoutOpen,
    isBannerManagerOpen
  });

  useEffect(() => {
    modalsRef.current = {
      selectedMember,
      isCollectModalOpen,
      isAddMemberOpen,
      activeReceipt,
      isDrawerOpen,
      isLoginOpen,
      isLogoutOpen,
      isBannerManagerOpen
    };
  }, [
    selectedMember,
    isCollectModalOpen,
    isAddMemberOpen,
    activeReceipt,
    isDrawerOpen,
    isLoginOpen,
    isLogoutOpen,
    isBannerManagerOpen
  ]);

  // ১. যখনই কোনো মেনু বা ট্যাবে ক্লিক করা হবে, এই ফাংশনটি কল করবেন
  const navigateToSection = (sectionId: ActiveTab, pushHistory = true) => {
    if (activeTab === sectionId) return;
    setActiveTab(sectionId);
    if (pushHistory) {
      // ব্যাক বাটনের জন্য হিস্টোরিতে একটি স্টেট যোগ করা
      window.history.pushState({ section: sectionId }, '', '#' + sectionId);
    }
  };

  // মোবাইলের অরিজিনাল ব্যাক বাটন ও ব্রাউজার হিস্টোরি হ্যান্ডলিং
  useEffect(() => {
    const validTabs: ActiveTab[] = [
      'dashboard',
      'members',
      'todayPaid',
      'totalPaid',
      'dueList',
      'dailyReport',
      'calculator',
      'profit',
      'reports',
      'history',
      'monthlyPaid'
    ];
    const hash = window.location.hash.replace('#', '') as ActiveTab;
    const initialSection: ActiveTab = validTabs.includes(hash) ? hash : 'dashboard';

    if (initialSection !== 'dashboard') {
      setActiveTab(initialSection);
    }
    // প্রথমবার পেজ লোড হওয়ার সময় হোম স্টেটের হিস্টোরি সেট করা
    window.history.replaceState({ section: initialSection }, '', '#' + initialSection);

    // ২. মোবাইলের অরিজিনাল ব্যাক বাটন চাপলে এই অংশটি কাজ করবে
    const handlePopState = (event: PopStateEvent) => {
      const modals = modalsRef.current;
      const anyModalOpen =
        Boolean(modals.selectedMember) ||
        modals.isCollectModalOpen ||
        modals.isAddMemberOpen ||
        Boolean(modals.activeReceipt) ||
        modals.isDrawerOpen ||
        modals.isLoginOpen ||
        modals.isLogoutOpen ||
        modals.isBannerManagerOpen;

      // ব্যবহারকারী যদি কোনো মডাল বা ড্রয়ারে থাকে, তবে ব্যাক বাটন চাপলে মডালটি বন্ধ হবে
      if (anyModalOpen) {
        setSelectedMember(null);
        setIsCollectModalOpen(false);
        setCollectTargetMember(null);
        setIsAddMemberOpen(false);
        setActiveReceipt(null);
        setIsDrawerOpen(false);
        setIsLoginOpen(false);
        setIsLogoutOpen(false);
        setIsBannerManagerOpen(false);
        return;
      }

      if (event.state && event.state.section) {
        // ব্যবহারকারী যদি কোনো সাব-পেইজে থাকে, তবে ব্যাক বাটন চাপলে সেই পেইজটি দেখাবে
        setActiveTab(event.state.section);
      } else {
        // ব্যবহারকারী যদি একদম মূল বা হোম পেইজে চলে আসে
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openMemberDetail = (m: Member) => {
    setSelectedMember(m);
    window.history.pushState({ modal: 'member', id: m.id, section: activeTab }, '', '#memberDetail');
  };

  const openQuickCollect = (member?: Member | null) => {
    if (user.role !== 'admin') {
      showToast('কিস্তি জমা বা পরিবর্তন করতে অনুগ্রহ করে এডমিন হিসেবে লগইন করুন।');
      setIsLoginOpen(true);
      window.history.pushState({ modal: 'login' }, '', '#login');
      return;
    }
    setCollectTargetMember(member || null);
    setIsCollectModalOpen(true);
    window.history.pushState({ modal: 'collect', section: activeTab }, '', '#collect');
  };

  const openAddMember = () => {
    if (user.role !== 'admin') {
      showToast('নতুন সদস্য যোগ করতে অনুগ্রহ করে এডমিন হিসেবে লগইন করুন।');
      setIsLoginOpen(true);
      window.history.pushState({ modal: 'login' }, '', '#login');
      return;
    }
    setIsAddMemberOpen(true);
    window.history.pushState({ modal: 'addMember', section: activeTab }, '', '#addMember');
  };

  const openDrawer = () => {
    setIsDrawerOpen(true);
    window.history.pushState({ modal: 'drawer', section: activeTab }, '', '#drawer');
  };

  const openReceipt = (record: CollectionRecord) => {
    setActiveReceipt(record);
    window.history.pushState({ modal: 'receipt', id: record.id, section: activeTab }, '', '#receipt');
  };

  const closeModals = () => {
    setSelectedMember(null);
    setIsCollectModalOpen(false);
    setCollectTargetMember(null);
    setIsAddMemberOpen(false);
    setActiveReceipt(null);
    setIsDrawerOpen(false);
    setIsLoginOpen(false);
    setIsLogoutOpen(false);
    setIsBannerManagerOpen(false);
  };

  const handleSaveBannerConfig = (newConfig: BannerConfig) => {
    setBannerConfig(newConfig);
    try {
      localStorage.setItem('somiti_banner_config_v1', JSON.stringify(newConfig));
    } catch (e) {}
    saveSomitiData({
      members,
      collections,
      settings,
      users,
      bannerConfig: newConfig
    });
    showToast('ব্যানার বিজ্ঞাপন সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
  };

  // Load from Central Cloud Database on mount
  useEffect(() => {
    loadSomitiData().then((data) => {
      setMembers(data.members);
      setCollections(data.collections);
      setSettings(data.settings);
      if (data.users && data.users.length > 0) {
        setUsers(data.users);
      }
      if (data.bannerConfig) {
        setBannerConfig(data.bannerConfig);
      }
      setIsInitialized(true);
    });

    // Start background multi-user sync polling
    const unsubscribeSync = startMultiUserSyncPolling((freshData) => {
      setMembers(freshData.members);
      setCollections(freshData.collections);
      setSettings(freshData.settings);
      if (freshData.users && freshData.users.length > 0) {
        setUsers(freshData.users);
      }
      if (freshData.bannerConfig) {
        setBannerConfig(freshData.bannerConfig);
      }
    });

    return () => {
      unsubscribeSync();
    };
  }, []);

  // Monitor online/offline status and automatically upload pending local changes when internet returns
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      showToast('ইন্টারনেট সংযোগ পুনরায় সক্রিয় হয়েছে! 📶');
      
      const hasPendingSync = localStorage.getItem('somiti_needs_sync') === 'true';
      if (hasPendingSync) {
        setIsSyncing(true);
        try {
          const savedMembers = localStorage.getItem('somiti_members_v3');
          const savedCollections = localStorage.getItem('somiti_collections_v3');
          const savedSettings = localStorage.getItem('somiti_settings_v3');
          const savedUsers = localStorage.getItem('somiti_users_v3');
          
          if (savedMembers && savedCollections && savedSettings) {
            const m = JSON.parse(savedMembers);
            const c = JSON.parse(savedCollections);
            const s = JSON.parse(savedSettings);
            const u = savedUsers ? JSON.parse(savedUsers) : users;
            
            showToast('অфলাইনের জমানো তথ্য ক্লাউডে আপলোড করা হচ্ছে...');
            const success = await saveSomitiData({
              members: m,
              collections: c,
              settings: s,
              users: u
            });
            
            if (success) {
              localStorage.removeItem('somiti_needs_sync');
              showToast('সব অফলাইন তথ্য স্বয়ংক্রিয়ভাবে ক্লাউডে সফলভাবে সেভ করা হয়েছে! 🎉');
              
              // Load fresh merged data
              const fresh = await loadSomitiData();
              setMembers(fresh.members);
              setCollections(fresh.collections);
              setSettings(fresh.settings);
              if (fresh.users && fresh.users.length > 0) {
                setUsers(fresh.users);
              }
            }
          }
        } catch (syncErr) {
          console.warn('[Sync] Auto reconnect upload failed:', syncErr);
        } finally {
          setIsSyncing(false);
        }
      } else {
        // Just refresh to make sure we have latest server data
        try {
          const fresh = await loadSomitiData();
          setMembers(fresh.members);
          setCollections(fresh.collections);
          setSettings(fresh.settings);
          if (fresh.users && fresh.users.length > 0) {
            setUsers(fresh.users);
          }
        } catch {}
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('নেট সংযোগ বিচ্ছিন্ন! আপনি এখন অফলাইন মোডে আছেন। ⚠️');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check in case it transitioned while loading
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [users]);

  useEffect(() => {
    if (settings.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.isDarkMode]);

  useEffect(() => {
    if (settings.themeColor) {
      document.documentElement.setAttribute('data-theme', settings.themeColor);
    }
  }, [settings.themeColor]);

  const refreshCloudData = async () => {
    setIsSyncing(true);
    try {
      const data = await loadSomitiData();
      setMembers(data.members);
      setCollections(data.collections);
      setSettings(data.settings);
      if (data.users && data.users.length > 0) {
        setUsers(data.users);
      }
      setSettings((prev) => ({
        ...prev,
        lastSyncedAt: new Date().toLocaleTimeString('bn-BD')
      }));
      showToast('সমিতি ক্লাউড সার্ভার থেকে সর্বশেষ তথ্য সফলভাবে রিফ্রেশ করা হয়েছে!');
    } catch (err: any) {
      showToast('লাইভ তথ্য রিফ্রেশ করতে সাময়িক সমস্যা হয়েছে।');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddUser = (newUser: Omit<AppUser, 'id' | 'createdAt'>) => {
    const userObj: AppUser = {
      ...newUser,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updatedUsers = [...users, userObj];
    setUsers(updatedUsers);
    saveSomitiData({ members, collections, settings, users: updatedUsers });
    showToast(`নতুন ইউজার "${userObj.name}" অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!`);
  };

  const handleEditUser = (updatedUser: AppUser) => {
    const updatedUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updatedUsers);
    saveSomitiData({ members, collections, settings, users: updatedUsers });
    showToast(`ইউজার "${updatedUser.name}" এর তথ্য সফলভাবে পরিবর্তন করা হয়েছে!`);
  };

  const handleDeleteUser = async (userId: string) => {
    const updatedUsers = users.filter((u) => u.id !== userId);
    setUsers(updatedUsers);
    await deleteUserFromServer(userId);
    showToast('ইউজার অ্যাকাউন্টটি সফলভাবে ডিলিট করা হয়েছে!');
  };

  const showToast = (msg: string) => {
    setSyncToast(msg);
    setTimeout(() => setSyncToast(null), 4000);
  };

  const toggleDarkMode = () => {
    setSettings((prev) => {
      const next = { ...prev, isDarkMode: !prev.isDarkMode };
      saveSomitiData({ members, collections, settings: next, users });
      return next;
    });
  };

  const handleSelectThemeColor = (themeColor: ThemeColor) => {
    setSettings((prev) => {
      const next = { ...prev, themeColor };
      saveSomitiData({ members, collections, settings: next, users });
      return next;
    });
  };

  const handleTestWebhook = async () => {
    setIsSyncing(true);
    const result = await testGoogleSheetWebhookConnection(settings.googleAppsScriptUrl);
    setIsSyncing(false);
    showToast(result.message);
  };

  // Financial statistics calculations
  const currentMonthKey = 'September 2026';
  let currentMonthCollection = 0;
  let totalLoansDisbursed = 0;
  let totalCollectedAllTime = 0;
  let totalOverdue = 0;
  let totalProfit = 0;

  members.forEach((m) => {
    totalLoansDisbursed += m.taka;
    totalProfit += Math.round(m.taka * (m.profitRate || 0.20));

    const metrics = getMemberMetrics(m);
    totalCollectedAllTime += metrics.totalPaid;
    totalOverdue += metrics.totalDue;

    const paidThisMonth = m.months[currentMonthKey];
    if (paidThisMonth && paidThisMonth > 0) {
      currentMonthCollection += paidThisMonth;
    }
  });

  // Handlers
  const handleAddMember = async (newMember: Member) => {
    const updatedMembers = [newMember, ...members];
    setMembers(updatedMembers);
    saveSomitiData({
      members: updatedMembers,
      collections,
      settings,
      users
    });
    showToast(`সদস্য "${newMember.name}" যোগ হচ্ছে ও গুগল শিটে সেভ হচ্ছে... ⏳`);
    try {
      await postMemberToGoogleSheet(newMember, settings.googleAppsScriptUrl);
      showToast(`সদস্য "${newMember.name}" সফলভাবে যুক্ত হয়েছেন ও গুগল স্প্রেডশিটে সেভ হয়েছে! ✅`);
    } catch {
      showToast(`সদস্য "${newMember.name}" অ্যাপে সংরক্ষিত হয়েছে! ✅`);
    }
  };

  const handleRecordCollection = (record: CollectionRecord) => {
    const updatedCollections = [record, ...(collections || [])];

    // Update member's month payment with null safety
    const updatedMembers = (members || []).map((m) => {
      if (String(m.id) === String(record.memberId)) {
        const currentMonths = m.months || {};
        const currentMonthPaid = currentMonths[record.monthKey] || 0;
        return {
          ...m,
          months: {
            ...currentMonths,
            [record.monthKey]: currentMonthPaid + Number(record.amount)
          }
        };
      }
      return m;
    });

    setCollections(updatedCollections);
    setMembers(updatedMembers);
    setActiveReceipt(record);

    saveSomitiData({
      members: updatedMembers,
      collections: updatedCollections,
      settings,
      users
    });

    postCollectionToGoogleSheet(record, settings.googleAppsScriptUrl).catch(() => {});

    showToast(`৳ ${formatTaka(record.amount)} কিস্তি সফলভাবে আদায় হয়েছে ও গুগল স্প্রেডশিটে সেভ হয়েছে! ✅`);
  };

  const handleDeleteMember = (memberId: string | number) => {
    if (user.role !== 'admin') {
      showToast('শুধুমাত্র এডমিন সদস্য ডিলিট করতে পারবেন।');
      return;
    }
    const targetMember = members.find((m) => String(m.id) === String(memberId));
    if (!targetMember) return;

    setDeleteModalState({
      isOpen: true,
      title: 'সদস্য স্থায়ীভাবে ডিলিট করুন',
      description: 'আপনি কি নিশ্চিত যে এই সদস্য ও তার সমস্ত কিস্তির ইতিহাস সার্ভার থেকে ডিলিট করতে চান?',
      itemName: `${targetMember.name} (ID: #${targetMember.id})`,
      onConfirm: async () => {
        const updatedMembers = members.filter((m) => String(m.id) !== String(memberId));
        const updatedCollections = collections.filter((c) => String(c.memberId) !== String(memberId));
        setMembers(updatedMembers);
        setCollections(updatedCollections);
        closeModals();

        await deleteMemberFromServer(memberId, settings.googleAppsScriptUrl);
        saveSomitiData({ members: updatedMembers, collections: updatedCollections, settings, users });

        showToast(`সদস্য "${targetMember.name}" এর তথ্য স্প্রেডশিট ও অ্যাপ থেকে স্থায়ীভাবে ডিলিট করা হয়েছে!`);
      }
    });
  };

  const handleDeleteCollection = (record: CollectionRecord) => {
    if (user.role !== 'admin') {
      showToast('শুধুমাত্র এডমিন রসিদ ডিলিট করতে পারবেন।');
      return;
    }

    setDeleteModalState({
      isOpen: true,
      title: 'কিস্তি আদায় রসিদ ডিলিট করুন',
      description: 'আপনি কি নিশ্চিত যে এই কিস্তি সংগ্রহের রসিদটি ডিলিট করতে চান? সদস্যের বকেয়া পুনরায় হিসেব করা হবে।',
      itemName: `রসিদ নং: ${record.receiptNo} (${record.memberName} - ৳${formatTaka(record.amount)})`,
      onConfirm: async () => {
        const updatedCollections = collections.filter((c) => c.id !== record.id);
        let newTotalForMonth = 0;
        const updatedMembers = members.map((m) => {
          if (String(m.id) === String(record.memberId)) {
            const currentMonths = m.months || {};
            const currentPaid = currentMonths[record.monthKey] || 0;
            const newPaid = Math.max(0, currentPaid - record.amount);
            const updatedMonths = { ...currentMonths };
            if (newPaid <= 0) {
              delete updatedMonths[record.monthKey];
            } else {
              updatedMonths[record.monthKey] = newPaid;
            }
            newTotalForMonth = newPaid;
            return {
              ...m,
              months: updatedMonths
            };
          }
          return m;
        });

        setCollections(updatedCollections);
        setMembers(updatedMembers);

        await deleteCollectionFromServer(record.id, updatedMembers);
        postDeleteCollectionToGoogleSheet(record, newTotalForMonth, settings.googleAppsScriptUrl).catch(() => {});

        showToast(`রসিদ নং ${record.receiptNo} স্থায়ীভাবে ডিলিট করা হয়েছে!`);
      }
    });
  };

  const handleSaveEditCollection = (updatedRecord: CollectionRecord) => {
    if (user.role !== 'admin') {
      showToast('শুধুমাত্র এডমিন কিস্তি এডিট করতে পারবেন।');
      return;
    }

    const oldRecord = collections.find((c) => c.id === updatedRecord.id);
    if (!oldRecord) return;

    // 1. Update collection list
    const updatedCollections = collections.map((c) => (c.id === updatedRecord.id ? updatedRecord : c));

    // 2. Update members' payment history
    const updatedMembers = members.map((m) => {
      let updatedMonths = { ...(m.months || {}) };
      let changed = false;

      // Deduct old collection from old member's month
      if (String(m.id) === String(oldRecord.memberId)) {
        const currentOldMonthPaid = updatedMonths[oldRecord.monthKey] || 0;
        const newOldPaid = Math.max(0, currentOldMonthPaid - oldRecord.amount);
        if (newOldPaid <= 0) {
          delete updatedMonths[oldRecord.monthKey];
        } else {
          updatedMonths[oldRecord.monthKey] = newOldPaid;
        }
        changed = true;
      }

      // Add new collection to new member's month
      if (String(m.id) === String(updatedRecord.memberId)) {
        const currentNewMonthPaid = updatedMonths[updatedRecord.monthKey] || 0;
        const newTotal = currentNewMonthPaid + Number(updatedRecord.amount);
        if (newTotal <= 0) {
          delete updatedMonths[updatedRecord.monthKey];
        } else {
          updatedMonths[updatedRecord.monthKey] = newTotal;
        }
        changed = true;
      }

      if (changed) {
        return {
          ...m,
          months: updatedMonths
        };
      }
      return m;
    });

    const updatedTargetMember = updatedMembers.find((m) => String(m.id) === String(updatedRecord.memberId));
    const newTotalForNewMonth = updatedTargetMember?.months?.[updatedRecord.monthKey] ?? Number(updatedRecord.amount);

    const updatedOldMember = updatedMembers.find((m) => String(m.id) === String(oldRecord.memberId));
    const newTotalForOldMonth = updatedOldMember?.months?.[oldRecord.monthKey] ?? 0;

    setCollections(updatedCollections);
    setMembers(updatedMembers);
    setEditingCollection(null);

    saveSomitiData({
      members: updatedMembers,
      collections: updatedCollections,
      settings,
      users
    });

    postUpdateCollectionToGoogleSheet({
      updatedRecord,
      oldRecord,
      newTotalForNewMonth,
      newTotalForOldMonth
    }, settings.googleAppsScriptUrl).catch(() => {});

    showToast(`রসিদ নং ${updatedRecord.receiptNo} এর কিস্তি ৳${formatTaka(updatedRecord.amount)} সফলভাবে আপডেট হয়েছে (শিটে পূর্বের টাকার সাথে যোগ না হয়ে নতুন পরিমাণ প্রতিস্থাপন হয়েছে)! ✅`);
  };

  const handleSaveEditMember = (updatedMember: Member) => {
    if (user.role !== 'admin') {
      showToast('শুধুমাত্র এডমিন সদস্য তথ্য সম্পাদন করতে পারবেন।');
      return;
    }

    const updatedMembers = members.map((m) => (m.id === updatedMember.id ? updatedMember : m));
    setMembers(updatedMembers);
    setEditingMember(null);

    saveSomitiData({
      members: updatedMembers,
      collections,
      settings,
      users
    });

    postUpdateMemberToGoogleSheet(updatedMember, settings.googleAppsScriptUrl).catch(() => {});

    showToast(`সদস্য "${updatedMember.name}" এর তথ্য সফলভাবে আপডেট ও গুগল শিটে সংরক্ষিত হয়েছে! ✅`);
  };

  const handleFetchFromGoogleSheet = async () => {
    setIsSyncing(true);
    showToast('গুগল স্প্রেডশিট থেকে সব তথ্য লোড করা হচ্ছে...');
    try {
      const data = await loadSomitiData();
      setMembers(data.members);
      setCollections(data.collections);
      setSettings(data.settings);
      showToast(`গুগল শিট থেকে মোট ${data.members.length} জন সদস্য ও ${data.collections.length} টি কিস্তির তথ্য সফলভাবে লোড হয়েছে! 🎉`);
    } catch (err: any) {
      showToast('গুগল শিট থেকে তথ্য আনতে সমস্যা হয়েছে: ' + (err.message || ''));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportAllToGoogleSheet = async () => {
    setIsSyncing(true);
    showToast('সকল সদস্য ও কিস্তির তথ্য গুগল স্প্রেডশিটে ব্যাকআপ পাঠানো হচ্ছে...');
    try {
      const res = await exportAllDataToGoogleSheet(members, collections, settings.googleAppsScriptUrl);
      showToast(res.message);
    } catch (err: any) {
      showToast('ব্যাকআপ পাঠাতে ত্রুটি হয়েছে।');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveGoogleSheetUrl = async (sheetUrl: string) => {
    const normalized = normalizeGoogleSheetCsvUrl(sheetUrl);
    const updated = { ...settings, googleSheetUrl: normalized };
    setSettings(updated);
    saveSomitiData({ members, collections, settings: updated, users });
    showToast('আপনার গুগল স্প্রেডশিট লিংক সংরক্ষিত হয়েছে! ডাটা লোড করা হচ্ছে... ⏳');
    setIsSyncing(true);
    try {
      const data = await fetchFromGoogleSheet(normalized, settings.googleAppsScriptUrl);
      if (data.members.length > 0) {
        setMembers(data.members);
        setCollections(data.collections);
        saveSomitiData({ members: data.members, collections: data.collections, settings: updated, users });
        showToast(`অভিনন্দন! আপনার গুগল শিট থেকে মোট ${data.members.length} জন সদস্য সফলভাবে লোড হয়েছে! 🎉`);
      } else {
        showToast('গুগল শিট থেকে কোনো সদস্য পাওয়া যায়নি। লিংকটি "Anyone with the link can view" কিনা নিশ্চিত করুন।');
      }
    } catch (e: any) {
      showToast('শিট থেকে ডাটা লোড করতে সমস্যা হয়েছে: ' + (e.message || ''));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveWebhookUrl = (url: string) => {
    const updated = { ...settings, googleAppsScriptUrl: url };
    setSettings(updated);
    saveSomitiData({ members, collections, settings: updated, users });
    showToast('গুগল স্প্রেডশিট Apps Script URL সফলভাবে সংরক্ষিত হয়েছে!');
  };

  const handleClearCacheAndReload = async () => {
    setIsSyncing(true);
    showToast('আগের ক্যাশ ক্লিয়ার করে সরাসরি গুগল স্প্রেডশিট থেকে ফ্রেশ ডাটা আনা হচ্ছে...');
    try {
      clearLocalCache();
      const data = await loadSomitiData();
      setMembers(data.members);
      setCollections(data.collections);
      setSettings(data.settings);
      showToast(`সফলভাবে ক্যাশ ক্লিয়ার হয়েছে! গুগল শিট থেকে ${data.members.length} জন সদস্য প্রদর্শিত হচ্ছে। 🎉`);
    } catch (err: any) {
      showToast('গুগল শিট থেকে তথ্য আনতে সমস্যা হয়েছে: ' + (err.message || ''));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('আপনি কি গুগল সীটের মূল ডেমো ডেটা পুনরায় লোড করতে চান?')) {
      setMembers(INITIAL_MEMBERS);
      setCollections(INITIAL_COLLECTIONS);
      setSettings(INITIAL_SETTINGS);
      localStorage.removeItem('somiti_members_v3');
      localStorage.removeItem('somiti_collections_v3');
      localStorage.removeItem('somiti_settings_v3');
      localStorage.removeItem('somiti_last_updated_v3');
      localStorage.removeItem('somiti_deleted_member_ids_v3');
      localStorage.removeItem('somiti_deleted_collection_ids_v3');
      try {
        await fetch('/api/somiti/reset', { method: 'POST' });
      } catch {}
      showToast('ডেমো ডেটা রিসেট হয়েছে');
    }
  };

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const metrics = getMemberMetrics(m);
    if (statusFilter !== 'all' && metrics.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.address.toLowerCase().includes(q) ||
        String(m.id).toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 flex flex-col font-sans">
      {/* Offline Status Banner */}
      {!isOnline && (
        <div className="sticky top-0 z-50 bg-amber-500 dark:bg-amber-600 text-amber-950 dark:text-amber-50 px-4 py-2.5 text-center text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all">
          <WifiOff className="w-4.5 h-4.5 shrink-0 text-amber-950 dark:text-amber-50 animate-pulse" />
          <span>আপনার ইন্টারনেট সংযোগ বিচ্ছিন্ন! ⚠️ বর্তমানে অফলাইন মোডে আছেন। নতুন জমা ও পরিবর্তন ফোনে সংরক্ষিত হবে এবং নেট আসলে অটো ক্লাউডে আপলোড হবে।</span>
        </div>
      )}

      {/* Toast Alert */}
      {syncToast && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Top Application Header */}
      <Header
        settings={settings}
        user={user}
        isSyncing={isSyncing}
        onOpenDrawer={openDrawer}
        onToggleTheme={toggleDarkMode}
        onRefresh={refreshCloudData}
        onOpenCollectModal={() => openQuickCollect(null)}
        onOpenLogin={() => {
          setIsLoginOpen(true);
          window.history.pushState({ modal: 'login' }, '', '#login');
        }}
        onOpenLogout={() => {
          setIsLogoutOpen(true);
          window.history.pushState({ modal: 'logout' }, '', '#logout');
        }}
      />

      {/* Slide-out Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={closeModals}
        settings={settings}
        user={user}
        isSyncing={isSyncing}
        onNavigate={(tab) => {
          navigateToSection(tab);
          closeModals();
        }}
        onSelectThemeColor={handleSelectThemeColor}
        onToggleDarkMode={toggleDarkMode}
        onOpenBannerManager={() => {
          setIsDrawerOpen(false);
          setIsBannerManagerOpen(true);
        }}
        onOpenAppsScriptModal={() => {
          setIsDrawerOpen(false);
          setIsAppsScriptModalOpen(true);
        }}
        onOpenLogin={() => {
          setIsLoginOpen(true);
          window.history.pushState({ modal: 'login' }, '', '#login');
        }}
        onOpenLogout={() => {
          setIsLogoutOpen(true);
          window.history.pushState({ modal: 'logout' }, '', '#logout');
        }}
      />

      {/* Main Application Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6 pb-24 md:pb-12">
        {/* Tab Navigation Strip (Hidden on Mobile view as requested) */}
        <div className="hidden md:flex items-center justify-between border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2 gap-2 custom-scroll no-print">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => navigateToSection('dashboard')}
              className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>বোর্ড (ড্যাশবোর্ড)</span>
            </button>

            <button
              onClick={() => navigateToSection('members')}
              className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
                activeTab === 'members'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>সদস্য তালিকা ({members.length})</span>
            </button>

            <button
              onClick={() => navigateToSection('calculator')}
              className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
                activeTab === 'calculator'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>ঋণ ক্যালকুলেটর</span>
            </button>

            <button
              onClick={() => navigateToSection('profit')}
              className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
                activeTab === 'profit'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>লাভের হিসাব</span>
            </button>

            <button
              onClick={() => navigateToSection('reports')}
              className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>রিপোর্ট ও গ্রাফ</span>
            </button>

            <button
              onClick={() => navigateToSection('history')}
              className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>জমার ইতিহাস ({collections.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshCloudData}
              disabled={isSyncing}
              title="ক্লাউড ডাটাবেস থেকে তথ্য রিফ্রেশ করুন"
              className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              <RotateCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* 1. DASHBOARD VIEW: Fast Quick Access Hub */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top 4 Operational Metrics (Interactive, click opens dedicated view) */}
            <StatsCards
              currentMonthCollection={currentMonthCollection}
              totalLoansDisbursed={totalLoansDisbursed}
              totalCollectedAllTime={totalCollectedAllTime}
              totalOverdue={totalOverdue}
              totalProfit={totalProfit}
              memberCount={members.length}
              onFilterClick={(type) => {
                if (type === 'monthlyPaid') navigateToSection('monthlyPaid');
                else if (type === 'today') navigateToSection('reports');
                else if (type === 'total') navigateToSection('totalPaid');
                else if (type === 'due') navigateToSection('dueList');
                else if (type === 'members') navigateToSection('members');
                else if (type === 'profit') navigateToSection('profit');
              }}
            />

            {/* Banner Slider & Advertisement Section - Placed right below the top 4 cards and above the remaining cards */}
            <BannerSlider
              bannerConfig={bannerConfig}
              isAdmin={user.role === 'admin'}
              onOpenBannerManager={() => setIsBannerManagerOpen(true)}
              onNavigate={navigateToSection}
            />

            {/* Quick Action Buttons Grid (Remaining cards below the banner) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => navigateToSection('todayPaid')}
                className="p-4 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-left shadow-sm hover:shadow-md transition space-y-2 group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
                  <HandCoins className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base">আজকের কিস্তি সংগ্রহ</h4>
                  <p className="text-[11px] text-emerald-100">আজ ও কালকের দৈনিক আদায় রিপোর্ট</p>
                </div>
              </button>

              <button
                onClick={() => navigateToSection('dailyReport')}
                className="p-4 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-left shadow-sm hover:shadow-md transition space-y-2 group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base">দৈনিক রিপোর্ট</h4>
                  <p className="text-[11px] text-blue-100">সব আদায় ও তারিখভিত্তিক হিসাব</p>
                </div>
              </button>

              <button
                onClick={() => navigateToSection('reports')}
                className="p-4 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 text-white text-left shadow-sm hover:shadow-md transition space-y-2 group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base">মাসিক রিপোর্ট</h4>
                  <p className="text-[11px] text-purple-100">মাস অনুযায়ী হিসাব ও গ্রাফ</p>
                </div>
              </button>

              <button
                onClick={() => navigateToSection('calculator')}
                className="p-4 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white text-left shadow-sm hover:shadow-md transition space-y-2 group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base">ঋণ ক্যালকুলেটর</h4>
                  <p className="text-[11px] text-amber-100">১০ মাস মেয়াদে ২০% লাভ</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 2. MEMBERS DIRECTORY */}
        {activeTab === 'members' && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="সদস্যের নাম, মোবাইল নম্বর, বা ঠিকানা দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <option value="all">সব সদস্য ({members.length})</option>
                  <option value="due">বকেয়া আছে</option>
                  <option value="partial">আংশিক জমা</option>
                  <option value="paid">পরিশোধিত</option>
                </select>

                <button
                  onClick={openAddMember}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>নতুন সদস্য</span>
                </button>
              </div>
            </div>

            {filteredMembers.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
                <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">
                  কোনো সদস্য পাওয়া যায়নি
                </h3>
                <p className="text-xs text-slate-400">
                  অনুগ্রহ করে অন্য কোনো নাম বা ফিল্টার দিয়ে চেষ্টা করুন অথবা নতুন সদস্য যুক্ত করুন
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMembers.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    onSelect={openMemberDetail}
                    onQuickCollect={openQuickCollect}
                    onPreviewImage={(m) => setPreviewImageMember(m)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* 3. SUBPAGE: আজকের কিস্তি সংগ্রহ */}
        {activeTab === 'todayPaid' && (
          <DailyReportView
            title="আজকের কিস্তি সংগ্রহ"
            subtitle="আজকের আদায়ের সঠিক বিবরণ ও হিসাব"
            collections={collections}
            members={members}
            isAdmin={user.role === 'admin'}
            initialFilter="today"
            onBack={() => (window.history.length > 1 ? window.history.back() : navigateToSection('dashboard'))}
            onViewReceipt={openReceipt}
            onEditCollection={(col) => setEditingCollection(col)}
            onDeleteCollection={handleDeleteCollection}
            onQuickCollect={() => setIsCollectModalOpen(true)}
            onPreviewImage={(m) => setPreviewImageMember(m)}
          />
        )}

        {/* 4. SUBPAGE: সকল জমা (Total Paid View) */}
        {activeTab === 'totalPaid' && (
          <TotalPaidView
            members={members}
            currentMonthKey={currentMonthKey}
            onBack={() => (window.history.length > 1 ? window.history.back() : navigateToSection('dashboard'))}
            onSelectMember={openMemberDetail}
            onPreviewImage={(m) => setPreviewImageMember(m)}
          />
        )}

        {/* 5. SUBPAGE: বকেয়া তালিকা (Due Members View) */}
        {activeTab === 'dueList' && (
          <DueListView
            members={members}
            currentMonthKey={currentMonthKey}
            onBack={() => (window.history.length > 1 ? window.history.back() : navigateToSection('dashboard'))}
            onSelectMember={openMemberDetail}
            onQuickCollect={openQuickCollect}
          />
        )}

        {/* 6. SUBPAGE: দৈনিক রিপোর্ট (সব আদায় ডিফল্ট সিলেক্ট থাকবে) */}
        {activeTab === 'dailyReport' && (
          <DailyReportView
            title="দৈনিক কিস্তি আদায়ের রিপোর্ট"
            subtitle="সকল তারিখের আদায়ের পূর্ণাঙ্গ হিসাব"
            collections={collections}
            members={members}
            isAdmin={user.role === 'admin'}
            initialFilter="all"
            onBack={() => (window.history.length > 1 ? window.history.back() : navigateToSection('dashboard'))}
            onViewReceipt={openReceipt}
            onEditCollection={(col) => setEditingCollection(col)}
            onDeleteCollection={handleDeleteCollection}
            onQuickCollect={() => setIsCollectModalOpen(true)}
            onPreviewImage={(m) => setPreviewImageMember(m)}
          />
        )}

        {/* 7. LOAN CALCULATOR */}
        {activeTab === 'calculator' && <LoanCalculator />}

        {/* 8. PROFIT ANALYTICS */}
        {activeTab === 'profit' && <ProfitAnalytics members={members} />}

        {/* 9. REPORTS & BAR CHART */}
        {activeTab === 'monthlyPaid' && (
          <MonthlyPaidView
            members={members}
            onBack={() => navigateToSection('dashboard')}
            onSelectMember={openMemberDetail}
            currentMonthKey={currentMonthKey}
            onPreviewImage={(m) => setPreviewImageMember(m)}
          />
        )}
        {activeTab === 'reports' && (
          <ReportsView members={members} collections={collections} />
        )}

        {/* 10. COLLECTION HISTORY */}
        {activeTab === 'history' && (
          <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-600" />
                  <span>কিস্তি আদায়ের ইতিহাস ও রসিদ তালিকা</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  সমিতির সর্বমোট আদায়ের রসিদসমূহ
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                মোট {collections.length} টি রসিদ
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">রসিদ নং</th>
                      <th className="py-3 px-4">তারিখ</th>
                      <th className="py-3 px-4">সদস্যের নাম</th>
                      <th className="py-3 px-4">কিস্তির মাস</th>
                      <th className="py-3 px-4">মাধ্যম</th>
                      <th className="py-3 px-4 text-right">আদায়ের পরিমাণ</th>
                      <th className="py-3 px-4 text-center">রসিদ দেখুন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {collections.map((col) => (
                      <tr key={col.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">
                          {col.receiptNo}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{col.date}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {col.memberName}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {col.monthKey}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {col.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-600">
                          {formatTaka(col.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openReceipt(col)}
                              className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold transition"
                            >
                              রসিদ
                            </button>
                            {user.role === 'admin' && (
                              <>
                                <button
                                  onClick={() => setEditingCollection(col)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition"
                                  title="রসিদ এডিট করুন"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCollection(col)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition"
                                  title="রসিদ ডিলিট করুন"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
        {/* 11. USER MANAGEMENT & ADMIN PANEL */}
        {activeTab === 'users' && user.role === 'admin' && (
          <UserManagement
            users={users}
            currentUsername={user.username}
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-2 px-3 z-30 flex items-center justify-around shadow-lg no-print">
        <button
          onClick={() => navigateToSection('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[11px] font-semibold transition ${
            activeTab === 'dashboard'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>বোর্ড</span>
        </button>

        <button
          onClick={() => navigateToSection('members')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[11px] font-semibold transition ${
            activeTab === 'members'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>সদস্য</span>
        </button>

        {/* Center Quick Collect Button */}
        <button
          onClick={() => openQuickCollect(null)}
          className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition"
        >
          <HandCoins className="w-6 h-6" />
        </button>

        <button
          onClick={() => navigateToSection('profit')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[11px] font-semibold transition ${
            activeTab === 'profit'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span>লাভ</span>
        </button>

        <button
          onClick={openDrawer}
          className="flex flex-col items-center gap-1 py-1 px-2 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
        >
          <Sparkles className="w-5 h-5" />
          <span>মেনু</span>
        </button>
      </nav>

      {/* MODALS */}
      {/* 1. Member Profile & Detailed Statement */}
      <MemberDetailModal
        member={selectedMember}
        isAdmin={user.role === 'admin'}
        onClose={closeModals}
        onCollect={openQuickCollect}
        onEditMember={(m) => setEditingMember(m)}
        onDeleteMember={handleDeleteMember}
        onPreviewImage={(m) => setPreviewImageMember(m)}
      />

      {/* 2. Collect Installment Entry */}
      <CollectModal
        isOpen={isCollectModalOpen}
        members={members}
        preSelectedMember={collectTargetMember}
        collectorName={settings.collectorName}
        onClose={closeModals}
        onSubmit={handleRecordCollection}
      />

      {/* 3. Add New Borrower / Member */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={closeModals}
        onAddMember={handleAddMember}
        members={members}
      />

      {/* 4. Payment Money Receipt */}
      <ReceiptModal
        record={activeReceipt}
        settings={settings}
        onClose={closeModals}
      />



      {/* 6. User Login */}
      <LoginModal
        isOpen={isLoginOpen}
        users={users}
        onClose={closeModals}
        onLoginSuccess={(newSession) => {
          setUser(newSession);
          try {
            localStorage.setItem('somiti_user_session', JSON.stringify(newSession));
          } catch (e) {}
          showToast(`স্বাগতম, ${newSession.name}!`);
        }}
      />

      {/* 7. Logout Confirmation */}
      <LogoutModal
        isOpen={isLogoutOpen}
        onClose={closeModals}
        onConfirm={() => {
          setUser({
            username: '',
            name: 'লগআউট অবস্থা',
            role: 'viewer',
            isLoggedIn: false
          });
          localStorage.removeItem('somiti_user_session');
          showToast('সফলভাবে লগআউট করা হয়েছে');
        }}
      />
      {/* 8. Edit Collection Entry Modal (Admin) */}
      <EditCollectionModal
        isOpen={Boolean(editingCollection)}
        record={editingCollection}
        members={members}
        onClose={() => setEditingCollection(null)}
        onSave={handleSaveEditCollection}
      />

      {/* 8b. Edit Member Info Modal (Admin) */}
      <EditMemberModal
        isOpen={Boolean(editingMember)}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onSave={handleSaveEditMember}
      />

      {/* 9. Custom Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalState.isOpen}
        title={deleteModalState.title}
        description={deleteModalState.description}
        itemName={deleteModalState.itemName}
        onClose={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModalState.onConfirm}
      />

      {/* 10. Member Photo Preview Modal */}
      <ImagePreviewModal
        member={previewImageMember}
        onClose={() => setPreviewImageMember(null)}
      />

      {/* 11. Banner Ads & Slider Manager Modal (Admin) */}
      <BannerManagerModal
        isOpen={isBannerManagerOpen}
        onClose={closeModals}
        bannerConfig={bannerConfig}
        onSaveConfig={handleSaveBannerConfig}
      />

      {/* 12. Google Spreadsheet Apps Script Modal */}
      <GoogleAppsScriptModal
        isOpen={isAppsScriptModalOpen}
        onClose={() => setIsAppsScriptModalOpen(false)}
        currentWebhookUrl={settings.googleAppsScriptUrl}
        currentSheetUrl={settings.googleSheetUrl}
        onSaveWebhookUrl={handleSaveWebhookUrl}
        onSaveSheetUrl={handleSaveGoogleSheetUrl}
        onFetchFromSheet={handleFetchFromGoogleSheet}
        onExportToSheet={handleExportAllToGoogleSheet}
        onClearCache={handleClearCacheAndReload}
        isSyncing={isSyncing}
        memberCount={members.length}
        collectionCount={collections.length}
      />
    </div>
  );
}
