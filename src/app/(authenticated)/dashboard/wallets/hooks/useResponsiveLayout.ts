/**
 * useResponsiveLayout Hook
 *
 * Custom hook for detecting desktop vs mobile layout.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

import { useState, useEffect } from 'react';

export function useResponsiveLayout() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return { isDesktop };
}


