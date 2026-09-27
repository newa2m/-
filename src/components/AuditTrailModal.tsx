import React from 'react';
import { useApp } from '../context/AppContext';
import {
  History,
  X,
  RotateCcw,
  ArrowUpRight,
  ArrowDownLeft,
  Edit2,
  Trash2,
  CheckCircle2
} from 'lucide-react';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ isOpen, onClose }) => {
  const { auditTrail, undoLastAction, clearAuditTrail, canUndo } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00B8C4] flex items-center justify-center text-white shadow-sm shadow-[#00B8C4]/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                سجل الحركات والتراجع (Audit Trail)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                متابعة آخر عمليات العد وتفادي الأخطاء الميدانية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Undo Toolbar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={!canUndo}
            onClick={() => undoLastAction()}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#00B8C4] hover:bg-[#009DA8] disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer border border-[#00B8C4]"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>تراجع عن آخر حركة فوراً</span>
          </button>

          {auditTrail.length > 0 && (
            <button
              type="button"
              onClick={clearAuditTrail}
              className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-[#EF4444] text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              مسح السجل
            </button>
          )}
        </div>

        {/* Trail Items List */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800 space-y-2">
          {auditTrail.length > 0 ? (
            auditTrail.map((action, idx) => {
              const isFirst = idx === 0;
              const isAdd = action.actionType === 'increment';
              const isSub = action.actionType === 'decrement';
              const timeStr = new Date(action.timestamp).toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div key={action.id} className="pt-2 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isAdd 
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-[#10B981] dark:text-[#10B981]' 
                        : isSub 
                        ? 'bg-red-100 dark:bg-red-950/60 text-[#EF4444] dark:text-red-400' 
                        : 'bg-[#E6F9FA] dark:bg-slate-800 text-[#00B8C4]'
                    }`}>
                      {isAdd && <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />}
                      {isSub && <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />}
                      {!isAdd && !isSub && <Edit2 className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                          {action.itemName}
                        </span>
                        {isFirst && (
                          <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                            الآن
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {timeStr}
                      </span>
                    </div>
                  </div>

                  <div className="text-left font-mono">
                    <span className="text-slate-400 text-[11px] block">
                      {action.previousValue} ⬅ <strong className="text-slate-900 dark:text-white font-bold">{action.newValue}</strong> {action.itemUnit || ''}
                    </span>
                    <span className={`text-xs font-bold ${
                      action.diff > 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                    }`}>
                      {action.diff > 0 ? `+${action.diff}` : `${action.diff}`}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs">لا توجد حركات مسجلة حالياً.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
