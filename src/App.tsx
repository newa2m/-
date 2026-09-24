import React, { useState, useMemo } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ListItem, List } from './types';
import { Navbar } from './components/Navbar';
import { ListHeaderStats } from './components/ListHeaderStats';
import { FilterSortBar } from './components/FilterSortBar';
import { ItemCard } from './components/ItemCard';
import { AdvancedCounterModal } from './components/AdvancedCounterModal';
import { DirectEditModal } from './components/DirectEditModal';
import { ItemFormModal } from './components/ItemFormModal';
import { ListFormModal } from './components/ListFormModal';
import { ListDrawer } from './components/ListDrawer';
import { SettingsModal } from './components/SettingsModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { ExportModal } from './components/ExportModal';
import {
  PackagePlus,
  SearchX,
  Plus,
  Layers,
  Sparkles,
  ClipboardList
} from 'lucide-react';

const MainView: React.FC = () => {
  const {
    activeList,
    searchQuery,
    filterMode,
    selectedCategory,
    selectedColor,
    sortMode,
    setSearchQuery,
    setFilterMode,
    setSelectedCategory,
    setSelectedColor,
    setSortMode,
    createItem,
  } = useApp();

  // Modals state
  const [isListDrawerOpen, setIsListDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // List create / edit modal
  const [isListFormOpen, setIsListFormOpen] = useState(false);
  const [listToEdit, setListToEdit] = useState<List | null>(null);

  // Item create / edit modal
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ListItem | null>(null);

  // Advanced addition/subtraction modal
  const [advancedModalState, setAdvancedModalState] = useState<{
    isOpen: boolean;
    item: ListItem | null;
    mode: 'add' | 'subtract';
  }>({
    isOpen: false,
    item: null,
    mode: 'add',
  });

  // Direct edit modal
  const [directEditModalState, setDirectEditModalState] = useState<{
    isOpen: boolean;
    item: ListItem | null;
  }>({
    isOpen: false,
    item: null,
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
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        (item.unit && item.unit.toLowerCase().includes(q))
      );
    }

    // 2. Active (> 0) / Zero (0) Filter
    if (filterMode === 'active') {
      result = result.filter(item => item.value > 0);
    } else if (filterMode === 'zero') {
      result = result.filter(item => item.value === 0);
    }

    // 3. Category Filter
    if (selectedCategory !== 'all') {
      result = result.filter(item => item.category === selectedCategory);
    }

    // 4. Color Filter
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

    return result;
  }, [activeList, searchQuery, filterMode, selectedCategory, selectedColor, sortMode]);

  // Modal handlers
  const handleOpenAdvanced = (item: ListItem, mode: 'add' | 'subtract') => {
    setAdvancedModalState({
      isOpen: true,
      item,
      mode,
    });
  };

  const handleOpenDirectEdit = (item: ListItem) => {
    setDirectEditModalState({
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
      category: 'عام',
      color: 'emerald',
      notes: 'تمت إضافته للبدء السريع',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* Top Navigation Bar */}
      <Navbar
        onOpenListDrawer={() => setIsListDrawerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCreateList={handleOpenCreateList}
      />

      {/* List Statistics Header */}
      <ListHeaderStats
        onOpenCreateItem={handleOpenCreateItem}
        onOpenResetConfirm={() => setIsResetConfirmOpen(true)}
        onOpenEditList={() => handleOpenEditList()}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Filter and Sort Toolbar */}
      <FilterSortBar />

      {/* Main Items Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 sm:px-6 pb-24 sm:pb-12">
        {displayedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {displayedItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onOpenAdvanced={handleOpenAdvanced}
                onOpenDirectEdit={handleOpenDirectEdit}
                onOpenEditForm={handleOpenEditItem}
              />
            ))}
          </div>
        ) : (
          /* Empty States */
          <div className="py-16 px-4 text-center">
            {activeList && activeList.items.length === 0 ? (
              /* Completely Empty List */
              <div className="max-w-sm mx-auto space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
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
                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة أول بند</span>
                  </button>
                  <button
                    onClick={handleAddSampleItem}
                    className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    إضافة بند تجريبي
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
                    setSelectedCategory('all');
                    setSelectedColor('all');
                    setSortMode('manual');
                  }}
                  className="py-2 px-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100"
                >
                  إلغاء جميع الفلاتر
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Bottom Quick Action for Thumb-Zone Ease on Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-20 sm:hidden bg-gradient-to-t from-white via-white/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 p-3 pb-safe border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-2 max-w-sm mx-auto">
          <button
            onClick={() => setIsListDrawerOpen(true)}
            className="h-12 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
          >
            <Layers className="w-4 h-4 text-blue-500" />
            <span>القوائم</span>
          </button>
          <button
            onClick={handleOpenCreateItem}
            className="flex-1 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 active:scale-98 transition-all"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>إضافة بند جديد (+)</span>
          </button>
        </div>
      </div>

      {/* Modals & Drawers */}
      <ListDrawer
        isOpen={isListDrawerOpen}
        onClose={() => setIsListDrawerOpen(false)}
        onOpenCreateList={handleOpenCreateList}
        onOpenEditList={handleOpenEditList}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      <AdvancedCounterModal
        isOpen={advancedModalState.isOpen}
        onClose={() => setAdvancedModalState(prev => ({ ...prev, isOpen: false }))}
        item={advancedModalState.item}
        mode={advancedModalState.mode}
      />

      <DirectEditModal
        isOpen={directEditModalState.isOpen}
        onClose={() => setDirectEditModalState(prev => ({ ...prev, isOpen: false }))}
        item={directEditModalState.item}
      />

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
