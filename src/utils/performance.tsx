/**
 * PERFORMANCE OPTIMIZATION UTILITIES
 * 
 * This module provides utilities for improving application performance:
 * - Lazy loading components
 * - Code splitting
 * - Caching strategies
 * - Bundle optimization
 * 
 * Created: 2025-06-08
 * Last Modified: 2025-06-08
 * Last Modified Summary: Performance optimization utilities for Option B implementation
 */

import React, { lazy, ComponentType, Suspense, ReactNode , useCallback, useEffect, useRef, useState } from 'react'
import { logger } from './logger'

// ==================== LAZY LOADING UTILITIES ====================

/**
 * Enhanced lazy loading with error boundary and loading states
 */
export function createLazyComponent<T = any>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: ComponentType
) {
  const LazyComponent = lazy(importFn)
  
  return function LazyWrapper(props: T) {
    return (
      <Suspense fallback={fallback ? React.createElement(fallback) : <div>Loading...</div>}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    )
  }
}

/**
 * Preload component for better UX
 */
export function preloadComponent(importFn: () => Promise<{ default: ComponentType<any> }>) {
  // Preload on idle or interaction
  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => importFn())
    } else {
      setTimeout(() => importFn(), 100)
    }
  }
}

// ==================== CACHING UTILITIES ====================

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of entries
  onEvict?: (key: string, value: any) => void
}

/**
 * Enhanced caching utility with TTL and size limits
 */
export class PerformanceCache<T = any> {
  private cache = new Map<string, { value: T; timestamp: number; hitCount: number }>()
  private readonly ttl: number
  private readonly maxSize: number
  private readonly onEvict?: (key: string, value: T) => void

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl || 5 * 60 * 1000 // 5 minutes default
    this.maxSize = options.maxSize || 100
    this.onEvict = options.onEvict
  }

  set(key: string, value: T): void {
    // Clean expired entries before adding new ones
    this.cleanup()
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hitCount: 0
    })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {return null}
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    // Update hit count for LRU
    entry.hitCount++
    return entry.value
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (entry && this.onEvict) {
      this.onEvict(key, entry.value)
    }
    return this.cache.delete(key)
  }

  clear(): void {
    if (this.onEvict) {
      const entries = Array.from(this.cache.entries())
      for (const [key, entry] of entries) {
        this.onEvict(key, entry.value)
      }
    }
    this.cache.clear()
  }

  size(): number {
    this.cleanup()
    return this.cache.size
  }

  private cleanup(): void {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > this.ttl) {
        if (this.onEvict) {
          this.onEvict(key, entry.value)
        }
        this.cache.delete(key)
      }
    }
  }

  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTimestamp = Date.now()
    let lowestHitCount = Infinity

    const entries = Array.from(this.cache.entries())
    for (const [key, entry] of entries) {
      if (entry.timestamp < oldestTimestamp || 
          (entry.timestamp === oldestTimestamp && entry.hitCount < lowestHitCount)) {
        oldestKey = key
        oldestTimestamp = entry.timestamp
        lowestHitCount = entry.hitCount
      }
    }

    if (oldestKey) {
      this.delete(oldestKey)
    }
  }

  getStats() {
    const entries = Array.from(this.cache.entries())
    const totalHits = entries.reduce((sum, [, entry]) => sum + entry.hitCount, 0)
    const totalAge = entries.reduce((sum, [, entry]) => sum + entry.timestamp, 0)
    const averageAge = totalAge / entries.length

    return {
      size: entries.length,
      totalHits,
      averageAge
    }
  }
}

// ==================== REQUEST DEDUPLICATION ====================

/**
 * Deduplicate concurrent requests to the same resource
 */
export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>()

  async dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // If request is already pending, return the same promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    // Create new request
    const request = requestFn().finally(() => {
      // Clean up when request completes
      this.pendingRequests.delete(key)
    })

    this.pendingRequests.set(key, request)
    return request
  }

  clear(): void {
    this.pendingRequests.clear()
  }
}

// ==================== PERFORMANCE MONITORING ====================

