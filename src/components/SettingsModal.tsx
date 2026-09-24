import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { DebounceDelay } from '../types';
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
  Image as ImageIcon
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExportModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenExportModal,
}) => {
  const {
    settings,
    updateSettings,
    exportActiveListCSV,
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
              <Shield className="w-4 h-4 text-blue-500" />
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
                  className={`p-3 rounded-xl border text-right transition-all ${
                    settings.debounceDelay === opt.value
                      ? 'bg-blue-50 border-blue-500 text-blue-900 dark:bg-blue-950/40 dark:border-blue-400 dark:text-blue-200 font-semibold shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{opt.label}</span>
                    {settings.debounceDelay === opt.value && (
                      <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
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
                onChange={(e) => updateSettings({ hapticFeedback: e.target.checked })}
                className="w-5 h-5 rounded accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Sound click */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
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
                className="w-5 h-5 rounded accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Screen Wake Lock */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
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
                className="w-5 h-5 rounded accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Dark Mode */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
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
                className="w-5 h-5 rounded accent-blue-600 cursor-pointer"
              />
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
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
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
              البيانات والتصدير والنسخ الاحتياطي
            </h4>

            {importStatus && (
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 text-center font-medium">
                {importStatus}
              </div>
            )}

            {/* Export Center Trigger Banner */}
            {onOpenExportModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenExportModal();
                }}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-between text-right shadow-md shadow-blue-500/20 active:scale-98 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">
                      تصدير ومشاركة تقرير (PDF / PNG)
                    </span>
                    <span className="text-[10px] text-blue-100 block">
                      حفظ كملف PDF رسمي أو صورة PNG للمشاركة عبر واتساب
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 bg-white/20 py-1 px-2.5 rounded-lg text-xs font-bold">
                  <span>فتح</span>
                  <ImageIcon className="w-3.5 h-3.5" />
                </div>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              {/* Export CSV */}
              <button
                type="button"
                onClick={exportActiveListCSV}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-right hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    تصدير Excel (CSV)
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    للقائمة الحالية
                  </span>
                </div>
              </button>

              {/* Export JSON */}
              <button
                type="button"
                onClick={exportAllDataJSON}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-right hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    نسخة كاملة (JSON)
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    حفظ كل القوائم
                  </span>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Import JSON */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-right hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <Upload className="w-5 h-5 text-purple-600 shrink-0" />
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

              {/* Reset to Sample Data */}
              <button
                type="button"
                onClick={() => {
                  if (confirm('هل تريد استعادة نماذج الجرد الجاهزة؟ سيتم استبدال البيانات الحالية.')) {
                    resetToDefaultData();
                    onClose();
                  }
                }}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-right hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    نماذج جاهزة
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    استرجاع عينات الجرد
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Dedication & Contact Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-slate-50 dark:from-slate-800/80 dark:via-blue-950/20 dark:to-slate-900 border border-blue-100 dark:border-blue-900/40 text-center space-y-2.5 shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-blue-700 dark:text-blue-300 font-bold text-xs sm:text-sm">
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
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-right">
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium block">
              نسألكم الدعاء لأخيكم أحمد عبد الغني
            </span>
            <a
              href="https://www.facebook.com/AhmedAbdelghany1976"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
            >
              facebook.com/AhmedAbdelghany1976
            </a>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-2 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold text-xs shadow-sm"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
