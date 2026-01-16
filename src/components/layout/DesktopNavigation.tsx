/**
 * Desktop Navigation Component
 *
 * Modular desktop navigation links for header.
 * Follows SOC principle - separate from Header component.
 *
 * Created: 2026-01-16
 */

'use client';

import Link from 'next/link';
import { useActiveRoute } from '@/hooks/useActiveRoute';
import type { NavigationItem } from '@/config/navigation';
import { cn } from '@/lib/utils';

interface DesktopNavigationProps {
  /** Navigation items to display */
  items: NavigationItem[];
}

/**
 * Desktop navigation links
 *
 * Displays navigation items with active state highlighting
 */
export function DesktopNavigation({ items }: DesktopNavigationProps) {
  const { isActive } = useActiveRoute();

  return (
    <div className="hidden lg:flex items-center gap-1 xl:gap-2 ml-2">
      {items.map(item => (
        <Link
          key={item.name}
          href={item.href!}
          className={cn(
            'px-3 py-2 text-sm font-medium rounded-xl transition-colors whitespace-nowrap',
            isActive(item.href!)
              ? 'text-orange-600 bg-orange-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
}
