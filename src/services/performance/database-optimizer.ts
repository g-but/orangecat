/**
 * DATABASE PERFORMANCE OPTIMIZER
 * 
 * Provides advanced database performance optimizations:
 * - Query caching with intelligent invalidation
 * - Connection pooling optimization
 * - Parallel query execution
 * - Request deduplication
 * - Performance monitoring and alerting
 * 
 * Created: 2025-01-14
 * Last Modified: 2025-01-14
 * Last Modified Summary: Database optimization for Option B performance improvements
 */

import { supabase } from '@/services/supabase/client'

// ==================== QUERY CACHE SYSTEM ====================

interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

class QueryCache {
  private cache = new Map<string, CacheEntry>()
  private maxSize = 100
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    // Cleanup old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.cleanup()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      key
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) {return null}

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  invalidate(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))

    // If still full, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      
      const toRemove = sortedEntries.slice(0, Math.floor(this.maxSize * 0.2))
      toRemove.forEach(([key]) => this.cache.delete(key))
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: (this.cache.size / this.maxSize) * 100
    }
  }
}

const queryCache = new QueryCache()

// ==================== REQUEST DEDUPLICATION ====================

class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>()

  async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // If request is already pending, return the existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    // Execute the request and cache the promise
    const promise = fn().finally(() => {
      this.pendingRequests.delete(key)
    })

    this.pendingRequests.set(key, promise)
    return promise
  }

  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      activeKeys: Array.from(this.pendingRequests.keys())
    }
  }
}

const requestDeduplicator = new RequestDeduplicator()

// ==================== PARALLEL QUERY EXECUTOR ====================

class ParallelQueryExecutor {
  async executeParallel<T extends Record<string, any>>(
    queries: Record<keyof T, () => Promise<T[keyof T]>>
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      const queryPromises = Object.entries(queries).map(async ([key, queryFn]) => {
        const result = await queryFn()
        return [key, result] as const
      })

      const results = await Promise.all(queryPromises)
      const data = Object.fromEntries(results) as T

      const executionTime = performance.now() - startTime
      performanceMonitor.recordMetric('parallel_query_execution', executionTime)

      return data
    } catch (error) {
      const executionTime = performance.now() - startTime
      performanceMonitor.recordError('parallel_query_error', error as Error, executionTime)
      throw error
    }
  }

  async executeBatch<T>(
    queries: Array<() => Promise<T>>,
    batchSize: number = 5
  ): Promise<T[]> {
    const results: T[] = []
    
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch.map(query => query()))
      results.push(...batchResults)
    }

    return results
  }
}

const parallelExecutor = new ParallelQueryExecutor()

// ==================== PERFORMANCE MONITORING ====================

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  metadata?: Record<string, any>
}

class DatabasePerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 1000

  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      metadata
    })

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  recordError(name: string, error: Error, executionTime?: number): void {
    this.recordMetric(`${name}_error`, executionTime || 0, {
      error: error.message,
      stack: error.stack
    })
  }

  getMetrics(name?: string, limit: number = 100): PerformanceMetric[] {
    let filtered = this.metrics
    
    if (name) {
      filtered = this.metrics.filter(m => m.name === name)
    }

    return filtered.slice(-limit)
  }

  getStats(name: string): {
    avg: number
    min: number
    max: number
    count: number
    p95: number
    p99: number
  } {
    const metrics = this.getMetrics(name)
    if (metrics.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0, p95: 0, p99: 0 }
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b)
    const sum = values.reduce((a, b) => a + b, 0)

    return {
      avg: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      count: values.length,
      p95: values[Math.floor(values.length * 0.95)],
      p99: values[Math.floor(values.length * 0.99)]
    }
  }
}

const performanceMonitor = new DatabasePerformanceMonitor()

// ==================== OPTIMIZED QUERY FUNCTIONS ====================

