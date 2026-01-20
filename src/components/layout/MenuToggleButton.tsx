/**
 * Menu Toggle Button Component
 *
 * Reusable menu toggle button for sidebar and mobile menu.
 * Follows DRY principle - extracted from Header component.
 *
 * Created: 2026-01-16
 */

import { Menu } from 'lucide-react';
import { forwardRef } from 'react';
import { TOUCH_TARGETS, HEADER_BUTTON_BASE } from '@/constants/header';
import { cn } from '@/lib/utils';

interface MenuToggleButtonProps {
  /** Click handler */
  onClick: () => void;
  /** Aria label for accessibility */
  ariaLabel: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Menu toggle button
 *
 * Reusable component for sidebar/menu toggle with proper touch targets
 */
export const MenuToggleButton = forwardRef<HTMLButtonElement, MenuToggleButtonProps>(
  ({ onClick, ariaLabel, className }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cn('lg:hidden', TOUCH_TARGETS.RESPONSIVE, HEADER_BUTTON_BASE.BASE, className)}
        aria-label={ariaLabel}
      >
        <Menu className="w-6 h-6 sm:w-5 sm:h-5" />
      </button>
    );
  }
);

MenuToggleButton.displayName = 'MenuToggleButton';
