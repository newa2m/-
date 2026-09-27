import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import html2canvasPro from 'html2canvas-pro';
import html2canvasStandard from 'html2canvas';
import jsPDF from 'jspdf';
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  MessageCircle,
  Copy,
  Check,
  Printer,
  Calendar,
  Layers,
  FilterX,
  Share2,
  Sparkles,
  Download,
  Loader2,
  RefreshCw,
  Coins,
  ArrowRight,
  X,
  Send,
  AlertCircle,
  CheckCircle2,
  HardDrive,
  Save,
  FileJson,
  PenLine,
  Tag
} from 'lucide-react';

interface ExportPreviewTabProps {
  onClose?: () => void;
}

export const ExportPreviewTab: React.FC<ExportPreviewTabProps> = ({ onClose }) => {
  const { activeList, exportActiveListCSV } = useApp();
  const reportRef = useRef<HTMLDivElement>(null);

  const [ignoreZeroItems, setIgnoreZeroItems] = useState(true);
  const [includePrices, setIncludePrices] = useState(false);
  const [loadingType, setLoadingType] = useState<'pdf' | 'png' | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Custom Report Title & Definition
  const [customReportTitle, setCustomReportTitle] = useState('');
  const [customReportSubtitle, setCustomReportSubtitle] = useState('');
  const [showTitleEditor, setShowTitleEditor] = useState(false);

  // WhatsApp Format Selection Modal State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppShareLoading, setWhatsAppShareLoading] = useState<'text' | 'pdf' | 'png' | 'csv' | null>(null);
  const [whatsAppNotice, setWhatsAppNotice] = useState<string | null>(null);

  // Active export method category: 'whatsapp' (إرسال إلى واتساب) vs 'device' (حفظ إلى الجهاز)
  const [exportCategory, setExportCategory] = useState<'whatsapp' | 'device'>('whatsapp');
  const [jsonExportSuccess, setJsonExportSuccess] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // High-Resolution PNG Saved / WhatsApp Share Modal State
  const [pngModalData, setPngModalData] = useState<{
    isOpen: boolean;
    imageUrl: string;
    filename: string;
    blob: Blob;
    isWhatsAppTarget: boolean;
  } | null>(null);

  if (!activeList) {
    return (
      <div className="py-16 text-center text-slate-400">
        <p className="text-sm">لا توجد قائمة نشطة حالياً لعرض التقرير.</p>
      </div>
    );
  }

  const allItems = activeList.items || [];
  const zeroCount = allItems.filter(i => i.value === 0).length;
  const items = ignoreZeroItems ? allItems.filter(i => i.value > 0) : allItems;

  const totalItems = items.length;
  const positiveItems = items.filter(i => i.value > 0).length;
  const totalQuantities = items.reduce((sum, i) => sum + i.value, 0);
  const maxValue = items.length > 0 ? Math.max(...items.map(i => i.value)) : 0;

  // Calculate total monetary amount (الكمية × السعر)
  const totalMonetaryAmount = items.reduce((sum, i) => {
    const p = i.price || 0;
    return sum + (i.value * p);
  }, 0);

  const formattedDate = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Robust Canvas Generator with Fallback and Clean RTL Formatting
  const generateReportCanvas = async (): Promise<HTMLCanvasElement> => {
    if (!reportRef.current) throw new Error('تعذر العثور على عنصر التقرير');
    const el = reportRef.current;
    const targetWidth = Math.max(el.offsetWidth, 780);

    const options = {
      scale: 2,
      useCORS: true,
      allowTaint: false, // Insecure taint flag disabled so toBlob and toDataURL never throw SecurityError
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: targetWidth,
      windowWidth: Math.max(el.scrollWidth, 800),
      onclone: (clonedDoc: Document) => {
        const clonedReport = clonedDoc.querySelector('.printable-report') as HTMLElement;
        if (clonedReport) {
          clonedReport.style.backgroundColor = '#ffffff';
          clonedReport.style.color = '#0f172a';
          clonedReport.style.boxShadow = 'none';
          clonedReport.style.border = '1px solid #cbd5e1';
          clonedReport.style.transform = 'none';
          clonedReport.style.margin = '0 auto';
          clonedReport.style.width = '780px';
          clonedReport.style.maxWidth = '780px';
          clonedReport.style.minWidth = '780px';
        }
      }
    };

    try {
      return await html2canvasPro(el, options);
    } catch (proErr) {
      console.warn('html2canvas-pro encountered an issue, falling back to standard html2canvas:', proErr);
      return await html2canvasStandard(el, options);
    }
  };

  // Convert HTMLCanvasElement to pristine Blob with base64 fallback
  const canvasToBlob = async (canvas: HTMLCanvasElement): Promise<Blob> => {
    return new Promise<Blob>((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            try {
              const dataUrl = canvas.toDataURL('image/png');
              const byteString = atob(dataUrl.split(',')[1]);
              const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
              }
              resolve(new Blob([ab], { type: mimeString }));
            } catch (fallbackErr) {
              reject(new Error('فشل استخراج ملف الصورة من الكانفاس: ' + (fallbackErr as any)?.message));
            }
          }
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    });
  };

  // Safe Blob file download with proper DOM attachment
  const triggerDownloadBlob = (blob: Blob, filename: string): string => {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    }, 4000);
    return blobUrl;
  };

  // Export as PNG Image (Save to Device)
  const handleExportPNG = async () => {
    if (!reportRef.current) return;
    try {
      setLoadingType('png');
      setExportFeedback(null);

      const canvas = await generateReportCanvas();
      const blob = await canvasToBlob(canvas);

      const prefix = customReportTitle.trim() 
        ? customReportTitle.trim().replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_')
        : (activeList.name || 'تقرير').replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_');
      const filename = `تقرير_${prefix}_${Date.now()}.png`;

      const blobUrl = triggerDownloadBlob(blob, filename);

      setPngModalData({
        isOpen: true,
        imageUrl: blobUrl,
        filename,
        blob,
        isWhatsAppTarget: false,
      });

      setExportFeedback({
        type: 'success',
        message: 'تم تنزيل وحفظ صورة التقرير عالية الدقة (PNG) بنجاح!'
      });
    } catch (err: any) {
      console.error('Error generating PNG:', err);
      setExportFeedback({
        type: 'error',
        message: 'حدث خطأ أثناء حفظ الصورة: ' + (err?.message || 'يرجى المحاولة مجدداً')
      });
    } finally {
      setLoadingType(null);
    }
  };

  // Export as PDF Document (A4)
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    try {
      setLoadingType('pdf');
      setExportFeedback(null);

      const canvas = await generateReportCanvas();
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();

      if (pdfHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      } else {
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

      const prefix = customReportTitle.trim() 
        ? customReportTitle.trim().replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_')
        : (activeList.name || 'تقرير').replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_');
      pdf.save(`تقرير_${prefix}_${Date.now()}.pdf`);
      setExportFeedback({ type: 'success', message: 'تم تنزيل مستند PDF المجدول بنجاح!' });
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setExportFeedback({ type: 'error', message: 'حدث خطأ أثناء إنشاء ملف PDF: ' + (err?.message || 'يرجى المحاولة مجدداً') });
    } finally {
      setLoadingType(null);
    }
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp formatted share text
  const generateReportText = () => {
    const reportTitleText = customReportTitle.trim() || `تقرير جرد: ${activeList.name}`;
    const lines = [
      `📋 ${reportTitleText}`,
    ];

    if (customReportSubtitle.trim()) {
      lines.push(`📝 البيان / الموقع: ${customReportSubtitle.trim()}`);
    }

    lines.push(`🏷️ القائمة: ${activeList.name}`);
    lines.push(`📅 التاريخ: ${formattedDate}`);
    lines.push(`📦 بنود التقرير: ${totalItems} صنف ${ignoreZeroItems && zeroCount > 0 ? `(تم استبعاد ${zeroCount} صنف صفري)` : ''}`);
    lines.push(`🔢 مجموع الكميات: ${totalQuantities}`);

    if (includePrices) {
      lines.push(`💰 إجمالي القيمة المالية: ${totalMonetaryAmount.toLocaleString()}`);
    }

    lines.push(`---------------------------------`);
    lines.push(
      ...items.map((i, idx) => {
        let line = `${idx + 1}. ${i.name}: ${i.value} ${i.unit || ''}`;
        if (includePrices && i.price !== undefined && i.price !== null) {
          line += ` [سعر: ${i.price} | إجمالي: ${(i.value * i.price).toLocaleString()}]`;
        }
        if (i.notes) line += ` (${i.notes})`;
        return line;
      })
    );
    lines.push(`---------------------------------`);
    lines.push(`🤲 نسألكم صالح الدعاء لأخيكم أحمد عبد الغني`);
    return lines.join('\n');
  };

  // Helper to generate UTF-8 CSV Blob
  const generateCSVBlob = () => {
    const metaRows: string[] = [];
    if (customReportTitle.trim()) {
      metaRows.push(`"عنوان التقرير:","${customReportTitle.trim().replace(/"/g, '""')}"`);
    }
    if (customReportSubtitle.trim()) {
      metaRows.push(`"البيان / التعريف:","${customReportSubtitle.trim().replace(/"/g, '""')}"`);
    }
    metaRows.push(`"اسم القائمة:","${activeList.name.replace(/"/g, '""')}"`);
    metaRows.push(`"تاريخ الاستخراج:","${formattedDate}"`);
    metaRows.push(''); // blank line before table

    const header = includePrices
      ? ['اسم البند', 'الكمية', 'وحدة القياس', 'سعر الوحدة', 'إجمالي القيمة', 'ملاحظات', 'تاريخ آخر تعديل']
      : ['اسم البند', 'الكمية', 'وحدة القياس', 'ملاحظات', 'تاريخ آخر تعديل'];

    const targetItems = ignoreZeroItems 
      ? allItems.filter(item => item.value > 0)
      : allItems;

    const rows = targetItems.map(item => {
      const itemTotal = (item.price || 0) * item.value;
      const base = [
        `"${item.name.replace(/"/g, '""')}"`,
        item.value,
        `"${(item.unit || '').replace(/"/g, '""')}"`,
      ];
      if (includePrices) {
        base.push(
          item.price !== undefined && item.price !== null ? item.price : '',
          itemTotal > 0 ? itemTotal : 0
        );
      }
      base.push(
        `"${(item.notes || '').replace(/"/g, '""')}"`,
        `"${new Date(item.updatedAt).toLocaleString('ar-EG')}"`
      );
      return base.join(',');
    });

    const csvContent = '\uFEFF' + (metaRows.length > 0 ? metaRows.join('\n') + '\n' : '') + [header.join(','), ...rows].join('\n');
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  };

  // WhatsApp Export Formats Handler
  const handleShareWhatsAppFormat = async (format: 'text' | 'pdf' | 'png' | 'csv') => {
    if (!activeList) return;
    setWhatsAppShareLoading(format);
    setWhatsAppNotice(null);

    const safeName = activeList.name.replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_');
    const summaryText = generateReportText();

    try {
      // 1. Text Message
      if (format === 'text') {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`;
        window.open(url, '_blank');
        setIsWhatsAppModalOpen(false);
        return;
      }

      // 2. PNG High-Res Image
      if (format === 'png') {
        if (!reportRef.current) return;
        const canvas = await generateReportCanvas();
        const blob = await canvasToBlob(canvas);

        const filename = `تقرير_جرد_${safeName}_${Date.now()}.png`;

        // Always download image directly to device first
        const blobUrl = triggerDownloadBlob(blob, filename);

        const file = new File([blob], filename, { type: 'image/png' });

        // Open WhatsApp Image action dialog
        setPngModalData({
          isOpen: true,
          imageUrl: blobUrl,
          filename,
          blob,
          isWhatsAppTarget: true,
        });
        setIsWhatsAppModalOpen(false);

        // Attempt direct native share if supported
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `تقرير جرد: ${activeList.name}`,
              text: `📋 تقرير جرد: ${activeList.name}\n📅 التاريخ: ${formattedDate}`
            });
          } catch (shareErr) {
            console.log('Native share dialog closed or canceled:', shareErr);
          }
        }
        return;
      }

      // 3. PDF Document
      if (format === 'pdf') {
        if (!reportRef.current) return;
        const canvas = await generateReportCanvas();
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        const pageHeight = pdf.internal.pageSize.getHeight();

        if (pdfHeight <= pageHeight) {
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        } else {
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

        const pdfBlob = pdf.output('blob');
        const filename = `تقرير_جرد_${safeName}_${Date.now()}.pdf`;
        triggerDownloadBlob(pdfBlob, filename);

        const file = new File([pdfBlob], filename, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `تقرير جرد: ${activeList.name}`,
              text: `📋 تقرير جرد: ${activeList.name}\n📅 التاريخ: ${formattedDate}`
            });
            setIsWhatsAppModalOpen(false);
          } catch (e) {
            console.log('PDF native share closed');
          }
        } else {
          setWhatsAppNotice('تم تنزيل ملف الـ PDF على جهازك بنجاح! جاري فتح واتساب لتقوم بإرفاقه ومشاركته في المحادثة 📎');
          setTimeout(() => {
            const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`مرفق ملف PDF لتقرير جرد: ${activeList.name}`)}`;
            window.open(waUrl, '_blank');
          }, 800);
        }
        return;
      }

      // 4. Excel (CSV)
      if (format === 'csv') {
        const csvBlob = generateCSVBlob();
        const file = new File([csvBlob], `جرد_${safeName}.csv`, { type: 'text/csv' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `جدول جرد: ${activeList.name}`,
            text: `جدول جرد: ${activeList.name}\nالتاريخ: ${formattedDate}`
          });
          setIsWhatsAppModalOpen(false);
        } else {
          triggerDownloadBlob(csvBlob, `جرد_${safeName}.csv`);
          setWhatsAppNotice('تم تنزيل ملف الإكسل (CSV) على جهازك بنجاح! جاري فتح واتساب لتقوم بإرفاقه ومشاركته في المحادثة 📎');
          setTimeout(() => {
            const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`مرفق جدول إكسل (CSV) لجرد: ${activeList.name}`)}`;
            window.open(waUrl, '_blank');
          }, 800);
        }
        return;
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Error sharing to WhatsApp:', err);
      }
    } finally {
      setWhatsAppShareLoading(null);
    }
  };

  const handleCopyText = () => {
    const text = generateReportText();
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Export digital JSON backup of the active list
  const handleExportJSON = () => {
    if (!activeList) return;
    const safeName = activeList.name.replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_');
    const targetItems = ignoreZeroItems ? activeList.items.filter(i => i.value > 0) : activeList.items;
    const data = {
      app: 'SmartInventoryCounter',
      version: '2.0',
      exportDate: new Date().toISOString(),
      list: {
        ...activeList,
        items: targetItems
      }
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `نسخة_جرد_${safeName}_${Date.now()}.json`;
    link.click();
    setJsonExportSuccess(true);
    setTimeout(() => setJsonExportSuccess(false), 2500);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Top Controls & Action Bar */}
      <div className="no-print bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        
        {/* Header with Title and List Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00B8C4] text-white flex items-center justify-center shadow-sm shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  التصدير والمعاينة الحية للتقرير
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  قائمة: <strong className="text-[#00B8C4]">{activeList.name}</strong> • {items.length} صنف مشمول
                </p>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="sm:hidden py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 shrink-0"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="hidden sm:flex py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
              >
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                <span>العودة للعد والجرد</span>
              </button>
            )}
          </div>

          {/* Options: Ignore Zeros & Include Prices */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto select-none">
            {/* Ignore Zeros Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={ignoreZeroItems}
                onChange={(e) => setIgnoreZeroItems(e.target.checked)}
                className="w-4 h-4 rounded text-[#00B8C4] focus:ring-[#00B8C4] cursor-pointer accent-[#00B8C4]"
              />
              <span className="flex items-center gap-1.5">
                <FilterX className="w-3.5 h-3.5 text-[#00B8C4]" />
                <span>استبعاد البنود الصفرية (0)</span>
              </span>
            </label>

            {/* Include Prices Checkbox */}
            <label className={`flex items-center gap-2 cursor-pointer font-bold text-xs py-2 px-3 rounded-xl border transition-all ${
              includePrices
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}>
              <input
                type="checkbox"
                checked={includePrices}
                onChange={(e) => setIncludePrices(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
              />
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>إظهار الأسعار والمجموع المالي</span>
              </span>
            </label>
          </div>
        </div>

        {/* Custom Title & Definition Editor */}
        <div className="pt-1">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <PenLine className="w-4 h-4 text-[#00B8C4]" />
                <span>تخصيص عنوان أو تعريف للتقرير:</span>
              </span>
              {(customReportTitle || customReportSubtitle) && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomReportTitle('');
                    setCustomReportSubtitle('');
                  }}
                  className="text-[11px] text-slate-400 hover:text-rose-500 font-bold transition-colors"
                >
                  إعادة للافتراضي
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={customReportTitle}
                  onChange={(e) => setCustomReportTitle(e.target.value)}
                  placeholder="عنوان مخصص (مثال: تقرير استلام أعمال التشطيب)"
                  className="w-full py-2 px-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B8C4]"
                />
                <PenLine className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={customReportSubtitle}
                  onChange={(e) => setCustomReportSubtitle(e.target.value)}
                  placeholder="تعريف أو بيان / موقع (مثال: فيلا التجمع - الدور الأرضي)"
                  className="w-full py-2 px-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B8C4]"
                />
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live A4 Sheet Preview Container */}
      <div className="printable-container bg-slate-200/70 dark:bg-slate-950 p-3 sm:p-6 rounded-3xl border border-slate-300 dark:border-slate-800 overflow-x-auto shadow-inner">
        <div
          ref={reportRef}
          className="printable-report bg-white text-slate-900 p-6 sm:p-10 rounded-2xl min-w-[560px] max-w-[800px] mx-auto text-right font-sans shadow-xl border border-slate-200/80"
          dir="rtl"
        >
          {/* Report Top Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-5">
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">
                {customReportTitle.trim() || 'تقرير حصر الكميات والمواد'}
              </h1>
              {customReportSubtitle.trim() && (
                <p className="text-sm font-bold text-slate-600 mt-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customReportSubtitle.trim()}</span>
                </p>
              )}
              <p className="text-sm font-bold text-[#00B8C4] mt-1">
                القائمة: {activeList.name}
              </p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formattedDate}</span>
              </p>
            </div>
            <div className="text-left">
              <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-sm">
                <Layers className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Key Metrics Boxes */}
          <div className={`grid ${includePrices ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-4'} gap-2.5 mb-6`}>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-slate-500 block leading-tight">بنود التقرير</span>
              <span className="text-base font-bold font-mono text-slate-900">{totalItems}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-[#10B981] block leading-tight">بنود نشطة (&gt;0)</span>
              <span className="text-base font-bold font-mono text-[#10B981]">{positiveItems}</span>
            </div>
            <div className="bg-[#E6F9FA] border border-[#00B8C4]/30 rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-[#00B8C4] block leading-tight">مجموع الكميات</span>
              <span className="text-base font-bold font-mono text-[#00B8C4]">{totalQuantities}</span>
            </div>
            {includePrices && (
              <div className="bg-emerald-600 text-white border border-emerald-700 rounded-xl p-2.5 text-center shadow-xs">
                <span className="text-[10px] text-emerald-100 block leading-tight font-bold">إجمالي القيمة المالية</span>
                <span className="text-base sm:text-lg font-black font-mono text-white tabular-nums">
                  {totalMonetaryAmount.toLocaleString()}
                </span>
              </div>
            )}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-amber-700 block leading-tight">أكبر كمية</span>
              <span className="text-base font-bold font-mono text-amber-700">{maxValue}</span>
            </div>
          </div>

          {/* Table of items */}
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b-2 border-slate-300">
                <th className="py-3 px-3 w-10 text-center font-black">#</th>
                <th className="py-3 px-3 font-black text-sm">اسم البند / المادة</th>
                <th className="py-3 px-3 font-black text-sm text-center">الكمية</th>
                <th className="py-3 px-3 font-black">الوحدة</th>
                {includePrices && (
                  <>
                    <th className="py-3 px-3 font-black text-center">سعر الوحدة</th>
                    <th className="py-3 px-3 font-black text-center">إجمالي القيمة</th>
                  </>
                )}
                <th className="py-3 px-3 font-black">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, idx) => {
                const itemTotalPrice = item.price !== undefined && item.price !== null ? (item.value * item.price) : null;
                return (
                  <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                    <td className="py-3 px-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                    <td className="py-3 px-3 font-black text-sm sm:text-base text-slate-950 leading-snug">
                      {item.name}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-black text-base sm:text-xl text-[#00B8C4] bg-[#E6F9FA] dark:bg-slate-800 px-3 py-1 rounded-xl inline-block tabular-nums shadow-2xs">
                        {item.value}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-700">{item.unit || '-'}</td>
                    {includePrices && (
                      <>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 tabular-nums">
                          {item.price !== undefined && item.price !== null ? item.price : '-'}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-black text-[#10B981] tabular-nums">
                          {itemTotalPrice !== null ? itemTotalPrice.toLocaleString() : '-'}
                        </td>
                      </>
                    )}
                    <td className="py-3 px-3 text-slate-500 text-xs">{item.notes || '-'}</td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={includePrices ? 7 : 5} className="py-10 text-center text-slate-400 text-sm font-medium">
                    {ignoreZeroItems ? 'لا توجد بنود بكميات أكبر من صفر للتصدير (جميع البنود قيمتها 0).' : 'لا توجد بنود في هذه القائمة بعد.'}
                  </td>
                </tr>
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-black border-t-2 border-slate-400">
                  <td colSpan={2} className="py-3.5 px-3 text-slate-900 text-sm sm:text-base">
                    الإجمالي العام
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="font-mono font-black text-lg sm:text-xl text-[#00B8C4] bg-[#E6F9FA] px-3 py-1 rounded-xl inline-block tabular-nums">
                      {totalQuantities}
                    </span>
                  </td>
                  <td></td>
                  {includePrices && (
                    <>
                      <td></td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-black text-lg sm:text-xl text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-xl inline-block tabular-nums">
                          {totalMonetaryAmount.toLocaleString()}
                        </span>
                      </td>
                    </>
                  )}
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>

          {/* Report Footer with Dedication */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <span>تقرير حصر كميات وجرد ميداني موثّق</span>
            <span className="font-bold text-slate-800">
              🤲 نسألكم صالح الدعاء لأخيكم أحمد عبد الغني
            </span>
          </div>
        </div>
      </div>

      {/* Unified Export Section with Two Distinct Categories:
          1. شكل إرسال إلى واتساب بخياراته الكاملة
          2. شكل حفظ وتنزيل إلى الجهاز بجميع الخيارات اللازمة */}
      <div className="no-print bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-5">
        
        {/* Category Tab Switcher Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#00B8C4]" />
              <span>طريقة تصدير وحفظ التقرير</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              اختر بين الإرسال المباشر عبر واتساب أو التنزيل والحفظ على جهازك
            </p>
          </div>

          {/* Segmented Controls for the 2 Shapes */}
          <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto min-w-[300px]">
            {/* Tab 1: WhatsApp */}
            <button
              type="button"
              onClick={() => setExportCategory('whatsapp')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                exportCategory === 'whatsapp'
                  ? 'bg-[#10B981] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>إرسال إلى واتساب</span>
            </button>

            {/* Tab 2: Save to Device */}
            <button
              type="button"
              onClick={() => setExportCategory('device')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                exportCategory === 'device'
                  ? 'bg-[#00B8C4] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HardDrive className="w-4 h-4 shrink-0" />
              <span>حفظ إلى الجهاز</span>
            </button>
          </div>
        </div>

        {/* ================= SHAPE 1: WHATSAPP SHARING ================= */}
        {exportCategory === 'whatsapp' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
              <span className="font-bold flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>اختر الصيغة المطلوبة للمشاركة الفورية عبر واتساب:</span>
              </span>
              <span className="text-[11px] py-0.5 px-2 rounded-full bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold">
                4 صيغ مشاركة
              </span>
            </div>

            {whatsAppNotice && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-bold">{whatsAppNotice}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* WhatsApp Option 1: PDF */}
              <button
                type="button"
                disabled={whatsAppShareLoading !== null}
                onClick={() => handleShareWhatsAppFormat('pdf')}
                className="text-right p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#EF4444] bg-slate-50/70 dark:bg-slate-800/40 hover:bg-red-50/50 dark:hover:bg-red-950/30 transition-all flex flex-col justify-between gap-3 group cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 dark:bg-red-500/20 text-[#EF4444] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {whatsAppShareLoading === 'pdf' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-[10px] py-0.5 px-2 rounded-full bg-red-100 dark:bg-red-900/50 text-[#EF4444] font-bold">
                    A4 رسمي
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#EF4444]">
                    مستند PDF رسمي
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                    ملف PDF منظم ومجدول بالكامل للإرسال والطباعة
                  </p>
                </div>
                <div className="w-full py-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-xs text-center transition-colors">
                  إرسال PDF للواتساب
                </div>
              </button>

              {/* WhatsApp Option 2: PNG */}
              <button
                type="button"
                disabled={whatsAppShareLoading !== null}
                onClick={() => handleShareWhatsAppFormat('png')}
                className="text-right p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#00B8C4] bg-slate-50/70 dark:bg-slate-800/40 hover:bg-[#E6F9FA]/50 dark:hover:bg-[#00B8C4]/10 transition-all flex flex-col justify-between gap-3 group cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="w-10 h-10 rounded-xl bg-[#00B8C4]/10 dark:bg-[#00B8C4]/20 text-[#00B8C4] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {whatsAppShareLoading === 'png' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ImageIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-[10px] py-0.5 px-2 rounded-full bg-[#E6F9FA] dark:bg-slate-800 text-[#00B8C4] font-bold">
                    معاينة فورية
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#00B8C4]">
                    صورة التقرير (PNG)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                    صورة عالية الدقة تظهر مباشرة داخل المحادثة
                  </p>
                </div>
                <div className="w-full py-2 rounded-xl bg-[#00B8C4] hover:bg-[#009DA8] text-white font-bold text-xs text-center transition-colors">
                  إرسال صورة للواتساب
                </div>
              </button>

              {/* WhatsApp Option 3: Excel CSV */}
              <button
                type="button"
                disabled={whatsAppShareLoading !== null}
                onClick={() => handleShareWhatsAppFormat('csv')}
                className="text-right p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-700 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition-all flex flex-col justify-between gap-3 group cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {whatsAppShareLoading === 'csv' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-[10px] py-0.5 px-2 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-bold">
                    إكسل عربي
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400">
                    جدول Excel (CSV)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                    ملف مجدول متوافق مع برامج الجداول والإحصاء
                  </p>
                </div>
                <div className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs text-center transition-colors">
                  إرسال Excel للواتساب
                </div>
              </button>

              {/* WhatsApp Option 4: Text Message */}
              <button
                type="button"
                disabled={whatsAppShareLoading !== null}
                onClick={() => handleShareWhatsAppFormat('text')}
                className="text-right p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-700 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all flex flex-col justify-between gap-3 group cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {whatsAppShareLoading === 'text' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <MessageCircle className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-[10px] py-0.5 px-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold">
                    نص منسق
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    رسالة نصية مباشرة
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                    رسالة نصية سريعة ببنود الجرد والمجموع الكلي
                  </p>
                </div>
                <div className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center transition-colors">
                  إرسال نص للواتساب
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ================= SHAPE 2: SAVE TO DEVICE ================= */}
        {exportCategory === 'device' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs text-[#00B8C4] dark:text-[#00B8C4] bg-[#E6F9FA] dark:bg-slate-800/80 p-3 rounded-2xl border border-[#00B8C4]/30">
              <span className="font-bold flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-[#00B8C4]" />
                <span>خيارات التنزيل والحفظ المباشر على الهاتف أو الكمبيوتر:</span>
              </span>
              <span className="text-[11px] py-0.5 px-2 rounded-full bg-[#00B8C4]/20 text-[#00B8C4] font-bold">
                6 خيارات حفظ
              </span>
            </div>

            {jsonExportSuccess && (
              <div className="p-3.5 rounded-2xl bg-[#E6F9FA] dark:bg-slate-800/80 border border-[#00B8C4]/30 flex items-center gap-2 text-xs text-[#00B8C4]">
                <CheckCircle2 className="w-4 h-4 text-[#00B8C4] shrink-0" />
                <span className="font-bold">تم تنزيل ملف النسخة الاحتياطية الرقمية (JSON) بنجاح إلى جهازك!</span>
              </div>
            )}

            {exportFeedback && (
              <div className={`p-3.5 rounded-2xl border flex items-center gap-2 text-xs font-bold animate-in fade-in ${
                exportFeedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#10B981] border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/40 text-[#EF4444] border-red-200 dark:border-red-800'
              }`}>
                {exportFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{exportFeedback.message}</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              
              {/* Device Option 1: PDF Download */}
              <button
                type="button"
                disabled={loadingType !== null}
                onClick={handleExportPDF}
                className="p-3 sm:p-3.5 rounded-2xl bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-50 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all text-center cursor-pointer"
                title="تنزيل مستند PDF رسمي جاهز للطباعة"
              >
                {loadingType === 'pdf' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
                <span>تحميل PDF (A4)</span>
              </button>

              {/* Device Option 2: PNG Image Download */}
              <button
                type="button"
                disabled={loadingType !== null}
                onClick={handleExportPNG}
                className="p-3 sm:p-3.5 rounded-2xl bg-[#00B8C4] hover:bg-[#009DA8] disabled:opacity-50 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all text-center cursor-pointer"
                title="حفظ صورة التقرير عالية الدقة في معرض الصور أو التنزيلات"
              >
                {loadingType === 'png' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
                <span>حفظ كصورة (PNG)</span>
              </button>

              {/* Device Option 3: Excel CSV Download */}
              <button
                type="button"
                onClick={() => exportActiveListCSV(ignoreZeroItems, includePrices)}
                className="p-3 sm:p-3.5 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all text-center cursor-pointer"
                title="تصدير جدول بيانات متوافق مع Excel و Google Sheets"
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span>تصدير Excel (CSV)</span>
              </button>

              {/* Device Option 4: Full Digital Backup (JSON) */}
              <button
                type="button"
                onClick={handleExportJSON}
                className="p-3 sm:p-3.5 rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all text-center cursor-pointer"
                title="تنزيل نسخة احتياطية رقمية كاملة للقائمة يمكن استيرادها لاحقاً"
              >
                <FileJson className="w-5 h-5" />
                <span>نسخة احتياطية (JSON)</span>
              </button>

              {/* Device Option 5: Instant Print */}
              <button
                type="button"
                onClick={handlePrint}
                className="p-3 sm:p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all text-center border border-slate-700 cursor-pointer"
                title="طباعة فورية للمستند عبر طابعة متصلة"
              >
                <Printer className="w-5 h-5" />
                <span>طباعة فورية</span>
              </button>

              {/* Device Option 6: Copy to Clipboard */}
              <button
                type="button"
                onClick={handleCopyText}
                className="p-3 sm:p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex flex-col items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95 transition-all text-center cursor-pointer"
                title="نسخ نص التقرير بالكامل للصقه في أي تطبيق"
              >
                {copiedText ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-600">تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <span>نسخ نص التقرير</span>
                  </>
                )}
              </button>

            </div>
          </div>
        )}

      </div>

      {/* WhatsApp Export Format Chooser Modal */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => {
              if (!whatsAppShareLoading) setIsWhatsAppModalOpen(false);
            }}
          />

          <div
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in zoom-in-95 duration-200"
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-l from-emerald-600 to-teal-700 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-xs">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">
                    مشاركة التقرير عبر واتساب
                  </h3>
                  <p className="text-xs text-emerald-100 font-medium">
                    اختر صيغة الملف التي ترغب بإرسالها في المحادثة
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                disabled={whatsAppShareLoading !== null}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notice / Desktop Feedback banner */}
            {whatsAppNotice && (
              <div className="m-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-bold">{whatsAppNotice}</span>
              </div>
            )}

            {/* Options List */}
            <div className="p-4 sm:p-5 space-y-2.5 max-h-[70vh] overflow-y-auto">
              
              {/* Option 1: PDF Document */}
              <button
                type="button"
                disabled={whatsAppShareLoading !== null}
                onClick={() => handleShareWhatsAppFormat('pdf')}
                className="w-full text-right p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#EF4444] bg-slate-50/60 dark:bg-slate-800/40 hover:bg-red-50/40 dark:hover:bg-red-950/20 transition-all flex items-center justify-between gap-3 group cursor-pointer active:scale-99 disabled:opacity-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-[#EF4444] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {whatsAppShareLoading === 'pdf' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#EF4444] transition-colors">
                        ملف PDF رسمي (A4)
                      </span>
                      <span className="text-[10px] py-0.5 px-2 rounded-full bg-red-100 dark:bg-red-900/50 text-[#EF4444] font-bold">
                        الأفضل للتوثيق
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      مستند PDF رسمي أنيق بحجم A4 يحتوي على الجدول والأرقام للطباعة والمشاركة
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0 group-hover:bg-[#EF4444] group-hover:text-white group-hover:border-[#EF4444] transition-colors">
                  إرسال PDF
                </div>
              </button>

              {/* Option 2: PNG High-Res Image */}
              <button
                type="button"
                disabled={whatsAppShareLoading !== null}
                onClick={() => handleShareWhatsAppFormat('png')}
                className="w-full text-right p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#00B8C4] bg-slate-50/60 dark:bg-slate-800/40 hover:bg-[#E6F9FA]/40 dark:hover:bg-[#00B8C4]/10 transition-all flex items-center justify-between gap-3 group cursor-pointer active:scale-99 disabled:opacity-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#00B8C4]/10 dark:bg-[#00B8C4]/20 text-[#00B8C4] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {whatsAppShareLoading === 'png' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ImageIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#00B8C4] transition-colors">
                        صورة التقرير (PNG)
                      </span>
                      <span className="text-[10px] py-0.5 px-2 rounded-full bg-[#E6F9FA] dark:bg-slate-800 text-[#00B8C4] font-bold">
                        معاينة مباشرة
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      تظهر كصورة واضحة في المحادثة مباشرة دون الحاجة لفتح برامج ملفات
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0 group-hover:bg-[#00B8C4] group-hover:text-white group-hover:border-[#00B8C4] transition-colors">
                  إرسال صورة
                </div>
              </button>

              {/* Option 3: Excel CSV */}
              <button
                type="button"
                disabled={whatsAppShareLoading !== null}
                onClick={() => handleShareWhatsAppFormat('csv')}
                className="w-full text-right p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700/80 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-all flex items-center justify-between gap-3 group cursor-pointer active:scale-99 disabled:opacity-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {whatsAppShareLoading === 'csv' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        جدول إكسل (CSV)
                      </span>
                      <span className="text-[10px] py-0.5 px-2 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-bold">
                        بيانات وجداول
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      ملف مجدول متوافق تماماً مع Microsoft Excel و Google Sheets
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600 transition-colors">
                  إرسال Excel
                </div>
              </button>

              {/* Option 4: Text Message */}
              <button
                type="button"
                disabled={whatsAppShareLoading !== null}
                onClick={() => handleShareWhatsAppFormat('text')}
                className="w-full text-right p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700/80 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all flex items-center justify-between gap-3 group cursor-pointer active:scale-99 disabled:opacity-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {whatsAppShareLoading === 'text' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <MessageCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        رسالة نصية منسقة
                      </span>
                      <span className="text-[10px] py-0.5 px-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold">
                        نص مباشر
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      رسالة واتساب نصية جاهزة ومعدة بالقائمة والأصناف وأرقامها
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors">
                  إرسال نص
                </div>
              </button>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>تعتمد الخيارات على إعدادات الأسعار والاستبعاد الحالية</span>
              </span>
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High-Res PNG Image Preview & WhatsApp Direct Share Modal */}
      {pngModalData && pngModalData.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setPngModalData(null)}
          />

          <div
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
            dir="rtl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`px-5 py-3.5 text-white flex items-center justify-between gap-3 ${
              pngModalData.isWhatsAppTarget
                ? 'bg-gradient-to-l from-emerald-600 to-teal-700'
                : 'bg-gradient-to-l from-[#00B8C4] to-cyan-700'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-xs">
                  {pngModalData.isWhatsAppTarget ? (
                    <MessageCircle className="w-5 h-5 text-white" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                    {pngModalData.isWhatsAppTarget
                      ? 'مشاركة صورة التقرير عبر واتساب'
                      : 'تم حفظ صورة التقرير بنجاح'}
                  </h3>
                  <p className="text-xs text-white/80 font-medium truncate">
                    {pngModalData.filename}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPngModalData(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
              {/* Image Preview Box */}
              <div className="p-2 sm:p-3 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center max-h-[38vh] overflow-hidden shadow-inner">
                <img
                  src={pngModalData.imageUrl}
                  alt="صورة تقرير الجرد"
                  className="max-h-[35vh] max-w-full object-contain rounded-xl shadow-md border border-slate-300 dark:border-slate-700 bg-white"
                />
              </div>

              {/* Status / Guidance Message */}
              {pngModalData.isWhatsAppTarget ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800/80 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-sm text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>تم تنزيل وحفظ الصورة على جهازك بنجاح!</span>
                  </div>
                  <p className="leading-relaxed">
                    اضغط الزر الأخضر أدناه لفتح محادثة واتساب، ثم انقر على رمز المشبك 📎 أو الكاميرا لإرفاق الصورة المحفوظة وإرسالها فوراً.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#E6F9FA] dark:bg-slate-800/90 border border-[#00B8C4]/40 text-xs text-slate-800 dark:text-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-sm text-[#00B8C4]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>تم حفظ صورة التقرير (PNG) عالية الدقة!</span>
                  </div>
                  <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                    الصورة متوفرة الآن في مجلد التنزيلات أو الصور بهاتفك/كمبيوترك، وجاهزة للطباعة أو الإرسال.
                  </p>
                </div>
              )}

              {/* Primary Action Buttons */}
              <div className="space-y-2 pt-1">
                {/* 1. Open WhatsApp Button */}
                <button
                  type="button"
                  onClick={() => {
                    const waText = `📋 تقرير جرد: ${activeList.name}\n📅 التاريخ: ${formattedDate}\n📦 إجمالي الأصناف: ${totalItems} صنف\n🔢 مجموع الكميات: ${totalQuantities}${includePrices ? `\n💰 الإجمالي المالي: ${totalMonetaryAmount.toLocaleString()} ج` : ''}\n\n(تم حفظ صورة التقرير عالية الدقة على الجهاز، يرجى إرفاقها بالمحادثة 📎)`;
                    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;
                    window.open(waUrl, '_blank');
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 active:scale-98 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 fill-white/20 stroke-[2.5]" />
                  <span>فتح تطبيق واتساب للمشاركة</span>
                </button>

                {/* 2. Direct Mobile File Share Button (if supported) */}
                <button
                  type="button"
                  onClick={async () => {
                    const file = new File([pngModalData.blob], pngModalData.filename, { type: 'image/png' });
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                      try {
                        await navigator.share({
                          files: [file],
                          title: `تقرير جرد: ${activeList.name}`,
                          text: `تقرير جرد: ${activeList.name}\nالتاريخ: ${formattedDate}`
                        });
                      } catch (e) {
                        console.log('Share dismissed');
                      }
                    } else {
                      triggerDownloadBlob(pngModalData.blob, pngModalData.filename);
                    }
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-[#00B8C4] hover:bg-[#009DA8] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>مشاركة الصورة كملف عبر التطبيقات (Share)</span>
                </button>

                {/* 3. Re-download image button */}
                <button
                  type="button"
                  onClick={() => triggerDownloadBlob(pngModalData.blob, pngModalData.filename)}
                  className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-98"
                >
                  <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span>إعادة تنزيل الصورة إلى الجهاز</span>
                </button>
              </div>

              {/* Mobile Tip */}
              <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 pt-1 leading-snug">
                💡 لمستخدمي الهواتف الذكية: يمكنك أيضاً الضغط مطولاً على صورة التقرير بالأعلى واختيار (حفظ الصورة) لحفظها فوراً في معرض الصور 📱
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setPngModalData(null)}
                className="py-1.5 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                تم الإنتهاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