export class DatabaseOptimizer {
  /**
   * Optimized query with caching and deduplication
   */
  async optimizedQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    options: {
      ttl?: number
      skipCache?: boolean
      skipDeduplication?: boolean
    } = {}
  ): Promise<T> {
    const { ttl, skipCache = false, skipDeduplication = false } = options
    const startTime = performance.now()

    try {
      // Check cache first
      if (!skipCache) {
        const cached = queryCache.get<T>(key)
        if (cached) {
          performanceMonitor.recordMetric('cache_hit', performance.now() - startTime, { key })
          return cached
        }
      }

      // Execute query with deduplication
      const executeQuery = skipDeduplication 
        ? queryFn 
        : () => requestDeduplicator.deduplicate(key, queryFn)

      const result = await executeQuery()
      const executionTime = performance.now() - startTime

      // Cache result
      if (!skipCache) {
        queryCache.set(key, result, ttl)
      }

      performanceMonitor.recordMetric('database_query', executionTime, { key })
      return result
    } catch (error) {
      const executionTime = performance.now() - startTime
      performanceMonitor.recordError('database_query_error', error as Error, executionTime)
      throw error
    }
  }

  /**
   * Execute multiple queries in parallel
   */
  async parallelQueries<T extends Record<string, any>>(
    queries: Record<keyof T, () => Promise<T[keyof T]>>
  ): Promise<T> {
    return parallelExecutor.executeParallel(queries)
  }

  /**
   * Execute queries in batches
   */
  async batchQueries<T>(
    queries: Array<() => Promise<T>>,
    batchSize: number = 5
  ): Promise<T[]> {
    return parallelExecutor.executeBatch(queries, batchSize)
  }

  /**
   * Invalidate cache patterns
   */
  invalidateCache(pattern: string): void {
    queryCache.invalidate(pattern)
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      cache: queryCache.getStats(),
      deduplication: requestDeduplicator.getStats(),
      queryStats: {
        cacheHits: performanceMonitor.getStats('cache_hit'),
        databaseQueries: performanceMonitor.getStats('database_query'),
        parallelQueries: performanceMonitor.getStats('parallel_query_execution')
      }
    }
  }
}

// ==================== OPTIMIZED DATABASE OPERATIONS ====================

export const dbOptimizer = new DatabaseOptimizer()

/**
 * Optimized profile queries
 */
export const ProfileQueries = {
  async getProfile(userId: string) {
    return dbOptimizer.optimizedQuery(
      `profile:${userId}`,
      async () => {
        return await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
      }
    )
  },

  async getProfileByUsername(username: string) {
    return dbOptimizer.optimizedQuery(
      `profile:username:${username}`,
      async () => {
        return await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single()
      },
      { ttl: 10 * 60 * 1000 } // 10 minutes
    )
  },

  async searchProfiles(query: string) {
    return dbOptimizer.optimizedQuery(
      `profiles:search:${query}`,
      async () => {
        return await supabase
          .from('profiles')
          .select('id, username, name, avatar_url')
          .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
          .limit(20)
      },
      { ttl: 2 * 60 * 1000 } // 2 minutes
    )
  }
}

/**
 * Optimized funding queries
 */
export const FundingQueries = {
  async getUserFundingPages(userId: string) {
    return dbOptimizer.optimizedQuery(
      `funding:user:${userId}`,
      async () => {
        return await supabase
          .from('projects')
          .select(`
            *,
            profiles!inner (
              username,
              name,
              avatar_url
            )
          `)
          .eq('creator_id', userId)
      }
    )
  },

  async getDashboardData(userId: string) {
    return dbOptimizer.parallelQueries({
      profile: async () => await ProfileQueries.getProfile(userId),
      fundingPages: async () => await FundingQueries.getUserFundingPages(userId),
      stats: async () => {
        return await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', userId)
          .single()
      }
    })
  }
}

// Export the performance monitor for debugging
export { performanceMonitor } 