/**
 * Performance metrics collection
 */
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>()

  mark(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)
    
    // Keep only last 100 measurements
    const values = this.metrics.get(name)!
    if (values.length > 100) {
      values.shift()
    }
  }

  measure<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    this.mark(name, performance.now() - start)
    return result
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    this.mark(name, performance.now() - start)
    return result
  }

  getStats(name: string) {
    const values = this.metrics.get(name) || []
    if (values.length === 0) {return null}

    const sorted = [...values].sort((a, b) => a - b)
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    }
  }

  getAllStats() {
    const stats: Record<string, any> = {}
    const keys = Array.from(this.metrics.keys())
    for (const name of keys) {
      stats[name] = this.getStats(name)
    }
    return stats
  }
}

// ==================== DEBOUNCING & THROTTLING ====================

/**
 * Enhanced debounce with immediate execution option
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): T {
  let timeout: NodeJS.Timeout | null = null
  
  return ((...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      if (!immediate) {func(...args)}
    }
    
    const callNow = immediate && !timeout
    
    if (timeout) {clearTimeout(timeout)}
    timeout = setTimeout(later, wait)
    
    if (callNow) {func(...args)}
  }) as T
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let lastTime = 0
  
  return ((...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastTime >= wait) {
      lastTime = now
      return func(...args)
    }
  }) as T
}

// ==================== BUNDLE OPTIMIZATION UTILITIES ====================

/**
 * Dynamic imports with error handling
 */
export async function importWithFallback<T>(
  importFn: () => Promise<T>,
  fallback: T,
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn()
    } catch (error) {
              logger.warn(`Import failed (attempt ${i + 1}/${retries})`, { error })
      if (i === retries - 1) {
        return fallback
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  return fallback
}

/**
 * Prefetch resources on interaction
 */
export function prefetchOnInteraction(urls: string[]) {
  if (typeof window === 'undefined') {return}

  const prefetch = () => {
    urls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = url
      document.head.appendChild(link)
    })
  }

  // Prefetch on first user interaction
  const events = ['mousedown', 'touchstart', 'keydown']
  const handler = () => {
    prefetch()
    events.forEach(event => {
      document.removeEventListener(event, handler, true)
    })
  }

  events.forEach(event => {
    document.addEventListener(event, handler, true)
  })
}

// ==================== MEMORY OPTIMIZATION ====================

/**
 * Weak reference cache for preventing memory leaks
 */
export class WeakCache<K extends object, V> {
  private cache = new WeakMap<K, V>()

  set(key: K, value: V): void {
    this.cache.set(key, value)
  }

  get(key: K): V | undefined {
    return this.cache.get(key)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  delete(key: K): boolean {
    return this.cache.delete(key)
  }
}

// ==================== GLOBAL INSTANCES ====================

// Global instances for common use cases
export const globalCache = new PerformanceCache({ ttl: 5 * 60 * 1000, maxSize: 100 })
export const requestDeduplicator = new RequestDeduplicator()
export const performanceMonitor = new PerformanceMonitor()

// ==================== REACT HOOKS ====================


/**
 * Hook for debounced values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook for throttled callbacks
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now())

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args)
        lastRun.current = Date.now()
      }
    }) as T,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delay]
  )
}

/**
 * Hook for performance-aware cached values
 */
export function usePerformanceCache<T>(
  key: string,
  factory: () => T,
  deps: any[] = []
): T {
  const cached = globalCache.get(key)
  
  return useCallback(() => {
    if (cached) {return cached}
    
    const value = factory()
    globalCache.set(key, value)
    return value
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ...deps])()
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Check if device has slow network connection
 */
export function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined') {return false}
  
  const connection = (navigator as any).connection
  if (!connection) {return false}
  
  return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g'
}

/**
 * Check if device is low-end
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') {return false}
  
  const memory = (navigator as any).deviceMemory
  return memory && memory < 4 // Less than 4GB RAM
}

/**
 * Get optimal image quality based on device capabilities
 */
export function getOptimalImageQuality(): 'low' | 'medium' | 'high' {
  if (isLowEndDevice() || isSlowConnection()) {return 'low'}
  if (isSlowConnection()) {return 'medium'}
  return 'high'
}

/**
 * Create optimized event handler that prevents excessive re-renders
 */
export function createOptimizedEventHandler<T extends (...args: any[]) => void>(
  handler: T,
  delay = 16 // ~60fps
): T {
  let rafId: number | null = null
  
  return ((...args: Parameters<T>) => {
    if (rafId) {cancelAnimationFrame(rafId)}
    
    rafId = requestAnimationFrame(() => {
      handler(...args)
      rafId = null
    })
  }) as T
} 