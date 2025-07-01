/**
 * DATA OPTIMIZATION UTILITIES
 * 
 * Optimizes loading and handling of large data files for better performance:
 * - Lazy loading of large datasets
 * - Memory-efficient data structures
 * - Pagination and virtualization support
 * - Caching strategies for static data
 * 
 * Created: 2025-06-08
 * Last Modified: 2025-06-08
 * Last Modified Summary: Data optimization for Option B performance improvements
 */

// ==================== LAZY DATA LOADING ====================

/**
 * Lazy loader for large data files with chunking support
 */
export class LazyDataLoader<T = any> {
  private cache = new Map<string, T>()
  private loadingPromises = new Map<string, Promise<T>>()
  
  constructor(
    private chunkSize: number = 50,
    private maxCacheSize: number = 10
  ) {}

  /**
   * Load data chunk lazily with caching
   */
  async loadData<T>(loader: () => Promise<T[]>, cacheKey: string): Promise<T[]> {
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as T[]
    }

    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey) as Promise<T[]>
    }

    const loadingPromise = loader()
    this.loadingPromises.set(cacheKey, loadingPromise as Promise<any>)
    
    try {
      const data = await loadingPromise
      this.setCache(cacheKey, data as any)
      this.loadingPromises.delete(cacheKey)
      return data
    } catch (error) {
      this.loadingPromises.delete(cacheKey)
      throw error
    }
  }

  private setCache<TData extends any>(key: string, data: TData): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(key, data as any)
  }

  clearCache(): void {
    this.cache.clear()
    this.loadingPromises.clear()
  }

  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      loadingPromises: this.loadingPromises.size,
      cacheKeys: Array.from(this.cache.keys())
    }
  }
}

// ==================== INITIATIVES DATA OPTIMIZATION ====================

/**
 * Optimized initiatives data loader
 */
export class InitiativesDataLoader {
  private static instance: InitiativesDataLoader
  private loader = new LazyDataLoader(25, 5) // 25 items per chunk, 5 chunks cached
  private searchIndex: Map<string, number[]> | null = null

  static getInstance(): InitiativesDataLoader {
    if (!InitiativesDataLoader.instance) {
      InitiativesDataLoader.instance = new InitiativesDataLoader()
    }
    return InitiativesDataLoader.instance
  }

  /**
   * Load initiatives with pagination
   */
  async getInitiatives(page: number = 0, pageSize: number = 25): Promise<any[]> {
    const startIndex = page * pageSize
    const endIndex = startIndex + pageSize
    
    return this.loader.loadData(
      () => this.loadAllInitiatives(),
      `initiatives_${startIndex}_${endIndex || 'end'}`
    )
  }

  /**
   * Search initiatives with optimized indexing
   */
  async searchInitiatives(query: string, limit: number = 10): Promise<any[]> {
    // Build search index if not exists
    if (!this.searchIndex) {
      await this.buildSearchIndex()
    }
    
    const lowerQuery = query.toLowerCase()
    const matchingIndices: number[] = []
    
    // Use search index for fast lookups
    const searchEntries = Array.from(this.searchIndex!.entries())
    for (const [term, indices] of searchEntries) {
      if (term.includes(lowerQuery)) {
        matchingIndices.push(...indices)
      }
    }
    
    // Remove duplicates and limit results
    const uniqueIndices = Array.from(new Set(matchingIndices)).slice(0, limit)
    
    // Load full data for matching indices
    const allInitiatives = await this.loadAllInitiatives()
    return uniqueIndices.map(index => allInitiatives[index])
  }

  /**
   * Get initiatives by category efficiently
   */
  async getInitiativesByCategory(category: string): Promise<any[]> {
    const allInitiatives = await this.loadAllInitiatives()
    return allInitiatives.filter(initiative => 
      initiative.category?.toLowerCase() === category.toLowerCase()
    )
  }

  private async loadAllInitiatives(): Promise<any[]> {
    // Dynamic import to split bundle
    const { INITIATIVES } = await import('@/data/initiatives')
    return Object.values(INITIATIVES)
  }

