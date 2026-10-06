import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  FileSpreadsheet,
  Code2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  Settings,
  HelpCircle,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE, testGoogleSheetWebhookConnection, DEFAULT_APPS_SCRIPT_URL } from '../utils/googleSheetSync';

interface GoogleAppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWebhookUrl?: string;
  currentSheetUrl?: string;
  onSaveWebhookUrl?: (url: string) => void;
  onSaveSheetUrl?: (url: string) => void;
  onFetchFromSheet?: () => Promise<void>;
  onExportToSheet?: () => Promise<void>;
  onClearCache?: () => Promise<void> | void;
  isSyncing?: boolean;
  memberCount?: number;
  collectionCount?: number;
}

export const GoogleAppsScriptModal: React.FC<GoogleAppsScriptModalProps> = ({
  isOpen,
  onClose,
  currentWebhookUrl = DEFAULT_APPS_SCRIPT_URL,
  currentSheetUrl = '',
  onSaveWebhookUrl,
  onSaveSheetUrl,
  onFetchFromSheet,
  onExportToSheet,
  onClearCache,
  isSyncing = false,
  memberCount = 0,
  collectionCount = 0
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'guide' | 'settings'>('settings');
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({
    loading: false
  });
  const [customUrl, setCustomUrl] = useState(currentWebhookUrl);
  const [sheetUrlInput, setSheetUrlInput] = useState(currentSheetUrl);

  React.useEffect(() => {
    setSheetUrlInput(currentSheetUrl);
  }, [currentSheetUrl]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRunTest = async () => {
    setTestStatus({ loading: true });
    const res = await testGoogleSheetWebhookConnection(customUrl);
    setTestStatus({
      loading: false,
      success: res.success,
      message: res.message
    });
  };

  const handleSaveSettings = () => {
    if (onSaveWebhookUrl) {
      onSaveWebhookUrl(customUrl.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-700 to-blue-800 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">গুগল স্প্রেডশিট Apps Script কোড</h2>
              <p className="text-xs sm:text-sm text-emerald-100">
                স্প্রেডশিটে কিস্তি অটো-সেভ ও রিয়েল-টাইম সিঙ্ক করার পূর্ণাঙ্গ ব্যাকএন্ড স্ক্রিপ্ট
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-3 gap-2 bg-slate-50 dark:bg-slate-950/40">
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
              activeTab === 'code'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Apps Script কোড</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>সেটআপ গাইড (টিউটোরিয়াল)</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>কানেকশন টেস্ট ও লিংক</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: CODE */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
                  <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>নতুন আপডেট (কিস্তি সংশোধন ও যেকোনো পরিমাণ টাকা সাপোর্ট):</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  এডমিন কিস্তি এডিট করলে শিটে পূর্বের টাকার সাথে নতুন টাকা যোগ না হয়ে সরাসরি নতুন পরিমাণ প্রতিস্থাপন হবে। নিচের বাটনে চাপ দিয়ে কোডটি কপি করে Apps Script এ পেস্ট করুন এবং <strong>Deploy &gt; Manage deployments &gt; Edit &gt; New version</strong> নির্বাচন করে Deploy করুন।
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>প্রস্তুতকৃত Apps Script কোড</span>
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    নিচের কোডটি কপি করে আপনার গুগল স্প্রেডশিটের Apps Script এডিটর-এ পেস্ট করুন।
                  </p>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition transform active:scale-95 whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>কোড কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white" />
                      <span>সম্পূর্ণ কোড কপি করুন</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code display */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-900 text-slate-100">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-950 text-xs text-slate-400 border-b border-slate-800">
                  <span>Google Apps Script (Code.gs)</span>
                  <span>JavaScript</span>
                </div>
                <pre className="p-4 text-xs font-mono overflow-x-auto max-h-[380px] leading-relaxed select-all">
                  {GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: STEP-BY-STEP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>গুগল শিটে স্ক্রিপ্ট যুক্ত করার সহজ ৬টি ধাপ:</span>
                </h3>

                <ol className="space-y-3.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      ১
                    </span>
                    <div>
                      <p className="font-semibold">গুগল শিট ওপেন করুন</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        আপনার সমিতির গুগল স্প্রেডশিট ব্রাউজারে খুলুন।
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      ২
                    </span>
                    <div>
                      <p className="font-semibold">Apps Script এডিটরে প্রবেশ করুন</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        মেনু থেকে <strong>Extensions</strong> (এক্সটেনশন) ➔ <strong>Apps Script</strong> (অ্যাপস স্ক্রিপ্ট) এ ক্লিক করুন।
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      ৩
                    </span>
                    <div>
                      <p className="font-semibold">কোড পেস্ট এবং সেভ করুন</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        এডিটরে থাকা <code>myFunction()</code> মুছে দিন। এরপর ওপরের <strong>'Apps Script কোড'</strong> ট্যাব থেকে কপি করা কোডটি পেস্ট করুন এবং <strong>Save (Ctrl + S)</strong> চাপুন।
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      ৪
                    </span>
                    <div>
                      <p className="font-semibold">ওয়েব অ্যাপ হিসেবে ডিপ্লয় করুন</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        উপরে ডানে নীল <strong>Deploy</strong> বাটনে ক্লিক করে <strong>New deployment</strong> নির্বাচন করুন।
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      ৫
                    </span>
                    <div>
                      <p className="font-semibold">অনুমতি ও পারমিশন কনফিগারেশন (খুবই গুরুত্বপূর্ণ!)</p>
                      <ul className="text-xs text-slate-600 dark:text-slate-400 list-disc ml-5 mt-1 space-y-0.5">
                        <li>গিয়ার আইকনে ক্লিক করে <strong>Web app</strong> নির্বাচন করুন</li>
                        <li><strong>Execute as:</strong> <code>Me (আপনার গুগল একাউন্ট)</code></li>
                        <li><strong>Who has access:</strong> <code>Anyone</code> (অবশ্যই "Anyone" সিলেক্ট করবেন যাতে মোবাইল বা অ্যাপ থেকে গুগল লগইন চাওয়া ছাড়াই ডাটা সেভ হতে পারে)</li>
                      </ul>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      ৬
                    </span>
                    <div>
                      <p className="font-semibold">Web App URL কপি করুন</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Deploy বাটনে ক্লিক করলে যে <strong>Web app URL</strong> (যা <code>/exec</code> দিয়ে শেষ হয়) পাবেন, তা কপি করে এই অ্যাপের 'কানেকশন টেস্ট ও লিংক' ট্যাবে সেভ করে নিন।
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS & TEST */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Google Sheet URL Config */}
              <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-bold text-blue-950 dark:text-blue-100 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>আপনার নিজস্ব গুগল স্প্রেডশিট লিংক (Google Sheet URL):</span>
                  </label>
                  <span className="text-[10px] bg-blue-600/20 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
                    প্রধান ডেটা সোর্স
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={sheetUrlInput}
                    onChange={(e) => setSheetUrlInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                    className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {onSaveSheetUrl && (
                    <button
                      onClick={() => onSaveSheetUrl(sheetUrlInput.trim())}
                      disabled={isSyncing || !sheetUrlInput.trim()}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 flex-shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : 'সেভ ও শিট থেকে ডাটা আনুন'}</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                  💡 আপনার গুগল স্প্রেডশিটের উপরের <strong>Share</strong> বাটনে গিয়ে <strong>"Anyone with the link can view"</strong> (যে কেউ দেখতে পারে) অপশন দিয়ে লিংকটি কপি করে এখানে পেস্ট করুন। সাথে সাথে আপনার শিটের আসল সদস্যরা সফটওয়্যারে চলে আসবে।
                </p>
              </div>

              {/* Apps Script Webhook URL Config */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  আপনার ডিপ্লয়কৃত Apps Script Web App URL (ঐচ্ছিক - কিস্তি অটোপোস্ট ও এডিটের জন্য):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  {onSaveWebhookUrl && (
                    <button
                      onClick={handleSaveSettings}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      সেভ
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  নতুন কোনো স্ক্রিপ্ট ডিপ্লয় করলে প্রাপ্ত URL এখানে পেস্ট করে সেভ করুন।
                </p>
              </div>

              {/* Run Test */}
              <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      কানেকশন সক্রিয়তা যাচাই করুন
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      স্ক্রিপ্টটি ঠিকমতো কাজ করছে কিনা এবং গুগল পারমিশন ঠিক আছে কিনা তা পরীক্ষা করে।
                    </p>
                  </div>
                  <button
                    onClick={handleRunTest}
                    disabled={testStatus.loading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{testStatus.loading ? 'যাচাই হচ্ছে...' : 'টেস্ট করুন'}</span>
                  </button>
                </div>

                {testStatus.message && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                      testStatus.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {testStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span>{testStatus.message}</span>
                  </div>
                )}
              </div>

              {/* Data Import & Export Actions */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-850 dark:to-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <RefreshCw className={`w-4 h-4 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>গুগল স্প্রেডশিট ডাটা কন্ট্রোল ও সিঙ্ক</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      বর্তমান অ্যাপে: <span className="font-semibold text-slate-800 dark:text-slate-200">{memberCount} জন সদস্য</span> ও <span className="font-semibold text-slate-800 dark:text-slate-200">{collectionCount} টি কিস্তির রেকর্ড</span> রয়েছে
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {onFetchFromSheet && (
                    <button
                      onClick={onFetchFromSheet}
                      disabled={isSyncing}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-750 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
                    >
                      <Download className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>{isSyncing ? 'লোড হচ্ছে...' : 'শিট থেকে তথ্য আনুন ও দেখান'}</span>
                    </button>
                  )}

                  {onExportToSheet && (
                    <button
                      onClick={onExportToSheet}
                      disabled={isSyncing}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4 shrink-0" />
                      <span>{isSyncing ? 'পাঠানো হচ্ছে...' : 'সব তথ্য শিটে ব্যাকআপ পাঠান'}</span>
                    </button>
                  )}
                </div>

                {onClearCache && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <button
                      onClick={onClearCache}
                      disabled={isSyncing}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs font-bold transition disabled:opacity-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                      <span>আগের ক্যাশ/তথ্য মুছে সরাসরি শিট থেকে ফ্রেশ ডাটা লোড করুন</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            দশ তারা সমবায় সমিতি • স্প্রেডশিট অটো-সিঙ্ক ইঞ্জিন
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopyCode}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
            >
              কোড কপি
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
