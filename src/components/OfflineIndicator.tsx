import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
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

  return (
    <div
      className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded border transition-colors ${
        isOnline
          ? 'text-neutral-400 border-neutral-800 bg-neutral-900/60'
          : 'text-amber-300 border-amber-800/80 bg-amber-950/60'
      }`}
      title={isOnline ? 'Online — FolioCraft works 100% offline' : 'Offline Mode active — all edits saved locally in IndexedDB'}
    >
      {isOnline ? (
        <>
          <Wifi className="w-3 h-3 text-neutral-400" />
          <span className="text-[11px]">Offline-Ready</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 text-amber-400" />
          <span className="text-[11px] font-medium">Offline Mode</span>
        </>
      )}
    </div>
  );
};
