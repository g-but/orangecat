/**
 * REACT PERFORMANCE MONITOR COMPONENT
 * 
 * Real-time performance monitoring for Option B optimization:
 * - Component render times
 * - API response times
 * - Bundle loading metrics
 * - Memory usage tracking
 * - Performance alerts
 * 
 * Created: 2025-01-14
 * Last Modified: 2025-01-14
 * Last Modified Summary: Real-time performance monitoring for production optimization
 */

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { performanceMonitor } from '@/services/performance/database-optimizer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  Activity, 
  Clock, 
  Database, 
  Gauge, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react'

// ==================== PERFORMANCE METRICS TYPES ====================

interface PerformanceStats {
  renderTime: number
  apiResponseTime: number
  bundleSize: number
  memoryUsage: number
  cacheHitRate: number
}

interface PerformanceAlert {
  type: 'warning' | 'error' | 'info'
  message: string
  timestamp: number
}

// ==================== PERFORMANCE HOOKS ====================

/**
 * Hook to measure component render performance
 */
function useRenderPerformance(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const renderTime = performance.now() - startTime
      performanceMonitor.recordMetric(`component_render:${componentName}`, renderTime)
    }
  }, [componentName])
}

/**
 * Hook to track API performance
 */
function useAPIPerformance() {
  const trackAPI = useCallback(async <T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now()
    try {
      const result = await apiCall()
      const responseTime = performance.now() - startTime
      performanceMonitor.recordMetric(`api:${name}`, responseTime)
      return result
    } catch (error) {
      const responseTime = performance.now() - startTime
      performanceMonitor.recordError(`api:${name}`, error as Error, responseTime)
      throw error
    }
  }, [])

  return { trackAPI }
}

/**
 * Hook to monitor memory usage
 */
function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number
    total: number
    percentage: number
  } | null>(null)

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const used = memory.usedJSHeapSize / 1024 / 1024 // MB
        const total = memory.totalJSHeapSize / 1024 / 1024 // MB
        const percentage = (used / total) * 100

        setMemoryInfo({ used, total, percentage })
        performanceMonitor.recordMetric('memory_usage', used)
      }
    }

    updateMemoryInfo()
    const interval = setInterval(updateMemoryInfo, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return memoryInfo
}

// ==================== PERFORMANCE MONITOR COMPONENT ====================

interface PerformanceMonitorProps {
  componentName?: string
  showDetailed?: boolean
  alertThresholds?: {
    renderTime: number
    apiTime: number
    memoryUsage: number
  }
}