  private async buildSearchIndex(): Promise<void> {
    const initiatives = await this.loadAllInitiatives()
    this.searchIndex = new Map()
    
    initiatives.forEach((initiative, index) => {
      // Index title, description, category
      const searchableFields = [
        initiative.title,
        initiative.description,
        initiative.category,
        ...(initiative.tags || [])
      ].filter(Boolean)
      
      searchableFields.forEach(field => {
        const words = field.toLowerCase().split(/\s+/)
        words.forEach((word: string) => {
          if (!this.searchIndex!.has(word)) {
            this.searchIndex!.set(word, [])
          }
          this.searchIndex!.get(word)!.push(index)
        })
      })
    })
  }
}

// ==================== DASHBOARD CONFIG OPTIMIZATION ====================

/**
 * Optimized dashboard config loader with role-based filtering
 */
export class DashboardConfigLoader {
  private static instance: DashboardConfigLoader
  private loader = new LazyDataLoader(10, 3) // 10 configs per chunk, 3 chunks cached
  private configsByRole = new Map<string, any[]>()

  static getInstance(): DashboardConfigLoader {
    if (!DashboardConfigLoader.instance) {
      DashboardConfigLoader.instance = new DashboardConfigLoader()
    }
    return DashboardConfigLoader.instance
  }

  /**
   * Get dashboard configs by user role
   */
  async getConfigsByRole(role: string = 'user'): Promise<any[]> {
    // Check cache first
    if (this.configsByRole.has(role)) {
      return this.configsByRole.get(role)!
    }

    const allConfigs = await this.loadAllConfigs()
    const roleConfigs = allConfigs.filter(config => 
      config.allowedRoles?.includes(role) || !config.allowedRoles
    )

    // Cache by role
    this.configsByRole.set(role, roleConfigs)
    return roleConfigs
  }

  /**
   * Get specific dashboard config by ID
   */
  async getConfigById(id: string): Promise<any | null> {
    const allConfigs = await this.loadAllConfigs()
    return allConfigs.find(config => config.id === id) || null
  }

  /**
   * Get dashboard configs with pagination
   */
  async getConfigs(page: number = 0, pageSize: number = 10): Promise<any[]> {
    const startIndex = page * pageSize
    const endIndex = startIndex + pageSize
    
    return this.loader.loadData(
      () => this.loadAllConfigs(),
      `dashboardConfigs_${startIndex}_${endIndex || 'end'}`
    )
  }

  private async loadAllConfigs(): Promise<any[]> {
    // Dynamic import to split bundle
    const { assetsConfig, eventsConfig, organizationsConfig, projectsConfig, peopleConfig, fundraisingConfig } = await import('@/data/dashboardConfigs')
    return [assetsConfig, eventsConfig, organizationsConfig, projectsConfig, peopleConfig, fundraisingConfig]
  }

  clearCache(): void {
    this.loader.clearCache()
    this.configsByRole.clear()
  }
}

// ==================== VIRTUAL SCROLLING UTILITIES ====================

/**
 * Virtual scrolling data provider for large lists
 */
export class VirtualScrollProvider<T> {
  private itemHeight: number
  private containerHeight: number
  private data: T[]
  private visibleRange: { start: number; end: number } = { start: 0, end: 0 }

  constructor(
    data: T[],
    itemHeight: number,
    containerHeight: number
  ) {
    this.data = data
    this.itemHeight = itemHeight
    this.containerHeight = containerHeight
    this.updateVisibleRange(0)
  }

  updateVisibleRange(scrollTop: number): { start: number; end: number; items: T[] } {
    const start = Math.floor(scrollTop / this.itemHeight)
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight)
    const end = Math.min(start + visibleCount + 5, this.data.length) // 5 items buffer
    
    this.visibleRange = { start, end }
    
    return {
      start,
      end,
      items: this.data.slice(start, end)
    }
  }

  getTotalHeight(): number {
    return this.data.length * this.itemHeight
  }

  getOffsetForIndex(index: number): number {
    return index * this.itemHeight
  }

  getVisibleRange(): { start: number; end: number } {
    return this.visibleRange
  }

  updateData(newData: T[]): void {
    this.data = newData
    this.updateVisibleRange(0) // Reset to top
  }
}

// ==================== MEMORY-EFFICIENT OPERATIONS ====================

/**
 * Process large datasets in chunks to avoid memory issues
 */
