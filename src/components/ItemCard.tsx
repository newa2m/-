import React, { useState, useRef, useCallback } from 'react';
import { ListItem, COLOR_PALETTE } from '../types';
import { useApp } from '../context/AppContext';
import {
  Plus,
  Minus,
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  RotateCcw,
  Tag,
  StickyNote,
  SlidersHorizontal
} from 'lucide-react';

interface ItemCardProps {
  item: ListItem;
  onOpenAdvanced: (item: ListItem, mode: 'add' | 'subtract') => void;
  onOpenDirectEdit: (item: ListItem) => void;
  onOpenEditForm: (item: ListItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onOpenAdvanced,
  onOpenDirectEdit,
  onOpenEditForm,
}) => {
  const {
    incrementItem,
    decrementItem,
    duplicateItem,
    deleteItem,
    resetItemValue,
  } = useApp();

  const [menuOpen, setMenuOpen] = useState(false);
  const [pulseType, setPulseType] = useState<'plus' | 'minus' | null>(null);

  // Long press tracking for (+)
  const plusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPlusLongPressRef = useRef(false);

  // Long press tracking for (-)
  const minusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMinusLongPressRef = useRef(false);

  const LONG_PRESS_DURATION = 420; // ms threshold for long press

  // Handlers for (+) button
  const handlePlusPointerDown = () => {
    isPlusLongPressRef.current = false;
    plusTimerRef.current = setTimeout(() => {
      isPlusLongPressRef.current = true;
      onOpenAdvanced(item, 'add');
    }, LONG_PRESS_DURATION);
  };

  const handlePlusPointerUp = () => {
    if (plusTimerRef.current) {
      clearTimeout(plusTimerRef.current);
      plusTimerRef.current = null;
    }
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlusLongPressRef.current) {
      isPlusLongPressRef.current = false;
      return;
    }
    const success = incrementItem(item.id, 1);
    if (success) {
      setPulseType('plus');
      setTimeout(() => setPulseType(null), 200);
    }
  };

  // Handlers for (-) button
  const handleMinusPointerDown = () => {
    isMinusLongPressRef.current = false;
    minusTimerRef.current = setTimeout(() => {
      isMinusLongPressRef.current = true;
      onOpenAdvanced(item, 'subtract');
    }, LONG_PRESS_DURATION);
  };

  const handleMinusPointerUp = () => {
    if (minusTimerRef.current) {
      clearTimeout(minusTimerRef.current);
      minusTimerRef.current = null;
    }
  };

  const handleMinusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMinusLongPressRef.current) {
      isMinusLongPressRef.current = false;
      return;
    }
    const success = decrementItem(item.id, 1);
    if (success) {
      setPulseType('minus');
      setTimeout(() => setPulseType(null), 200);
    }
  };

  const colorConfig = COLOR_PALETTE.find(c => c.id === item.color) || COLOR_PALETTE[0];
  const isZero = item.value === 0;

  return (
    <div
      className={`group relative bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
        isZero
          ? 'border-slate-200 dark:border-slate-800/90 opacity-90'
          : 'border-slate-200/90 dark:border-slate-800'
      }`}
    >
      {/* Visual Accent Colored Left Bar */}
      <div 
        className="absolute top-0 bottom-0 right-0 w-1.5 transition-colors"
        style={{ backgroundColor: colorConfig.hex }}
      />

      <div className="p-3.5 pr-4 sm:p-4 sm:pr-5">
        {/* Top line: Name & Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 
              onClick={() => onOpenEditForm(item)}
              className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug line-clamp-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="اضغط لتعديل بيانات البند"
            >
              {item.name}
            </h3>

            {/* Quiet Metadata without decorative pill boxes */}
            <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
              {item.category && (
                <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>{item.category}</span>
                </span>
              )}
              {item.category && item.notes && (
                <span className="text-slate-300 dark:text-slate-700">·</span>
              )}
              {item.notes && (
                <span className="flex items-center gap-1 truncate max-w-[200px]" title={item.notes}>
                  <StickyNote className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{item.notes}</span>
                </span>
              )}
            </div>
          </div>

          {/* Context Menu Button */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="خيارات البند"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Context Dropdown Menu */}
            {menuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setMenuOpen(false)} 
                />
                <div 
                  className="absolute left-0 top-9 z-40 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 text-xs animate-in fade-in duration-100"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenEditForm(item);
                    }}
                    className="w-full text-right px-3 py-2 flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>تعديل البند</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenDirectEdit(item);
                    }}
                    className="w-full text-right px-3 py-2 flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
                    <span>تعديل الرقم مباشرة</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      duplicateItem(item.id);
                    }}
                    className="w-full text-right px-3 py-2 flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-emerald-500" />
                    <span>نسخ البند</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      resetItemValue(item.id);
                    }}
                    className="w-full text-right px-3 py-2 flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-orange-500" />
                    <span>تصفير العداد (0)</span>
                  </button>
                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      deleteItem(item.id);
                    }}
                    className="w-full text-right px-3 py-2 flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف البند</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Counter Display and Controls Row */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
          
          {/* Plus (+) Button (Right side in RTL) */}
          <button
            type="button"
            onPointerDown={handlePlusPointerDown}
            onPointerUp={handlePlusPointerUp}
            onPointerLeave={handlePlusPointerUp}
            onPointerCancel={handlePlusPointerUp}
            onClick={handlePlusClick}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-bold text-white bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-92 transition-transform touch-manipulation select-none shadow-md shadow-emerald-600/20 border border-emerald-500 ${
              pulseType === 'plus' ? 'scale-105 bg-emerald-700 shadow-lg' : ''
            }`}
            title="نقرة: +1 · ضغط مطول: إضافة كمية متقدمة"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Central Big Counter Number (Direct Edit on Tap) */}
          <div
            onClick={() => onOpenDirectEdit(item)}
            className="flex-1 text-center cursor-pointer py-1 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group/num"
            title="اضغط هنا لتعديل الرقم مباشرة"
          >
            <div className="flex items-baseline justify-center gap-1.5">
              <span className={`text-3xl sm:text-4xl font-mono font-extrabold tracking-tight tabular-nums transition-colors ${
                isZero
                  ? 'text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-white group-hover/num:text-blue-600 dark:group-hover/num:text-blue-400'
              }`}>
                {item.value}
              </span>
              {item.unit && (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[60px]">
                  {item.unit}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block -mt-0.5 opacity-70 group-hover/num:opacity-100">
              اضغط لتغيير الرقم
            </span>
          </div>

          {/* Minus (-) Button (Left side in RTL) */}
          <button
            type="button"
            onPointerDown={handleMinusPointerDown}
            onPointerUp={handleMinusPointerUp}
            onPointerLeave={handleMinusPointerUp}
            onPointerCancel={handleMinusPointerUp}
            onClick={handleMinusClick}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 active:scale-92 transition-transform touch-manipulation select-none shadow-xs border border-slate-200/80 dark:border-slate-700/60 ${
              pulseType === 'minus' ? 'scale-90 bg-rose-100 text-rose-700 dark:bg-rose-900/50' : ''
            }`}
            title="نقرة: -1 · ضغط مطول: طرح كمية متقدم"
          >
            <Minus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Quick Micro Presets for direct 1-tap addition / subtraction */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAdvanced(item, 'add');
            }}
            className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors flex items-center gap-0.5 font-medium text-emerald-600 dark:text-emerald-400"
          >
            إضافة متقدمة...
          </button>
          <span className="text-[10px] opacity-60">
            ضغطة مطولة لفتح لوحة الأرقام
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAdvanced(item, 'subtract');
            }}
            className="hover:text-rose-500 dark:hover:text-rose-400 transition-colors flex items-center gap-0.5 font-medium"
          >
            طرح متقدم...
          </button>
        </div>
      </div>
    </div>
  );
};
