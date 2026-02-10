/**
 * Design System Tokens — SSOT
 *
 * Standardized typography, spacing, colors, and sizing tokens.
 * Import these constants instead of hardcoding Tailwind classes.
 *
 * Usage:
 *   import { HEADING, TEXT_COLOR, SPACING, ICON_SIZE } from '@/config/design-system';
 *   <h1 className={HEADING.h1}>Page Title</h1>
 *   <p className={TEXT_COLOR.secondary}>Description</p>
 */

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

/** Heading styles — use for all h1–h4 elements across the app */
export const HEADING = {
  /** Page titles: text-3xl sm:text-4xl font-bold */
  h1: 'text-3xl sm:text-4xl font-bold text-gray-900',
  /** Section titles: text-2xl font-semibold */
  h2: 'text-2xl font-semibold text-gray-900',
  /** Subsection titles: text-lg font-semibold */
  h3: 'text-lg font-semibold text-gray-900',
  /** Small headings: text-base font-semibold */
  h4: 'text-base font-semibold text-gray-900',
} as const;

/** Body text styles */
export const BODY = {
  large: 'text-lg text-gray-900',
  base: 'text-base text-gray-900',
  small: 'text-sm text-gray-600',
  xsmall: 'text-xs text-gray-400',
} as const;

// ---------------------------------------------------------------------------
// Text Colors — 3-level hierarchy
// ---------------------------------------------------------------------------

/** Text color hierarchy: primary → secondary → tertiary */
export const TEXT_COLOR = {
  /** Main content text */
  primary: 'text-gray-900',
  /** Supporting text, descriptions */
  secondary: 'text-gray-600',
  /** Metadata, timestamps, hints, disabled */
  tertiary: 'text-gray-400',
} as const;

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

/** Standard spacing tokens for layout consistency */
export const SPACING = {
  /** Card internal padding */
  card: 'p-6',
  /** Space between form fields */
  form: 'space-y-4',
  /** Space between major page sections */
  section: 'space-y-8',
  /** Space between list items */
  list: 'space-y-3',
  /** Grid gap defaults */
  grid: {
    tight: 'gap-2',
    normal: 'gap-4',
    loose: 'gap-6',
  },
  /** Page-level container padding */
  page: 'px-4 sm:px-6 lg:px-8 py-8',
} as const;

// ---------------------------------------------------------------------------
// Icon Sizes
// ---------------------------------------------------------------------------

/** Standardized icon sizing by context */
export const ICON_SIZE = {
  /** Inline with text (badges, labels) */
  xs: 'h-3 w-3',
  /** Inside buttons, form elements */
  sm: 'h-4 w-4',
  /** Standalone in lists, nav items */
  md: 'h-5 w-5',
  /** Section headers, card headers */
  lg: 'h-6 w-6',
  /** Feature icons, empty states */
  xl: 'h-8 w-8',
} as const;

// ---------------------------------------------------------------------------
// Touch Targets
// ---------------------------------------------------------------------------

/** Minimum touch target size per Apple HIG / WCAG 2.5.5 */
export const TOUCH_TARGET = {
  /** Minimum interactive element height */
  min: 'min-h-[44px]',
  /** Minimum interactive element width */
  minW: 'min-w-[44px]',
  /** Combined min height + width for icon buttons */
  icon: 'min-h-[44px] min-w-[44px]',
} as const;
