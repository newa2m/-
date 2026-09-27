import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { List, ListItem, AppSettings, DebounceDelay, SortMode, ItemFilterMode, AuditAction, HapticIntensity, THEME_PRESETS } from '../types';
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

  // Pocket Lock
  isPocketLocked: boolean;
  setIsPocketLocked: (locked: boolean) => void;

  // Quick Toggles
  toggleSound: () => void;
  toggleHaptic: () => void;

  // Undo & Audit Trail
  auditTrail: AuditAction[];
  canUndo: boolean;
  lastUndoAction: AuditAction | null;
  undoLastAction: () => boolean;
  undoItemAction: (itemId: string) => boolean;
  getItemLastAction: (itemId: string) => AuditAction | undefined;
  clearAuditTrail: () => void;
  
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
  importItemsToList: (
    itemsData: Array<Omit<ListItem, 'id' | 'createdAt' | 'updatedAt'>>,
    options?: {
      targetListId?: string;
      replaceExisting?: boolean;
    }
  ) => number;
  updateItem: (itemId: string, itemData: Partial<Omit<ListItem, 'id' | 'createdAt'>>) => void;
  duplicateItem: (itemId: string) => void;
  deleteItem: (itemId: string) => void;
  toggleFavoriteItem: (itemId: string) => void;
  incrementItem: (itemId: string, amount?: number) => boolean;
  decrementItem: (itemId: string, amount?: number) => boolean;
  setItemValue: (itemId: string, value: number) => void;
  resetItemValue: (itemId: string) => void;
  resetAllListItems: (listId: string) => void;
  autoCategorizeActiveList: () => number;
  moveItemStep: (itemId: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  reorderItems: (sourceIndex: number, destinationIndex: number) => void;
  moveItemToPosition: (sourceItemId: string, targetItemId: string, placement?: 'before' | 'after') => void;

  // Settings
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  
  // Backup / Export
  exportActiveListCSV: (includeZeros?: boolean, includePrices?: boolean) => void;
  exportAllDataJSON: () => void;
  importDataJSON: (jsonString: string) => boolean;
  resetToDefaultData: () => void;
}

const STORAGE_KEY_LISTS = 'inv_counter_lists_v1';
const STORAGE_KEY_SETTINGS = 'inv_counter_settings_v1';
const STORAGE_KEY_ACTIVE = 'inv_counter_active_v1';

