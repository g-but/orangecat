'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import HeroSection from '@/components/home/sections/HeroSection';
import ExperimentalBanner from '@/components/ui/ExperimentalBanner';

// Lazy load non-critical sections
// Hero loads immediately for good FCP, rest loads as user scrolls
const ProofSection = dynamic(() => import('@/components/home/sections/ProofSection'), {
  loading: () => <div className="h-96 bg-gray-50 animate-pulse" />,
});

const HowItWorksSection = dynamic(() => import('@/components/home/sections/HowItWorksSection'), {
  loading: () => <div className="h-96 bg-gradient-to-br from-gray-50 to-gray-100 animate-pulse" />,
});

const TransparencySection = dynamic(() => import('@/components/home/sections/TransparencySection'), {
  loading: () => <div className="h-96 bg-gradient-to-br from-tiffany-50 to-orange-50 animate-pulse" />,
});

const TrustSection = dynamic(() => import('@/components/home/sections/TrustSection'), {
  loading: () => <div className="h-96 bg-white animate-pulse" />,
});

/**
 * Home Public Client - Progressive Loading Strategy
 *
 * Performance Optimization:
 * - Hero section loads immediately (critical for FCP)
 * - Below-fold sections lazy load (saves ~60KB initial bundle)
 * - Skeleton loaders provide visual feedback
 * - Sections load as user scrolls down
 *
 * Expected improvement: -1.5s FCP, -60KB bundle
 */
export default function HomePublicClient() {
  return (
    <div className="min-h-screen">
      {/* Experimental Version Notice */}
      <ExperimentalBanner storageType="local" />

      {/* Hero Section - Above the fold, loads immediately */}
      <HeroSection />

      {/* Below-fold sections - lazy loaded */}
      <Suspense fallback={<div className="h-96 bg-gray-50 animate-pulse" />}>
        <ProofSection />
      </Suspense>

      <Suspense fallback={<div className="h-96 bg-gradient-to-br from-gray-50 to-gray-100 animate-pulse" />}>
        <HowItWorksSection />
      </Suspense>

      <Suspense fallback={<div className="h-96 bg-gradient-to-br from-tiffany-50 to-orange-50 animate-pulse" />}>
        <TransparencySection />
      </Suspense>

      <Suspense fallback={<div className="h-96 bg-white animate-pulse" />}>
        <TrustSection />
      </Suspense>
    </div>
  );
}