export async function processInChunks<T, R>(
  data: T[],
  processor: (chunk: T[]) => Promise<R[]> | R[],
  chunkSize: number = 100
): Promise<R[]> {
  const results: R[] = []
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize)
    const chunkResults = await processor(chunk)
    results.push(...chunkResults)
    
    // Allow garbage collection between chunks
    if (i % (chunkSize * 10) === 0) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }
  
  return results
}

/**
 * Debounced data transformer to prevent excessive processing
 */
export function createDebouncedTransformer<T, R>(
  transformer: (data: T[]) => R[],
  delay: number = 300
): (data: T[]) => Promise<R[]> {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (data: T[]): Promise<R[]> => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        const result = transformer(data)
        resolve(result)
      }, delay)
    })
  }
}

// ==================== GLOBAL INSTANCES ====================

// Singleton instances for common use
export const initiativesLoader = InitiativesDataLoader.getInstance()
export const dashboardConfigLoader = DashboardConfigLoader.getInstance()

// ==================== PERFORMANCE MONITORING ====================

/**
 * Monitor data loading performance
 */
export class DataLoadingMonitor {
  private metrics = new Map<string, { loadTime: number; size: number; timestamp: number }[]>()

  recordLoad(key: string, loadTime: number, dataSize: number): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    
    const metric = {
      loadTime,
      size: dataSize,
      timestamp: Date.now()
    }
    
    this.metrics.get(key)!.push(metric)
    
    // Keep only last 50 measurements
    const measurements = this.metrics.get(key)!
    if (measurements.length > 50) {
      measurements.shift()
    }
  }

  getStats(key: string) {
    const measurements = this.metrics.get(key) || []
    if (measurements.length === 0) return null

    const loadTimes = measurements.map(m => m.loadTime)
    const avgLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length
    const avgSize = measurements.reduce((sum, m) => sum + m.size, 0) / measurements.length

    return {
      avgLoadTime,
      avgSize,
      totalLoads: measurements.length,
      lastLoadTime: measurements[measurements.length - 1].loadTime
    }
  }

  getAllStats() {
    const stats: Record<string, any> = {}
    const keys = Array.from(this.metrics.keys())
    for (const key of keys) {
      stats[key] = this.getStats(key)
    }
    return stats
  }
}

export const dataLoadingMonitor = new DataLoadingMonitor()

// ==================== REACT INTEGRATION ====================

import { useEffect, useState, useCallback } from 'react'

/**
 * Hook for paginated data loading
 */
export function usePaginatedData<T>(
  loader: (page: number, pageSize: number) => Promise<T[]>,
  pageSize: number = 25
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const loadData = useCallback(async (pageNumber: number) => {
    setLoading(true)
    try {
      const startTime = performance.now()
      const newData = await loader(pageNumber, pageSize)
      const loadTime = performance.now() - startTime
      
      dataLoadingMonitor.recordLoad(`paginated_${pageNumber}`, loadTime, newData.length)
      
      if (pageNumber === 0) {
        setData(newData)
      } else {
        setData(prev => [...prev, ...newData])
      }
      
      setHasMore(newData.length === pageSize)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }, [loader, pageSize])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      loadData(nextPage)
    }
  }, [loading, hasMore, page, loadData])

  const reset = useCallback(() => {
    setPage(0)
    setData([])
    setHasMore(true)
    loadData(0)
  }, [loadData])

  useEffect(() => {
    loadData(0)
  }, [loadData])

  return {
    data,
    loading,
    hasMore,
    loadMore,
    reset
  }
}

/**
 * Hook for virtual scrolling
 */
export function useVirtualScroll<T>(
  data: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)
  const [virtualProvider] = useState(() => 
    new VirtualScrollProvider(data, itemHeight, containerHeight)
  )

  useEffect(() => {
    virtualProvider.updateData(data)
  }, [data, virtualProvider])

  const visibleItems = virtualProvider.updateVisibleRange(scrollTop)
  const totalHeight = virtualProvider.getTotalHeight()

  const handleScroll = useCallback((newScrollTop: number) => {
    setScrollTop(newScrollTop)
  }, [])

  return {
    visibleItems: visibleItems.items,
    totalHeight,
    handleScroll,
    startIndex: visibleItems.start,
    endIndex: visibleItems.end
  }
} 