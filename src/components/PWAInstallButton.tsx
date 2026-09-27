import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, CheckCircle2 } from 'lucide-react';
import { AndroidInstallModal } from './AndroidInstallModal';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'full' }> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  const handleClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`relative inline-flex items-center gap-1.5 rounded-xl font-bold transition-all shadow-sm ${
          isInstalled
            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1.5 text-xs'
            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20 hover:shadow-emerald-500/30 px-3 py-1.5 text-xs active:scale-95'
        }`}
        title={isInstalled ? 'التطبيق مثبت كأندرويد' : 'تثبيت تطبيق أندرويد'}
      >
        {isInstalled ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>تطبيق أندرويد</span>
          </>
        ) : (
          <>
            <Smartphone className="w-3.5 h-3.5 animate-pulse" />
            <span>تطبيق أندرويد</span>
            <span className="hidden sm:inline text-[10px] opacity-80">(تثبيت)</span>
          </>
        )}
      </button>

      <AndroidInstallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};
