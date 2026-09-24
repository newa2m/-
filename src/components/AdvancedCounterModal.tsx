import React, { useState, useEffect, useRef } from 'react';
import { ListItem } from '../types';
import { useApp } from '../context/AppContext';
import { Plus, Minus, X, Check, Sparkles } from 'lucide-react';

interface AdvancedCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ListItem | null;
  mode: 'add' | 'subtract';
}

export const AdvancedCounterModal: React.FC<AdvancedCounterModalProps> = ({
  isOpen,
  onClose,
  item,
  mode,
}) => {
  const { incrementItem, decrementItem, settings } = useApp();
  const [customAmount, setCustomAmount] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomAmount('');
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const isAdd = mode === 'add';
  const presets = settings.quickPresets || [5, 10, 20, 50, 100];

  const handleApplyCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseFloat(customAmount);
    if (!isNaN(val) && val > 0) {
      if (isAdd) {
        incrementItem(item.id, val);
      } else {
        decrementItem(item.id, val);
      }
      onClose();
    }
  };

  const handleApplyPreset = (presetValue: number) => {
    if (isAdd) {
      incrementItem(item.id, presetValue);
    } else {
      decrementItem(item.id, presetValue);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle for mobile */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
              isAdd ? 'bg-emerald-600' : 'bg-rose-600'
            }`}>
              {isAdd ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                {isAdd ? 'إضافة كمية متقدمة' : 'طرح كمية متقدم'}
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

        {/* Current Value Indicator */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">القيمة الحالية للبند:</span>
          <span className="font-mono text-base font-bold text-slate-800 dark:text-slate-200 tabular-nums">
            {item.value} {item.unit || ''}
          </span>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Quick presets grid */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAdd ? 'إضافة سريعة بنقرة واحدة:' : 'طرح سريع بنقرة واحدة:'}</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`py-3 px-1 rounded-xl text-center font-bold font-mono text-sm transition-all transform active:scale-95 shadow-sm border ${
                    isAdd
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60'
                  }`}
                >
                  <span className="text-xs font-sans block mb-0.5 opacity-75">{isAdd ? '+' : '-'}</span>
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount form */}
          <form onSubmit={handleApplyCustom} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                أو أدخل رقماً مخصصاً:
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  step="any"
                  placeholder="0"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full text-center text-3xl font-mono font-bold py-3 px-4 bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 rounded-2xl outline-none text-slate-900 dark:text-white tabular-nums"
                />
                {item.unit && (
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
                    {item.unit}
                  </span>
                )}
              </div>
            </div>

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
                disabled={!customAmount || parseFloat(customAmount) <= 0}
                className={`py-3 px-4 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
                  isAdd
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{isAdd ? `إضافة (${customAmount || '0'})` : `طرح (${customAmount || '0'})`}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
