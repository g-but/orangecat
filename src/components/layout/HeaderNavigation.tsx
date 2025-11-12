/**
 * Header Navigation Component
 *
 * Reusable navigation component for headers with dropdown support
 * Eliminates code duplication between UnifiedHeader and AuthenticatedHeader
 *
 * Created: 2025-01-27
 * Last Modified: 2025-01-12
 * Last Modified Summary: Added dropdown menu support
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavigationItem {
  name: string;
  href?: string;
  children?: NavigationItem[];
  description?: string;
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
 * Supports dropdown menus for items with children
 */
export function HeaderNavigation({ items, isActive, className }: HeaderNavigationProps) {
  return (
    <nav className={cn('flex items-center space-x-1', className)}>
      {items.map((item, index) => {
        if (item.children && item.children.length > 0) {
          return (
            <HeaderNavDropdown
              key={item.name}
              item={item}
              isActive={isActive}
            />
          );
        }

        return (
          <HeaderNavLink
            key={item.href || `nav-item-${index}`}
            href={item.href || '#'}
            label={item.name}
            isActive={item.href ? isActive(item.href) : false}
          />
        );
      })}
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

interface HeaderNavDropdownProps {
  item: NavigationItem;
  isActive: (href: string) => boolean;
}

/**
 * Header Navigation Dropdown Component
 *
 * Dropdown menu for navigation items with children
 */
function HeaderNavDropdown({ item, isActive }: HeaderNavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Check if any child is active
  const hasActiveChild = item.children?.some(child => child.href && isActive(child.href)) || false;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 relative flex items-center gap-1',
          hasActiveChild
            ? 'text-orange-600 bg-orange-50 shadow-sm'
            : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
        )}
      >
        {item.name}
        <ChevronDown
          className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')}
        />
        {hasActiveChild && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-orange-500 rounded-full" />}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          {item.children?.map((child, index) => (
            <Link
              key={child.href || `dropdown-item-${index}`}
              href={child.href || '#'}
              className={cn(
                'block px-4 py-2.5 text-sm transition-colors',
                child.href && isActive(child.href)
                  ? 'text-orange-600 bg-orange-50 font-medium'
                  : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
              )}
              onClick={() => setIsOpen(false)}
            >
              <div className="font-medium">{child.name}</div>
              {child.description && (
                <div className="text-xs text-gray-500 mt-0.5">{child.description}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
