import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { COLOR_PALETTE } from '../types';
import { ListIcon } from './ListIcon';
import { FilterSortBar } from './FilterSortBar';
import {
  Boxes,
  CheckCircle2,
  Sigma,
  TrendingUp,
  Clock,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  Search,
  Settings2,
  Sparkles
} from 'lucide-react';

interface ListHeaderStatsProps {
  onOpenCreateItem?: () => void;
  onOpenResetConfirm?: () => void;
  onOpenEditList: () => void;
}

export const ListHeaderStats: React.FC<ListHeaderStatsProps> = ({
  onOpenEditList,
}) => {
  const {
    activeList,
    searchQuery,
    setSearchQuery,
    filterMode,
    selectedColor,
    sortMode,
  } = useApp();

  // State to toggle properties panel containing Search & Stats
  const [isOpenProperties, setIsOpenProperties] = useState(false);

  if (!activeList) return null;

  const items = activeList.items || [];
  const totalItems = items.length;
  const positiveItems = items.filter(i => i.value > 0).length;
  const totalQuantities = items.reduce((sum, i) => sum + i.value, 0);
  const maxValue = items.length > 0 ? Math.max(...items.map(i => i.value)) : 0;
  
  // Format last updated date in Arabic
  const formattedDate = new Date(activeList.updatedAt).toLocaleDateString('ar-EG', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const colorConfig = COLOR_PALETTE.find(c => c.id === activeList.color) || COLOR_PALETTE[0];

  const hasActiveFilters = 
    Boolean(searchQuery.trim()) || 
    filterMode !== 'all' || 
    selectedColor !== 'all' || 
    sortMode !== 'manual';

  return (
    <div className="bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 shadow-xs transition-all">
      <div className="max-w-4xl mx-auto px-4 py-3 sm:px-6">
        
        {/* Title row: List Name + Properties Button */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div 
              onClick={onOpenEditList}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-white shadow-sm cursor-pointer hover:opacity-90 transition-opacity ${colorConfig.bg} shrink-0`}
              title="اضغط لتعديل القائمة"
            >
              <ListIcon name={activeList.icon} className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 
                onClick={onOpenEditList}
                className="text-base sm:text-lg font-extrabold text-[#0F172A] dark:text-white truncate cursor-pointer hover:text-[#00B8C4] transition-colors"
                title="اضغط لتعديل القائمة"
              >
                {activeList.name}
              </h1>
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>آخر تعديل: {formattedDate}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Active Search Pill & List Properties Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick search badge if properties panel is collapsed */}
            {!isOpenProperties && searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="hidden sm:flex items-center gap-1 py-1.5 px-2.5 rounded-xl bg-[#E6F9FA] dark:bg-slate-800 text-[#00B8C4] border border-[#00B8C4]/30 text-xs font-bold transition-all hover:bg-[#d0f4f7] cursor-pointer"
                title="إلغاء البحث الحالي"
              >
                <span>بحث: {searchQuery}</span>
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Search & List Properties Button */}
            <button
              type="button"
              onClick={() => setIsOpenProperties(!isOpenProperties)}
              className={`py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border ${
                isOpenProperties || hasActiveFilters
                  ? 'bg-[#00B8C4] hover:bg-[#009DA8] text-white border-[#00B8C4] shadow-[#00B8C4]/20'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0F172A] dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
              title="فتح البحث الفوري والتصفية وإحصائيات القائمة"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>البحث والخصائص</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
              )}
              {isOpenProperties ? (
                <ChevronUp className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Properties Panel: Search Row & Items Statistics */}
        {isOpenProperties && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            
            {/* Section 1: Search, Filter & Sort Toolbar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-[#00B8C4]" />
                  <span>البحث والفرز والتصفية في بنود القائمة:</span>
                </span>
              </div>
              <FilterSortBar embedded={true} />
            </div>

            {/* Section 2: Items Statistics (إحصائيات البنود) */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>إحصائيات البنود والكميات:</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  آخر تعديل: {formattedDate}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Total Items */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-[#0F172A] dark:text-white flex items-center justify-center shrink-0">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-none">
                      إجمالي البنود
                    </span>
                    <span className="text-base sm:text-lg font-mono font-bold text-[#0F172A] dark:text-white tabular-nums">
                      {totalItems}
                    </span>
                  </div>
                </div>

                {/* Positive Items (> 0) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-[#10B981] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-none">
                      بنود أكبر من صفر
                    </span>
                    <span className="text-base sm:text-lg font-mono font-bold text-[#10B981] tabular-nums">
                      {positiveItems}
                    </span>
                  </div>
                </div>

                {/* Sum of all quantities */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#E6F9FA] dark:bg-slate-800 text-[#00B8C4] flex items-center justify-center shrink-0">
                    <Sigma className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-none">
                      مجموع الكميات
                    </span>
                    <span className="text-base sm:text-lg font-mono font-bold text-[#00B8C4] tabular-nums">
                      {totalQuantities}
                    </span>
                  </div>
                </div>

                {/* Max Value */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-[#0F172A] dark:text-white flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-none">
                      أكبر قيمة
                    </span>
                    <span className="text-base sm:text-lg font-mono font-bold text-[#0F172A] dark:text-white tabular-nums">
                      {maxValue}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer actions inside properties: Edit List & Close */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={onOpenEditList}
                  className="py-1 px-2.5 rounded-lg text-[#00B8C4] hover:bg-[#00B8C4]/10 flex items-center gap-1 font-bold transition-colors cursor-pointer"
                >
                  <span>تعديل بيانات القائمة (الاسم، الأيقونة، اللون)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpenProperties(false)}
                  className="py-1 px-2.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 font-bold transition-colors cursor-pointer"
                >
                  <span>إخفاء الخصائص</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
