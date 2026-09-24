import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ItemFilterMode, SortMode, COLOR_PALETTE } from '../types';
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  Tag,
  Palette
} from 'lucide-react';

export const FilterSortBar: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    filterMode,
    setFilterMode,
    selectedCategory,
    setSelectedCategory,
    selectedColor,
    setSelectedColor,
    sortMode,
    setSortMode,
    activeList,
  } = useApp();

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Extract unique categories from current items
  const categories = Array.from(
    new Set(
      (activeList?.items || [])
        .map(i => i.category?.trim())
        .filter((c): c is string => Boolean(c))
    )
  );

  // Extract unique colors used in current items
  const usedColors = Array.from(
    new Set((activeList?.items || []).map(i => i.color || 'emerald'))
  );

  const hasActiveFilters = 
    filterMode !== 'all' || 
    selectedCategory !== 'all' || 
    selectedColor !== 'all' || 
    sortMode !== 'manual';

  const resetAllFilters = () => {
    setFilterMode('all');
    setSelectedCategory('all');
    setSelectedColor('all');
    setSortMode('manual');
    setSearchQuery('');
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-14 z-20 border-b border-slate-200/80 dark:border-slate-800/80 py-2.5 px-4 sm:px-6 transition-all">
      <div className="max-w-4xl mx-auto space-y-2.5">
        
        {/* Main row: Search + Quick status segmented pills + Filters Toggle */}
        <div className="flex items-center gap-2">
          {/* Instant Search Bar */}
          <div className="relative flex-1 min-w-[140px]">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="بحث فوري في البنود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-9 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-6 h-6 absolute left-2 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Segmented Filter: الكل | النشطة (>0) | الصفرية (0) */}
          <div className="hidden sm:flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold shrink-0">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilterMode('active')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                filterMode === 'active'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              النشطة فقط (&gt; 0)
            </button>
            <button
              onClick={() => setFilterMode('zero')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                filterMode === 'zero'
                  ? 'bg-slate-800 text-white dark:bg-slate-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              الصفرية (0)
            </button>
          </div>

          {/* Toggle Advanced Filters Button */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`py-2 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all shrink-0 ${
              hasActiveFilters || showAdvancedFilters
                ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-950/40 dark:border-blue-400 dark:text-blue-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">فرز وتصفية</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
        </div>

        {/* Mobile quick status pills */}
        <div className="flex sm:hidden items-center justify-between gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilterMode('all')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-colors ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setFilterMode('active')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-colors ${
              filterMode === 'active'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            النشطة (&gt; 0)
          </button>
          <button
            onClick={() => setFilterMode('zero')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-colors ${
              filterMode === 'zero'
                ? 'bg-slate-800 text-white dark:bg-slate-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            الصفرية (0)
          </button>
        </div>

        {/* Expandable Advanced Filters and Sorting Panel */}
        {showAdvancedFilters && (
          <div className="pt-2 pb-1 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Sort selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-blue-500" />
                  <span>الفرز والترتيب:</span>
                </label>
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                >
                  <option value="manual">الترتيب اليدوي (الافتراضي)</option>
                  <option value="value-desc">الكمية: من الأكبر للأصغر</option>
                  <option value="value-asc">الكمية: من الأصغر للأكبر</option>
                  <option value="name-asc">الاسم: أبجدياً (أ إلى ي)</option>
                  <option value="name-desc">الاسم: عكسي (ي إلى أ)</option>
                  <option value="updated-desc">أحدث تعديل أولاً</option>
                </select>
              </div>

              {/* Category filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-emerald-500" />
                  <span>التصفية حسب التصنيف:</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                >
                  <option value="all">جميع التصنيفات</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Palette className="w-3 h-3 text-purple-500" />
                  <span>التصفية حسب اللون:</span>
                </label>
                <div className="flex items-center gap-1.5 flex-wrap py-1">
                  <button
                    type="button"
                    onClick={() => setSelectedColor('all')}
                    className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors ${
                      selectedColor === 'all'
                        ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 border-transparent font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    كل الألوان
                  </button>
                  {usedColors.map((colorId) => {
                    const c = COLOR_PALETTE.find(item => item.id === colorId);
                    if (!c) return null;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedColor(c.id)}
                        className={`w-5 h-5 rounded-full ${c.bg} transition-transform ${
                          selectedColor === c.id
                            ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 scale-110'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                        title={c.label}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Clear filters button if any active */}
            {hasActiveFilters && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>إلغاء جميع الفلاتر</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
