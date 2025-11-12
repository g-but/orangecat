/**
 * Header Navigation Component
 *
 * Reusable navigation component for headers
 * Eliminates code duplication between UnifiedHeader and AuthenticatedHeader
 *
 * Created: 2025-01-27
 * Last Modified: 2025-01-27
 * Last Modified Summary: Created reusable navigation component
 */

'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface NavigationItem {
  name: string;
  href: string;
}

interface HeaderNavigationProps {
  items: NavigationItem[];
  isActive: (href: string) => boolean;
  className?: string;
}

/**
 * Header Navigation Component
 *
 * Renders navigation links with consistent styling and active state indicators
 */
export function HeaderNavigation({ items, isActive, className }: HeaderNavigationProps) {
  return (
    <nav className={cn('flex items-center space-x-1', className)}>
      {items.map(item => (
        <HeaderNavLink
          key={item.href}
          href={item.href}
          label={item.name}
          isActive={isActive(item.href)}
        />
      ))}
    </nav>
  );
}

interface HeaderNavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
}

/**
 * Header Navigation Link Component
 *
 * Individual navigation link with active state styling
 */
function HeaderNavLink({ href, label, isActive }: HeaderNavLinkProps) {
  const linkClasses = cn(
    'px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 relative',
    isActive
      ? 'text-orange-600 bg-orange-50 shadow-sm'
      : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
  );

  return (
    <Link href={href} className={linkClasses}>
      {label}
      {isActive && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-orange-500 rounded-full" />}
    </Link>
  );
}