export function PerformanceMonitor({ 
  componentName = 'Unknown',
  showDetailed = false,
  alertThresholds = {
    renderTime: 100, // ms
    apiTime: 2000, // ms
    memoryUsage: 100 // MB
  }
}: PerformanceMonitorProps) {
  useRenderPerformance(componentName)
  
  const [stats, setStats] = useState<PerformanceStats>({
    renderTime: 0,
    apiResponseTime: 0,
    bundleSize: 0,
    memoryUsage: 0,
    cacheHitRate: 0
  })
  
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const memoryInfo = useMemoryMonitor()

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      const renderStats = performanceMonitor.getStats(`component_render:${componentName}`)
      const apiStats = performanceMonitor.getStats('api')
      const cacheStats = performanceMonitor.getStats('cache_hit')
      
      const newStats: PerformanceStats = {
        renderTime: renderStats.avg,
        apiResponseTime: apiStats.avg,
        bundleSize: 0, // Would be calculated from build stats
        memoryUsage: memoryInfo?.used || 0,
        cacheHitRate: cacheStats.count > 0 ? (cacheStats.count / (cacheStats.count + performanceMonitor.getStats('database_query').count)) * 100 : 0
      }

      setStats(newStats)

      // Check for performance alerts
      const newAlerts: PerformanceAlert[] = []
      
      if (newStats.renderTime > alertThresholds.renderTime) {
        newAlerts.push({
          type: 'warning',
          message: `Slow render time: ${newStats.renderTime.toFixed(2)}ms`,
          timestamp: Date.now()
        })
      }
      
      if (newStats.apiResponseTime > alertThresholds.apiTime) {
        newAlerts.push({
          type: 'error',
          message: `Slow API response: ${newStats.apiResponseTime.toFixed(2)}ms`,
          timestamp: Date.now()
        })
      }
      
      if (newStats.memoryUsage > alertThresholds.memoryUsage) {
        newAlerts.push({
          type: 'warning',
          message: `High memory usage: ${newStats.memoryUsage.toFixed(2)}MB`,
          timestamp: Date.now()
        })
      }

      setAlerts(prev => [...prev, ...newAlerts].slice(-5)) // Keep last 5 alerts
    }

    updateStats()
    const interval = setInterval(updateStats, 3000) // Update every 3 seconds

    return () => clearInterval(interval)
  }, [componentName, alertThresholds, memoryInfo])

  if (!showDetailed) {
    return null // Hide in production by default
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {/* Performance Stats Card */}
      <Card className="bg-black/90 text-white border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Render Performance */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Render
            </span>
            <Badge variant={stats.renderTime > alertThresholds.renderTime ? 'destructive' : 'default'}>
              {stats.renderTime.toFixed(1)}ms
            </Badge>
          </div>

          {/* API Performance */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              API
            </span>
            <Badge variant={stats.apiResponseTime > alertThresholds.apiTime ? 'destructive' : 'default'}>
              {stats.apiResponseTime.toFixed(1)}ms
            </Badge>
          </div>

          {/* Memory Usage */}
          {memoryInfo && (
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                Memory
              </span>
              <Badge variant={memoryInfo.used > alertThresholds.memoryUsage ? 'destructive' : 'default'}>
                {memoryInfo.used.toFixed(1)}MB
              </Badge>
            </div>
          )}

          {/* Cache Hit Rate */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Cache
            </span>
            <Badge variant={stats.cacheHitRate > 70 ? 'default' : 'secondary'}>
              {stats.cacheHitRate.toFixed(1)}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="bg-red-900/90 text-white border-red-700">
          <CardContent className="p-2">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-center gap-2 text-xs mb-1 last:mb-0">
                {alert.type === 'error' && <AlertTriangle className="h-3 w-3 text-red-400" />}
                {alert.type === 'warning' && <AlertTriangle className="h-3 w-3 text-yellow-400" />}
                {alert.type === 'info' && <CheckCircle className="h-3 w-3 text-blue-400" />}
                <span>{alert.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ==================== DEVELOPMENT PERFORMANCE MONITOR ====================

/**
 * Development-only performance monitor with detailed metrics
 */
export function DevPerformanceMonitor() {
  const isProduction = process.env.NODE_ENV === 'production'
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Only show in development or when explicitly enabled
  if (isProduction && !process.env.NEXT_PUBLIC_SHOW_PERFORMANCE_MONITOR) {
    return null
  }

  return (
    <PerformanceMonitor 
      componentName="Application"
      showDetailed={isDevelopment || !!process.env.NEXT_PUBLIC_SHOW_PERFORMANCE_MONITOR}
      alertThresholds={{
        renderTime: 50,
        apiTime: 1000,
        memoryUsage: 75
      }}
    />
  )
}

// ==================== PERFORMANCE PROVIDER ====================

/**
 * Context provider for performance monitoring across the app
 */
export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { trackAPI } = useAPIPerformance()

  // Add performance monitoring to window for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__performanceMonitor = {
        getStats: () => performanceMonitor.getStats(''),
        trackAPI,
        clearMetrics: () => {
          // Clear metrics functionality could be added here
        }
      }
    }
  }, [trackAPI])

  return (
    <>
      {children}
      <DevPerformanceMonitor />
    </>
  )
}

// ==================== EXPORTS ====================

export { useRenderPerformance, useAPIPerformance, useMemoryMonitor }
export default PerformanceMonitor 