import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

interface Props {
  lang?: 'id' | 'en';
}

export const OfflineIndicator: React.FC<Props> = ({ lang = 'id' }) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 text-slate-950 px-3.5 py-2 text-xs font-bold shadow-xl border border-amber-400 animate-bounce">
      <WifiOff className="w-4 h-4" />
      <span>
        {lang === 'id'
          ? 'Mode Offline Aktif — Kalkulasi termal tetap berjalan mandiri di perangkat Anda.'
          : 'Offline Mode Active — Thermal calculations continue running locally on your device.'}
      </span>
    </div>
  );
};
