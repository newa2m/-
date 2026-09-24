import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { COLOR_PALETTE } from '../types';
import { ListIcon } from './ListIcon';
import {
  Layers,
  ChevronDown,
  Settings,
  Sun,
  Moon,
  Download,
  Plus,
  WifiOff,
  Share
} from 'lucide-react';

interface NavbarProps {
  onOpenListDrawer: () => void;
  onOpenSettings: () => void;
  onOpenCreateList: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenListDrawer,
  onOpenSettings,
  onOpenCreateList,
}) => {
  const { lists, activeList, settings, updateSettings } = useApp();
  const { isInstallable, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const activeColor = COLOR_PALETTE.find(c => c.id === activeList?.color) || COLOR_PALETTE[0];

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          
          {/* Zone 1: Current List Switcher Trigger */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onOpenListDrawer}
              className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-white transition-colors border border-slate-700/60 max-w-[210px] sm:max-w-xs"
              title="انقر لفتح قائمة القوائم والتبديل بينها"
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 ${activeColor.bg}`}>
                <ListIcon name={activeList?.icon || 'boxes'} className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-xs sm:text-sm truncate">
                {activeList?.name || 'قائمة العداد'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Quick + List Button */}
            <button
              type="button"
              onClick={onOpenCreateList}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors border border-slate-700/60"
              title="إنشاء قائمة جديدة"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Zone 2 & 3: Actions (PWA install, Theme toggle, Settings) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Install PWA Button (Android/Chrome) */}
            {isInstallable && (
              <button
                type="button"
                onClick={install}
                className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                title="تثبيت التطبيق على جهازك كـ تطبيق أندرويد"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تثبيت التطبيق</span>
              </button>
            )}

            {/* Install Guide on iOS Safari */}
            {isIOS && (
              <button
                type="button"
                onClick={() => setShowIOSGuide(true)}
                className="py-1 px-2.5 rounded-lg border border-slate-700 text-[11px] text-slate-300 hover:bg-slate-800"
              >
                تثبيت App
              </button>
            )}

            {/* Dark / Light Toggle */}
            <button
              type="button"
              onClick={() => updateSettings({ darkMode: !settings.darkMode })}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title={settings.darkMode ? 'التحويل للوضع الفاتح' : 'التحويل للوضع الداكن'}
            >
              {settings.darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-300" />
              )}
            </button>

            {/* Settings button */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="إعدادات التطبيق والتغذية الراجعة"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* iOS Installation instructions modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-right space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Share className="w-4 h-4 text-blue-500" />
              <span>تثبيت التطبيق على جهازك</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              1. اضغط على زر <strong>المشاركة (Share)</strong> في شريط متصفح سفاري.<br />
              2. مرر لأسفل واختر <strong>"إضافة إلى الصفحة الرئيسية" (Add to Home Screen)</strong>.<br />
              3. سيعمل التطبيق كأنه تطبيق هاتف أصلي بدون شريط المتصفح ويعمل دون اتصال بالإنترنت.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-bold"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
};
