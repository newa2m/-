import React, { useState, useRef, useEffect } from 'react';
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
  SlidersHorizontal,
  GripVertical,
  Star,
  Coins,
  Check,
  ClipboardCopy
} from 'lucide-react';

interface ItemCardProps {
  item: ListItem;
  index: number;
  isDragging?: boolean;
  dropIndicator?: 'before' | 'after' | null;
  onDragStartHandler?: (e: React.DragEvent, id: string) => void;
  onDragOverHandler?: (e: React.DragEvent, id: string) => void;
  onDropHandler?: (e: React.DragEvent, id: string) => void;
  onDragEndHandler?: () => void;
  onTouchDragStartHandler?: (e: React.TouchEvent, id: string, fromHandle?: boolean) => void;
  onTouchDragMoveHandler?: (e: React.TouchEvent) => void;
  onTouchDragEndHandler?: () => void;
  onOpenAdvanced: (item: ListItem, mode: 'add' | 'subtract' | 'set') => void;
  onOpenEditForm: (item: ListItem) => void;
  onOpenVoiceForItem?: (item: ListItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  index,
  isDragging = false,
  dropIndicator = null,
  onDragStartHandler,
  onDragOverHandler,
  onDropHandler,
  onDragEndHandler,
  onTouchDragStartHandler,
  onTouchDragMoveHandler,
  onTouchDragEndHandler,
  onOpenAdvanced,
  onOpenEditForm,
}) => {
  const {
    incrementItem,
    decrementItem,
    duplicateItem,
    deleteItem,
    resetItemValue,
    isPocketLocked,
    undoItemAction,
    getItemLastAction,
    toggleFavoriteItem,
    settings,
  } = useApp();

  const isCompact = settings.viewMode === 'compact';
  const lastItemAction = getItemLastAction(item.id);

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [itemCopied, setItemCopied] = useState(false);
  const [pulseType, setPulseType] = useState<'plus' | 'minus' | null>(null);

  // Long-press timer refs to avoid triggering standard tap on long-press
  const plusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const minusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const numberTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPlusLongPressRef = useRef(false);
  const isMinusLongPressRef = useRef(false);
  const isNumberLongPressRef = useRef(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const touchMoved = useRef(false);
  const lastTouchMovedTimeRef = useRef(0);

  const longPressDuration = settings.longPressDelay || 1000;

  useEffect(() => {
    return () => {
      if (plusTimerRef.current) clearTimeout(plusTimerRef.current);
      if (minusTimerRef.current) clearTimeout(minusTimerRef.current);
      if (numberTimerRef.current) clearTimeout(numberTimerRef.current);
    };
  }, []);

  const handleTouchStartCoords = (e: React.TouchEvent, callback: () => void) => {
    if (e.touches.length > 0) {
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      touchMoved.current = false;
    }
    callback();
  };

  const handleTouchMoveCoords = (e: React.TouchEvent) => {
    if (touchStartPos.current && e.touches.length > 0) {
      const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
      // Standard mobile touch slop (16px) so natural finger wobble does not cancel button taps
      if (dx > 16 || dy > 16) {
        touchMoved.current = true;
        lastTouchMovedTimeRef.current = Date.now();
        cancelPlusPress();
        cancelMinusPress();
        cancelNumberPress();
      }
    }
  };

  // Handlers for (+) button: Tap = +1, Long press = Open Advanced Add
  const startPlusPress = () => {
    if (isPocketLocked) return;
    isPlusLongPressRef.current = false;
    plusTimerRef.current = setTimeout(() => {
      if (!touchMoved.current) {
        isPlusLongPressRef.current = true;
        onOpenAdvanced(item, 'add');
      }
    }, longPressDuration);
  };

  const cancelPlusPress = () => {
    if (plusTimerRef.current) {
      clearTimeout(plusTimerRef.current);
      plusTimerRef.current = null;
    }
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    cancelPlusPress();
    if (isPocketLocked) return;
    if (touchMoved.current) {
      touchMoved.current = false;
      return;
    }
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

  // Handlers for (-) button: Tap = -1, Long press = Open Advanced Subtract
  const startMinusPress = () => {
    if (isPocketLocked) return;
    isMinusLongPressRef.current = false;
    minusTimerRef.current = setTimeout(() => {
      if (!touchMoved.current) {
        isMinusLongPressRef.current = true;
        onOpenAdvanced(item, 'subtract');
      }
    }, longPressDuration);
  };

  const cancelMinusPress = () => {
    if (minusTimerRef.current) {
      clearTimeout(minusTimerRef.current);
      minusTimerRef.current = null;
    }
  };

  const handleMinusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    cancelMinusPress();
    if (isPocketLocked) return;
    if (touchMoved.current) {
      touchMoved.current = false;
      return;
    }
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

  // Handlers for Quantity Number: Long-press or deliberate click opens direct numeric edit
  const startNumberPress = () => {
    if (isPocketLocked) return;
    isNumberLongPressRef.current = false;
    numberTimerRef.current = setTimeout(() => {
      if (!touchMoved.current) {
        isNumberLongPressRef.current = true;
        onOpenAdvanced(item, 'set');
      }
    }, longPressDuration);
  };

  const cancelNumberPress = () => {
    if (numberTimerRef.current) {
      clearTimeout(numberTimerRef.current);
      numberTimerRef.current = null;
    }
  };

  const handleNumberClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    cancelNumberPress();
    if (isPocketLocked) return;
    if (touchMoved.current) {
      touchMoved.current = false;
      return;
    }
    if (isNumberLongPressRef.current) {
      isNumberLongPressRef.current = false;
      return;
    }
    onOpenAdvanced(item, 'set');
  };

  const colorConfig = COLOR_PALETTE.find(c => c.id === item.color) || COLOR_PALETTE[0];
  const isZero = item.value === 0;

  return (
    <div
      data-item-id={item.id}
      data-item-index={index}
      onDragOver={(e) => onDragOverHandler?.(e, item.id)}
      onDrop={(e) => onDropHandler?.(e, item.id)}
      className={`group relative rounded-2xl border transition-all duration-200 overflow-visible ${
        isDragging
          ? 'opacity-35 scale-[0.98] border-2 border-dashed border-[#00B8C4] bg-[#E6F9FA]/50 dark:bg-slate-900 shadow-none'
          : isZero
            ? 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-slate-300'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md ring-1 ring-[#00B8C4]/20'
      }`}
    >
      {/* Drop Target Indicator Line - Before */}
      {dropIndicator === 'before' && (
        <div className="absolute -top-2.5 left-2 right-2 h-1.5 bg-[#00B8C4] rounded-full shadow-lg shadow-[#00B8C4]/50 z-30 pointer-events-none flex items-center justify-between px-1 animate-pulse">
          <div className="w-3 h-3 rounded-full bg-[#00B8C4] ring-2 ring-white dark:ring-slate-900 -translate-x-1" />
          <div className="w-3 h-3 rounded-full bg-[#00B8C4] ring-2 ring-white dark:ring-slate-900 translate-x-1" />
        </div>
      )}

      {/* Drop Target Indicator Line - After */}
      {dropIndicator === 'after' && (
        <div className="absolute -bottom-2.5 left-2 right-2 h-1.5 bg-[#00B8C4] rounded-full shadow-lg shadow-[#00B8C4]/50 z-30 pointer-events-none flex items-center justify-between px-1 animate-pulse">
          <div className="w-3 h-3 rounded-full bg-[#00B8C4] ring-2 ring-white dark:ring-slate-900 -translate-x-1" />
          <div className="w-3 h-3 rounded-full bg-[#00B8C4] ring-2 ring-white dark:ring-slate-900 translate-x-1" />
        </div>
      )}

      {/* Visual Accent Colored Right Bar (RTL right edge) */}
      <div 
        className="absolute top-0 bottom-0 right-0 w-1.5 transition-colors rounded-r-2xl"
        style={{ backgroundColor: isZero ? '#0F172A' : '#00B8C4' }}
      />

      <div className={isCompact ? "p-2 pr-3 sm:p-2.5 sm:pr-3.5" : "p-2.5 pr-3.5 sm:p-3 sm:pr-4"}>
        {/* Top line: Full width Item Name + Inline Metadata tags + essential quick tools */}
        <div className="flex items-center justify-between gap-2">
          {/* Main Title Area & Inline Metadata (Draggable area for moving/reordering the item) */}
          <div 
            draggable={true}
            onDragStart={(e) => onDragStartHandler?.(e, item.id)}
            onDragEnd={onDragEndHandler}
            onTouchStart={(e) => onTouchDragStartHandler?.(e, item.id, true)}
            onTouchMove={onTouchDragMoveHandler}
            onTouchEnd={onTouchDragEndHandler}
            className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden flex-wrap cursor-grab active:cursor-grabbing select-none"
            title="امسك البند من هنا وحركه لأعلى أو لأسفل لترتيبه، أو انقر على الاسم لتعديل البيانات"
          >
            <h3 
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditForm(item);
              }}
              className={`font-black text-slate-900 dark:text-white leading-normal cursor-pointer hover:text-[#00B8C4] dark:hover:text-[#00B8C4] transition-colors tracking-tight truncate ${
                isCompact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
              }`}
              title={`اضغط لتعديل بيانات البند (${item.name}) أو اسحب لنقله`}
            >
              {item.name}
            </h3>

            {item.isFavorite && (
              <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60 shadow-2xs">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                <span className="hidden sm:inline">المفضلة</span>
              </span>
            )}

            {/* Inline Price Tag */}
            {item.price !== undefined && item.price !== null && item.price > 0 && (
              <span className="shrink-0 inline-flex items-center gap-1 font-bold text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                <Coins className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                <span>{item.price} ج</span>
                {item.value > 0 && (
                  <span className="opacity-80 font-normal hidden md:inline">
                    · {(item.value * item.price).toLocaleString()}
                  </span>
                )}
              </span>
            )}

            {/* Inline Notes indicator */}
            {item.notes && (
              <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100/70 dark:bg-slate-800/50 px-1.5 py-0.5 rounded-md truncate max-w-[110px]" title={item.notes}>
                <StickyNote className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                <span className="truncate">{item.notes}</span>
              </span>
            )}
          </div>

          {/* Action buttons: Direct Undo (if exists), Favorite Star, & Context Menu */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Direct Undo Button for this specific item (only appears when there's an action to undo) */}
            {lastItemAction && (
              <button
                type="button"
                disabled={isPocketLocked}
                onClick={(e) => {
                  e.stopPropagation();
                  undoItemAction(item.id);
                }}
                className="h-7 px-2 rounded-lg flex items-center gap-1 text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/70 dark:hover:bg-amber-900/90 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60 shadow-xs cursor-pointer active:scale-95 transition-all"
                title={`تراجع عن آخر حركة: كان (${lastItemAction.previousValue}) وأصبح (${lastItemAction.newValue})`}
              >
                <RotateCcw className="w-3 h-3" />
                <span className="text-[10px] font-mono font-black">
                  {lastItemAction.diff > 0 ? `+${lastItemAction.diff}` : lastItemAction.diff}
                </span>
              </button>
            )}

            {/* Favorite Star Toggle Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavoriteItem(item.id);
              }}
              className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                item.isFavorite
                  ? 'text-amber-500 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 ring-1 ring-amber-300/80 dark:ring-amber-700/80 shadow-2xs'
                  : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-amber-50/50 dark:hover:bg-slate-800'
              }`}
              title={
                item.isFavorite
                  ? 'بند مثبت في المفضلة بأعلى القائمة (اضغط للإلغاء)'
                  : 'تثبيت في المفضلة بأعلى القائمة دائماً'
              }
              aria-label={item.isFavorite ? 'إزالة من المفضلة' : 'تثبيت في المفضلة'}
            >
              <Star
                className={`w-3.5 h-3.5 transition-transform ${
                  item.isFavorite ? 'fill-amber-400 text-amber-500 scale-110' : ''
                }`}
              />
            </button>

            {/* Context Menu Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(!menuOpen);
                  setConfirmDelete(false);
                }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  menuOpen
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-label="خيارات البند"
                title="خيارات البند (تعديل، تصفير، حذف، نسخ...)"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {/* Context Dropdown Menu */}
              {menuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmDelete(false);
                    }} 
                  />
                  <div 
                    className="absolute left-0 top-8 z-50 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 text-xs animate-in fade-in duration-100"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      خيارات البند
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenEditForm(item);
                      }}
                      className="w-full text-right px-3 py-2 flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#00B8C4]" />
                      <span>تعديل البند والخواص</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenAdvanced(item, 'set');
                      }}
                      className="w-full text-right px-3 py-2 flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#00B8C4]" />
                      <span>تعديل الرقم مباشرة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const priceInfo = item.price ? ` (سعر الوحدة: ${item.price} ج)` : '';
                        const text = `${item.name}: ${item.value} ${item.unit || ''}${priceInfo}`.trim();
                        navigator.clipboard?.writeText(text);
                        setItemCopied(true);
                        setTimeout(() => {
                          setItemCopied(false);
                          setMenuOpen(false);
                        }, 800);
                      }}
                      className="w-full text-right px-3 py-2 flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium"
                    >
                      <div className="flex items-center gap-2">
                        {itemCopied ? (
                          <Check className="w-3.5 h-3.5 text-[#10B981]" />
                        ) : (
                          <ClipboardCopy className="w-3.5 h-3.5 text-[#00B8C4]" />
                        )}
                        <span>{itemCopied ? 'تم نسخ البيانات بنجاح!' : 'نسخ بيانات البند (نص)'}</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        duplicateItem(item.id);
                      }}
                      className="w-full text-right px-3 py-2 flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>نسخ وتكرار البند</span>
                    </button>

                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                    {/* Reset Option (تصفير البند) */}
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        resetItemValue(item.id);
                      }}
                      className="w-full text-right px-3 py-2 flex items-center justify-between text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer font-bold"
                      title="تصفير عداد هذا البند إلى (0)"
                    >
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>تصفير العداد (0)</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono">0</span>
                    </button>

                    {/* Delete Option (حذف البند) with confirmation */}
                    {!confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="w-full text-right px-3 py-2 flex items-center gap-2 text-[#EF4444] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer font-bold"
                        title="حذف هذا البند من القائمة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف البند</span>
                      </button>
                    ) : (
                      <div className="p-2 m-1 bg-red-50 dark:bg-red-950/60 rounded-xl space-y-1.5 border border-red-200 dark:border-red-800">
                        <p className="text-[11px] font-bold text-red-900 dark:text-red-200">
                          تأكيد حذف "{item.name}"؟
                        </p>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              setConfirmDelete(false);
                              deleteItem(item.id);
                            }}
                            className="flex-1 py-1 px-2 rounded-lg bg-[#EF4444] hover:bg-red-600 text-white font-bold text-[11px] shadow-xs active:scale-95 cursor-pointer text-center"
                          >
                            تأكيد الحذف
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            className="flex-1 py-1 px-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-medium cursor-pointer text-center"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Counter Display and Controls Row */}
        <div className={`border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2.5 sm:gap-4 ${
          isCompact ? 'mt-1.5 pt-1.5' : 'mt-2 pt-2'
        }`}>
          
          {/* Plus (+) Button (Right side in RTL) - Tap = +1, Long press = Advanced Add */}
          <button
            type="button"
            onClick={handlePlusClick}
            onMouseDown={startPlusPress}
            onMouseUp={cancelPlusPress}
            onMouseLeave={cancelPlusPress}
            onTouchStart={(e) => handleTouchStartCoords(e, startPlusPress)}
            onTouchMove={handleTouchMoveCoords}
            onTouchEnd={cancelPlusPress}
            onTouchCancel={cancelPlusPress}
            className={`rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-white bg-[#10B981] hover:bg-[#059669] active:scale-90 transition-transform touch-manipulation select-none shadow-md shadow-[#10B981]/25 border border-[#10B981] shrink-0 cursor-pointer ${
              isCompact 
                ? 'w-10 h-10 sm:w-11 sm:h-11' 
                : 'w-12 h-12 sm:w-14 sm:h-14 md:w-15 md:h-15'
            } ${
              pulseType === 'plus' ? 'scale-105 bg-[#059669] shadow-lg' : ''
            }`}
            title="نقرة: زيادة +1 | ضغط مطول: إضافة متقدمة..."
          >
            <Plus className={`${isCompact ? 'w-5 h-5 sm:w-6 sm:h-6 stroke-[3]' : 'w-6 h-6 sm:w-7 sm:h-7 stroke-[2.8]'}`} />
          </button>

          {/* Central Big Counter Number (Direct Edit on Long-Press or Click) */}
          <div
            onClick={handleNumberClick}
            onMouseDown={startNumberPress}
            onMouseUp={cancelNumberPress}
            onMouseLeave={cancelNumberPress}
            onTouchStart={(e) => handleTouchStartCoords(e, startNumberPress)}
            onTouchMove={handleTouchMoveCoords}
            onTouchEnd={cancelNumberPress}
            onTouchCancel={cancelNumberPress}
            className="flex-1 text-center cursor-pointer py-1 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group/num select-none"
            title="نقرة أو ضغط مطول: فتح لوحة الأرقام وتعيين الرصيد مباشرة"
          >
            <div className="flex items-baseline justify-center gap-1.5 sm:gap-2">
              <span className={`font-mono font-black tracking-tight tabular-nums transition-colors ${
                isCompact
                  ? 'text-3xl sm:text-4xl md:text-5xl leading-none'
                  : 'text-5xl sm:text-6xl md:text-7xl leading-none'
              } ${
                isZero
                  ? 'text-slate-400 dark:text-slate-500'
                  : 'text-[#10B981] dark:text-[#10B981] group-hover/num:text-[#00B8C4]'
              }`}>
                {item.value}
              </span>
              {item.unit && (
                <span className={`font-black text-slate-500 dark:text-slate-400 truncate max-w-[90px] ${
                  isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base md:text-lg'
                }`}>
                  {item.unit}
                </span>
              )}
            </div>
          </div>

          {/* Minus (-) Button (Left side in RTL) - Tap = -1, Long press = Advanced Subtract */}
          <button
            type="button"
            onClick={handleMinusClick}
            onMouseDown={startMinusPress}
            onMouseUp={cancelMinusPress}
            onMouseLeave={cancelMinusPress}
            onTouchStart={(e) => handleTouchStartCoords(e, startMinusPress)}
            onTouchMove={handleTouchMoveCoords}
            onTouchEnd={cancelMinusPress}
            onTouchCancel={cancelMinusPress}
            className={`rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-[#0F172A] dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 active:scale-90 transition-transform touch-manipulation select-none shadow-xs border border-slate-200/80 dark:border-slate-700/60 shrink-0 cursor-pointer ${
              isCompact 
                ? 'w-10 h-10 sm:w-11 sm:h-11' 
                : 'w-12 h-12 sm:w-14 sm:h-14 md:w-15 md:h-15'
            } ${
              pulseType === 'minus' ? 'scale-90 bg-red-100 dark:bg-red-950/60 text-[#EF4444] border-[#EF4444]' : ''
            }`}
            title="نقرة: خصم -1 | ضغط مطول: طرح متقدم..."
          >
            <Minus className={`${isCompact ? 'w-5 h-5 sm:w-6 sm:h-6 stroke-[3]' : 'w-6 h-6 sm:w-7 sm:h-7 stroke-[2.8]'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
