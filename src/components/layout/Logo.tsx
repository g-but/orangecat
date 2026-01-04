/**
 * OrangeCat Logo Component
 *
 * Modular logo component using the CatIcon.
 * Single source of truth for logo display across the app.
 *
 * Created: 2025-12-27
 * Last Modified: 2025-12-27
 * Last Modified Summary: Refactored to use modular CatIcon component
 */

'use client';

import Link from 'next/link';
import { CatIcon } from './CatIcon';

export interface LogoProps {
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the text label (default: true) */
  showText?: boolean;
  /** Size of the icon */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const iconSizeClasses = {
  sm: 'w-7 h-7',
  md: 'w-8 h-8 sm:w-9 sm:h-9',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export default function Logo({ className = '', showText = true, size = 'md' }: LogoProps) {
  return (
    <Link
      href="/"
      className={`flex items-center space-x-1.5 sm:space-x-2 group min-h-[44px] py-2 ${className}`.trim()}
      aria-label="OrangeCat - Bitcoin crowdfunding platform"
    >
      <span className={`inline-block align-middle flex-shrink-0 ${iconSizeClasses[size]}`}>
        <CatIcon />
      </span>
      {showText && (
        <span className="text-lg sm:text-xl md:text-2xl font-bold text-tiffany-600 group-hover:text-orange-500 transition-colors whitespace-nowrap">
          OrangeCat
        </span>
      )}
    </Link>
  );
}
