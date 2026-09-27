export interface ListItem {
  id: string;
  name: string;
  value: number;
  unit?: string;
  price?: number;
  category?: string;
  color?: string;
  notes?: string;
  isFavorite?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
  createdAt: number;
}

export interface List {
  id: string;
  name: string;
  color: string;
  icon: string;
  items: ListItem[];
  folderId?: string;
  createdAt: number;
  updatedAt: number;
  order: number;
}

export type DebounceDelay = 0 | 100 | 200 | 500;
export type HapticIntensity = 'light' | 'medium' | 'strong';

export type ViewMode = 'comfortable' | 'compact';

export type ThemeId = 
  | 'beige' 
  | 'monochrome' 
  | 'sage' 
  | 'navy' 
  | 'cocoa' 
  | 'terracotta' 
  | 'mint' 
  | 'petrol'
  | 'turquoise';
export type DesignStyle = 'modern' | 'sharp' | 'tactile';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  success: string;
  danger: string;
  bg: string;
  card: string;
  border: string;
  text: string;
  navbar: string;
  accentLight: string;
  darkBg: string;
  darkCard: string;
  darkBorder: string;
  darkText: string;
  darkNavbar: string;
}

export const THEME_PRESETS: ThemeConfig[] = [
  {
    id: 'beige',
    name: 'درجات البيج والبني الدافئ',
    description: 'ألوان الورق الطبيعي والكتان والأخشاب الهادئة الأكثر راحة للعين',
    primary: '#8C532B',
    secondary: '#3D2A1D',
    success: '#4A7C59',
    danger: '#BA4336',
    bg: '#FAF7F2',
    card: '#FFFFFF',
    border: '#E3DAC9',
    text: '#382B22',
    navbar: '#2C1F17',
    accentLight: '#F3ECE3',
    darkBg: '#1B1510',
    darkCard: '#261E18',
    darkBorder: '#3D3128',
    darkText: '#F5ECE3',
    darkNavbar: '#140E0A',
  },
  {
    id: 'monochrome',
    name: 'درجات الأسود والأبيض والرمادي',
    description: 'بساطة مينيمال تيتانيوم عالية الأناقة وخالية من أي تشتيت بصري',
    primary: '#27272A',
    secondary: '#09090B',
    success: '#16A34A',
    danger: '#DC2626',
    bg: '#F4F4F6',
    card: '#FFFFFF',
    border: '#DCDCE2',
    text: '#18181B',
    navbar: '#121214',
    accentLight: '#E8E8ED',
    darkBg: '#09090B',
    darkCard: '#18181B',
    darkBorder: '#2E2E33',
    darkText: '#F4F4F5',
    darkNavbar: '#000000',
  },
  {
    id: 'sage',
    name: 'درجات الزيتوني والمريمية الهادئ',
    description: 'درجات نباتية وطبيعية ناعمة تمنح راحة فورية للأعصاب والعين في المواقع',
    primary: '#386641',
    secondary: '#1B2E1E',
    success: '#2E6F40',
    danger: '#B93838',
    bg: '#F2F5F3',
    card: '#FFFFFF',
    border: '#D3DFD5',
    text: '#1F2E22',
    navbar: '#17261B',
    accentLight: '#E5EFE7',
    darkBg: '#101712',
    darkCard: '#19241C',
    darkBorder: '#2F4234',
    darkText: '#EBF2EC',
    darkNavbar: '#0B120D',
  },
  {
    id: 'navy',
    name: 'درجات الكحلي والرمادي المزرق',
    description: 'طابع هندسي كلاسيكي وبارد بدرجات الكحلي الصخري الرصين',
    primary: '#2B5885',
    secondary: '#0F172A',
    success: '#10B981',
    danger: '#EF4444',
    bg: '#F0F4F8',
    card: '#FFFFFF',
    border: '#CBD5E1',
    text: '#1E293B',
    navbar: '#0F172A',
    accentLight: '#E2ECF7',
    darkBg: '#0B1120',
    darkCard: '#151F32',
    darkBorder: '#273854',
    darkText: '#EEF2F6',
    darkNavbar: '#070C18',
  },
  {
    id: 'cocoa',
    name: 'درجات الكاكاو والشوكولاتة المخملية',
    description: 'ألوان كاكاو وبندق مطفأة وناعمة تريح البصر في القراءة الميدانية',
    primary: '#6F4E37',
    secondary: '#2E1E14',
    success: '#406E4A',
    danger: '#B3392F',
    bg: '#F9F6F3',
    card: '#FFFFFF',
    border: '#E0D4C7',
    text: '#2D1F17',
    navbar: '#22150E',
    accentLight: '#F2E8DF',
    darkBg: '#17100B',
    darkCard: '#221812',
    darkBorder: '#3A2A20',
    darkText: '#F3EAE3',
    darkNavbar: '#0F0906',
  },
  {
    id: 'terracotta',
    name: 'درجات التيراكوتا والفخار الدافئ',
    description: 'تدرجات قرميدية ترابية دافئة مستوحاة من فخار المعمار الطبيعي',
    primary: '#A0522D',
    secondary: '#3E1C11',
    success: '#3D7A53',
    danger: '#C0392B',
    bg: '#FAF5F2',
    card: '#FFFFFF',
    border: '#E6D7CF',
    text: '#3A2016',
    navbar: '#2E150D',
    accentLight: '#F5EAE4',
    darkBg: '#1A0E09',
    darkCard: '#27150E',
    darkBorder: '#422419',
    darkText: '#F7EBE5',
    darkNavbar: '#120704',
  },
  {
    id: 'mint',
    name: 'درجات النعناع واليشم البارد',
    description: 'أخضر يشمي فاتح ومنعش يخفف حرارة الألوان وإجهاد النظر تماماً',
    primary: '#2D7263',
    secondary: '#13352E',
    success: '#237352',
    danger: '#BC3838',
    bg: '#F1F6F5',
    card: '#FFFFFF',
    border: '#D0E0DC',
    text: '#16332C',
    navbar: '#112B25',
    accentLight: '#E3EFEB',
    darkBg: '#0C1715',
    darkCard: '#132420',
    darkBorder: '#233F39',
    darkText: '#E6F2EF',
    darkNavbar: '#071210',
  },
  {
    id: 'petrol',
    name: 'درجات البترولي والأزرق المخضر الصخري',
    description: 'أزرق بترولي مطفأ يجمع بين هدوء الأخضر ووقار الكحلي الميداني',
    primary: '#245C68',
    secondary: '#0F262B',
    success: '#1EA278',
    danger: '#D94539',
    bg: '#F0F5F6',
    card: '#FFFFFF',
    border: '#CEE0E3',
    text: '#132B30',
    navbar: '#0C2024',
    accentLight: '#E1EEF0',
    darkBg: '#091518',
    darkCard: '#102126',
    darkBorder: '#1E3940',
    darkText: '#E5F1F3',
    darkNavbar: '#050E10',
  },
];

