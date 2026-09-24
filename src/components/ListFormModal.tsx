import React, { useState, useEffect } from 'react';
import { List, LIST_ICONS, COLOR_PALETTE } from '../types';
import { useApp } from '../context/AppContext';
import { ListIcon } from './ListIcon';
import { Layers, X, Check } from 'lucide-react';

interface ListFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  listToEdit: List | null;
}

export const ListFormModal: React.FC<ListFormModalProps> = ({
  isOpen,
  onClose,
  listToEdit,
}) => {
  const { createList, updateList } = useApp();

  const [name, setName] = useState('');
  const [color, setColor] = useState('emerald');
  const [icon, setIcon] = useState('boxes');

  useEffect(() => {
    if (isOpen) {
      if (listToEdit) {
        setName(listToEdit.name);
        setColor(listToEdit.color || 'emerald');
        setIcon(listToEdit.icon || 'boxes');
      } else {
        setName('');
        setColor('emerald');
        setIcon('boxes');
      }
    }
  }, [isOpen, listToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (listToEdit) {
      updateList(listToEdit.id, {
        name: name.trim(),
        color,
        icon,
      });
    } else {
      createList({
        name: name.trim(),
        color,
        icon,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {listToEdit ? 'تعديل بيانات القائمة' : 'إنشاء قائمة جديدة'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                إدارة القوائم والجرد
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* List Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              اسم القائمة <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: جرد مواد البناء، تشطيبات الطابق الأول، مخزن القطع..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 outline-none"
              autoFocus
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              لون تمييز القائمة
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  title={c.label}
                  className={`w-8 h-8 rounded-full ${c.bg} transition-all transform flex items-center justify-center ${
                    color === c.id
                      ? 'ring-4 ring-blue-500/30 ring-offset-2 dark:ring-offset-slate-900 scale-110 shadow'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  {color === c.id && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              أيقونة القائمة
            </label>
            <div className="grid grid-cols-4 gap-2">
              {LIST_ICONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIcon(item.id)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    icon === item.id
                      ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-950/40 dark:border-blue-400 dark:text-blue-300 shadow-sm font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <ListIcon name={item.id} className="w-5 h-5" />
                  <span className="text-[10px] leading-tight text-center truncate max-w-full">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{listToEdit ? 'حفظ التعديلات' : 'إنشاء القائمة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
