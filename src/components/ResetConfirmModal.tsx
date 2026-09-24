import React from 'react';
import { useApp } from '../context/AppContext';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({ isOpen, onClose }) => {
  const { activeList, resetAllListItems } = useApp();

  if (!isOpen || !activeList) return null;

  const handleConfirm = () => {
    resetAllListItems(activeList.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <RotateCcw className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            تصفير جميع عدادات القائمة؟
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            هل تريد إعادة ضبط جميع كميات بنود قائمة <strong className="text-slate-800 dark:text-slate-200">"{activeList.name}"</strong> إلى (صفر)؟
            لن يتم حذف البنود ولكن ستصبح قيمها 0 للبدء بجرد جديد.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/30"
          >
            تأكيد التصفير
          </button>
        </div>
      </div>
    </div>
  );
};
