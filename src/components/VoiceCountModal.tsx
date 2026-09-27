import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ListItem } from '../types';
import { parseArabicVoiceCommand, isSpeechRecognitionSupported } from '../utils/voiceRecognition';
import { feedback } from '../utils/feedback';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
  Package
} from 'lucide-react';

interface VoiceCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItem?: ListItem | null;
}

export const VoiceCountModal: React.FC<VoiceCountModalProps> = ({
  isOpen,
  onClose,
  targetItem: initialTargetItem,
}) => {
  const { activeList, incrementItem, decrementItem, setItemValue, settings } = useApp();
  const [selectedItemId, setSelectedItemId] = useState<string>(initialTargetItem?.id || '');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const items = activeList?.items || [];
  const selectedItem = items.find(i => i.id === selectedItemId) || items[0];

  useEffect(() => {
    if (initialTargetItem) {
      setSelectedItemId(initialTargetItem.id);
    } else if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id);
    }
  }, [initialTargetItem, items, selectedItemId]);

  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setTranscript('');
      setLastActionMessage(null);
    }
  }, [isOpen]);

  const startListening = () => {
    if (!isSpeechRecognitionSupported()) {
      alert('التعرف الصوتي غير مدعوم في متصفحك. يرجى تجربة متصفح Google Chrome.');
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();
    recognition.lang = 'ar-EG';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const speech = event.results[current][0].transcript;
      setTranscript(speech);

      if (event.results[current].isFinal) {
        handleVoiceCommand(speech);
      }
    };

    recognition.onerror = (e: any) => {
      console.warn('Speech recognition error:', e);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isOpen && isListening) {
        // Auto restart for continuous hands-free counting
        try {
          recognition.start();
        } catch (err) {}
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      feedback.playClick('tap');
    } catch (e) {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleVoiceCommand = (text: string) => {
    if (!selectedItem) return;

    const parsed = parseArabicVoiceCommand(text);
    if (parsed.amount === null) {
      setLastActionMessage(`لم يتم تمييز عدد من: "${text}"`);
      return;
    }

    const amount = parsed.amount;
    if (parsed.action === 'add') {
      incrementItem(selectedItem.id, amount);
      setLastActionMessage(`✅ تمت إضافة +${amount} إلى [${selectedItem.name}]`);
      feedback.playClick('increment');
      feedback.vibrate('increment', settings.hapticIntensity);
    } else if (parsed.action === 'subtract') {
      decrementItem(selectedItem.id, amount);
      setLastActionMessage(`🔻 تم خصم -${amount} من [${selectedItem.name}]`);
      feedback.playClick('decrement');
      feedback.vibrate('decrement', settings.hapticIntensity);
    } else if (parsed.action === 'set') {
      setItemValue(selectedItem.id, amount);
      setLastActionMessage(`⚙️ تم تعيين رصيد [${selectedItem.name}] إلى ${amount}`);
      feedback.playClick('tap');
      feedback.vibrate('tap', settings.hapticIntensity);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00B8C4] flex items-center justify-center text-white shadow-sm shadow-[#00B8C4]/25">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                العد الصوتي الذكي (Voice Count)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                إملاء الأعداد أثناء انشغال اليدين في الميدان
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopListening();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Item Selection */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            الصنف المراد العد له حالياً:
          </label>
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="w-full py-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#00B8C4]"
          >
            {items.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} — الرصيد: {item.value} {item.unit || ''}
              </option>
            ))}
          </select>

          {selectedItem && (
            <div className="mt-2 flex items-center justify-between bg-white dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-500 dark:text-slate-400">الرصيد المباشر:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-base">
                {selectedItem.value} {selectedItem.unit || ''}
              </span>
            </div>
          )}
        </div>

        {/* Big Mic Button & Waveform Area */}
        <div className="p-6 text-center space-y-4">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-white transition-all transform active:scale-95 shadow-xl cursor-pointer ${
              isListening
                ? 'bg-[#EF4444] ring-8 ring-red-200 dark:ring-red-950/50 animate-pulse'
                : 'bg-[#00B8C4] hover:bg-[#009DA8] shadow-[#00B8C4]/30'
            }`}
          >
            {isListening ? (
              <MicOff className="w-10 h-10" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </button>

          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
              isListening
                ? 'bg-red-100 text-[#EF4444] dark:bg-red-950/60 dark:text-red-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              {isListening ? '🎙️ الميكروفون يستمع الآن... تكلم بالأرقام' : 'انقر على الميكروفون للبدء'}
            </span>
          </div>

          {/* Current speech transcription */}
          {transcript && (
            <div className="p-3 bg-slate-100 dark:bg-slate-800/70 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              "{transcript}"
            </div>
          )}

          {/* Last detected action */}
          {lastActionMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-[#10B981]/40 rounded-xl text-xs font-bold text-[#10B981] animate-in fade-in">
              {lastActionMessage}
            </div>
          )}

          {/* Hint guide */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-right space-y-1">
            <span className="font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300">
              <Sparkles className="w-3 h-3 text-[#00B8C4]" />
              أمثلة لجمل يمكنك قولها:
            </span>
            <p>• قل مباشرة: <strong>"عشرين"</strong> أو <strong>"خمسة وعشرين"</strong> (يضيف للرصيد فوراً).</p>
            <p>• قل: <strong>"زائد عشرة"</strong> أو <strong>"ضيف 5"</strong>.</p>
            <p>• للخصم قل: <strong>"اطرح اثنين"</strong> أو <strong>"ناقص 4"</strong>.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
