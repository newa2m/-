import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { List, COLOR_PALETTE } from '../types';
import { ListIcon } from './ListIcon';
import {
  X,
  Plus,
  Copy,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Check,
  AlertTriangle
} from 'lucide-react';

interface ListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateList: () => void;
  onOpenEditList: (list: List) => void;
}

export const ListDrawer: React.FC<ListDrawerProps> = ({
  isOpen,
  onClose,
  onOpenCreateList,
  onOpenEditList,
}) => {
  const {
    lists,
    activeListId,
    setActiveListId,
    duplicateList,
    deleteList,
    moveListStep,
    reorderLists,
  } = useApp();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [listToDelete, setListToDelete] = useState<List | null>(null);

  if (!isOpen) return null;

  const handleSelect = (id: string) => {
    setActiveListId(id);
    onClose();
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    reorderLists(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const confirmDelete = () => {
    if (listToDelete) {
      deleteList(listToDelete.id);
      setListToDelete(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
        <div 
          className="w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl border-r border-slate-200 dark:border-slate-800"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                إدارة القوائم والجرد
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lists.length} قائمة متاحة · اضغط للتبديل أو الترتيب
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New List Button */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                onClose();
                onOpenCreateList();
              }}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء قائمة جديدة</span>
            </button>
          </div>

          {/* List items scrollable area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {lists.map((l, index) => {
              const colorInfo = COLOR_PALETTE.find(c => c.id === l.color) || COLOR_PALETTE[0];
              const isActive = l.id === activeListId;

              return (
                <div
                  key={l.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group relative rounded-2xl p-3.5 border transition-all cursor-pointer flex items-center gap-3 ${
                    isActive
                      ? 'bg-blue-50/70 border-blue-400 dark:bg-blue-950/30 dark:border-blue-500/60 shadow-sm'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                  onClick={() => handleSelect(l.id)}
                >
                  {/* Drag Grip Handle */}
                  <div 
                    className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-500 flex items-center touch-manipulation"
                    title="اسحب لإعادة الترتيب"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* List Icon Badge */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${colorInfo.bg}`}>
                    <ListIcon name={l.icon} className="w-5 h-5" />
                  </div>

                  {/* Title & metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {l.name}
                      </h4>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{l.items.length} بند</span>
                      <span>·</span>
                      <span>إجمالي {l.items.reduce((s, i) => s + i.value, 0)}</span>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    {/* Step Up / Down */}
                    <div className="flex flex-col">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveListStep(l.id, 'up')}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 transition-colors"
                        title="تحريك لأعلى"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === lists.length - 1}
                        onClick={() => moveListStep(l.id, 'down')}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 transition-colors"
                        title="تحريك لأسفل"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenEditList(l);
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                      title="تعديل اسم ولون القائمة"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Duplicate */}
                    <button
                      type="button"
                      onClick={() => duplicateList(l.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                      title="نسخ القائمة كاملة"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setListToDelete(l)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="حذف القائمة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 text-center">
            يمكنك سحب وإفلات أي قائمة باللمس أو الماوس لإعادة ترتيبها
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {listToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                تأكيد حذف القائمة
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                هل أنت متأكد من رغبتك في حذف قائمة <strong className="text-slate-800 dark:text-slate-200">"{listToDelete.name}"</strong>؟
                سيتم حذف جميع بنودها ({listToDelete.items.length} بند) ولا يمكن التراجع.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setListToDelete(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
