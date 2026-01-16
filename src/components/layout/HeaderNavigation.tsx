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

// Variant A: Horizontal header links
interface HeaderNavBarProps {
  items: NavigationItem[];
  isActive: (href: string) => boolean;
  className?: string;
}

// Variant B: Mobile drawer navigation used by Header.tsx
interface MobileDrawerProps {
  navigation: NavigationItem[];
  footer: {
    product?: Array<{ name: string; href: string }>;
    company?: Array<{ name: string; href: string }>;
    legal?: Array<{ name: string; href: string }>;
    social?: Array<{ name: string; href: string; icon?: any }>;
  };
  onClose: () => void;
}

type HeaderNavigationProps = HeaderNavBarProps | MobileDrawerProps;

/**
 * Header Navigation Component
 *
 * Renders navigation links with consistent styling and active state indicators
 * Supports dropdown menus for items with children
 */
export function HeaderNavigation(props: HeaderNavigationProps) {
  // Variant B: Mobile drawer (navigation + footer + onClose)
  if ('navigation' in props) {
    const { navigation, footer, onClose } = props;
    const navItems = Array.isArray(navigation) ? navigation : [];
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 space-y-1">
          {navItems.map(item =>
            item.href ? (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded-lg text-base text-gray-700 hover:text-orange-600 hover:bg-gray-50"
                onClick={onClose}
              >
                {item.name}
              </Link>
            ) : null
          )}
        </div>

        {/* Footer sections */}
        <div className="mt-auto border-t border-gray-100">
          {(['product', 'company', 'legal'] as const).map(sectionKey => {
            const section = footer?.[sectionKey] || [];
            if (!section || section.length === 0) {
              return null;
            }
            return (
              <div key={sectionKey} className="p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  {sectionKey}
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {section.map(link => (
                    <Link
                      key={`${sectionKey}-${link.href}`}
                      href={link.href}
                      className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-orange-600 hover:bg-gray-50"
                      onClick={onClose}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Variant A: Horizontal header links (default)
  const { items = [], isActive, className } = props as HeaderNavBarProps;
  const safeItems = Array.isArray(items) ? items : [];
  const activeFn = typeof isActive === 'function' ? isActive : () => false;
  return (
    <nav className={cn('flex items-center space-x-1', className)}>
      {safeItems.map(item => {
        if (item.children && item.children.length > 0) {
          return <HeaderNavDropdown key={item.name} item={item} isActive={activeFn} />;
        }

        if (!item.href) {
          return null;
        }
        return (
          <HeaderNavLink
            key={item.href}
            href={item.href}
            label={item.name}
            isActive={activeFn(item.href)}
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
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
        {hasActiveChild && (
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-orange-500 rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          {item.children?.map((child, _index) => {
            // Skip children without href
            if (!child.href) {
              return null;
            }

            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  'block px-4 py-2.5 text-sm transition-colors',
                  isActive(child.href)
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
            );
          })}
        </div>
      )}
    </div>
  );
}
