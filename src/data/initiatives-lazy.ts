/**
 * LAZY INITIATIVES DATA LOADER
 * 
 * This module provides lazy loading for the massive initiatives data (1018 lines)
 * to improve bundle size and initial page load performance.
 * 
 * Created: 2025-01-14
 * Last Modified: 2025-01-14
 * Last Modified Summary: Lazy loading system for Option B bundle optimization
 */

import { Initiative } from './initiatives'
import { LucideIcon } from 'lucide-react'
import { logger } from '@/utils/logger'

// Type-only imports don't increase bundle size
export type { Initiative, LucideIcon }

// ==================== LAZY LOADING CACHE ====================

let initiativesCache: Record<string, Initiative> | null = null
let loadingPromise: Promise<Record<string, Initiative>> | null = null

/**
 * Lazy loader for all initiatives data
 */
export async function loadInitiatives(): Promise<Record<string, Initiative>> {
  // Return cached data if available
  if (initiativesCache) {
    return initiativesCache
  }

  // Return existing promise if already loading
  if (loadingPromise) {
    return loadingPromise
  }

  // Create new loading promise
  loadingPromise = import('./initiatives').then(module => {
    initiativesCache = module.INITIATIVES
    loadingPromise = null // Clear loading state
    return module.INITIATIVES
  })

  return loadingPromise
}

/**
 * Lazy loader for specific initiative
 */
export async function loadInitiative(id: string): Promise<Initiative | undefined> {
  const initiatives = await loadInitiatives()
  return initiatives[id]
}

/**
 * Lazy loader for all initiatives as array
 */
export async function loadAllInitiatives(): Promise<Initiative[]> {
  const initiatives = await loadInitiatives()
  return Object.values(initiatives)
}

/**
 * Lazy loader for available initiatives
 */
export async function loadAvailableInitiatives(): Promise<Initiative[]> {
  const initiatives = await loadAllInitiatives()
  return initiatives.filter(initiative => initiative.status === 'available')
}

/**
 * Lazy loader for coming soon initiatives
 */
export async function loadComingSoonInitiatives(): Promise<Initiative[]> {
  const initiatives = await loadAllInitiatives()
  return initiatives.filter(initiative => initiative.status === 'coming-soon')
}

/**
 * Lazy icon component loader with caching
 */
let iconMapCache: Record<string, LucideIcon> | null = null

export async function loadIconComponent(iconName: string): Promise<LucideIcon> {
  if (!iconMapCache) {
    const module = await import('./initiatives')
    iconMapCache = module.ICON_MAP
  }
  
  const icon = iconMapCache[iconName]
  if (!icon) {
    // Fallback to Building icon if not found
    const { Building } = await import('lucide-react')
    return Building
  }
  
  return icon
}

// ==================== PRELOADING UTILITIES ====================

/**
 * Preload initiatives data in the background
 */
export function preloadInitiatives(): void {
  if (typeof window !== 'undefined' && !initiativesCache && !loadingPromise) {
    // Use requestIdleCallback for better performance
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        loadInitiatives().catch(error => logger.error('Failed to preload initiatives', { error: error?.message }, 'InitiativesLoader'))
      })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        loadInitiatives().catch(error => logger.error('Failed to preload initiatives', { error: error?.message }, 'InitiativesLoader'))
      }, 100)
    }
  }
}

/**
 * Clear cache (useful for development/testing)
 */
export function clearInitiativesCache(): void {
  initiativesCache = null
  loadingPromise = null
  iconMapCache = null
}

// ==================== NOTE ====================
// React hooks are available in separate client-side file: 
// src/hooks/useInitiatives.ts 