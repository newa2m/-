import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Volume2,
  VolumeX,
  Vibrate,
  Smartphone,
  Lock,
  RotateCcw,
  History,
  Mic,
  ShieldCheck
} from 'lucide-react';

interface QuickFieldToolbarProps {
  onOpenVoiceModal: () => void;
  onOpenAuditModal: () => void;
}

export const QuickFieldToolbar: React.FC<QuickFieldToolbarProps> = ({
  onOpenVoiceModal,
  onOpenAuditModal,
}) => {
  const {
    settings,
    toggleSound,
    toggleHaptic,
    isPocketLocked,
    setIsPocketLocked,
    canUndo,
    lastUndoAction,
    undoLastAction,
  } = useApp();

  return (
    <div 
      className="border-b text-white select-none transition-colors duration-200"
      style={{
        backgroundColor: 'var(--app-navbar-bg)',
        borderBottomColor: 'var(--app-navbar-border)',
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto no-scrollbar text-xs">
        
        {/* Group 1: Field Sensory Toggles (Sound & Haptics) */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Sound FX Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={`py-1.5 px-2.5 rounded-xl border flex items-center gap-1.5 transition-all active:scale-95 ${
              settings.soundFeedback
                ? 'bg-[#00B8C4]/20 border-[#00B8C4]/50 text-[#00B8C4] font-bold'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 opacity-60'
            }`}
            title={settings.soundFeedback ? 'الصوت الميكانيكي: مفعل (انقر لكتمه)' : 'الصوت الميكانيكي: مكتوم (انقر لتفعيله)'}
          >
            {settings.soundFeedback ? <Volume2 className="w-3.5 h-3.5 text-[#00B8C4]" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{settings.soundFeedback ? 'صوت نقر' : 'صامت'}</span>
          </button>

          {/* Haptic Vibration Toggle */}
          <button
            type="button"
            onClick={toggleHaptic}
            className={`py-1.5 px-2.5 rounded-xl border flex items-center gap-1.5 transition-all active:scale-95 ${
              settings.hapticFeedback
                ? 'bg-[#10B981]/20 border-[#10B981]/50 text-[#10B981] font-bold'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 opacity-60'
            }`}
            title={settings.hapticFeedback ? `الاهتزاز اللمسي: مفعل (${settings.hapticIntensity})` : 'الاهتزاز: متوقف'}
          >
            <Vibrate className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{settings.hapticFeedback ? 'اهتزاز' : 'كتم'}</span>
          </button>

          {/* Pocket Lock Toggle */}
          <button
            type="button"
            onClick={() => setIsPocketLocked(true)}
            className="py-1.5 px-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold flex items-center gap-1.5 transition-all active:scale-95"
            title="تفعيل قفل الجيب لحماية الشاشة من اللمس غير المقصود أثناء المشي"
          >
            <Lock className="w-3.5 h-3.5 text-slate-300" />
            <span>قفل الجيب</span>
          </button>
        </div>

        {/* Group 2: Operational Field Tools (Voice, Undo, Audit Trail, Report Preview) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          
          {/* Quick Voice Counter Trigger */}
          <button
            type="button"
            onClick={onOpenVoiceModal}
            className="py-1.5 px-2.5 rounded-xl border border-[#00B8C4]/40 bg-[#00B8C4]/15 hover:bg-[#00B8C4]/25 text-[#00B8C4] font-bold flex items-center gap-1.5 transition-all active:scale-95"
            title="العد الصوتي الذكي (إملاء الأعداد صوتياً بدون لمس الشاشة)"
          >
            <Mic className="w-3.5 h-3.5 text-[#00B8C4] animate-pulse" />
            <span>عد صوتي</span>
          </button>

          {/* Quick Undo Button */}
          <button
            type="button"
            disabled={!canUndo}
            onClick={() => undoLastAction()}
            className="py-1.5 px-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 font-bold flex items-center gap-1.5 transition-all active:scale-95"
            title={lastUndoAction ? `تراجع عن: ${lastUndoAction.itemName}` : 'تراجع عن آخر حركة'}
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
            <span>تراجع</span>
          </button>

          {/* Audit Trail Log Button */}
          <button
            type="button"
            onClick={onOpenAuditModal}
            className="p-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95"
            title="سجل الحركات والتعديلات (Audit Trail)"
          >
            <History className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
