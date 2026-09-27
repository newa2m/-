import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { DebounceDelay, THEME_PRESETS, ThemeId, DesignStyle } from '../types';
import { feedback } from '../utils/feedback';
import {
  Settings,
  X,
  Shield,
  Vibrate,
  Volume2,
  Sparkles,
  Sun,
  Moon,
  Eye,
  FileSpreadsheet,
  Download,
  Upload,
  RotateCcw,
  Check,
  Smartphone,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  List as ListIconLucide,
  Clock,
  Palette
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    settings,
    updateSettings,
    exportAllDataJSON,
    importDataJSON,
    resetToDefaultData,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Quick preset inputs
  const [presets, setPresets] = useState<number[]>(settings.quickPresets);
  const [isEditingPresets, setIsEditingPresets] = useState(false);

  if (!isOpen) return null;

  const debounceOptions: { value: DebounceDelay; label: string; desc: string }[] = [
    { value: 0, label: 'بدون تأخير', desc: 'استجابة فائقة السرعة' },
    { value: 100, label: '100 مللي ثانية', desc: 'حماية خفيفة (موصى به)' },
    { value: 200, label: '200 مللي ثانية', desc: 'حماية متوسطة' },
    { value: 500, label: '500 مللي ثانية', desc: 'حماية قصوى ضد اللمس المتكرر' },
  ];

  const handlePresetChange = (index: number, val: string) => {
    const num = parseInt(val, 10);
    const updated = [...presets];
    updated[index] = isNaN(num) || num <= 0 ? 1 : num;
    setPresets(updated);
  };

  const savePresets = () => {
    updateSettings({ quickPresets: presets });
    setIsEditingPresets(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataJSON(content);
        if (success) {
          setImportStatus('تم استيراد البيانات بنجاح!');
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('خطأ: الملف غير صالح أو تالف.');
          setTimeout(() => setImportStatus(null), 3000);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-sm">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                إعدادات التطبيق والاستجابة
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تخصيص اللمس، العدادات، والنسخ الاحتياطي
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Settings Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Section 1: Debounce Anti-Double Tap */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Shield className="w-4 h-4 text-[#00B8C4]" />
              <span>الحماية من اللمسات الخاطئة (منع الضغطات المتكررة):</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              تحديد الفترة الزمنية التي يتم فيها تجاهل الضغطات المزدوجة المتتالية غير المقصودة على زري (+) و (-).
            </p>
            <div className="grid grid-cols-2 gap-2">
              {debounceOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateSettings({ debounceDelay: opt.value })}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    settings.debounceDelay === opt.value
                      ? 'bg-[#E6F9FA] border-[#00B8C4] text-[#008790] dark:bg-[#00B8C4]/20 dark:border-[#00B8C4] dark:text-[#00B8C4] font-semibold shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{opt.label}</span>
                    {settings.debounceDelay === opt.value && (
                      <Check className="w-3.5 h-3.5 text-[#00B8C4]" />
                    )}
                  </div>
                  <span className="block text-[10px] text-slate-400 mt-1">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Section: Long-Press Duration Setting */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Clock className="w-4 h-4 text-[#10B981]" />
              <span>مدة اللمس المطول (لتعديل العدادات والأرقام):</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              تحديد زمن اللمس المستمر المطلوب لتفعيل نافذة الأرقام على (+) و (-) ورقم البند، مع ميزة منع التفعيل العرضي أثناء التمرير والسحب.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 800, label: '800 مللي ثانية', desc: 'متوازن' },
                { value: 1000, label: '1000 مللي ثانية (1 ثانية)', desc: 'موصى به لمنع الفتح العرضي' },
                { value: 1200, label: '1.2 ثانية', desc: 'حماية إضافية أثناء التمرير' },
                { value: 1500, label: '1.5 ثانية', desc: 'طويل جداً للميدان والقفازات' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateSettings({ longPressDelay: opt.value })}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    (settings.longPressDelay || 1000) === opt.value
                      ? 'bg-[#10B981]/15 border-[#10B981] text-[#059669] dark:bg-[#10B981]/25 dark:border-[#10B981] dark:text-[#10B981] font-semibold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{opt.label}</span>
                    {(settings.longPressDelay || 1000) === opt.value && (
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    )}
                  </div>
                  <span className="block text-[10px] text-slate-400 mt-1">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Section 2: Sensory Feedback & Performance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              التغذية الراجعة وتجربة أندرويد
            </h4>

            {/* Haptic vibration */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Vibrate className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    الاهتزاز اللمسي (Haptic Feedback)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    نبضة اهتزاز واقعية عند كل نقرة عداد
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.hapticFeedback}
                onChange={(e) => {
                  const checked = e.target.checked;
                  updateSettings({ hapticFeedback: checked });
                  if (checked) {
                    feedback.vibrate('tap', settings.hapticIntensity);
                  }
                }}
                className="w-5 h-5 rounded accent-[#00B8C4] cursor-pointer"
              />
            </div>

            {/* Haptic Intensity selector & Test Button */}
            {settings.hapticFeedback && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    شدة الاهتزاز اللمسي:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      feedback.playClick('tap');
                      feedback.vibrate('tap', settings.hapticIntensity);
                    }}
                    className="py-1 px-2.5 rounded-lg bg-[#00B8C4]/15 hover:bg-[#00B8C4]/25 text-[#00B8C4] font-bold text-[11px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer border border-[#00B8C4]/30"
                  >
                    <Vibrate className="w-3 h-3" />
                    <span>تجربة الهزاز الآن ⚡</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'light', label: 'خفيف (35ms)' },
                    { id: 'medium', label: 'متوسط (65ms)' },
                    { id: 'strong', label: 'قوي للورش (110ms)' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => {
                        updateSettings({ hapticIntensity: lvl.id as any });
                        feedback.vibrate('tap', lvl.id as any);
                      }}
                      className={`py-2 px-1 rounded-lg text-center font-bold transition-all cursor-pointer active:scale-95 ${
                        settings.hapticIntensity === lvl.id
                          ? 'bg-[#10B981] text-white shadow-xs'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                  💡 يعمل الهزاز على أجهزة أندرويد وآيفون (iOS 17.4+). تأكد من تفعيل "اهتزاز اللمس / Haptic Feedback" في إعدادات الصوت العامة لجهازك.
                </p>
              </div>
            )}

            {/* Sound click */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E6F9FA] dark:bg-slate-800 text-[#00B8C4] flex items-center justify-center">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    صوت النقرة الميكانيكية
                  </span>
                  <span className="text-[10px] text-slate-400">
                    صوت تكة هادئة وسريعة عند تغيير القيمة
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundFeedback}
                onChange={(e) => updateSettings({ soundFeedback: e.target.checked })}
                className="w-5 h-5 rounded accent-[#00B8C4] cursor-pointer"
              />
            </div>

            {/* Screen Wake Lock */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    إبقاء الشاشة قيد التشغيل (Wake Lock)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    منع إغلاق الشاشة أثناء جرد الموقع أو المخزن
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.keepScreenAwake}
                onChange={(e) => updateSettings({ keepScreenAwake: e.target.checked })}
                className="w-5 h-5 rounded accent-[#00B8C4] cursor-pointer"
              />
            </div>

            {/* Dark Mode */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  {settings.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    الوضع الداكن (Dark Mode)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    مريح للعين وموفر لبطارية شاشات AMOLED
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={(e) => updateSettings({ darkMode: e.target.checked })}
                className="w-5 h-5 rounded accent-[#00B8C4] cursor-pointer"
              />
            </div>

            {/* View Mode: Comfortable vs Compact */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-[#00B8C4]" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    نمط عرض بطاقات الجرد:
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {settings.viewMode === 'compact' ? 'عرض مدمج ومكثف' : 'عرض قياسي مريح'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => updateSettings({ viewMode: 'comfortable' })}
                  className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
                    (settings.viewMode || 'comfortable') === 'comfortable'
                      ? 'bg-[#00B8C4] text-white shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>قياسي مريح (Comfortable)</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ viewMode: 'compact' })}
                  className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
                    settings.viewMode === 'compact'
                      ? 'bg-[#00B8C4] text-white shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <ListIconLucide className="w-3.5 h-3.5" />
                  <span>مدمج سريع (Compact)</span>
                </button>
              </div>
            </div>

            {/* Themes & Visual Color Palettes */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#00B8C4]" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    مظهر التطبيق ونظام الألوان:
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  انقر لاختيار المظهر المفضل
                </span>
              </div>

              {/* Theme Palettes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {THEME_PRESETS.map((theme) => {
                  const isSelected = (settings.themeId || 'beige') === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => updateSettings({ themeId: theme.id })}
                      className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-2 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                      style={{
                        borderColor: isSelected ? theme.primary : undefined,
                        backgroundColor: isSelected ? (settings.darkMode ? theme.darkCard : theme.accentLight) : undefined,
                      }}
                    >
                      <div className="flex items-start justify-between gap-1.5 mb-2">
                        <div className="min-w-0">
                          <span className="text-xs font-black text-slate-900 dark:text-white block truncate">
                            {theme.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                            {theme.description}
                          </span>
                        </div>
                        {isSelected && (
                          <div 
                            className="w-5 h-5 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs"
                            style={{ backgroundColor: theme.primary }}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Swatches preview showing the entire harmonious palette */}
                      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        <span className="text-[9px] text-slate-400 font-medium">تناسق الدرجات:</span>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5 p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                            <span className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: theme.primary }} title={`اللون المميز: ${theme.primary}`} />
                            <span className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: theme.navbar }} title={`الشريط العلوي: ${theme.navbar}`} />
                            <span className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: theme.bg }} title={`الخلفية: ${theme.bg}`} />
                            <span className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: theme.text }} title={`النصوص: ${theme.text}`} />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Design Styles (انسيابي ناعم / هندسي صارم / أزرار بارزة) */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  نمط تصميم وحواف الواجهة:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'modern', label: 'انسيابي ناعم', desc: 'زوايا دائرية حديثة' },
                    { id: 'sharp', label: 'هندسي صارم', desc: 'حواف حادة تباين عالي' },
                    { id: 'tactile', label: 'أزرار بارزة', desc: 'مجسمة للميدان' },
                  ].map((style) => {
                    const isSelected = (settings.designStyle || 'modern') === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => updateSettings({ designStyle: style.id as DesignStyle })}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#00B8C4] bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-white'
                        }`}
                      >
                        <span className="block text-[11px] font-bold">{style.label}</span>
                        <span className="block text-[9px] text-slate-400 mt-0.5">{style.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Section 3: Customizable Quick Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>أرقام الإضافة السريعة الافتراضية:</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isEditingPresets) {
                    savePresets();
                  } else {
                    setIsEditingPresets(true);
                  }
                }}
                className="text-xs text-[#00B8C4] font-semibold hover:underline"
              >
                {isEditingPresets ? 'حفظ الأرقام' : 'تخصيص'}
              </button>
            </div>

            {isEditingPresets ? (
              <div className="grid grid-cols-5 gap-2">
                {presets.map((val, idx) => (
                  <input
                    key={idx}
                    type="number"
                    value={val}
                    onChange={(e) => handlePresetChange(idx, e.target.value)}
                    className="w-full text-center py-2 px-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {settings.quickPresets.map((p) => (
                  <span
                    key={p}
                    className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-center font-mono font-bold text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    +{p}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[10px] text-slate-400">
              تظهر هذه الأرقام عند الضغط المطول على زر (+) أو (-) لتسهيل إضافة الشحنات الكبيرة.
            </p>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Section 4: Data & Backup */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              النسخ الاحتياطي واستعادة البيانات (Backup & Restore)
            </h4>

            {importStatus && (
              <div className="p-2.5 rounded-xl bg-[#E6F9FA] dark:bg-slate-800 border border-[#00B8C4]/30 text-xs text-[#00B8C4] text-center font-medium">
                {importStatus}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {/* Export JSON */}
              <button
                type="button"
                onClick={exportAllDataJSON}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-right hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-5 h-5 text-[#00B8C4] shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    تصدير نسخة كاملة
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    ملف كود (JSON)
                  </span>
                </div>
              </button>

              {/* Import JSON */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-right hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-5 h-5 text-[#00B8C4] shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    استيراد نسخة
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    استرجاع ملف JSON
                  </span>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="pt-1">
              {/* Reset to Sample Data */}
              <button
                type="button"
                onClick={() => {
                  if (confirm('هل تريد استعادة نماذج الجرد الجاهزة؟ سيتم استبدال البيانات الحالية.')) {
                    resetToDefaultData();
                    onClose();
                  }
                }}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-right hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    استرجاع نماذج وعينات الجرد التجريبية
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Dedication & Contact Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-center space-y-2.5 shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm">
              <span>🤲</span>
              <span>نسألكم صالح الدعاء لأخيكم أحمد عبد الغني</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              نسأل الله أن ينفع بهذا العمل وأن يتقبله خالصاً لوجهه الكريم
            </p>
            <div className="pt-1">
              <a
                href="https://www.facebook.com/AhmedAbdelghany1976"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold shadow-sm transition-all transform active:scale-95"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>للتواصل مع أحمد عبد الغني عبر فيسبوك</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-[#00B8C4] hover:bg-[#009DA8] text-white font-bold text-xs shadow-sm transition-colors border border-[#00B8C4]"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
