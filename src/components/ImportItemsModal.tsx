import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ListItem } from '../types';
import {
  parseImportText,
  ParsedImportItem,
  SAMPLE_IMPORT_LISTS
} from '../utils/textImporter';
import {
  FileSpreadsheet,
  Upload,
  FileText,
  Check,
  X,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Plus,
  Trash2,
  ListPlus,
  RefreshCw,
  FolderPlus,
  Layers,
  ChevronDown,
  ArrowRight
} from 'lucide-react';

interface ImportItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  importMode?: 'items' | 'list';
  onOpenCreateList?: () => void;
}

export const ImportItemsModal: React.FC<ImportItemsModalProps> = ({
  isOpen,
  onClose,
  importMode = 'items',
  onOpenCreateList
}) => {
  const { activeList, lists, importItemsToList, createList, setActiveListId } = useApp();

  const [activeStep, setActiveStep] = useState<'input' | 'preview'>('input');
  const [inputText, setInputText] = useState<string>('');
  const [defaultQuantity, setDefaultQuantity] = useState<number>(0);
  const [parsedItems, setParsedItems] = useState<ParsedImportItem[]>([]);
  const [targetMode, setTargetMode] = useState<'current' | 'new'>(importMode === 'list' ? 'new' : 'current');
  const [importAction, setImportAction] = useState<'append' | 'replace'>('append');
  const [newListName, setNewListName] = useState<string>('');
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse text whenever input text or defaultQuantity changes
  const parseResult = useMemo(() => {
    return parseImportText(inputText, defaultQuantity);
  }, [inputText, defaultQuantity]);

  // Sync parsed items when parseResult changes
  useEffect(() => {
    setParsedItems(parseResult.items);
  }, [parseResult.items]);

  useEffect(() => {
    if (isOpen) {
      setActiveStep('input');
      setFeedbackMsg(null);
      if (importMode === 'list') {
        setTargetMode('new');
        setNewListName('قائمة جرد جديدة');
      } else {
        setTargetMode('current');
        if (activeList) {
          setNewListName(`${activeList.name} - مستوردة`);
        }
      }
    }
  }, [isOpen, activeList, importMode]);

  if (!isOpen) return null;

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
        setFeedbackMsg(`تم قراءة الملف بنجاح (${file.name})`);
        setTimeout(() => setFeedbackMsg(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Select/Deselect All
  const handleToggleSelectAll = () => {
    const allSelected = parsedItems.every(i => i.selected);
    setParsedItems(prev => prev.map(i => ({ ...i, selected: !allSelected })));
  };

  // Toggle single item
  const handleToggleItem = (id: string) => {
    setParsedItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  };

  // Remove row from preview
  const handleRemoveRow = (id: string) => {
    setParsedItems(prev => prev.filter(i => i.id !== id));
  };

  // Edit item inline
  const handleUpdateItemField = (id: string, field: keyof ParsedImportItem, value: any) => {
    setParsedItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  // Load sample template
  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_IMPORT_LISTS.find(s => s.id === sampleId);
    if (sample) {
      setInputText(sample.data);
      setFeedbackMsg(`تم تحميل: ${sample.label}`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  // Submit and perform import
  const handleConfirmImport = () => {
    const selectedItems = parsedItems.filter(i => i.selected && i.name.trim().length > 0);
    if (selectedItems.length === 0) {
      alert('يرجى تحديد بند واحد على الأقل للاستيراد');
      return;
    }

    const itemsToImport = selectedItems.map(item => ({
      name: item.name.trim(),
      value: item.value,
      unit: item.unit.trim() || 'قطعة',
      price: item.price !== undefined && item.price !== null && !isNaN(item.price) ? item.price : undefined,
      category: item.category?.trim() || undefined,
      color: item.color || 'emerald',
      notes: item.notes?.trim() || undefined,
    }));

    let targetListId = activeList?.id;

    if (targetMode === 'new') {
      const name = newListName.trim() || 'قائمة مستوردة جديدة';
      targetListId = createList({
        name,
        color: activeList?.color || 'blue',
        icon: activeList?.icon || 'boxes',
      });
      setActiveListId(targetListId);
    }

    if (targetListId) {
      importItemsToList(itemsToImport, {
        targetListId,
        replaceExisting: targetMode === 'current' && importAction === 'replace',
      });
    }

    onClose();
  };

  const selectedCount = parsedItems.filter(i => i.selected).length;
  const totalImportQuantity = parsedItems
    .filter(i => i.selected)
    .reduce((sum, i) => sum + (Number(i.value) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#00B8C4] text-white flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                {importMode === 'list'
                  ? 'استيراد قائمة جرد جديدة (CSV أو نصي)'
                  : `استيراد بنود إلى: ${activeList?.name || 'القائمة'}`}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {importMode === 'list'
                  ? 'إنشاء قائمة جرد متكاملة بجميع بنودها بضغطة زر'
                  : 'إضافة مجموعة بنود جديدة دفعة واحدة إلى هذه القائمة'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveStep('input')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeStep === 'input'
                ? 'bg-white dark:bg-slate-800 text-[#00B8C4] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. لصق النص أو رفع الملف</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep('preview')}
            disabled={parsedItems.length === 0}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              activeStep === 'preview'
                ? 'bg-white dark:bg-slate-800 text-[#00B8C4] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>2. مراجعة البنود المستخرجة ({parsedItems.length})</span>
          </button>
        </div>

        {/* Step 1: Input text / upload */}
        {activeStep === 'input' && (
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
            {/* Quick Actions Row */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-slate-500 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>نماذج جاهزة:</span>
                </span>
                {SAMPLE_IMPORT_LISTS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleLoadSample(sample.id)}
                    className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    {sample.label.split(' ')[1]}
                  </button>
                ))}
              </div>

              {/* Upload file trigger */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-1.5 px-3 rounded-xl bg-[#E6F9FA] dark:bg-slate-800 text-[#00B8C4] hover:bg-[#00B8C4]/10 border border-[#00B8C4]/30 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع ملف CSV / TXT</span>
                </button>
              </div>
            </div>

            {feedbackMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#10B981] text-xs font-bold border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
                {feedbackMsg}
              </div>
            )}

            {/* Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  الصق نص البنود هنا (جدول إكسل، أو CSV، أو كل صنف بسطر):
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-xs text-[#00B8C4] hover:underline flex items-center gap-1 font-semibold"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>أشكال التنسيق المدعومة</span>
                </button>
              </div>

              {showHelp && (
                <div className="p-3 mb-2 rounded-xl bg-[#E6F9FA]/70 dark:bg-slate-800/80 border border-[#00B8C4]/30 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
                  <p className="font-bold text-[#0F172A] dark:text-[#00B8C4]">💡 يقبل النظام أي شكل من الأشكال التالية تلقائياً:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                    <li><strong>جدول منسق CSV:</strong> <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">اسم الصنف, الكمية, الوحدة, ملاحظات</code></li>
                    <li><strong>نسخ ولصق مباشر من Excel أو Google Sheets:</strong> الصق الأعمدة مباشرة كما هي.</li>
                    <li><strong>نص عادي مع كمية:</strong> <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">محبس دفن تركي (15)</code> أو <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">ماسورة 2 بوصة - 20 متر</code></li>
                    <li><strong>قائمة أسماء فقط:</strong> كتابة كل اسم صنف في سطر، وسيعتمد النظام كمية افتراضية مع تصنيف ذكي تلقائي.</li>
                  </ul>
                </div>
              )}

              <textarea
                rows={9}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`مثال لصق مباشر:
محبس بلي 1 بوصة, 25, حبة, رف A
كوع زاوية 90 درجة, 40, قطعة
ماسورة بي في سي 3 بوصة (15)
خلاط مغسلة شجرة - 10 حبات
سيفون معلق`}
                className="w-full p-3 font-mono text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B8C4]/20 focus:border-[#00B8C4] transition-all leading-relaxed resize-y"
              />
            </div>

            {/* Quick config */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    الكمية الافتراضية
                  </span>
                  <span className="text-[11px] text-slate-400">
                    للبنود التي لم يحدد لها كمية
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[0, 1, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setDefaultQuantity(num)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                        defaultQuantity === num
                          ? 'bg-[#00B8C4] text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status indicator */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    النتيجة المتوقعة
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {parseResult.detectedFormat === 'csv' && 'تنسيق CSV مفصول بفواصل'}
                    {parseResult.detectedFormat === 'tsv' && 'أعمدة منسوخة من إكسل'}
                    {parseResult.detectedFormat === 'lines' && 'أسطر نصية حرة'}
                    {parseResult.detectedFormat === 'empty' && 'في انتظار إدخال البيانات'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black font-mono text-[#10B981] dark:text-[#10B981]">
                    {parsedItems.length} بند
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview & Confirm */}
        {activeStep === 'preview' && (
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 flex flex-col min-h-0">
            {/* Top Toolbar: Selection & Target list option */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shrink-0">
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="py-1 px-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                  >
                    {parsedItems.every(i => i.selected) ? 'إلغاء تحديد الكل' : 'تحديد كل البنود'}
                  </button>
                  <span className="font-semibold text-slate-500">
                    محدد: <strong className="text-[#00B8C4] font-mono">{selectedCount}</strong> من {parsedItems.length}
                  </span>
                </div>

                <div className="text-xs text-slate-500 font-semibold">
                  مجموع الكميات المحددة: <strong className="text-[#10B981] font-mono">{totalImportQuantity}</strong>
                </div>
              </div>

              {/* Destination choice */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  targetMode === 'current'
                    ? 'bg-[#E6F9FA] dark:bg-[#00B8C4]/15 border-[#00B8C4] text-[#008790] dark:text-[#00B8C4] font-bold'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="targetMode"
                    checked={targetMode === 'current'}
                    onChange={() => setTargetMode('current')}
                    className="accent-[#00B8C4]"
                  />
                  <div className="min-w-0">
                    <span className="block truncate">القائمة الحالية: ({activeList?.name})</span>
                    <span className="text-[11px] font-normal opacity-75">
                      {importAction === 'append' ? 'إلحاق بالبنود الموجودة' : 'استبدال كل البنود'}
                    </span>
                  </div>
                </label>

                <label className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  targetMode === 'new'
                    ? 'bg-[#E6F9FA] dark:bg-[#00B8C4]/15 border-[#00B8C4] text-[#008790] dark:text-[#00B8C4] font-bold'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="targetMode"
                    checked={targetMode === 'new'}
                    onChange={() => setTargetMode('new')}
                    className="accent-[#00B8C4]"
                  />
                  <div className="min-w-0">
                    <span className="block">إنشاء قائمة جرد جديدة</span>
                    <span className="text-[11px] font-normal opacity-75">تخصيص اسم وقائمة مستقلة</span>
                  </div>
                </label>
              </div>

              {/* Sub-options based on target mode */}
              {targetMode === 'current' ? (
                <div className="flex items-center gap-3 pt-1 text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-400">طريقة الإضافة:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="importAction"
                      checked={importAction === 'append'}
                      onChange={() => setImportAction('append')}
                      className="accent-[#00B8C4]"
                    />
                    <span>إلحاق بالبنود الحالية (+{activeList?.items.length || 0} بند قائم)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[#EF4444] font-semibold">
                    <input
                      type="radio"
                      name="importAction"
                      checked={importAction === 'replace'}
                      onChange={() => setImportAction('replace')}
                      className="accent-[#EF4444]"
                    />
                    <span>استبدال بنود القائمة بالكامل</span>
                  </label>
                </div>
              ) : (
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">اسم القائمة الجديدة:</span>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="مثال: جرد بضاعة مخزن النواكل"
                    className="flex-1 py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:border-[#00B8C4] outline-none"
                  />
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col min-h-[220px]">
              <div className="bg-slate-100 dark:bg-slate-800/90 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 grid grid-cols-12 gap-2 border-b border-slate-200 dark:border-slate-700">
                <span className="col-span-1 text-center">اختيار</span>
                <span className="col-span-6">اسم الصنف والبند</span>
                <span className="col-span-2 text-center">الكمية</span>
                <span className="col-span-2">الوحدة</span>
                <span className="col-span-1 text-center">حذف</span>
              </div>

              <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[340px]">
                {parsedItems.map((item) => (
                  <div
                    key={item.id}
                    className={`px-3 py-2 text-xs grid grid-cols-12 gap-2 items-center transition-colors ${
                      item.selected
                        ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        : 'bg-slate-50/60 dark:bg-slate-950/40 opacity-50'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="col-span-1 flex justify-center">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleItem(item.id)}
                        className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                      />
                    </div>

                    {/* Name */}
                    <div className="col-span-6 min-w-0">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItemField(item.id, 'name', e.target.value)}
                        className="w-full py-1 px-2 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 font-bold text-slate-900 dark:text-white text-xs truncate focus:bg-white dark:focus:bg-slate-800 focus:border-[#00B8C4] outline-none"
                      />
                      {item.notes && (
                        <span className="block text-[10px] text-slate-400 truncate px-2">
                          {item.notes}
                        </span>
                      )}
                    </div>

                    {/* Value */}
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        value={item.value}
                        onChange={(e) => handleUpdateItemField(item.id, 'value', parseFloat(e.target.value) || 0)}
                        className="w-full py-1 px-1.5 text-center font-mono font-bold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:border-[#00B8C4] outline-none"
                      />
                    </div>

                    {/* Unit */}
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleUpdateItemField(item.id, 'unit', e.target.value)}
                        className="w-full py-1 px-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs focus:border-[#00B8C4] outline-none"
                      />
                    </div>

                    {/* Delete */}
                    <div className="col-span-1 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(item.id)}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="حذف هذا البند من الاستيراد"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          {activeStep === 'input' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={parsedItems.length === 0}
                onClick={() => setActiveStep('preview')}
                className="py-2.5 px-5 rounded-xl bg-[#00B8C4] hover:bg-[#009DA8] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-md active:scale-95 transition-all"
              >
                <span>مراجعة ومعاينة ({parsedItems.length} بند)</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveStep('input')}
                className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                تعديل النص
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-3 rounded-xl text-slate-500 text-xs sm:text-sm hover:text-slate-700 transition-colors"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  disabled={selectedCount === 0}
                  onClick={handleConfirmImport}
                  className="py-2.5 px-6 rounded-xl bg-[#10B981] hover:bg-[#059669] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-[#10B981]/25 active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>تأكيد استيراد ({selectedCount}) بند الآن</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
