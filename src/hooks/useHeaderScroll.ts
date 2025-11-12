/**
 * Shared hook for header scroll behavior
 *
 * Handles:
 * - Scroll detection for backdrop blur
 * - Hide/show on scroll down/up
 *
 * Created: 2025-01-07
 * Last Modified: 2025-01-07
 * Last Modified Summary: Created shared hook for header scroll logic
 */

import { useState, useEffect, useRef } from 'react';

interface UseHeaderScrollOptions {
  hideOnScrollDown?: boolean;
  scrollThreshold?: number;
}

interface UseHeaderScrollReturn {
  isScrolled: boolean;
  isHidden: boolean;
}

export function useHeaderScroll(options: UseHeaderScrollOptions = {}): UseHeaderScrollReturn {
  const { hideOnScrollDown = true, scrollThreshold = 80 } = options;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setIsScrolled(current > 0);

      if (hideOnScrollDown) {
        const isScrollingDown = current > lastScrollRef.current && current > scrollThreshold;
        const isScrollingUp = current < lastScrollRef.current;

        if (isScrollingDown) {
          setIsHidden(true);
        }
        if (isScrollingUp) {
          setIsHidden(false);
        }
      }

      lastScrollRef.current = current;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hideOnScrollDown, scrollThreshold]);

  return { isScrolled, isHidden };
}