export interface AppSettings {
  debounceDelay: DebounceDelay;
  longPressDelay?: number; // Duration in ms for long-press trigger (default 800ms)
  hapticFeedback: boolean;
  hapticIntensity: HapticIntensity;
  soundFeedback: boolean;
  quickPresets: number[];
  allowNegative: boolean;
  keepScreenAwake: boolean;
  darkMode: boolean;
  themeId?: ThemeId;
  designStyle?: DesignStyle;
  viewMode?: ViewMode;
}

export interface AuditAction {
  id: string;
  itemId: string;
  listId: string;
  itemName: string;
  itemUnit?: string;
  actionType: 'increment' | 'decrement' | 'set' | 'reset';
  diff: number;
  previousValue: number;
  newValue: number;
  timestamp: number;
}

export type ItemFilterMode = 'all' | 'active' | 'zero' | 'favorites';

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
  { id: 'turquoise', hex: '#00B8C4', label: 'تركواز حديث (أساسي)', bg: 'bg-[#00B8C4]', lightBg: 'bg-[#E6F9FA] dark:bg-slate-800', text: 'text-[#00B8C4]', border: 'border-[#00B8C4]' },
  { id: 'navy', hex: '#0F172A', label: 'كحلي داكن (ثانوي)', bg: 'bg-[#0F172A]', lightBg: 'bg-slate-100 dark:bg-slate-800', text: 'text-[#0F172A] dark:text-white', border: 'border-[#0F172A]' },
  { id: 'emerald', hex: '#10B981', label: 'أخضر (نجاح)', bg: 'bg-[#10B981]', lightBg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-[#10B981]', border: 'border-[#10B981]' },
  { id: 'rose', hex: '#EF4444', label: 'أحمر (تحذير أو حذف)', bg: 'bg-[#EF4444]', lightBg: 'bg-red-50 dark:bg-red-950/40', text: 'text-[#EF4444]', border: 'border-[#EF4444]' },
  { id: 'slate', hex: '#64748B', label: 'رمادي حيادي', bg: 'bg-slate-600', lightBg: 'bg-slate-100 dark:bg-slate-800/50', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-500' },
];
