/**
 * Dynamic Component Loader
 * 
 * Provides lazy loading for heavy components to reduce initial bundle size.
 * Critical for performance optimization and code splitting.
 * 
 * @author Claude Code Assistant
 * @created 2025-06-30
 */

import { lazy, Suspense, ComponentType } from 'react'
import Loading from '@/components/Loading'

/**
 * Create a dynamically imported component with loading fallback
 * @param importFunc - Function that returns a dynamic import promise
 * @param fallback - Optional custom loading component
 * @returns Component wrapped with Suspense and lazy loading
 */
export function createDynamicComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc)
  
  return function DynamicComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <Loading />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

/**
 * Pre-defined dynamic components for common heavy modules
 */

// Analytics Dashboard (heavy charts and data visualization)
export const DynamicAnalyticsDashboard = createDynamicComponent(
  () => import('@/components/dashboard/AnalyticsDashboard'),
  <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
)

// Campaign Management (complex forms and state)
export const DynamicCampaignManagement = createDynamicComponent(
  () => import('@/components/dashboard/CampaignManagement'),
  <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />
)

// QR Code Generator (external library heavy)
export const DynamicQRGenerator = createDynamicComponent(
  () => import('@/components/ui/QRGenerator'),
  <div className="animate-pulse bg-gray-200 w-48 h-48 rounded-lg mx-auto" />
)

// Rich Text Editor (if you have one)
export const DynamicRichTextEditor = createDynamicComponent(
  () => import('@/components/ui/RichTextEditor'),
  <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />
)

// Advanced Charts (chart libraries are heavy)
export const DynamicAdvancedCharts = createDynamicComponent(
  () => import('@/components/charts/AdvancedCharts'),
  <div className="animate-pulse bg-gray-200 h-80 rounded-lg" />
)

// Image Upload with Preview (file handling libraries)
export const DynamicImageUpload = createDynamicComponent(
  () => import('@/components/ui/ImageUpload'),
  <div className="animate-pulse bg-gray-200 h-40 rounded-lg" />
)

// Date Picker (date libraries can be heavy)
export const DynamicDatePicker = createDynamicComponent(
  () => import('@/components/ui/DatePicker'),
  <div className="animate-pulse bg-gray-200 h-10 w-48 rounded" />
)

// Advanced Search (complex filtering logic)
export const DynamicAdvancedSearch = createDynamicComponent(
  () => import('@/components/search/AdvancedSearch'),
  <div className="animate-pulse bg-gray-200 h-16 rounded-lg" />
)

/**
 * Utility for preloading components on user interaction
 */
export const preloadComponent = (importFunc: () => Promise<any>) => {
  // Only preload in browser environment
  if (typeof window !== 'undefined') {
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        importFunc().catch(() => {
          // Silently fail - preloading is an optimization
        })
      })
    } else {
      setTimeout(() => {
        importFunc().catch(() => {
          // Silently fail - preloading is an optimization
        })
      }, 100)
    }
  }
}

/**
 * Hook for intersection-based component loading
 */
export function useLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  threshold = 0.1
) {
  const LazyComponent = lazy(importFunc)
  
  return function IntersectionLazyComponent(props: React.ComponentProps<T> & { 
    fallback?: React.ReactNode,
    rootMargin?: string 
  }) {
    const { fallback, rootMargin = '50px', ...componentProps } = props
    
    return (
      <Suspense fallback={fallback || <Loading />}>
        <LazyComponent {...(componentProps as React.ComponentProps<T>)} />
      </Suspense>
    )
  }
}