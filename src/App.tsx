import React, { useState, useMemo, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ListItem, List } from './types';
import { useItemReorder } from './hooks/useItemReorder';
import { Navbar } from './components/Navbar';
import { QuickFieldToolbar } from './components/QuickFieldToolbar';
import { ListHeaderStats } from './components/ListHeaderStats';
import { ItemCard } from './components/ItemCard';
import { NumPadModal } from './components/NumPadModal';
import { VoiceCountModal } from './components/VoiceCountModal';
import { PocketLockOverlay } from './components/PocketLockOverlay';
import { AuditTrailModal } from './components/AuditTrailModal';
import { ItemFormModal } from './components/ItemFormModal';
import { ListFormModal } from './components/ListFormModal';
import { ListDrawer } from './components/ListDrawer';
import { SettingsModal } from './components/SettingsModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { ExportPreviewTab } from './components/ExportPreviewTab';
import { ImportItemsModal } from './components/ImportItemsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  PackagePlus,
  SearchX,
  Plus,
  Layers,
  Sparkles,
  ClipboardList,
  Boxes,
  FileText,
  FileSpreadsheet,
  ArrowRight,
  Coins,
  RotateCcw,
  LayoutGrid,
  List as ListIconLucide
} from 'lucide-react';

const MainView: React.FC = () => {
  const {
    activeList,
    searchQuery,
    filterMode,
    selectedColor,
    sortMode,
    setSearchQuery,
    setFilterMode,
    setSelectedColor,
    setSortMode,
    createItem,
    moveItemToPosition,
    settings,
    updateSettings,
  } = useApp();

  const handleReorder = useCallback((sourceId: string, targetId: string, placement: 'before' | 'after') => {
    moveItemToPosition(sourceId, targetId, placement);
  }, [moveItemToPosition]);

  const {
    draggedId,
    dropTarget,
    touchGhost,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useItemReorder({
    items: activeList?.items || [],
    onReorder: handleReorder,
  });

  // Export and Preview modal / full view state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Live totals for sticky bottom bar
  const totalQuantities = useMemo(() => {
    return activeList?.items.reduce((sum, item) => sum + item.value, 0) || 0;
  }, [activeList?.items]);

  const totalMonetaryValue = useMemo(() => {
    return activeList?.items.reduce((sum, item) => sum + (item.value * (item.price || 0)), 0) || 0;
  }, [activeList?.items]);

  // Modals state
  const [isListDrawerOpen, setIsListDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Voice Dictation modal
  const [voiceModalState, setVoiceModalState] = useState<{
    isOpen: boolean;
    item: ListItem | null;
  }>({
    isOpen: false,
    item: null,
  });

  // List create / edit modal
  const [isListFormOpen, setIsListFormOpen] = useState(false);
  const [listToEdit, setListToEdit] = useState<List | null>(null);

  // Item create / edit modal
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ListItem | null>(null);

  // Import Modal State (can be 'items' when inside list, or 'list' from lists drawer)
  const [importModalState, setImportModalState] = useState<{
    isOpen: boolean;
    mode: 'items' | 'list';
  }>({
    isOpen: false,
    mode: 'items',
  });

  // NumPad Modal (Add, Subtract, Set)
  const [numPadState, setNumPadState] = useState<{
    isOpen: boolean;
    item: ListItem | null;
    mode: 'add' | 'subtract' | 'set';
  }>({
    isOpen: false,
    item: null,
    mode: 'add',
  });

  // Filter and sort items calculation
  const displayedItems = useMemo(() => {
    if (!activeList) return [];

    let result = [...activeList.items];

    // 1. Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        (item.unit && item.unit.toLowerCase().includes(q))
      );
    }

    // 2. Active (> 0) / Zero (0) / Favorites Filter
    if (filterMode === 'active') {
      result = result.filter(item => item.value > 0);
    } else if (filterMode === 'zero') {
      result = result.filter(item => item.value === 0);
    } else if (filterMode === 'favorites') {
      result = result.filter(item => Boolean(item.isFavorite));
    }

    // 3. Color Filter
    if (selectedColor !== 'all') {
      result = result.filter(item => item.color === selectedColor);
    }

    // 5. Sorting
    switch (sortMode) {
      case 'value-desc':
        result.sort((a, b) => b.value - a.value);
        break;
      case 'value-asc':
        result.sort((a, b) => a.value - b.value);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name, 'ar'));
        break;
      case 'updated-desc':
        result.sort((a, b) => b.updatedAt - a.updatedAt);
        break;
      case 'manual':
      default:
        // Keep original order
        break;
    }

    // 6. Pin Favorites Always at the Top of the List
    result.sort((a, b) => {
      const aFav = a.isFavorite ? 1 : 0;
      const bFav = b.isFavorite ? 1 : 0;
      return bFav - aFav;
    });

    return result;
  }, [activeList, searchQuery, filterMode, selectedColor, sortMode]);

  // Modal handlers
  const handleOpenNumPad = (item: ListItem, mode: 'add' | 'subtract' | 'set') => {
    setNumPadState({
      isOpen: true,
      item,
      mode,
    });
  };

  const handleOpenVoiceForItem = (item: ListItem) => {
    setVoiceModalState({
      isOpen: true,
      item,
    });
  };

  const handleOpenCreateItem = () => {
    setItemToEdit(null);
    setIsItemFormOpen(true);
  };

  const handleOpenEditItem = (item: ListItem) => {
    setItemToEdit(item);
    setIsItemFormOpen(true);
  };

  const handleOpenCreateList = () => {
    setListToEdit(null);
    setIsListFormOpen(true);
  };

  const handleOpenEditList = (list?: List) => {
    setListToEdit(list || activeList || null);
    setIsListFormOpen(true);
  };

  const handleAddSampleItem = () => {
    createItem({
      name: 'بند جرد تجريبي جديد',
      value: 10,
      unit: 'قطعة',
      color: 'emerald',
      notes: 'تمت إضافته للبدء السريع',
    });
  };

  return (
    <div 
      className={`min-h-screen flex flex-col antialiased transition-colors duration-200 ${settings.darkMode ? 'dark' : ''}`}
      style={{
        backgroundColor: 'var(--app-bg)',
        color: 'var(--app-text)',
      }}
    >
      {/* Top Navigation Bar */}
      <Navbar
        onOpenListDrawer={() => setIsListDrawerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCreateList={handleOpenCreateList}
      />

      {/* Quick Field Toolbar (One-touch Sound, Haptics, Pocket Lock, Undo, Voice) */}
      <QuickFieldToolbar
        onOpenVoiceModal={() => setVoiceModalState({ isOpen: true, item: null })}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
      />

      {/* Primary Inventory & Counting View (بدون تقسيم تبويبات علوية) */}
      <div className="pt-2">
        {/* List Statistics Header (يحتوي على زر خصائص القائمة المنسدل للبحث والإحصائيات) */}
        <ListHeaderStats
          onOpenCreateItem={handleOpenCreateItem}
          onOpenResetConfirm={() => setIsResetConfirmOpen(true)}
          onOpenEditList={() => handleOpenEditList()}
        />

        {/* Main Items Content Area */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 py-3 sm:px-6 pb-8">
          {/* Header & Quick Action Row directly adjacent to the items */}
          <div className="flex items-center justify-between gap-3 mb-3.5 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-200">
                البنود والمواد ({displayedItems.length})
              </span>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                (امسك البند واسحبه لأعلى أو لأسفل لترتيبه)
              </span>
            </div>

            {/* Actions: View Mode toggle, Reset Counters, Import Items & Add New Item */}
            <div className="flex items-center gap-2">
              {/* Quick View Mode Toggle (Comfortable vs Compact) */}
              <button
                type="button"
                onClick={() => updateSettings({ viewMode: (settings.viewMode || 'comfortable') === 'comfortable' ? 'compact' : 'comfortable' })}
                className="p-2 sm:py-2.5 sm:px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0F172A] dark:text-slate-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                title={(settings.viewMode || 'comfortable') === 'comfortable' ? 'التبديل إلى العرض المدمج السريع' : 'التبديل إلى العرض القياسي المريح'}
              >
                {(settings.viewMode || 'comfortable') === 'compact' ? (
                  <>
                    <LayoutGrid className="w-4 h-4 text-[#00B8C4]" />
                    <span className="hidden sm:inline text-xs">عرض قياسي</span>
                  </>
                ) : (
                  <>
                    <ListIconLucide className="w-4 h-4 text-slate-500" />
                    <span className="hidden sm:inline text-xs">عرض مدمج</span>
                  </>
                )}
              </button>

              {/* Reset Counters Action button (Red #EF4444) */}
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/40 text-[#EF4444] dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                title="تصفير جميع عدادات القائمة الحالية"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden xs:inline">تصفير العدادات</span>
                <span className="xs:hidden">تصفير</span>
              </button>

              {/* Import items button */}
              <button
                type="button"
                onClick={() => setImportModalState({ isOpen: true, mode: 'items' })}
                className="py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0F172A] dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-2xs active:scale-95"
                title="استيراد بنود جديدة إلى هذه القائمة من نص منسق أو ملف CSV أو إكسل"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#00B8C4]" />
                <span className="hidden xs:inline">استيراد بنود</span>
              </button>

              {/* Add New Item button (Primary Turquoise #00B8C4) */}
              <button
                type="button"
                onClick={handleOpenCreateItem}
                className="py-2 px-3.5 sm:py-2.5 sm:px-4 rounded-xl bg-[#00B8C4] hover:bg-[#009DA8] text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-[#00B8C4]/25 active:scale-95 transition-all cursor-pointer border border-[#00B8C4]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ إضافة بند جديد</span>
              </button>
            </div>
          </div>

            {displayedItems.length > 0 ? (
              <div className={
                (settings.viewMode || 'comfortable') === 'compact'
                  ? "grid grid-cols-1 sm:grid-cols-2 gap-2 relative"
                  : "grid grid-cols-1 gap-2.5 relative"
              }>
                {displayedItems.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    isDragging={draggedId === item.id}
                    dropIndicator={dropTarget?.id === item.id ? dropTarget.placement : null}
                    onDragStartHandler={handleDragStart}
                    onDragOverHandler={handleDragOver}
                    onDropHandler={handleDrop}
                    onDragEndHandler={handleDragEnd}
                    onTouchDragStartHandler={handleTouchStart}
                    onTouchDragMoveHandler={handleTouchMove}
                    onTouchDragEndHandler={handleTouchEnd}
                    onOpenAdvanced={handleOpenNumPad}
                    onOpenEditForm={handleOpenEditItem}
                    onOpenVoiceForItem={handleOpenVoiceForItem}
                  />
                ))}
              </div>
            ) : (
              /* Empty States */
              <div className="py-16 px-4 text-center">
                {activeList && activeList.items.length === 0 ? (
                  /* Completely Empty List */
                  <div className="max-w-sm mx-auto space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-[#E6F9FA] dark:bg-slate-800 text-[#00B8C4] flex items-center justify-center mx-auto shadow-inner">
                      <PackagePlus className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-white">
                        هذه القائمة فارغة حالياً
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        ابدأ بإضافة المواد أو الأصناف لبدء الحصر والعد السريع.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                      <button
                        onClick={handleOpenCreateItem}
                        className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[#00B8C4] hover:bg-[#009DA8] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm border border-[#00B8C4]"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة أول بند</span>
                      </button>
                      <button
                        onClick={() => setImportModalState({ isOpen: true, mode: 'items' })}
                        className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[#0F172A] dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-[#00B8C4]" />
                        <span>استيراد بنود (CSV / نص)</span>
                      </button>
                      <button
                        onClick={handleAddSampleItem}
                        className="w-full sm:w-auto py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        بند تجريبي
                      </button>
                    </div>
                  </div>
                ) : (
                  /* No items matching the active filters */
                  <div className="max-w-sm mx-auto space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <SearchX className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                        لا توجد بنود تطابق شروط البحث أو التصفية
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        جرب تغيير كلمة البحث أو إعادة ضبط خيارات التصفية.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterMode('all');
                        setSelectedColor('all');
                        setSortMode('manual');
                      }}
                      className="py-2 px-4 rounded-xl bg-white dark:bg-slate-800 text-[#00B8C4] border border-[#00B8C4] text-xs font-bold hover:bg-[#E6F9FA]"
                    >
                      إلغاء جميع الفلاتر
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
      </div>

      {/* Memorial Dedication Footer (مع مساحة سفلية كافية للشريط الثابت) */}
      <footer className="max-w-4xl w-full mx-auto px-4 py-6 pb-28 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80">
        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
          🤲 نسألكم صالح الدعاء لأخيكم أحمد عبد الغني
        </p>
      </footer>

      {/* Fixed Sticky Bottom Action Bar (شريط التصدير الثابت في أسفل شاشة الهاتف) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] py-2.5 px-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Quick Metrics Summary */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 text-xs overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[#0F172A] dark:text-slate-300 shrink-0 font-medium border border-slate-200/50 dark:border-slate-700/50">
              <span className="text-slate-500 dark:text-slate-400">البنود:</span>
              <span className="font-mono font-bold text-[#0F172A] dark:text-white tabular-nums">
                {activeList?.items.length || 0}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#E6F9FA] dark:bg-slate-800 text-[#00B8C4] border border-[#00B8C4]/30 shrink-0 font-medium">
              <span className="hidden xs:inline">مجموع الكميات:</span>
              <span className="xs:hidden">الكميات:</span>
              <span className="font-mono font-bold tabular-nums">
                {totalQuantities}
              </span>
            </div>

            {totalMonetaryValue > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981] border border-[#10B981]/30 shrink-0 font-medium">
                <Coins className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="hidden sm:inline">القيمة:</span>
                <span className="font-mono font-bold tabular-nums">
                  {totalMonetaryValue.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Sticky Export Tab / Action Button (Turquoise #00B8C4) */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="py-2.5 px-3.5 sm:px-6 rounded-xl bg-[#00B8C4] hover:bg-[#009DA8] active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-md shadow-[#00B8C4]/25 transition-all shrink-0 cursor-pointer border border-[#00B8C4]"
            title="معاينة وتصدير تقرير الجرد (PDF / Excel / صورة / واتساب)"
          >
            <FileText className="w-4 h-4 stroke-[2.5]" />
            <span>معاينة وتصدير التقرير</span>
          </button>
        </div>
      </div>

      {/* Export & Preview Modal (نافذة التقرير والمعاينة الكاملة) */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setIsExportModalOpen(false)}
          />

          <div className="relative w-full max-w-4xl mx-auto h-[92vh] sm:h-[88vh] bg-slate-50 dark:bg-slate-950 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#00B8C4] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#00B8C4]/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                    معاينة وتصدير التقرير
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    قائمة: <strong className="text-[#00B8C4]">{activeList?.name}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="py-2 px-3.5 sm:px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 shrink-0"
              >
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                <span>العودة للعد والجرد</span>
              </button>
            </div>

            {/* Modal Scrollable Report Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-contain">
              <ExportPreviewTab onClose={() => setIsExportModalOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      <ListDrawer
        isOpen={isListDrawerOpen}
        onClose={() => setIsListDrawerOpen(false)}
        onOpenCreateList={handleOpenCreateList}
        onOpenEditList={handleOpenEditList}
        onOpenImportItems={() => setImportModalState({ isOpen: true, mode: 'list' })}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Tactile On-Screen NumPad Modal for (+), (-), and direct quantity overwrite */}
      <NumPadModal
        isOpen={numPadState.isOpen}
        onClose={() => setNumPadState(prev => ({ ...prev, isOpen: false }))}
        item={numPadState.item}
        mode={numPadState.mode}
      />

      {/* Hands-Free Voice Counter Modal */}
      <VoiceCountModal
        isOpen={voiceModalState.isOpen}
        onClose={() => setVoiceModalState({ isOpen: false, item: null })}
        targetItem={voiceModalState.item}
      />

      {/* Audit Trail & Quick Undo Modal */}
      <AuditTrailModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      {/* Pocket Lock Screen Protection */}
      <PocketLockOverlay />

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Floating Touch Drag Ghost for Mobile */}
      {touchGhost && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 dark:bg-slate-900/95 border-2 border-[#00B8C4] rounded-2xl shadow-2xl p-3 w-64 opacity-95 flex items-center justify-between backdrop-blur-md transition-none"
          style={{
            left: `${touchGhost.x}px`,
            top: `${touchGhost.y}px`,
          }}
        >
          <div className="min-w-0 flex-1">
            <span className="font-black text-sm text-slate-900 dark:text-white truncate block">
              {touchGhost.name}
            </span>
            <span className="text-[11px] text-[#00B8C4] font-bold">
              جاري السحب والترتيب...
            </span>
          </div>
          <div className="text-base font-mono font-black text-slate-800 dark:text-slate-200 shrink-0 mr-2">
            {touchGhost.value} {touchGhost.unit || ''}
          </div>
        </div>
      )}

      <ItemFormModal
        isOpen={isItemFormOpen}
        onClose={() => setIsItemFormOpen(false)}
        itemToEdit={itemToEdit}
      />

      <ListFormModal
        isOpen={isListFormOpen}
        onClose={() => setIsListFormOpen(false)}
        listToEdit={listToEdit}
      />

      <ImportItemsModal
        isOpen={importModalState.isOpen}
        importMode={importModalState.mode}
        onClose={() => setImportModalState(prev => ({ ...prev, isOpen: false }))}
        onOpenCreateList={() => {
          setListToEdit(null);
          setIsListFormOpen(true);
        }}
      />

      <ResetConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainView />
    </AppProvider>
  );
}
