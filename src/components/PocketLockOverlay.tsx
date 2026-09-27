import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { feedback } from '../utils/feedback';
import { Lock, Unlock, ShieldAlert } from 'lucide-react';

export const PocketLockOverlay: React.FC = () => {
  const { isPocketLocked, setIsPocketLocked, settings } = useApp();
  const [unlockProgress, setUnlockProgress] = useState(0);
  const pressTimerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);

  const HOLD_DURATION = 1200; // 1.2s to unlock

  const startHold = () => {
    feedback.vibrate('tap', settings.hapticIntensity);
    const startTime = Date.now();

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / HOLD_DURATION) * 100));
      setUnlockProgress(pct);

      if (elapsed >= HOLD_DURATION) {
        clearInterval(progressIntervalRef.current);
        unlockScreen();
      }
    }, 30);
  };

  const endHold = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setUnlockProgress(0);
  };

  const unlockScreen = () => {
    setIsPocketLocked(false);
    setUnlockProgress(0);
    feedback.playClick('unlock');
    feedback.vibrate('double_warning', settings.hapticIntensity);
  };

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  if (!isPocketLocked) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-between p-6 select-none animate-in fade-in duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Banner */}
      <div className="w-full max-w-sm flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-slate-900/90 border border-slate-800 text-amber-400 text-xs font-bold shadow-lg">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        <span>قفل الجيب مفعل: تم تعطيل اللمس لمنع الأخطاء أثناء الحركة</span>
      </div>

      {/* Center Icon */}
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 text-amber-400 flex items-center justify-center mx-auto shadow-2xl">
          <Lock className="w-10 h-10 stroke-[2.2]" />
        </div>
        <h2 className="text-xl font-bold text-white">
          الشاشة مقفولة للحماية
        </h2>
        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
          جميع أزرار العد والزيادة والنقصان مقفلة بأمان لمنع أي لمس غير مقصود في الجيب.
        </p>
      </div>

      {/* Bottom Hold to Unlock Button with Circular / Bar Progress */}
      <div className="w-full max-w-sm space-y-3">
        <div className="relative">
          <button
            type="button"
            onPointerDown={startHold}
            onPointerUp={endHold}
            onPointerCancel={endHold}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/20 active:scale-98 transition-all overflow-hidden relative"
          >
            {/* Visual Fill Layer */}
            <div 
              className="absolute inset-y-0 right-0 bg-amber-300 transition-all pointer-events-none"
              style={{ width: `${unlockProgress}%` }}
            />
            
            <div className="relative z-10 flex items-center gap-2">
              <Unlock className="w-5 h-5 stroke-[2.5]" />
              <span>
                {unlockProgress > 0 ? `جاري فك القفل (${unlockProgress}%)...` : 'اضغط مع الاستمرار لفك القفل'}
              </span>
            </div>
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-500">
          استمر بالضغط لمدة ثانية لفك القفل والعودة للعد
        </p>
      </div>
    </div>
  );
};
