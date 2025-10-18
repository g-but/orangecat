'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { 
  Activity, 
  Database, 
  Clock, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { analyticsService } from '@/services/analytics'

interface PerformanceMonitorProps {
  className?: string
}

export function PerformanceMonitor({ className = '' }: PerformanceMonitorProps) {
  const [isVisible, setIsVisible] = useState(false)
  const { metrics, isLoading, error, lastUpdated, cacheStats } = useAnalytics()

  if (!isVisible) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-white shadow-lg border-gray-300"
        >
          <Activity className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  const getHealthStatus = () => {
    if (error) {return { status: 'error', color: 'text-red-600', icon: AlertTriangle }}
    if (isLoading) {return { status: 'loading', color: 'text-yellow-600', icon: RefreshCw }}
    return { status: 'healthy', color: 'text-green-600', icon: CheckCircle }
  }

  const health = getHealthStatus()
  const HealthIcon = health.icon

  const getDataFreshness = () => {
    if (!lastUpdated) {return 'Never'}
    const now = Date.now()
    const diff = now - lastUpdated.getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    if (minutes > 0) {return `${minutes}m ${seconds}s ago`}
    return `${seconds}s ago`
  }

  const getMetricsBreakdown = () => {
    if (!metrics) {return { real: 0, demo: 0, total: 0 }}
    
    let real = 0
    let demo = 0
    let total = 0
    
    Object.values(metrics).forEach(feature => {
      Object.values(feature.stats).forEach(stat => {
        total++
        if (typeof stat === 'object' && stat !== null && 'isDemo' in stat && stat.isDemo) {
          demo++
        } else {
          real++
        }
      })
    })
    
    return { real, demo, total }
  }

  const breakdown = getMetricsBreakdown()

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Card className="w-80 bg-white shadow-xl border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Performance Monitor
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* System Health */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">System Health</span>
            <div className={`flex items-center gap-1 text-sm ${health.color}`}>
              <HealthIcon className="w-4 h-4" />
              <span className="capitalize">{health.status}</span>
            </div>
          </div>

          {/* Data Freshness */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Last Updated</span>
            <div className="flex items-center gap-1 text-sm text-gray-700">
              <Clock className="w-4 h-4" />
              <span>{getDataFreshness()}</span>
            </div>
          </div>

          {/* Cache Stats */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Cache Size</span>
            <div className="flex items-center gap-1 text-sm text-gray-700">
              <Database className="w-4 h-4" />
              <span>{cacheStats.size} items</span>
            </div>
          </div>

          {/* Metrics Breakdown */}
          <div className="space-y-2">
            <span className="text-sm text-gray-600">Data Sources</span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="font-semibold text-green-700">{breakdown.real}</div>
                <div className="text-green-600">Real</div>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded">
                <div className="font-semibold text-orange-700">{breakdown.demo}</div>
                <div className="text-orange-600">Demo</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-semibold text-gray-700">{breakdown.total}</div>
                <div className="text-gray-600">Total</div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Cache Keys (Debug) */}
          {process.env.NODE_ENV === 'development' && cacheStats.keys.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                Cache Keys ({cacheStats.keys.length})
              </summary>
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {cacheStats.keys.map((key, index) => (
                  <div key={index} className="font-mono text-gray-500 truncate">
                    {key}
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => analyticsService.clearCache()}
              className="flex-1 text-xs"
            >
              Clear Cache
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="flex-1 text-xs"
            >
              Reload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Development-only wrapper
export function DevPerformanceMonitor() {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return <PerformanceMonitor />
} 