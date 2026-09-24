import React, { useState, useEffect, useRef } from 'react';
import { ListItem } from '../types';
import { useApp } from '../context/AppContext';
import { Edit3, X, Check, RotateCcw } from 'lucide-react';

interface DirectEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ListItem | null;
}

export const DirectEditModal: React.FC<DirectEditModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const { setItemValue, resetItemValue } = useApp();
  const [newValue, setNewValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && item) {
      setNewValue(item.value.toString());
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newValue);
    if (!isNaN(val)) {
      setItemValue(item.id, val);
      onClose();
    }
  };

  const handleReset = () => {
    resetItemValue(item.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                تعديل مباشر للعداد
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                {item.name}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              القيمة الجديدة للعداد ({item.unit || 'كمية'}):
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                step="any"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full text-center text-4xl font-mono font-bold py-3.5 px-4 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-2xl outline-none text-slate-900 dark:text-white tabular-nums shadow-inner"
              />
              {item.unit && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  {item.unit}
                </span>
              )}
            </div>
          </div>

          {/* Quick preset changes */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setNewValue((prev) => (Math.max(0, (parseFloat(prev) || 0) + 1)).toString())}
              className="flex-1 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              +1
            </button>
            <button
              type="button"
              onClick={() => setNewValue((prev) => (Math.max(0, (parseFloat(prev) || 0) + 10)).toString())}
              className="flex-1 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              +10
            </button>
            <button
              type="button"
              onClick={() => setNewValue((prev) => (Math.max(0, (parseFloat(prev) || 0) + 50)).toString())}
              className="flex-1 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              +50
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 py-2 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              تصفير
            </button>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={newValue === '' || isNaN(parseFloat(newValue))}
              className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 active:scale-95 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              حفظ القيمة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
