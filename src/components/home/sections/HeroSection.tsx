'use client';

import HeroSectionStatic from './HeroSectionStatic';

/**
 * Hero Section Wrapper - Progressive Enhancement Strategy
 *
 * Performance Optimization:
 * - Shows static content immediately (no framer-motion blocking)
 * - Animations are CSS-based for instant rendering
 * - Framer Motion removed to save ~50KB bundle size
 *
 * This provides instant First Contentful Paint (FCP) without sacrificing UX
 */
export default function HeroSection() {
  return <HeroSectionStatic />;
}
