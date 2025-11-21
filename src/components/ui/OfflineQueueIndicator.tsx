'use client';

import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { WifiOff, UploadCloud, CheckCircle } from 'lucide-react';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const OfflineQueueManager = dynamic(
  () => import('@/components/ui/OfflineQueueManager').then(m => ({ default: m.OfflineQueueManager })),
  { ssr: false, loading: () => null }
);

/**
 * A small indicator that shows the status of the offline post queue.
 * It appears when the user is offline or when there are posts waiting to be synced.
 */
export function OfflineQueueIndicator() {
  const { queueLength, isOnline, isSyncing, progress } = useOfflineQueue();
  const [open, setOpen] = useState(false);

  // Determine if the indicator should be visible
  const isVisible = !isOnline || queueLength > 0 || isSyncing;

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
        text:
          progress && progress.total > 0
            ? `Syncing ${progress.processed}/${progress.total}`
            : `Syncing...`,
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
    <div className="fixed bottom-4 left-4 z-30 md:z-50">
      <div className="sr-only" aria-live="polite">
        {isSyncing ? 'Synchronizing queued posts' : isOnline ? 'Online' : 'Offline mode'}
      </div>
      <button
        onClick={() => setOpen(true)}
        className={`
          flex items-center gap-3 pl-4 pr-5 py-3 rounded-full
          text-white font-semibold text-sm shadow-lg
          transform transition-all hover:scale-105
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white
          ${bgColor}
        `}
        aria-label={`${text}. ${queueLength} pending.`}
      >
        {icon}
        <span>{text}</span>
      </button>
      <OfflineQueueManager isOpen={open} onClose={() => setOpen(false)} />
    </div>
  );
}
