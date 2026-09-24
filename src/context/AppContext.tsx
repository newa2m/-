import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { List, ListItem, AppSettings, DebounceDelay, SortMode, ItemFilterMode } from '../types';
import { INITIAL_LISTS } from '../data/defaultData';
import { feedback } from '../utils/feedback';

interface AppContextType {
  lists: List[];
  activeListId: string;
  activeList: List | undefined;
  settings: AppSettings;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterMode: ItemFilterMode;
  setFilterMode: (m: ItemFilterMode) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  selectedColor: string;
  setSelectedColor: (c: string) => void;
  sortMode: SortMode;
  setSortMode: (s: SortMode) => void;
  
  // List actions
  setActiveListId: (id: string) => void;
  createList: (data: { name: string; color: string; icon: string }) => string;
  updateList: (id: string, data: Partial<Omit<List, 'id' | 'items' | 'createdAt'>>) => void;
  duplicateList: (id: string) => void;
  deleteList: (id: string) => void;
  reorderLists: (sourceIndex: number, destIndex: number) => void;
  moveListStep: (id: string, direction: 'up' | 'down') => void;

  // Item actions
  createItem: (itemData: Omit<ListItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (itemId: string, itemData: Partial<Omit<ListItem, 'id' | 'createdAt'>>) => void;
  duplicateItem: (itemId: string) => void;
  deleteItem: (itemId: string) => void;
  incrementItem: (itemId: string, amount?: number) => boolean;
  decrementItem: (itemId: string, amount?: number) => boolean;
  setItemValue: (itemId: string, value: number) => void;
  resetItemValue: (itemId: string) => void;
  resetAllListItems: (listId: string) => void;

  // Settings
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  
  // Backup / Export
  exportActiveListCSV: () => void;
  exportAllDataJSON: () => void;
  importDataJSON: (jsonString: string) => boolean;
  resetToDefaultData: () => void;
}

const STORAGE_KEY_LISTS = 'inv_counter_lists_v1';
const STORAGE_KEY_SETTINGS = 'inv_counter_settings_v1';
const STORAGE_KEY_ACTIVE = 'inv_counter_active_v1';

const DEFAULT_SETTINGS: AppSettings = {
  debounceDelay: 100, // 100ms default protection
  hapticFeedback: true,
  soundFeedback: true,
  quickPresets: [5, 10, 20, 50, 100],
  allowNegative: false,
  keepScreenAwake: false,
  darkMode: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved state or default
  const [lists, setLists] = useState<List[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LISTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If the new plumbing lists are not yet in the user's saved lists, prepend or merge them!
          const existingIds = new Set(parsed.map((l: List) => l.id));
          const missingInitial = INITIAL_LISTS.filter(l => !existingIds.has(l.id));
          if (missingInitial.length > 0) {
            const merged = [...missingInitial, ...parsed];
            localStorage.setItem(STORAGE_KEY_LISTS, JSON.stringify(merged));
            return merged;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load lists from localStorage', e);
    }
    return INITIAL_LISTS;
  });

  const [activeListId, setActiveListId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (saved && lists.some(l => l.id === saved)) return saved;
    } catch (e) {}
    return lists[0]?.id || '';
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {}
    // Detect system dark mode default
    const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return { ...DEFAULT_SETTINGS, darkMode: prefersDark };
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<ItemFilterMode>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('manual');

