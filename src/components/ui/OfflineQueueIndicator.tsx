'use client';

import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { WifiOff, UploadCloud, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * A small indicator that shows the status of the offline post queue.
 * It appears when the user is offline or when there are posts waiting to be synced.
 */
export function OfflineQueueIndicator() {
  const { queueLength, isOnline } = useOfflineQueue();
  const [isSyncing, setIsSyncing] = useState(false);

  // Determine if the indicator should be visible
  const isVisible = !isOnline || queueLength > 0;

  // Effect to simulate a "syncing" state when coming back online
  useEffect(() => {
    if (isOnline && queueLength > 0) {
      setIsSyncing(true);
      // Assume syncing takes a few seconds. In a real app, this would be
      // driven by events from the sync manager.
      const timer = setTimeout(() => setIsSyncing(false), 4000);
      return () => clearTimeout(timer);
    } else {
      setIsSyncing(false);
    }
  }, [isOnline, queueLength]);

  if (!isVisible) {
    return null;
  }

  const getIndicatorContent = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="w-5 h-5" />,
        text: 'Offline Mode',
        bgColor: 'bg-gray-700',
      };
    }
    if (isSyncing) {
      return {
        icon: <UploadCloud className="w-5 h-5 animate-pulse" />,
        text: `Syncing ${queueLength}...`,
        bgColor: 'bg-blue-600',
      };
    }
    if (queueLength > 0) {
      return {
        icon: <UploadCloud className="w-5 h-5" />,
        text: `${queueLength} post${queueLength > 1 ? 's' : ''} pending`,
        bgColor: 'bg-yellow-600',
      };
    }
    // This case should ideally not be reached if isVisible is calculated correctly,
    // but it's a good fallback. It shows for a moment after the queue is cleared.
    return {
      icon: <CheckCircle className="w-5 h-5" />,
      text: 'Synced',
      bgColor: 'bg-green-600',
    };
  };

  const { icon, text, bgColor } = getIndicatorContent();

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => console.log('Offline queue clicked. Posts:', queueLength)}
        className={`
          flex items-center gap-3 pl-4 pr-5 py-3 rounded-full
          text-white font-semibold text-sm shadow-lg
          transform transition-all hover:scale-105
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white
          ${bgColor}
        `}
      >
        {icon}
        <span>{text}</span>
      </button>
    </div>
  );
}
