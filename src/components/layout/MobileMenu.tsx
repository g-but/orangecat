/**
 * Mobile Menu Component
 *
 * Modular mobile menu with portal rendering.
 * Follows SOC principle - extracted from Header component.
 *
 * Created: 2026-01-16
 */

'use client';

import { createPortal } from 'react-dom';
import { HeaderNavigation } from './HeaderNavigation';
import { getMobileMenuBackdropClasses, getMobileMenuPanelClasses } from '@/lib/ui/header-utils';
import type { NavigationItem } from '@/config/navigation';

interface MobileMenuProps {
  /** Whether menu is open */
  isOpen: boolean;
  /** Whether menu is in closing animation */
  isClosing: boolean;
  /** Ref for menu element */
  menuRef: React.RefObject<HTMLDivElement>;
  /** Navigation items */
  navigation: NavigationItem[];
  /** Footer navigation */
  footer: typeof import('@/config/navigation').footerNavigation;
  /** Callback when menu closes */
  onClose: () => void;
}

/**
 * Mobile menu with portal rendering
 *
 * Renders navigation menu in a portal for proper z-index layering
 */
export function MobileMenu({
  isOpen,
  isClosing,
  menuRef,
  navigation,
  footer,
  onClose,
}: MobileMenuProps) {
  // Don't render if menu has never been opened
  if (!isOpen && !isClosing) {
    return null;
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div className={getMobileMenuBackdropClasses(isOpen)} />

      {/* Mobile Menu Panel */}
      <div ref={menuRef} className={getMobileMenuPanelClasses(isOpen)}>
        {/* Mobile Navigation */}
        <HeaderNavigation navigation={navigation} footer={footer} onClose={onClose} />
      </div>
    </>,
    document.body
  );
}
