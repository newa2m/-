import React, { useState, useEffect, useCallback } from 'react';
import { ListItem } from '../types';
import { useApp } from '../context/AppContext';
import { feedback } from '../utils/feedback';
import { parseArabicVoiceCommand, isSpeechRecognitionSupported } from '../utils/voiceRecognition';
import {
  Plus,
  Minus,
  Edit3,
  X,
  Check,
  Delete,
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Trash2
} from 'lucide-react';

interface NumPadModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ListItem | null;
  mode: 'add' | 'subtract' | 'set';
}

export const NumPadModal: React.FC<NumPadModalProps> = ({
  isOpen,
  onClose,
  item,
  mode,
}) => {
  const {
    incrementItem,
    decrementItem,
    setItemValue,
    resetItemValue,
    deleteItem,
    undoItemAction,
    getItemLastAction,
    activeList,
    settings
  } = useApp();

  const [displayValue, setDisplayValue] = useState<string>('');
  const [isFreshOverwrite, setIsFreshOverwrite] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get current item state from active list to stay reactive to undos
  const currentItem = activeList?.items.find(i => i.id === item?.id) || item;
  const lastItemAction = currentItem ? getItemLastAction(currentItem.id) : undefined;

  useEffect(() => {
    if (isOpen && currentItem) {
      if (mode === 'set') {
        setDisplayValue(currentItem.value.toString());
        setIsFreshOverwrite(true);
      } else {
        setDisplayValue('');
        setIsFreshOverwrite(false);
      }
      setVoiceNotice(null);
      setIsListening(false);
    }
  }, [isOpen, currentItem?.id, mode]);

  const currentVal = currentItem?.value ?? 0;
  const inputNum = parseFloat(displayValue) || 0;

  // Handle undo previous action for this item
  const handleUndoPreviousAction = () => {
    if (!currentItem) return;
    feedback.playClick('reset');
    feedback.vibrate('tap', settings.hapticIntensity);
    const prevAction = getItemLastAction(currentItem.id);
    const success = undoItemAction(currentItem.id);
    if (success && prevAction) {
      if (mode === 'set') {
        setDisplayValue(prevAction.previousValue.toString());
        setIsFreshOverwrite(true);
      }
      setVoiceNotice(`تم التراجع بنجاح! الرصيد: ${prevAction.previousValue}`);
      setTimeout(() => setVoiceNotice(null), 3000);
    }
  };
  
  let previewNextVal = currentVal;
  if (mode === 'add') {
    previewNextVal = currentVal + inputNum;
  } else if (mode === 'subtract') {
    previewNextVal = Math.max(0, currentVal - inputNum);
  } else {
    previewNextVal = inputNum;
  }

  // Handle key press on tactile on-screen keypad
  const handleNumClick = (digit: string) => {
    feedback.playClick('tap');
    feedback.vibrate('tap', settings.hapticIntensity);

    // If in fresh overwrite mode: wipe the existing value and replace with new digit
    if (isFreshOverwrite && mode === 'set') {
      setIsFreshOverwrite(false);
      if (digit === '.') {
        setDisplayValue('0.');
      } else {
        setDisplayValue(digit);
      }
      return;
    }

    if (digit === '.') {
      if (!displayValue.includes('.')) {
        setDisplayValue(prev => (prev === '' ? '0.' : prev + '.'));
      }
      return;
    }

    if (displayValue === '0') {
      setDisplayValue(digit);
    } else {
      setDisplayValue(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    feedback.playClick('tap');
    feedback.vibrate('tap', settings.hapticIntensity);

    if (isFreshOverwrite && mode === 'set') {
      setDisplayValue('');
      setIsFreshOverwrite(false);
      return;
    }

    setDisplayValue(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    feedback.playClick('tap');
    feedback.vibrate('tap', settings.hapticIntensity);
    setDisplayValue('');
    setIsFreshOverwrite(false);
  };

  // Preset shortcut click
  const handlePresetClick = (amount: number) => {
    feedback.playClick('tap');
    feedback.vibrate('tap', settings.hapticIntensity);
    setDisplayValue(amount.toString());
    setIsFreshOverwrite(false);
  };

  // Confirm and submit
  const handleConfirm = () => {
    if (!item) return;
    const val = parseFloat(displayValue);
    if (isNaN(val)) {
      onClose();
      return;
    }

    if (mode === 'add') {
      if (val > 0) incrementItem(item.id, val);
    } else if (mode === 'subtract') {
      if (val > 0) decrementItem(item.id, val);
    } else {
      setItemValue(item.id, val);
    }

    onClose();
  };

  // Voice dictation
  const handleToggleVoice = () => {
    if (!isSpeechRecognitionSupported()) {
      alert('التعرف الصوتي غير مدعوم في هذا المتصفح. يرجى استخدام متصفح جوجل كروم.');
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();
    recognition.lang = 'ar-EG';
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsListening(true);
    setVoiceNotice('تحدث الآن بالعدد... (مثال: خمسة وعشرين، عشرة، +50)');

    recognition.onresult = (event: any) => {
      const speechResult = event.results[0][0].transcript;
      const parsed = parseArabicVoiceCommand(speechResult);
      if (parsed.amount !== null) {
        setDisplayValue(parsed.amount.toString());
        setVoiceNotice(`تم التقاط: "${speechResult}" ⬅ ${parsed.amount}`);
        feedback.playClick('increment');
      } else {
        setVoiceNotice(`لم نتمكن من تحديد العدد من: "${speechResult}"`);
      }
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setVoiceNotice('تعذر التقاط الصوت، حاول مجدداً.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Keyboard shortcut listener for desktop/laptop numpads
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumClick(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        handleNumClick('.');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFreshOverwrite, displayValue, mode]);

  const presets = [5, 10, 25, 50, 100];

  if (!isOpen || !item || !currentItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm ${
              mode === 'add' ? 'bg-[#10B981]' : mode === 'subtract' ? 'bg-[#EF4444]' : 'bg-[#00B8C4]'
            }`}>
              {mode === 'add' && <Plus className="w-5 h-5 stroke-[2.5]" />}
              {mode === 'subtract' && <Minus className="w-5 h-5 stroke-[2.5]" />}
              {mode === 'set' && <Edit3 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-tight">
                {mode === 'add' && 'لوحة إضافة كمية سريعة'}
                {mode === 'subtract' && 'لوحة طرح وخصم كمية'}
                {mode === 'set' && 'تعيين كمية الصنف مباشرة'}
              </h3>
              <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate max-w-[240px] mt-0.5">
                {item.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Quick Delete Item Button */}
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                showDeleteConfirm
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-950/40 border-slate-200 dark:border-slate-700'
              }`}
              title="حذف هذا البند"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Voice Dictation Button in Header */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`p-2 rounded-xl border transition-colors ${
                isListening 
                  ? 'bg-[#EF4444] text-white animate-pulse border-[#EF4444]' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border-slate-200 dark:border-slate-700'
              }`}
              title="إملاء صوتي ذكي للعدد"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Alert */}
        {showDeleteConfirm && (
          <div className="px-4 py-2.5 bg-red-50 dark:bg-red-950/80 border-b border-red-200 dark:border-red-800 flex items-center justify-between gap-2 text-xs animate-in fade-in">
            <span className="font-bold text-red-900 dark:text-red-200 truncate">
              تأكيد حذف "{item.name}" نهائياً؟
            </span>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  deleteItem(item.id);
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-[#EF4444] hover:bg-red-600 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                نعم، حذف
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Quick Undo Previous Action Bar (to correct accidental changes) */}
        {lastItemAction && (
          <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 min-w-0">
              <RotateCcw className="w-3.5 h-3.5 text-[#00B8C4] shrink-0" />
              <span className="truncate">
                آخر تعديل: كان ({lastItemAction.previousValue}) ➔ أصبح ({lastItemAction.newValue})
              </span>
            </div>
            <button
              type="button"
              onClick={handleUndoPreviousAction}
              className="py-1 px-2.5 rounded-lg bg-[#00B8C4] hover:bg-[#009DA8] active:scale-95 text-white font-bold text-xs flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
              title="تراجع فوراً عن الحركة السابقة وتصحيح الخطأ"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تراجع ({lastItemAction.diff > 0 ? `+${lastItemAction.diff}` : lastItemAction.diff})</span>
            </button>
          </div>
        )}

        {/* Display / Calculator Screen */}
        <div className="bg-[#0F172A] px-5 py-3 text-white">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>الرصيد الحالي: <strong className="text-slate-200 font-mono text-sm">{currentVal} {item.unit || ''}</strong></span>
            {voiceNotice && (
              <span className="text-[11px] text-[#00B8C4] font-medium truncate max-w-[170px] animate-pulse">
                {voiceNotice}
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between py-1">
            <span className={`text-xl font-bold font-mono ${
              mode === 'add' ? 'text-[#10B981]' : mode === 'subtract' ? 'text-[#EF4444]' : 'text-[#00B8C4]'
            }`}>
              {mode === 'add' ? '+' : mode === 'subtract' ? '-' : '='}
            </span>
            <div className="text-right flex items-baseline justify-end">
              <span className={`text-4xl font-mono font-black tabular-nums tracking-tight transition-all duration-150 inline-block ${
                isFreshOverwrite && mode === 'set'
                  ? 'bg-[#00B8C4]/30 text-white ring-2 ring-[#00B8C4] px-2.5 py-0.5 rounded-xl shadow-inner'
                  : ''
              }`}>
                {displayValue || '0'}
              </span>
              {item.unit && (
                <span className="text-xs font-semibold text-slate-400 mr-1.5">
                  {item.unit}
                </span>
              )}
            </div>
          </div>

          {isFreshOverwrite && mode === 'set' && (
            <div className="text-[11px] text-[#00B8C4] font-medium flex items-center justify-end gap-1 mt-0.5 animate-in fade-in duration-100">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00B8C4] animate-pulse" />
              <span>جاهز للاستبدال: اكتب الرقم الجديد مباشرة</span>
            </div>
          )}

          {/* Live Preview Result */}
          <div className="mt-1 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">النتيجة بعد التطبيق:</span>
            <span className="font-mono font-bold text-[#10B981] text-sm tabular-nums">
              {previewNextVal} {item.unit || ''}
            </span>
          </div>
        </div>

        {/* Quick Presets Row */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#00B8C4]" />
            <span>كراتين:</span>
          </span>
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold font-mono border transition-all active:scale-95 shadow-sm whitespace-nowrap cursor-pointer ${
                mode === 'add'
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-[#10B981] border-[#10B981]/30 dark:bg-emerald-950/40 dark:text-[#10B981] dark:border-emerald-800/60'
                  : mode === 'subtract'
                  ? 'bg-red-50 hover:bg-red-100 text-[#EF4444] border-[#EF4444]/30 dark:bg-red-950/40 dark:text-[#EF4444] dark:border-red-800/60'
                  : 'bg-[#E6F9FA] hover:bg-[#d0f4f7] text-[#00B8C4] border-[#00B8C4]/30 dark:bg-slate-800 dark:text-[#00B8C4] dark:border-slate-700'
              }`}
            >
              {mode === 'add' ? `+${preset}` : mode === 'subtract' ? `-${preset}` : `${preset}`}
            </button>
          ))}
        </div>

        {/* Tactile On-Screen NumPad */}
        <div className="p-3.5 sm:p-4 grid grid-cols-3 gap-2 bg-slate-100/70 dark:bg-slate-900/90 select-none">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleNumClick(digit)}
              className="h-13 sm:h-14 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 active:bg-slate-200 dark:active:bg-slate-700 text-[#0F172A] dark:text-white font-mono font-bold text-2xl shadow-sm border border-slate-200/80 dark:border-slate-700 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              {digit}
            </button>
          ))}

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleBackspace}
            className="h-13 sm:h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 active:bg-slate-400 text-[#0F172A] dark:text-slate-200 font-bold shadow-sm border border-slate-300 dark:border-slate-700 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="مسح خانة"
          >
            <Delete className="w-6 h-6 stroke-[2]" />
          </button>
        </div>

        {/* Action Confirmation Footer */}
        <div className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          {/* Direct Undo Button to correct accidental entry */}
          <button
            type="button"
            disabled={!lastItemAction}
            onClick={handleUndoPreviousAction}
            className={`py-3 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 shrink-0 ${
              lastItemAction
                ? 'bg-slate-100 hover:bg-slate-200 text-[#0F172A] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer'
                : 'border border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 opacity-40 cursor-not-allowed'
            }`}
            title={
              lastItemAction
                ? `تراجع عن آخر حركة: كان (${lastItemAction.previousValue}) وأصبح (${lastItemAction.newValue})`
                : 'لا توجد حركة مسجلة لهذا البند للتراجع عنها'
            }
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تراجع</span>
            {lastItemAction && (
              <span className="font-mono text-[11px] font-black">
                ({lastItemAction.diff > 0 ? `+${lastItemAction.diff}` : lastItemAction.diff})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="py-3 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
            title="مسح الرقم المكتوب في الشاشة لإعادة كتابته"
          >
            مسح (C)
          </button>

          {/* Quick Reset to Zero Button */}
          <button
            type="button"
            onClick={() => {
              feedback.playClick('reset');
              feedback.vibrate('tap', settings.hapticIntensity);
              if (mode === 'set') {
                setDisplayValue('0');
                setIsFreshOverwrite(false);
              } else {
                if (currentItem) resetItemValue(currentItem.id);
                onClose();
              }
            }}
            className="py-3 px-2.5 rounded-xl border border-amber-300/80 dark:border-amber-800 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/60 shrink-0 cursor-pointer flex items-center gap-1 active:scale-95 transition-all"
            title="تصفير رصيد هذا البند إلى (0)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>تصفير (0)</span>
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className={`flex-1 py-3.5 px-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer ${
              mode === 'add'
                ? 'bg-[#10B981] hover:bg-[#059669] shadow-[#10B981]/25 border border-[#10B981]'
                : mode === 'subtract'
                ? 'bg-[#EF4444] hover:bg-[#DC2626] shadow-[#EF4444]/25 border border-[#EF4444]'
                : 'bg-[#00B8C4] hover:bg-[#009DA8] shadow-[#00B8C4]/25 border border-[#00B8C4]'
            }`}
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>
              {mode === 'add' && `تأكيد إضافة (${displayValue || '0'})`}
              {mode === 'subtract' && `تأكيد خصم (${displayValue || '0'})`}
              {mode === 'set' && `تعيين الرصيد (${displayValue || '0'})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
