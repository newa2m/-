import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center gap-3 rounded-xl bg-amber-500/95 backdrop-blur-md px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-950 shadow-2xl border border-amber-400">
      <WifiOff className="w-5 h-5 flex-shrink-0 animate-pulse text-slate-900" />
      <div>
        <p className="font-bold">وضع عدم الاتصال (Offline)</p>
        <p className="text-[11px] opacity-90">التطبيق يعمل بالكامل بدون إنترنت، وجميع بياناتك وعدّاداتك محفوظة محلياً على هاتفك.</p>
      </div>
    </div>
  );
};
