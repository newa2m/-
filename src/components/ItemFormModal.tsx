import React, { useState, useEffect } from 'react';
import { ListItem, COMMON_UNITS, COLOR_PALETTE } from '../types';
import { useApp } from '../context/AppContext';
import { Package, X, Check, Star, Coins, Copy, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: ListItem | null;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  itemToEdit,
}) => {
  const { createItem, updateItem, duplicateItem, deleteItem, resetItemValue, activeList } = useApp();

  const [name, setName] = useState('');
  const [value, setValue] = useState('0');
  const [unit, setUnit] = useState('قطعة');
  const [price, setPrice] = useState('');
  const [color, setColor] = useState('emerald');
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShowDeleteConfirm(false);
      setShowResetConfirm(false);
      setResetFeedback(null);
      if (itemToEdit) {
        setName(itemToEdit.name);
        setValue(itemToEdit.value.toString());
        setUnit(itemToEdit.unit || 'قطعة');
        setPrice(itemToEdit.price !== undefined && itemToEdit.price !== null ? itemToEdit.price.toString() : '');
        setColor(itemToEdit.color || 'emerald');
        setNotes(itemToEdit.notes || '');
        setIsFavorite(Boolean(itemToEdit.isFavorite));
      } else {
        setName('');
        setValue('0');
        setUnit('قطعة');
        setPrice('');
        setColor(activeList?.color || 'emerald');
        setNotes('');
        setIsFavorite(false);
      }
    }
  }, [isOpen, itemToEdit, activeList]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numVal = parseFloat(value) || 0;
    const parsedPrice = price.trim() !== '' ? parseFloat(price) : undefined;
    const finalPrice = parsedPrice !== undefined && !isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : undefined;

    if (itemToEdit) {
      updateItem(itemToEdit.id, {
        name: name.trim(),
        value: numVal,
        unit: unit.trim() || undefined,
        price: finalPrice,
        color,
        notes: notes.trim() || undefined,
        isFavorite,
      });
    } else {
      createItem({
        name: name.trim(),
        value: numVal,
        unit: unit.trim() || undefined,
        price: finalPrice,
        color,
        notes: notes.trim() || undefined,
        isFavorite,
      });
    }

    onClose();
  };

  const handleDuplicate = () => {
    if (itemToEdit) {
      duplicateItem(itemToEdit.id);
      onClose();
    }
  };

  const handleConfirmReset = () => {
    if (itemToEdit) {
      resetItemValue(itemToEdit.id);
      setValue('0');
      setShowResetConfirm(false);
      setResetFeedback('تم تصفير رصيد البند بنجاح إلى (0)');
      setTimeout(() => setResetFeedback(null), 3000);
    } else {
      setValue('0');
      setShowResetConfirm(false);
    }
  };

  const handleConfirmDelete = () => {
    if (itemToEdit) {
      deleteItem(itemToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-3 sm:hidden" />

        {/* Header with Top Approval Button */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 sticky top-0 z-20 backdrop-blur-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#00B8C4] text-white flex items-center justify-center shadow-xs shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                {itemToEdit ? 'خواص وتعديل البند' : 'إنشاء بند جديد'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                في قائمة: {activeList?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Top Approval Button (زر الموافقة على إنشاء/حفظ البند في الأعلى) */}
            <button
              type="submit"
              form="item-modal-form"
              disabled={!name.trim()}
              className="py-2 px-3.5 sm:px-4 rounded-xl bg-[#00B8C4] hover:bg-[#009DA8] disabled:opacity-40 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md shadow-[#00B8C4]/25 active:scale-95 transition-all cursor-pointer border border-[#00B8C4]"
              title={itemToEdit ? 'الموافقة وحفظ التعديلات' : 'الموافقة على إنشاء البند وإضافته'}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{itemToEdit ? 'حفظ التعديلات' : 'الموافقة على إنشاء البند'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form id="item-modal-form" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Top Quick Create Approval Bar for New Items */}
          {!itemToEdit && (
            <div className="p-3 bg-[#E6F9FA] dark:bg-slate-800/80 rounded-2xl border border-[#00B8C4]/30 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="text-xs">
                <span className="font-black text-slate-900 dark:text-white block">
                  زر الموافقة جاهز بالأعلى ☝️
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  اكتب اسم البند واضغط زر الموافقة بالأعلى لحفظه فوراً
                </span>
              </div>
              <button
                type="submit"
                disabled={!name.trim()}
                className="py-2 px-3 rounded-xl bg-[#00B8C4] hover:bg-[#009DA8] disabled:opacity-40 text-white text-xs font-black flex items-center gap-1 shadow-sm active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>موافقة وإنشاء</span>
              </button>
            </div>
          )}
          {/* Feedback Notice */}
          {resetFeedback && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{resetFeedback}</span>
            </div>
          )}

          {/* Inline Delete Confirmation Alert */}
          {showDeleteConfirm && itemToEdit && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border-2 border-red-300 dark:border-red-800 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-red-900 dark:text-red-200">
                    تأكيد حذف البند نهائياً؟
                  </h4>
                  <p className="text-[11px] text-red-700 dark:text-red-300 mt-0.5 leading-relaxed">
                    هل تريد بالتأكيد حذف <strong className="font-black">"{itemToEdit.name}"</strong> نهائياً من القائمة؟
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#EF4444] hover:bg-red-600 text-white shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>نعم، حذف البند</span>
                </button>
              </div>
            </div>
          )}

          {/* Inline Reset Confirmation Alert */}
          {showResetConfirm && itemToEdit && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-800 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200">
                    تأكيد تصفير عداد البند؟
                  </h4>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
                    سيتم ضبط كمية <strong className="font-black">"{itemToEdit.name}"</strong> إلى (0) مع الاحتفاظ بالاسم وكافة الخواص.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>تأكيد التصفير (0)</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Item Actions Bar (تصفير، حذف، تكرار، تمييز) when editing */}
          {itemToEdit && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              {/* Reset to Zero Option */}
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setShowResetConfirm(true);
                }}
                className="py-2.5 px-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                title="تصفير عداد هذا البند وإعادته إلى صفر"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>تصفير البند (0)</span>
              </button>

              {/* Delete Option */}
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  setShowDeleteConfirm(true);
                }}
                className="py-2.5 px-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-[#EF4444] border border-red-200 dark:border-red-800/60 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                title="حذف هذا البند نهائياً"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
                <span>حذف البند</span>
              </button>

              {/* Duplicate Option */}
              <button
                type="button"
                onClick={handleDuplicate}
                className="py-2.5 px-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-slate-200 hover:text-[#10B981] border border-slate-200 dark:border-slate-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                title="إنشاء نسخة مكررة جديدة من هذا البند"
              >
                <Copy className="w-3.5 h-3.5 text-[#10B981]" />
                <span>تكرار البند</span>
              </button>

              {/* Favorite Star Option */}
              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer ${
                  isFavorite
                    ? 'bg-[#00B8C4]/15 border-[#00B8C4] text-[#00B8C4]'
                    : 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                }`}
                title={isFavorite ? 'إلغاء تمييز البند' : 'تمييز وتثبيت البند في المفضلة'}
              >
                <Star className={`w-3.5 h-3.5 ${isFavorite ? 'text-[#00B8C4] fill-[#00B8C4]' : 'text-slate-400'}`} />
                <span>{isFavorite ? 'مُميز ⭐' : 'تمييز'}</span>
              </button>
            </div>
          )}

          {/* Item Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              اسم البند أو المادة <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: مواسير 1 بوصة، كوع، سلك 4 مم، دهان..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:border-[#00B8C4] focus:bg-white dark:focus:bg-slate-800 outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* Initial Value, Unit & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  الكمية الحالية
                </label>
                {parseFloat(value) !== 0 && (
                  <button
                    type="button"
                    onClick={() => setValue('0')}
                    className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-300/80 dark:border-amber-700/60 flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                    title="تصفير القيمة المعروضة إلى (0)"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>تصفير (0)</span>
                  </button>
                )}
              </div>
              <input
                type="number"
                step="any"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-base focus:border-[#00B8C4] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                وحدة القياس
              </label>
              <input
                type="text"
                placeholder="قطعة، كيس، متر..."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:border-[#00B8C4] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>سعر الوحدة</span>
                <span className="text-[10px] text-slate-400 font-normal">اختياري</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-sm focus:border-[#00B8C4] outline-none text-left"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Subtotal preview if both quantity and price are entered */}
          {parseFloat(value) > 0 && parseFloat(price) > 0 && (
            <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
              <span className="text-[#10B981] font-semibold flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-[#10B981]" />
                <span>إجمالي قيمة هذا الصنف ({value} {unit} × {price}):</span>
              </span>
              <span className="font-mono font-black text-sm text-[#10B981] tabular-nums">
                {(parseFloat(value) * parseFloat(price)).toLocaleString()}
              </span>
            </div>
          )}

          {/* Common Unit chips */}
          <div>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
              اختيار سريع لوحدة القياس:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_UNITS.slice(0, 8).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    unit === u
                      ? 'bg-[#00B8C4] text-white border-[#00B8C4] font-semibold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              لون تمييز البند
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  title={c.label}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-all transform flex items-center justify-center ${
                    color === c.id
                      ? 'ring-4 ring-[#00B8C4]/40 ring-offset-2 dark:ring-offset-slate-900 scale-110 shadow'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  {color === c.id && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ملاحظة أو وصف إضافي (اختياري)
            </label>
            <textarea
              rows={2}
              placeholder="مثال: مكان التخزين، المورد، مواصفات خاصة..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:border-[#00B8C4] outline-none resize-none"
            />
          </div>

          {/* Favorite / Highlight Switch Card (تمييز البند) */}
          <div
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
              isFavorite
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/80 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                isFavorite
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
              }`}>
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-black text-slate-900 dark:text-white">
                  تمييز البند وتثبيته في المفضلة ⭐
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  يثبت البند في أعلى القائمة لسرعة الوصول والحصر الميداني
                </span>
              </div>
            </div>

            <div className={`w-11 h-6 rounded-full p-0.5 transition-colors relative shrink-0 ${
              isFavorite ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
            }`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                isFavorite ? '-translate-x-5' : 'translate-x-0'
              }`} />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center cursor-pointer"
            >
              إلغاء وإغلاق النافذة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
