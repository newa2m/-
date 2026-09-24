export interface ListItem {
  id: string;
  name: string;
  value: number;
  unit?: string;
  category?: string;
  color?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface List {
  id: string;
  name: string;
  color: string;
  icon: string;
  items: ListItem[];
  createdAt: number;
  updatedAt: number;
  order: number;
}

export type DebounceDelay = 0 | 100 | 200 | 500;

export interface AppSettings {
  debounceDelay: DebounceDelay;
  hapticFeedback: boolean;
  soundFeedback: boolean;
  quickPresets: number[];
  allowNegative: boolean;
  keepScreenAwake: boolean;
  darkMode: boolean;
}

export type ItemFilterMode = 'all' | 'active' | 'zero';

export type SortMode = 
  | 'manual'
  | 'value-desc'
  | 'value-asc'
  | 'name-asc'
  | 'name-desc'
  | 'updated-desc';

export const COMMON_UNITS = [
  'قطعة',
  'متر',
  'متر مربع',
  'متر مكعب',
  'كيس',
  'طن',
  'كيلو',
  'كرتونة',
  'لتر',
  'علبة',
  'حبة',
  'لفة',
  'بند'
];

export const LIST_ICONS = [
  { id: 'boxes', label: 'صناديق ومخازن' },
  { id: 'warehouse', label: 'مستودع' },
  { id: 'hard-hat', label: 'تشطيبات وبناء' },
  { id: 'paint-roller', label: 'دهانات وتشطيب' },
  { id: 'wrench', label: 'أدوات وصيانة' },
  { id: 'shopping-cart', label: 'مشتريات' },
  { id: 'clipboard-list', label: 'جرد وتدقيق' },
  { id: 'truck', label: 'شحن وتوريدات' },
  { id: 'layers', label: 'خامات ومواد' },
  { id: 'check-circle-2', label: 'مهام يومية' },
  { id: 'cpu', label: 'إلكترونيات' },
  { id: 'archive', label: 'أرشيف' }
];

export const COLOR_PALETTE = [
  { id: 'emerald', hex: '#10b981', label: 'زمردي أخضر', bg: 'bg-emerald-500', lightBg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500' },
  { id: 'blue', hex: '#3b82f6', label: 'أزرق سماوي', bg: 'bg-blue-500', lightBg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500' },
  { id: 'indigo', hex: '#6366f1', label: 'نيلي ملكي', bg: 'bg-indigo-500', lightBg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500' },
  { id: 'amber', hex: '#f59e0b', label: 'كهرماني ذهبي', bg: 'bg-amber-500', lightBg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500' },
  { id: 'orange', hex: '#f97316', label: 'برتقالي حراري', bg: 'bg-orange-500', lightBg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500' },
  { id: 'rose', hex: '#f43f5e', label: 'وردي أحمر', bg: 'bg-rose-500', lightBg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500' },
  { id: 'purple', hex: '#a855f7', label: 'أرجواني', bg: 'bg-purple-500', lightBg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500' },
  { id: 'cyan', hex: '#06b6d4', label: 'تركواز بحري', bg: 'bg-cyan-500', lightBg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500' },
  { id: 'slate', hex: '#64748b', label: 'رمادي حجري', bg: 'bg-slate-600', lightBg: 'bg-slate-100 dark:bg-slate-800/50', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-500' },
];
