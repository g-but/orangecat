/**
 * Shared hook for active route detection
 *
 * Determines if a route is currently active based on pathname matching
 *
 * Created: 2025-01-07
 * Last Modified: 2025-01-07
 * Last Modified Summary: Created shared hook for active route detection
 */

import { usePathname } from 'next/navigation';

export function useActiveRoute() {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return { isActive, pathname };
}