  // Debounce lock tracking per item
  const lastTapRef = useRef<Map<string, number>>(new Map());

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LISTS, JSON.stringify(lists));
    } catch (e) {
      console.error('Failed to save lists', e);
    }
  }, [lists]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE, activeListId);
    } catch (e) {}
  }, [activeListId]);

  // Apply Dark mode class to document HTML
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Wake lock on screen awake setting
  useEffect(() => {
    feedback.setKeepAwake(settings.keepScreenAwake);
    return () => {
      feedback.setKeepAwake(false);
    };
  }, [settings.keepScreenAwake]);

  const activeList = lists.find(l => l.id === activeListId) || lists[0];

  // Helper to trigger sensory feedback
  const triggerFeedback = useCallback((type: 'increment' | 'decrement' | 'tap' | 'reset' = 'tap') => {
    if (settings.soundFeedback) {
      feedback.playClick(type);
    }
    if (settings.hapticFeedback) {
      feedback.vibrate(type === 'reset' ? [20, 40, 20] : 14);
    }
  }, [settings.soundFeedback, settings.hapticFeedback]);

  // Anti-double-tap debounce check
  const checkDebounce = useCallback((itemId: string): boolean => {
    if (settings.debounceDelay === 0) return true;
    const now = Date.now();
    const last = lastTapRef.current.get(itemId) || 0;
    if (now - last < settings.debounceDelay) {
      return false; // Accidental double tap prevented
    }
    lastTapRef.current.set(itemId, now);
    return true;
  }, [settings.debounceDelay]);

  // List actions
  const createList = useCallback((data: { name: string; color: string; icon: string }) => {
    const newListId = `list-${Date.now()}`;
    const newList: List = {
      id: newListId,
      name: data.name.trim() || 'قائمة جديدة',
      color: data.color || 'emerald',
      icon: data.icon || 'boxes',
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: lists.length,
    };
    setLists(prev => [...prev, newList]);
    setActiveListId(newListId);
    triggerFeedback('tap');
    return newListId;
  }, [lists.length, triggerFeedback]);

  const updateList = useCallback((id: string, data: Partial<Omit<List, 'id' | 'items' | 'createdAt'>>) => {
    setLists(prev => prev.map(l => {
      if (l.id !== id) return l;
      return {
        ...l,
        ...data,
        updatedAt: Date.now(),
      };
    }));
    triggerFeedback('tap');
  }, [triggerFeedback]);

  const duplicateList = useCallback((id: string) => {
    const target = lists.find(l => l.id === id);
    if (!target) return;

    const newListId = `list-${Date.now()}`;
    const duplicatedItems: ListItem[] = target.items.map(item => ({
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    const newList: List = {
      ...target,
      id: newListId,
      name: `${target.name} (نسخة)`,
      items: duplicatedItems,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: lists.length,
    };

    setLists(prev => [...prev, newList]);
    setActiveListId(newListId);
    triggerFeedback('tap');
  }, [lists, triggerFeedback]);

  const deleteList = useCallback((id: string) => {
    setLists(prev => {
      const remaining = prev.filter(l => l.id !== id);
      if (remaining.length === 0) {
        // Keep at least one empty list
        const emptyList: List = {
          id: `list-${Date.now()}`,
          name: 'قائمة عامة',
          color: 'emerald',
          icon: 'boxes',
          items: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          order: 0,
        };
        setActiveListId(emptyList.id);
        return [emptyList];
      }
      if (activeListId === id) {
        setActiveListId(remaining[0].id);
      }
      return remaining;
    });
    triggerFeedback('reset');
  }, [activeListId, triggerFeedback]);

  const reorderLists = useCallback((sourceIndex: number, destIndex: number) => {
    setLists(prev => {
      const copy = [...prev];
      const [removed] = copy.splice(sourceIndex, 1);
      copy.splice(destIndex, 0, removed);
      return copy.map((l, idx) => ({ ...l, order: idx }));
    });
    triggerFeedback('tap');
  }, [triggerFeedback]);

  const moveListStep = useCallback((id: string, direction: 'up' | 'down') => {
    setLists(prev => {
      const index = prev.findIndex(l => l.id === id);
      if (index === -1) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((l, idx) => ({ ...l, order: idx }));
    });
    triggerFeedback('tap');
  }, [triggerFeedback]);

  // Item actions
  const createItem = useCallback((itemData: Omit<ListItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!activeListId) return;
    const newItem: ListItem = {
      ...itemData,
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;
      return {
        ...l,
        items: [newItem, ...l.items],
        updatedAt: Date.now(),
      };
    }));
    triggerFeedback('tap');
  }, [activeListId, triggerFeedback]);

  const updateItem = useCallback((itemId: string, itemData: Partial<Omit<ListItem, 'id' | 'createdAt'>>) => {
    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;
      return {
        ...l,
        items: l.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            ...itemData,
            updatedAt: Date.now(),
          };
        }),
        updatedAt: Date.now(),
      };
    }));
    triggerFeedback('tap');
  }, [activeListId, triggerFeedback]);

  const duplicateItem = useCallback((itemId: string) => {
    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;
      const itemToDup = l.items.find(i => i.id === itemId);
      if (!itemToDup) return l;

      const duplicated: ListItem = {
        ...itemToDup,
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: `${itemToDup.name} (نسخة)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const itemIndex = l.items.findIndex(i => i.id === itemId);
      const newItems = [...l.items];
      newItems.splice(itemIndex + 1, 0, duplicated);

      return {
        ...l,
        items: newItems,
        updatedAt: Date.now(),
      };
    }));
    triggerFeedback('tap');
  }, [activeListId, triggerFeedback]);

  const deleteItem = useCallback((itemId: string) => {
    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;
      return {
        ...l,
        items: l.items.filter(i => i.id !== itemId),
        updatedAt: Date.now(),
      };
    }));
    triggerFeedback('reset');
  }, [activeListId, triggerFeedback]);

  // Increment item
  const incrementItem = useCallback((itemId: string, amount: number = 1): boolean => {
    if (!checkDebounce(itemId)) return false;

    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;
      return {
        ...l,
        items: l.items.map(item => {
          if (item.id !== itemId) return item;
          const nextVal = item.value + amount;
          return {
            ...item,
            value: nextVal,
            updatedAt: Date.now(),
          };
        }),
        updatedAt: Date.now(),
      };
    }));

    triggerFeedback('increment');
    return true;
  }, [activeListId, checkDebounce, triggerFeedback]);

  // Decrement item
  const decrementItem = useCallback((itemId: string, amount: number = 1): boolean => {
    if (!checkDebounce(itemId)) return false;

    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;
      return {
        ...l,
        items: l.items.map(item => {
          if (item.id !== itemId) return item;
          let nextVal = item.value - amount;
          if (!settings.allowNegative && nextVal < 0) {
            nextVal = 0;
          }
          return {
            ...item,
            value: nextVal,
            updatedAt: Date.now(),
          };
        }),
        updatedAt: Date.now(),
      };
    }));

    triggerFeedback('decrement');
    return true;
  }, [activeListId, checkDebounce, settings.allowNegative, triggerFeedback]);

  // Set direct item value
  const setItemValue = useCallback((itemId: string, value: number) => {
    let finalVal = Number.isFinite(value) ? value : 0;
    if (!settings.allowNegative && finalVal < 0) {
      finalVal = 0;
    }

    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;
      return {
        ...l,
        items: l.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            value: finalVal,
            updatedAt: Date.now(),
          };
        }),
        updatedAt: Date.now(),
      };
    }));

    triggerFeedback('tap');
  }, [activeListId, settings.allowNegative, triggerFeedback]);

  // Reset single item counter
  const resetItemValue = useCallback((itemId: string) => {
    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;
      return {
        ...l,
        items: l.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            value: 0,
            updatedAt: Date.now(),
          };
        }),
        updatedAt: Date.now(),
      };
    }));
    triggerFeedback('reset');
  }, [activeListId, triggerFeedback]);

  // Batch reset all counters in current list
  const resetAllListItems = useCallback((listId: string) => {
    setLists(prev => prev.map(l => {
      if (l.id !== listId) return l;
      return {
        ...l,
        items: l.items.map(item => ({
          ...item,
          value: 0,
          updatedAt: Date.now(),
        })),
        updatedAt: Date.now(),
      };
    }));
    triggerFeedback('reset');
  }, [triggerFeedback]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Export Active List to CSV (Excel compatible with UTF-8 BOM)
  const exportActiveListCSV = useCallback(() => {
    if (!activeList) return;
    const header = ['اسم البند', 'الكمية', 'وحدة القياس', 'التصنيف', 'ملاحظات', 'تاريخ آخر تعديل'];
    const rows = activeList.items.map(item => [
      `"${item.name.replace(/"/g, '""')}"`,
      item.value,
      `"${(item.unit || '').replace(/"/g, '""')}"`,
      `"${(item.category || '').replace(/"/g, '""')}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
      `"${new Date(item.updatedAt).toLocaleString('ar-EG')}"`
    ]);

    const csvContent = '\uFEFF' + [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeList.name}_جرد_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerFeedback('tap');
  }, [activeList, triggerFeedback]);

  // Export all lists backup JSON
  const exportAllDataJSON = useCallback(() => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      lists,
      settings,
    };
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `تطبيق_العدادات_نسخة_احتياطية_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerFeedback('tap');
  }, [lists, settings, triggerFeedback]);

  // Import JSON backup
  const importDataJSON = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.lists)) {
        setLists(parsed.lists);
        if (parsed.lists.length > 0) {
          setActiveListId(parsed.lists[0].id);
        }
        if (parsed.settings) {
          setSettings(prev => ({ ...prev, ...parsed.settings }));
        }
        triggerFeedback('reset');
        return true;
      }
    } catch (e) {
      console.error('Import parse error', e);
    }
    return false;
  }, [triggerFeedback]);

  // Reset to default sample lists
  const resetToDefaultData = useCallback(() => {
    setLists(INITIAL_LISTS);
    setActiveListId(INITIAL_LISTS[0].id);
    triggerFeedback('reset');
  }, [triggerFeedback]);

  return (
    <AppContext.Provider
      value={{
        lists,
        activeListId,
        activeList,
        settings,
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
        setActiveListId,
        createList,
        updateList,
        duplicateList,
        deleteList,
        reorderLists,
        moveListStep,
        createItem,
        updateItem,
        duplicateItem,
        deleteItem,
        incrementItem,
        decrementItem,
        setItemValue,
        resetItemValue,
        resetAllListItems,
        updateSettings,
        exportActiveListCSV,
        exportAllDataJSON,
        importDataJSON,
        resetToDefaultData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
