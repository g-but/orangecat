'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ExperimentalBannerProps {
  /**
   * Storage type for dismissal persistence
   * - 'session': Dismissed for current browser session only
   * - 'local': Dismissed permanently until localStorage is cleared
   */
  storageType?: 'session' | 'local';
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to show the dismiss button
   */
  dismissible?: boolean;
  /**
   * Custom content to show instead of default message
   */
  children?: React.ReactNode;
  /**
   * Callback when banner is dismissed
   */
  onDismiss?: () => void;
}

/**
 * Reusable Experimental Banner Component
 *
 * DRY-compliant component that handles dismissal persistence.
 * Supports both session and local storage dismissal.
 */
export default function ExperimentalBanner({
  storageType = 'session',
  className = '',
  dismissible = true,
  children,
  onDismiss,
}: ExperimentalBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const storageKey =
    storageType === 'session' ? 'oc_hide_experimental_banner' : 'experimental-banner-dismissed';

  const storageValue = storageType === 'session' ? '1' : 'true';

  useEffect(() => {
    try {
      const storage = storageType === 'session' ? sessionStorage : localStorage;
      const dismissed = storage.getItem(storageKey) === storageValue;
      if (dismissed) {
        setIsVisible(false);
      }
    } catch {
      // Storage not available, show banner
    }
  }, [storageKey, storageValue, storageType]);

  const handleDismiss = () => {
    try {
      const storage = storageType === 'session' ? sessionStorage : localStorage;
      storage.setItem(storageKey, storageValue);
    } catch {
      // Storage not available, just hide for this session
    }
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`bg-gradient-to-r from-orange-100 to-tiffany-100 border-b border-orange-200 ${className}`}
    >
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 justify-center">
            {children || (
              <>
                <span className="text-orange-600 font-medium">🚧 Experimental</span>
                <span className="text-gray-600 hidden sm:inline">•</span>
                <span className="text-gray-600 text-xs sm:text-sm hidden sm:inline">
                  {storageType === 'session' ? 'Development preview' : 'Development preview'}
                </span>
                <span className="text-gray-600 hidden sm:inline">•</span>
                <a
                  href="https://github.com/g-but/orangecat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 font-medium underline text-xs sm:text-sm"
                >
                  Source
                </a>
              </>
            )}
          </div>
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="ml-2 sm:ml-4 p-1 hover:bg-orange-200 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Dismiss banner"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
