/**
 * Shared hook for header scroll behavior
 *
 * Handles:
 * - Scroll detection for backdrop blur
 * - Hide/show on scroll down/up
 *
 * Created: 2025-01-07
 * Last Modified: 2025-01-27
 * Last Modified Summary: Extended to support bottom nav transparency
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
  const tickingRef = useRef<boolean>(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const minScrollDelta = 16; // Minimum scroll delta to prevent flickering from tiny movements and layout shifts

  useEffect(() => {
    const handleScroll = () => {
      if (!tickingRef.current) {
        window.requestAnimationFrame(() => {
          const current = window.scrollY;
          const scrollDelta = Math.abs(current - lastScrollRef.current);

          setIsScrolled(current > 0);

          // When near the top, always show the header and clear pending hides
          if (current <= scrollThreshold) {
            if (hideTimeoutRef.current) {
              clearTimeout(hideTimeoutRef.current);
              hideTimeoutRef.current = null;
            }
            setIsHidden(false);
          }

          if (hideOnScrollDown) {
            // Only process if scroll delta is significant enough to prevent flickering
            if (scrollDelta >= minScrollDelta) {
              const isScrollingDown = current > lastScrollRef.current && current > scrollThreshold;
              const isScrollingUp = current < lastScrollRef.current;

              // Clear any pending hide timeout
              if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
              }

              if (isScrollingDown) {
                // Add small delay before hiding to prevent flickering
                hideTimeoutRef.current = setTimeout(() => {
                  setIsHidden(true);
                }, 100);
              } else if (isScrollingUp) {
                // Show immediately when scrolling up
                setIsHidden(false);
              }
            }
          }

          lastScrollRef.current = current;
          tickingRef.current = false;
        });

        tickingRef.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [hideOnScrollDown, scrollThreshold]);

  return { isScrolled, isHidden };
}

/**
 * Hook for bottom navigation scroll transparency
 * Reuses scroll detection pattern from useHeaderScroll
 */
interface UseBottomNavScrollOptions {
  transparencyThreshold?: number;
  scrollDelay?: number;
}

interface UseBottomNavScrollReturn {
  shouldBeTransparent: boolean;
  shouldBeSmall: boolean;
}

export function useBottomNavScroll(
  options: UseBottomNavScrollOptions = {}
): UseBottomNavScrollReturn {
  const { transparencyThreshold = 10, scrollDelay = 200 } = options;
  const [shouldBeTransparent, setShouldBeTransparent] = useState(false);
  const [shouldBeSmall, setShouldBeSmall] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const lastScrollY = useRef(0);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY.current;
      const scrollThreshold = 50; // Start shrinking/transparency after 50px

      // More transparent and smaller when actively scrolling down
      if (isScrollingDown && currentScrollY > transparencyThreshold) {
        isScrollingRef.current = true;
        setShouldBeTransparent(true);
        setShouldBeSmall(currentScrollY > scrollThreshold);

        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
          isScrollingRef.current = false;
          // Keep slightly transparent and small even when stopped (like X)
          const keepTransparent = currentScrollY > scrollThreshold;
          setShouldBeTransparent(keepTransparent);
          setShouldBeSmall(keepTransparent);
        }, scrollDelay);
      } else if (!isScrollingDown && currentScrollY < scrollThreshold) {
        // Less transparent and full size when near top
        setShouldBeTransparent(false);
        setShouldBeSmall(false);
      } else if (currentScrollY > scrollThreshold) {
        // Maintain state when scrolling up but still scrolled
        setShouldBeTransparent(true);
        setShouldBeSmall(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [transparencyThreshold, scrollDelay]);

  return { shouldBeTransparent, shouldBeSmall };
}
