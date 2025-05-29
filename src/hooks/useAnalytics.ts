'use client'

import { useState, useEffect, useCallback } from 'react'
import { analyticsService, DashboardMetrics, FeatureMetrics } from '@/services/analytics'
import { useAuth } from '@/hooks/useAuth'

interface UseAnalyticsOptions {
  refreshInterval?: number // in milliseconds
  enabled?: boolean
}

interface UseAnalyticsReturn {
  metrics: DashboardMetrics | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  lastUpdated: Date | null
  cacheStats: { size: number; keys: string[] }
}

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const { user, profile } = useAuth()
  const { refreshInterval = 5 * 60 * 1000, enabled = true } = options // Default 5 minutes
  
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchMetrics = useCallback(async () => {
    if (!user || !enabled) {
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const walletAddress = profile?.bitcoin_address || undefined
      const data = await analyticsService.getAllMetrics(user.id, walletAddress)
      
      setMetrics(data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data')
    } finally {
      setIsLoading(false)
    }
  }, [user, profile?.bitcoin_address, enabled])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    await fetchMetrics()
  }, [fetchMetrics])

  // Initial load
  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  // Auto-refresh interval
  useEffect(() => {
    if (!enabled || !refreshInterval) return

    const interval = setInterval(fetchMetrics, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchMetrics, refreshInterval, enabled])

  // Get cache stats
  const cacheStats = analyticsService.getCacheStats()

  return {
    metrics,
    isLoading,
    error,
    refresh,
    lastUpdated,
    cacheStats
  }
}

// Hook for specific feature metrics
export function useFeatureMetrics(feature: keyof DashboardMetrics): {
  metrics: FeatureMetrics | null
  isLoading: boolean
  error: string | null
} {
  const { metrics, isLoading, error } = useAnalytics()
  
  return {
    metrics: metrics?.[feature] || null,
    isLoading,
    error
  }
}

// Hook for fundraising metrics specifically
export function useFundraisingMetrics() {
  return useFeatureMetrics('fundraising')
}

// Hook for wallet metrics specifically  
export function useWalletMetrics() {
  return useFeatureMetrics('wallet')
} 