const DEFAULT_SETTINGS: AppSettings = {
  debounceDelay: 100, // 100ms default protection
  longPressDelay: 1000, // 1000ms default long-press trigger for touch protection
  hapticFeedback: true,
  hapticIntensity: 'medium',
  soundFeedback: true,
  quickPresets: [5, 10, 25, 50, 100],
  allowNegative: false,
  keepScreenAwake: false,
  darkMode: false,
  themeId: 'beige',
  designStyle: 'modern',
  viewMode: 'comfortable',
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
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          themeId: parsed.themeId === 'monochrome' || parsed.themeId === 'sage' || parsed.themeId === 'navy' || parsed.themeId === 'beige' ? parsed.themeId : 'beige',
          designStyle: parsed.designStyle || 'modern',
          longPressDelay: typeof parsed.longPressDelay === 'number' ? parsed.longPressDelay : 800,
          quickPresets: parsed.quickPresets || [5, 10, 25, 50, 100],
          hapticIntensity: parsed.hapticIntensity || 'medium',
        };
      }
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

  // Pocket Lock
  const [isPocketLocked, setIsPocketLocked] = useState(false);

  // Undo / Audit Trail Stack
  const [auditTrail, setAuditTrail] = useState<AuditAction[]>([]);

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

  // Apply Dark mode class to document HTML & Body
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Apply Theme and Design Style attributes to document HTML
  useEffect(() => {
    const themeId = settings.themeId || 'beige';
    const preset = THEME_PRESETS.find(p => p.id === themeId) || THEME_PRESETS[0];
    const root = document.documentElement;
    root.setAttribute('data-theme', themeId);
    
    const isDark = settings.darkMode;
    const bg = isDark ? preset.darkBg : preset.bg;
    const card = isDark ? preset.darkCard : preset.card;
    const border = isDark ? preset.darkBorder : preset.border;
    const text = isDark ? preset.darkText : preset.text;
    const navbar = isDark ? preset.darkNavbar : preset.navbar;

    root.style.setProperty('--app-bg', bg);
    root.style.setProperty('--app-surface', card);
    root.style.setProperty('--app-surface-muted', isDark ? preset.darkBorder + '55' : preset.accentLight);
    root.style.setProperty('--app-border', border);
    root.style.setProperty('--app-text', text);
    root.style.setProperty('--app-navbar-bg', navbar);
    root.style.setProperty('--color-primary', preset.primary);
    root.style.setProperty('--color-primary-hover', preset.primary);
    root.style.setProperty('--color-primary-light', preset.accentLight);
    root.style.setProperty('--color-secondary', preset.secondary);
    root.style.setProperty('--color-success', preset.success);
    root.style.setProperty('--color-danger', preset.danger);

    const style = settings.designStyle || 'modern';
    root.setAttribute('data-style', style);
  }, [settings.themeId, settings.designStyle, settings.darkMode]);

  // Wake lock on screen awake setting
  useEffect(() => {
    feedback.setKeepAwake(settings.keepScreenAwake);
    return () => {
      feedback.setKeepAwake(false);
    };
  }, [settings.keepScreenAwake]);

  const activeList = lists.find(l => l.id === activeListId) || lists[0];

  // Helper to trigger sensory feedback
  const triggerFeedback = useCallback((type: 'increment' | 'decrement' | 'tap' | 'reset' | 'lock' | 'unlock' = 'tap') => {
    if (settings.soundFeedback) {
      feedback.playClick(type);
    }
    if (settings.hapticFeedback) {
      feedback.vibrate(
        type === 'decrement'
          ? 'decrement'
          : (type === 'increment'
            ? 'increment'
            : (type === 'reset' ? 'double_warning' : (type === 'lock' ? 'lock' : 'tap'))),
        settings.hapticIntensity
      );
    }
  }, [settings.soundFeedback, settings.hapticFeedback, settings.hapticIntensity]);

  // Quick toggles
  const toggleSound = useCallback(() => {
    setSettings(prev => {
      const next = !prev.soundFeedback;
      if (next) feedback.playClick('tap');
      return { ...prev, soundFeedback: next };
    });
  }, []);

  const toggleHaptic = useCallback(() => {
    setSettings(prev => {
      const next = !prev.hapticFeedback;
      if (next) feedback.vibrate('tap', prev.hapticIntensity);
      return { ...prev, hapticFeedback: next };
    });
  }, []);

  // Record audit step
  const addAuditAction = useCallback((action: Omit<AuditAction, 'id' | 'timestamp'>) => {
    const newAction: AuditAction = {
      ...action,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };
    setAuditTrail(prev => [newAction, ...prev].slice(0, 60)); // Keep last 60 actions
  }, []);

  // Undo last counting action
  const undoLastAction = useCallback((): boolean => {
    if (auditTrail.length === 0) return false;
    const [actionToUndo, ...remaining] = auditTrail;

    setLists(prev => prev.map(l => {
      if (l.id !== actionToUndo.listId) return l;
      return {
        ...l,
        items: l.items.map(item => {
          if (item.id !== actionToUndo.itemId) return item;
          return {
            ...item,
            value: actionToUndo.previousValue,
            updatedAt: Date.now(),
          };
        }),
        updatedAt: Date.now(),
      };
    }));

    setAuditTrail(remaining);
    triggerFeedback('reset');
    return true;
  }, [auditTrail, triggerFeedback]);

  // Undo specific item's last action
  const undoItemAction = useCallback((itemId: string): boolean => {
    const actionIndex = auditTrail.findIndex(a => a.itemId === itemId);
    if (actionIndex === -1) return false;

    const actionToUndo = auditTrail[actionIndex];
    setLists(prev => prev.map(l => {
      if (l.id !== actionToUndo.listId) return l;
      return {
        ...l,
        items: l.items.map(item => {
          if (item.id !== actionToUndo.itemId) return item;
          return {
            ...item,
            value: actionToUndo.previousValue,
            updatedAt: Date.now(),
          };
        }),
        updatedAt: Date.now(),
      };
    }));

    // Remove this specific action from audit trail
    setAuditTrail(prev => prev.filter((_, idx) => idx !== actionIndex));
    triggerFeedback('reset');
    return true;
  }, [auditTrail, triggerFeedback]);

  const getItemLastAction = useCallback((itemId: string): AuditAction | undefined => {
    return auditTrail.find(a => a.itemId === itemId);
  }, [auditTrail]);

  const clearAuditTrail = useCallback(() => {
    setAuditTrail([]);
  }, []);

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
      color: itemData.color || 'emerald',
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

  // Batch import items into a list (append or replace)
  const importItemsToList = useCallback((
    itemsData: Array<Omit<ListItem, 'id' | 'createdAt' | 'updatedAt'>>,
    options?: {
      targetListId?: string;
      replaceExisting?: boolean;
    }
  ): number => {
    const listIdToUse = options?.targetListId || activeListId;
    if (!listIdToUse || itemsData.length === 0) return 0;

    const timestamp = Date.now();
    const newItems: ListItem[] = itemsData.map((item, index) => {
      return {
        ...item,
        color: item.color || 'emerald',
        unit: item.unit?.trim() || 'قطعة',
        id: `item-${timestamp}-${index}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: timestamp + index,
        updatedAt: timestamp + index,
      };
    });

    setLists(prev => prev.map(l => {
      if (l.id !== listIdToUse) return l;

      const finalItems = options?.replaceExisting
        ? newItems
        : [...newItems, ...l.items];

      return {
        ...l,
        items: finalItems,
        updatedAt: Date.now(),
      };
    }));

    triggerFeedback('increment');
    return newItems.length;
  }, [activeListId, triggerFeedback]);

  // Bulk auto-categorize stub (kept for interface compatibility)
  const autoCategorizeActiveList = useCallback((): number => {
    return 0;
  }, []);

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

  // Toggle favorite star on an item
  const toggleFavoriteItem = useCallback((itemId: string) => {
    if (!activeListId) return;

    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;

      return {
        ...l,
        items: l.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            isFavorite: !item.isFavorite,
            updatedAt: Date.now(),
          };
        }),
        updatedAt: Date.now(),
      };
    }));
    triggerFeedback('tap');
  }, [activeListId, triggerFeedback]);

  // Move an item up, down, top, or bottom in manual order
  const moveItemStep = useCallback((itemId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (!activeListId) return;

    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;

      const items = [...l.items];
      const index = items.findIndex(i => i.id === itemId);
      if (index === -1) return l;

      let targetIndex = index;
      if (direction === 'up') {
        targetIndex = Math.max(0, index - 1);
      } else if (direction === 'down') {
        targetIndex = Math.min(items.length - 1, index + 1);
      } else if (direction === 'top') {
        targetIndex = 0;
      } else if (direction === 'bottom') {
        targetIndex = items.length - 1;
      }

      if (targetIndex === index) return l;

      const [movedItem] = items.splice(index, 1);
      items.splice(targetIndex, 0, movedItem);

      return {
        ...l,
        items,
        updatedAt: Date.now(),
      };
    }));

    setSortMode('manual');
    triggerFeedback('tap');
  }, [activeListId, setSortMode, triggerFeedback]);

  // Reorder items by numeric index
  const reorderItems = useCallback((sourceIndex: number, destinationIndex: number) => {
    if (!activeListId || sourceIndex === destinationIndex) return;

    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;

      const items = [...l.items];
      if (
        sourceIndex < 0 ||
        sourceIndex >= items.length ||
        destinationIndex < 0 ||
        destinationIndex >= items.length
      ) {
        return l;
      }

      const [movedItem] = items.splice(sourceIndex, 1);
      items.splice(destinationIndex, 0, movedItem);

      return {
        ...l,
        items,
        updatedAt: Date.now(),
      };
    }));

    setSortMode('manual');
    triggerFeedback('tap');
  }, [activeListId, setSortMode, triggerFeedback]);

  // Move an item relative to a target item (for Drag and Drop)
  const moveItemToPosition = useCallback((sourceItemId: string, targetItemId: string, placement: 'before' | 'after' = 'before') => {
    if (!activeListId || sourceItemId === targetItemId) return;

    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;

      const items = [...l.items];
      const sourceIndex = items.findIndex(i => i.id === sourceItemId);
      const targetIndex = items.findIndex(i => i.id === targetItemId);

      if (sourceIndex === -1 || targetIndex === -1) return l;

      const [movedItem] = items.splice(sourceIndex, 1);
      
      const newTargetIndex = items.findIndex(i => i.id === targetItemId);
      const insertIndex = placement === 'after' ? newTargetIndex + 1 : newTargetIndex;
      
      items.splice(insertIndex, 0, movedItem);

      return {
        ...l,
        items,
        updatedAt: Date.now(),
      };
    }));

    setSortMode('manual');
    triggerFeedback('tap');
  }, [activeListId, setSortMode, triggerFeedback]);

  // Increment item
  const incrementItem = useCallback((itemId: string, amount: number = 1): boolean => {
    if (isPocketLocked) return false;
    if (!checkDebounce(itemId)) return false;

    let previousVal = 0;
    let targetName = '';
    let targetUnit = '';

    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;
      return {
        ...l,
        items: l.items.map(item => {
          if (item.id !== itemId) return item;
          previousVal = item.value;
          targetName = item.name;
          targetUnit = item.unit || '';
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

    addAuditAction({
      itemId,
      listId: activeListId,
      itemName: targetName,
      itemUnit: targetUnit,
      actionType: 'increment',
      diff: amount,
      previousValue: previousVal,
      newValue: previousVal + amount,
    });

    triggerFeedback('increment');
    return true;
  }, [activeListId, checkDebounce, isPocketLocked, triggerFeedback, addAuditAction]);

  // Decrement item
  const decrementItem = useCallback((itemId: string, amount: number = 1): boolean => {
    if (isPocketLocked) return false;
    if (!checkDebounce(itemId)) return false;

    let previousVal = 0;
    let targetName = '';
    let targetUnit = '';
    let finalNextVal = 0;

    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;
      return {
        ...l,
        items: l.items.map(item => {
          if (item.id !== itemId) return item;
          previousVal = item.value;
          targetName = item.name;
          targetUnit = item.unit || '';
          let nextVal = item.value - amount;
          if (!settings.allowNegative && nextVal < 0) {
            nextVal = 0;
          }
          finalNextVal = nextVal;
          return {
            ...item,
            value: nextVal,
            updatedAt: Date.now(),
          };
        }),
        updatedAt: Date.now(),
      };
    }));

    addAuditAction({
      itemId,
      listId: activeListId,
      itemName: targetName,
      itemUnit: targetUnit,
      actionType: 'decrement',
      diff: -amount,
      previousValue: previousVal,
      newValue: finalNextVal,
    });

    triggerFeedback('decrement');
    return true;
  }, [activeListId, checkDebounce, isPocketLocked, settings.allowNegative, triggerFeedback, addAuditAction]);

  // Set direct item value
  const setItemValue = useCallback((itemId: string, value: number) => {
    if (isPocketLocked) return;
    let finalVal = Number.isFinite(value) ? value : 0;
    if (!settings.allowNegative && finalVal < 0) {
      finalVal = 0;
    }

    let previousVal = 0;
    let targetName = '';
    let targetUnit = '';

    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;
      return {
        ...l,
        items: l.items.map(item => {
          if (item.id !== itemId) return item;
          previousVal = item.value;
          targetName = item.name;
          targetUnit = item.unit || '';
          return {
            ...item,
            value: finalVal,
            updatedAt: Date.now(),
          };
        }),
        updatedAt: Date.now(),
      };
    }));

    addAuditAction({
      itemId,
      listId: activeListId,
      itemName: targetName,
      itemUnit: targetUnit,
      actionType: 'set',
      diff: finalVal - previousVal,
      previousValue: previousVal,
      newValue: finalVal,
    });

    triggerFeedback('tap');
  }, [activeListId, isPocketLocked, settings.allowNegative, triggerFeedback, addAuditAction]);

  // Reset single item counter
  const resetItemValue = useCallback((itemId: string) => {
    if (isPocketLocked) return;

    let previousVal = 0;
    let targetName = '';
    let targetUnit = '';

    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;
      return {
        ...l,
        items: l.items.map(item => {
          if (item.id !== itemId) return item;
          previousVal = item.value;
          targetName = item.name;
          targetUnit = item.unit || '';
          return {
            ...item,
            value: 0,
            updatedAt: Date.now(),
          };
        }),
        updatedAt: Date.now(),
      };
    }));

    addAuditAction({
      itemId,
      listId: activeListId,
      itemName: targetName,
      itemUnit: targetUnit,
      actionType: 'reset',
      diff: -previousVal,
      previousValue: previousVal,
      newValue: 0,
    });

    triggerFeedback('reset');
  }, [activeListId, isPocketLocked, triggerFeedback, addAuditAction]);

  // Batch reset all counters in current list
  const resetAllListItems = useCallback((listId: string) => {
    if (isPocketLocked) return;
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
  }, [isPocketLocked, triggerFeedback]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Export Active List to CSV (Excel compatible with UTF-8 BOM)
  const exportActiveListCSV = useCallback((includeZeros = false, includePrices = false) => {
    if (!activeList) return;
    const header = includePrices
      ? ['اسم البند', 'الكمية', 'وحدة القياس', 'سعر الوحدة', 'إجمالي القيمة', 'ملاحظات', 'تاريخ آخر تعديل']
      : ['اسم البند', 'الكمية', 'وحدة القياس', 'ملاحظات', 'تاريخ آخر تعديل'];

    const targetItems = includeZeros 
      ? activeList.items 
      : activeList.items.filter(item => item.value > 0);

    const rows = targetItems.map(item => {
      const base = [
        `"${item.name.replace(/"/g, '""')}"`,
        item.value,
        `"${(item.unit || '').replace(/"/g, '""')}"`,
      ];
      if (includePrices) {
        base.push(
          item.price !== undefined && item.price !== null ? item.price.toString() : '',
          item.price !== undefined && item.price !== null ? (item.value * item.price).toFixed(2) : ''
        );
      }
      base.push(
        `"${(item.notes || '').replace(/"/g, '""')}"`,
        `"${new Date(item.updatedAt).toLocaleString('ar-EG')}"`
      );
      return base;
    });

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
        importItemsToList,
        updateItem,
        duplicateItem,
        deleteItem,
        toggleFavoriteItem,
        incrementItem,
        decrementItem,
        setItemValue,
        resetItemValue,
        resetAllListItems,
        autoCategorizeActiveList,
        moveItemStep,
        reorderItems,
        moveItemToPosition,
        isPocketLocked,
        setIsPocketLocked,
        toggleSound,
        toggleHaptic,
        auditTrail,
        canUndo: auditTrail.length > 0,
        lastUndoAction: auditTrail[0] || null,
        undoLastAction,
        undoItemAction,
        getItemLastAction,
        clearAuditTrail,
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
