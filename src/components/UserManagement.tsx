import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldAlert,
  UserCheck,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Key,
  Clock,
  Circle,
  Search,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { AppUser, UserRole } from '../types';

interface UserManagementProps {
  users: AppUser[];
  currentUsername: string;
  onAddUser: (user: Omit<AppUser, 'id' | 'createdAt'>) => void;
  onEditUser: (user: AppUser) => void;
  onDeleteUser: (userId: string) => void;
}

export function formatTimeAgo(isoString?: string): { text: string; isOnline: boolean } {
  if (!isoString) return { text: 'কখনো সক্রিয় হয়নি', isOnline: false };
  const last = new Date(isoString).getTime();
  if (isNaN(last)) return { text: 'অজানা', isOnline: false };

  const now = Date.now();
  const diffSec = Math.floor((now - last) / 1000);

  if (diffSec < 180) {
    return { text: 'এখনই অনলাইনে আছেন', isOnline: true };
  } else if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    return { text: `${mins} মিনিট আগে সক্রিয় ছিলেন`, isOnline: false };
  } else if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return { text: `${hours} ঘন্টা আগে সক্রিয় ছিলেন`, isOnline: false };
  } else {
    const days = Math.floor(diffSec / 86400);
    return { text: `${days} দিন আগে সক্রিয় ছিলেন`, isOnline: false };
  }
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  currentUsername,
  onAddUser,
  onEditUser,
  onDeleteUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [errorMsg, setErrorMsg] = useState('');

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm))
  );

  const openAddModal = () => {
    setName('');
    setUsername('');
    setPassword('');
    setPhone('');
    setRole('user');
    setErrorMsg('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (u: AppUser) => {
    setEditingUser(u);
    setName(u.name);
    setUsername(u.username);
    setPassword(u.password || '');
    setPhone(u.phone || '');
    setRole(u.role);
    setErrorMsg('');
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim()) {
      setErrorMsg('অনুগ্রহ করে নাম, ইউজারনেম ও পাসওয়ার্ড লিখুন!');
      return;
    }
    const exists = users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (exists) {
      setErrorMsg('এই ইউজারনেম ইতিমধ্যেই নিবন্ধিত আছে! অন্য একটি ব্যবহার করুন।');
      return;
    }

    onAddUser({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      password: password.trim(),
      phone: phone.trim(),
      role,
      isOnline: false,
      lastActive: new Date().toISOString()
    });

    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!name.trim() || !username.trim()) {
      setErrorMsg('নাম ও ইউজারনেম ফাঁকা রাখা যাবে না!');
      return;
    }

    onEditUser({
      ...editingUser,
      name: name.trim(),
      username: username.trim().toLowerCase(),
      password: password.trim() || editingUser.password,
      phone: phone.trim(),
      role
    });

    setEditingUser(null);
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <ShieldAlert className="w-3 h-3" /> এডমিন (পূর্ণ নিয়ন্ত্রণ)
          </span>
        );
      case 'user':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <UserCheck className="w-3 h-3" /> ইউজার (ফিল্ড অফিসার)
          </span>
        );
      case 'viewer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Eye className="w-3 h-3" /> ভিউয়ার (শুধু দর্শক)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 rounded-3xl text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black">ইউজার ও অ্যাডমিন প্যানেল</h2>
          </div>
          <p className="text-xs text-slate-300">
            সকল ব্যবহারকারীর এক্সেস নিয়ন্ত্রণ করুন এবং রিয়েল-টাইম অনলাইন অ্যাক্টিভিটি ট্র্যাক করুন।
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg flex items-center gap-2 transition active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>নতুন ইউজার যোগ করুন</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="নাম, ইউজারনেম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold shrink-0">
          <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl border border-emerald-200 dark:border-emerald-800">
            🟢 অনলাইন: {users.filter((u) => formatTimeAgo(u.lastActive).isOnline).length} জন
          </span>
          <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
            মোট ইউজার: {users.length} জন
          </span>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((u) => {
          const status = formatTimeAgo(u.lastActive);
          const isCurrentUser = u.username.toLowerCase() === currentUsername.toLowerCase();

          return (
            <div
              key={u.id || u.username}
              className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border shadow-sm space-y-4 relative overflow-hidden transition hover:shadow-md ${
                isCurrentUser
                  ? 'border-blue-500/80 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Top User Info Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {u.name}
                      </h3>
                      {isCurrentUser && (
                        <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                          আপনি
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">@{u.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(u)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition"
                    title="ইউজার এডিট করুন"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!isCurrentUser && (
                    <button
                      onClick={() => setDeletingUserId(u.id)}
                      className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 rounded-xl transition"
                      title="ইউজার ডিলিট করুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Role & Status Info */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div>{getRoleBadge(u.role)}</div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{u.phone || 'মোবাইল যুক্ত নেই'}</span>
                  </div>

                  {/* Realtime Active Presence Badge */}
                  <div
                    className={`inline-flex items-center gap-1.5 font-bold text-[11px] px-2.5 py-1 rounded-xl ${
                      status.isOnline
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800 animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Circle
                      className={`w-2 h-2 fill-current ${
                        status.isOnline ? 'text-emerald-500' : 'text-slate-400'
                      }`}
                    />
                    <span>{status.text}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {(isAddModalOpen || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>{editingUser ? 'ইউজার তথ্য পরিবর্তন' : 'নতুন ইউজার অ্যাকাউন্ট তৈরি'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingUser(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={editingUser ? handleSaveEdit : handleSaveAdd} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  পুরো নাম *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: মোঃ রাজিব হোসেন"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ইউজারনেম *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="rajib"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    পাসওয়ার্ড *
                  </label>
                  <input
                    type="text"
                    required={!editingUser}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUser ? 'পাসওয়ার্ড অপরিবর্তিত রাখতে ফাঁকা রাখুন' : '••••••'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  মোবাইল নম্বর
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01700000000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ইউজার রোল (পাওয়ার ও এক্সেস লেভেল) *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">ইউজার (ফিল্ড অফিসার - কিস্তি এন্ট্রি করতে পারবে)</option>
                  <option value="admin">এডমিন (ম্যানেজার - সকল কিছু নিয়ন্ত্রণ ও ইউজার যোগ করতে পারবে)</option>
                  <option value="viewer">ভিউয়ার (শুধুমাত্র তথ্য দেখতে পারবে)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition"
                >
                  {editingUser ? 'পরিবর্তন সেভ করুন' : 'অ্যাকাউন্ট তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deletingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              ইউজার ডিলিট নিশ্চিত করুন
            </h3>
            <p className="text-xs text-slate-500">
              আপনি কি নিশ্চিত যে এই ইউজার অ্যাকাউন্টটি ডিলিট করতে চান?
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeletingUserId(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
              >
                বাতিল
              </button>
              <button
                onClick={() => {
                  onDeleteUser(deletingUserId);
                  setDeletingUserId(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md"
              >
                হ্যাঁ, ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
