import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { COLOR_PALETTE } from '../types';
import { ListIcon } from './ListIcon';
import {
  Boxes,
  CheckCircle2,
  Sigma,
  TrendingUp,
  Clock,
  Plus,
  RotateCcw,
  FileSpreadsheet,
  Share2,
  Check,
  Download,
  FileText,
  Image as ImageIcon
} from 'lucide-react';

interface ListHeaderStatsProps {
  onOpenCreateItem: () => void;
  onOpenResetConfirm: () => void;
  onOpenEditList: () => void;
  onOpenExportModal: () => void;
}

export const ListHeaderStats: React.FC<ListHeaderStatsProps> = ({
  onOpenCreateItem,
  onOpenResetConfirm,
  onOpenEditList,
  onOpenExportModal,
}) => {
  const { activeList } = useApp();
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!activeList) return null;

  const items = activeList.items || [];
  const totalItems = items.length;
  const positiveItems = items.filter(i => i.value > 0).length;
  const totalQuantities = items.reduce((sum, i) => sum + i.value, 0);
  const maxValue = items.length > 0 ? Math.max(...items.map(i => i.value)) : 0;
  
  // Format last updated date in Arabic
  const formattedDate = new Date(activeList.updatedAt).toLocaleDateString('ar-EG', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const colorConfig = COLOR_PALETTE.find(c => c.id === activeList.color) || COLOR_PALETTE[0];

  const handleCopySummary = () => {
    const textLines = [
      `📋 تقرير جرد: ${activeList.name}`,
      `📅 التاريخ: ${new Date().toLocaleDateString('ar-EG')}`,
      `📦 إجمالي البنود: ${totalItems} (النشط: ${positiveItems})`,
      `🔢 مجموع الكميات: ${totalQuantities}`,
      `-----------------------`,
      ...items.map(i => `• ${i.name}: ${i.value} ${i.unit || ''}`),
    ];
    navigator.clipboard.writeText(textLines.join('\n'));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
        {/* Title row */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              onClick={onOpenEditList}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm cursor-pointer hover:opacity-90 transition-opacity ${colorConfig.bg}`}
              title="اضغط لتعديل القائمة"
            >
              <ListIcon name={activeList.icon} className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 
                onClick={onOpenEditList}
                className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white truncate cursor-pointer hover:text-blue-600 transition-colors"
                title="اضغط لتعديل القائمة"
              >
                {activeList.name}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>آخر تعديل: {formattedDate}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Primary Action: Add item */}
          <button
            onClick={onOpenCreateItem}
            className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm active:scale-95 transition-all whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>إضافة بند</span>
          </button>
        </div>

        {/* 5 Specific Stats Required by Prompt:
            1. إجمالي عدد البنود
            2. عدد البنود التي قيمتها أكبر من صفر
            3. مجموع جميع الكميات
            4. أكبر قيمة موجودة
            5. تاريخ آخر تعديل
        */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Total Items */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-none">
                إجمالي البنود
              </span>
              <span className="text-base sm:text-lg font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                {totalItems}
              </span>
            </div>
          </div>

          {/* Positive Items (> 0) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-none">
                بنود أكبر من صفر
              </span>
              <span className="text-base sm:text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {positiveItems}
              </span>
            </div>
          </div>

          {/* Sum of all quantities */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Sigma className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-none">
                مجموع الكميات
              </span>
              <span className="text-base sm:text-lg font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                {totalQuantities}
              </span>
            </div>
          </div>

          {/* Max Value */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-none">
                أكبر قيمة
              </span>
              <span className="text-base sm:text-lg font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {maxValue}
              </span>
            </div>
          </div>
        </div>

        {/* Secondary Toolbar: Export, Copy, Reset List */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            
            {/* Main Export Center Button */}
            <button
              onClick={onOpenExportModal}
              className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors font-bold shadow-xs active:scale-95"
              title="تصدير تقرير الجرد كملف PDF أو صورة PNG أو ملف Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير ومشاركة...</span>
            </button>

            {/* Quick PDF button */}
            <button
              onClick={onOpenExportModal}
              className="py-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1 transition-colors font-semibold"
              title="تصدير كملف PDF"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF</span>
            </button>

            {/* Quick PNG button */}
            <button
              onClick={onOpenExportModal}
              className="py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-1 transition-colors font-semibold"
              title="تصدير كصورة PNG"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>PNG</span>
            </button>

            {/* Copy text report */}
            <button
              onClick={handleCopySummary}
              className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors font-medium"
              title="نسخ ملخص القائمة إلى الحافظة"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">تم النسخ!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>نسخ نص</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={onOpenResetConfirm}
            className="py-1.5 px-2.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1 transition-colors font-medium"
            title="تصفير كل عدادات القائمة"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تصفير العدادات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
