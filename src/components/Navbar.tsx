import React from 'react';
import { useApp } from '../context/AppContext';
import { COLOR_PALETTE } from '../types';
import { ListIcon } from './ListIcon';
import {
  ChevronDown,
  Settings,
  Sun,
  Moon,
  Plus
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

  const activeColor = COLOR_PALETTE.find(c => c.id === activeList?.color) || COLOR_PALETTE[0];

  return (
    <header 
      className="sticky top-0 z-30 text-white shadow-md border-b transition-colors duration-200"
      style={{
        backgroundColor: 'var(--app-navbar-bg)',
        borderBottomColor: 'var(--app-navbar-border)',
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        
        {/* Zone 1: Current List Switcher Trigger */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onOpenListDrawer}
            className="flex items-center gap-2 py-1.5 px-3 rounded-xl text-white transition-all border max-w-[210px] sm:max-w-xs cursor-pointer active:scale-98"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.15)',
            }}
            title="انقر لفتح قائمة القوائم والتبديل بينها"
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 ${activeColor.bg}`}>
              <ListIcon name={activeList?.icon || 'boxes'} className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs sm:text-sm truncate">
              {activeList?.name || 'قائمة العداد'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          </button>

          {/* Quick + List Button */}
          <button
            type="button"
            onClick={onOpenCreateList}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-200 hover:text-white transition-all border cursor-pointer active:scale-95"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.15)',
            }}
            title="إنشاء قائمة جديدة"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Zone 2 & 3: Actions (Theme toggle, Settings) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Dark / Light Toggle */}
          <button
            type="button"
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-200 hover:text-white transition-all cursor-pointer border"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
            }}
            title={settings.darkMode ? 'التحويل للوضع الفاتح' : 'التحويل للوضع الداكن'}
          >
            {settings.darkMode ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-slate-200" />
            )}
          </button>

          {/* Settings button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-200 hover:text-white transition-all cursor-pointer border"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
            }}
            title="إعدادات التطبيق والتغذية الراجعة"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

