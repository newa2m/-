import React, { useState, useEffect } from 'react';
import { ListItem, COMMON_UNITS, COLOR_PALETTE } from '../types';
import { useApp } from '../context/AppContext';
import { Package, X, Check, Tag } from 'lucide-react';

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
  const { createItem, updateItem, activeList } = useApp();

  const [name, setName] = useState('');
  const [value, setValue] = useState('0');
  const [unit, setUnit] = useState('قطعة');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('emerald');
  const [notes, setNotes] = useState('');

  // Extract existing categories in the active list for quick suggestions
  const existingCategories = Array.from(
    new Set(
      (activeList?.items || [])
        .map(i => i.category?.trim())
        .filter((c): c is string => Boolean(c))
    )
  );

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setName(itemToEdit.name);
        setValue(itemToEdit.value.toString());
        setUnit(itemToEdit.unit || 'قطعة');
        setCategory(itemToEdit.category || '');
        setColor(itemToEdit.color || 'emerald');
        setNotes(itemToEdit.notes || '');
      } else {
        setName('');
        setValue('0');
        setUnit('قطعة');
        setCategory('');
        setColor(activeList?.color || 'emerald');
        setNotes('');
      }
    }
  }, [isOpen, itemToEdit, activeList]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numVal = parseFloat(value) || 0;

    if (itemToEdit) {
      updateItem(itemToEdit.id, {
        name: name.trim(),
        value: numVal,
        unit: unit.trim() || undefined,
        category: category.trim() || undefined,
        color,
        notes: notes.trim() || undefined,
      });
    } else {
      createItem({
        name: name.trim(),
        value: numVal,
        unit: unit.trim() || undefined,
        category: category.trim() || undefined,
        color,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {itemToEdit ? 'تعديل بيانات البند' : 'إضافة بند جديد'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                في قائمة: {activeList?.name}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Item Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              اسم البند أو المادة <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: أسمنت بورتلاندي، كابل 4 مم، دهان أبيض..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* Initial Value & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                الكمية الحالية
              </label>
              <input
                type="number"
                step="any"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-base focus:border-blue-500 outline-none"
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
                className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              />
            </div>
          </div>

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
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                التصنيف أو النوع (اختياري)
              </label>
              {existingCategories.length > 0 && (
                <span className="text-[11px] text-slate-400">من التصنيفات السابقة</span>
              )}
            </div>
            <input
              type="text"
              placeholder="مثال: أسمنت، سباكة، كهرباء، دهانات، عهد..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
            />
            {existingCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {existingCategories.slice(0, 5).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3 text-slate-400" />
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            )}
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
                      ? 'ring-4 ring-blue-500/30 ring-offset-2 dark:ring-offset-slate-900 scale-110 shadow'
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
              placeholder="مثال: رقم الصنف، مكان التخزين، المورد، مواصفات خاصة..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:border-blue-500 outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="grid grid-cols-2 gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{itemToEdit ? 'حفظ التعديلات' : 'إضافة البند'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
