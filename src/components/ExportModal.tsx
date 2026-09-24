import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  X,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Printer,
  Copy,
  Check,
  Download,
  Loader2,
  Boxes,
  Sigma,
  Calendar,
  Layers
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { activeList, exportActiveListCSV } = useApp();
  const [loadingType, setLoadingType] = useState<'pdf' | 'png' | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !activeList) return null;

  const items = activeList.items || [];
  const totalItems = items.length;
  const positiveItems = items.filter(i => i.value > 0).length;
  const totalQuantities = items.reduce((sum, i) => sum + i.value, 0);
  const maxValue = items.length > 0 ? Math.max(...items.map(i => i.value)) : 0;

  const formattedDate = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Export as PNG Image
  const handleExportPNG = async () => {
    if (!reportRef.current) return;
    try {
      setLoadingType('png');
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // 2x resolution for high sharpness
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const image = canvas.toDataURL('image/png');
      const safeName = activeList.name.replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_');
      const link = document.createElement('a');
      link.href = image;
      link.download = `تقرير_جرد_${safeName}_${Date.now()}.png`;
      link.click();
    } catch (err) {
      console.error('Error generating PNG:', err);
    } finally {
      setLoadingType(null);
    }
  };

  // Export as PDF
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    try {
      setLoadingType('pdf');

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Calculate A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();

      // If content fits on one page
      if (pdfHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      } else {
        // Multi-page splitting
        let heightLeft = pdfHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }
      }

      const safeName = activeList.name.replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_');
      pdf.save(`تقرير_جرد_${safeName}_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setLoadingType(null);
    }
  };

  // Direct print option
  const handlePrint = () => {
    window.print();
  };

  // Copy text report to clipboard
  const handleCopyText = () => {
    const textLines = [
      `📋 تقرير جرد: ${activeList.name}`,
      `📅 التاريخ: ${formattedDate}`,
      `📦 إجمالي البنود: ${totalItems} (النشط: ${positiveItems})`,
      `🔢 مجموع الكميات: ${totalQuantities}`,
      `-----------------------`,
      ...items.map((i, idx) => `${idx + 1}. ${i.name}: ${i.value} ${i.unit || ''} ${i.category ? `(${i.category})` : ''} ${i.notes ? `- ${i.notes}` : ''}`),
      `-----------------------`,
      `نسألكم صالح الدعاء لأخيكم أحمد عبد الغني`,
    ];
    navigator.clipboard.writeText(textLines.join('\n'));
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full sm:max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-sm">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                تصدير ومشاركة تقرير الجرد
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                قائمة: {activeList.name} ({totalItems} بند)
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

        {/* Export Buttons Action Grid */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* 1. PDF Export */}
            <button
              type="button"
              disabled={loadingType !== null}
              onClick={handleExportPDF}
              className="p-4 rounded-2xl bg-rose-50 hover:bg-rose-100/80 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 text-right transition-all group flex items-start gap-3.5 shadow-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                {loadingType === 'pdf' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <span className="text-sm font-bold text-rose-950 dark:text-rose-200 block">
                  تصدير كملف PDF
                </span>
                <span className="text-xs text-rose-700/80 dark:text-rose-300/70 block mt-0.5">
                  مستند منسق جاهز للطباعة والأرشفة الرسمية (.pdf)
                </span>
              </div>
            </button>

            {/* 2. PNG Image Export */}
            <button
              type="button"
              disabled={loadingType !== null}
              onClick={handleExportPNG}
              className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/40 text-right transition-all group flex items-start gap-3.5 shadow-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                {loadingType === 'png' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <span className="text-sm font-bold text-emerald-950 dark:text-emerald-200 block">
                  تصدير كصورة PNG
                </span>
                <span className="text-xs text-emerald-700/80 dark:text-emerald-300/70 block mt-0.5">
                  صورة عالية الدقة مثالية للمشاركة عبر واتساب وتيليجرام (.png)
                </span>
              </div>
            </button>

            {/* 3. Excel CSV Export */}
            <button
              type="button"
              onClick={exportActiveListCSV}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-right transition-all group flex items-start gap-3.5"
            >
              <div className="w-9 h-9 rounded-xl bg-green-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  تصدير Excel (CSV)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  جدول بيانات متوافق مع Excel وجداول Google
                </span>
              </div>
            </button>

            {/* 4. Copy Text Report */}
            <button
              type="button"
              onClick={handleCopyText}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-right transition-all group flex items-start gap-3.5"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                {copiedText ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  {copiedText ? 'تم نسخ التقرير!' : 'نسخ التقرير كنص'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  نسخ ملخص سريع للحافظة واللصق في المحادثات
                </span>
              </div>
            </button>
          </div>

          {/* Quick Print Button */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Printer className="w-4 h-4 text-slate-500" />
              <span>أو الطباعة المباشرة من الطابعة / حفظ PDF من المتصفح:</span>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="py-1.5 px-3 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-bold text-xs hover:bg-slate-50"
            >
              طباعة فورية
            </button>
          </div>

          {/* Preview Section Header */}
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              معاينة التقرير المستخرج (يتم حفظه بنفس التنسيق):
            </span>

            {/* Visual Printable/Exportable Report Canvas Container */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-inner bg-slate-200/50 p-2">
              <div
                ref={reportRef}
                className="bg-white text-slate-900 p-6 sm:p-8 rounded-xl min-w-[540px] max-w-[720px] mx-auto text-right font-sans"
                dir="rtl"
              >
                {/* Report Top Header */}
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-5">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                      تقرير جرد الكميات والعدادات
                    </h2>
                    <p className="text-sm font-bold text-blue-600 mt-0.5">
                      القائمة: {activeList.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formattedDate}</span>
                    </p>
                  </div>
                  <div className="text-left">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-sm">
                      <Layers className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Key Metrics Boxes */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] text-slate-500 block leading-tight">إجمالي البنود</span>
                    <span className="text-base font-bold font-mono text-slate-900">{totalItems}</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] text-emerald-700 block leading-tight">بنود نشطة (&gt;0)</span>
                    <span className="text-base font-bold font-mono text-emerald-700">{positiveItems}</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] text-blue-700 block leading-tight">مجموع الكميات</span>
                    <span className="text-base font-bold font-mono text-blue-700">{totalQuantities}</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] text-amber-700 block leading-tight">أكبر كمية</span>
                    <span className="text-base font-bold font-mono text-amber-700">{maxValue}</span>
                  </div>
                </div>

                {/* Table of items */}
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                      <th className="py-2.5 px-3 w-8 text-center font-bold">#</th>
                      <th className="py-2.5 px-3 font-bold">اسم البند / المادة</th>
                      <th className="py-2.5 px-3 font-bold text-center">الكمية</th>
                      <th className="py-2.5 px-3 font-bold">الوحدة</th>
                      <th className="py-2.5 px-3 font-bold">التصنيف</th>
                      <th className="py-2.5 px-3 font-bold">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                        <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{item.name}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-sm text-slate-900">
                          {item.value}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{item.unit || '-'}</td>
                        <td className="py-2 px-3 text-slate-600">{item.category || '-'}</td>
                        <td className="py-2 px-3 text-slate-500 text-[11px]">{item.notes || '-'}</td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          لا توجد بنود في هذه القائمة بعد.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {items.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                        <td colSpan={2} className="py-2.5 px-3 text-slate-800">الإجمالي العام لجميع الكميات</td>
                        <td className="py-2.5 px-3 text-center font-mono text-base text-blue-700">
                          {totalQuantities}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>

                {/* Report Footer with Dedication */}
                <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>تم استخراج التقرير عبر تطبيق عداد الجرد والكميات</span>
                  <div className="text-left">
                    <span className="font-semibold text-slate-700 block">🤲 نسألكم صالح الدعاء لأخيكم أحمد عبد الغني</span>
                    <span className="text-[10px] text-slate-400">facebook.com/AhmedAbdelghany1976</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold text-xs shadow-sm"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
