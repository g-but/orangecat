'use client'

import { LucideIcon, AlertTriangle, Database, Globe, TestTube, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { MetricValue } from '@/services/analytics'

interface MetricCardProps {
  icon: LucideIcon
  iconColor: string
  label: string
  metric: MetricValue
  subtitle?: string
  className?: string
  onClick?: () => void
  isLoading?: boolean
}

export function MetricCard({
  icon: Icon,
  iconColor,
  label,
  metric,
  subtitle,
  className = '',
  onClick,
  isLoading = false
}: MetricCardProps) {
  const getSourceIcon = () => {
    switch (metric.source) {
      case 'database':
        return <Database className="w-3 h-3" />
      case 'api':
        return <Globe className="w-3 h-3" />
      case 'demo':
        return <TestTube className="w-3 h-3" />
      default:
        return null
    }
  }

  const getConfidenceColor = () => {
    switch (metric.confidence) {
      case 'high':
        return 'text-green-600'
      case 'medium':
        return 'text-yellow-600'
      case 'low':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getBorderColor = () => {
    if (metric.isDemo) return 'border-orange-200 bg-orange-50/50'
    if (metric.confidence === 'low') return 'border-red-200 bg-red-50/50'
    return 'border-gray-200 bg-white'
  }

  return (
    <Card 
      className={`${getBorderColor()} transition-all duration-200 hover:shadow-md ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      } ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconColor}`}>
            {isLoading ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <Icon className="w-6 h-6" />
            )}
          </div>
          
          {/* Data source and confidence indicators */}
          <div className="flex items-center gap-2">
            {metric.isDemo && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                <TestTube className="w-3 h-3" />
                Demo
              </div>
            )}
            
            {metric.confidence === 'low' && !metric.isDemo && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                <AlertTriangle className="w-3 h-3" />
                Limited
              </div>
            )}
            
            <div className={`flex items-center gap-1 text-xs ${getConfidenceColor()}`}>
              {getSourceIcon()}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          
          <p className={`text-2xl font-bold ${
            metric.isDemo ? 'text-orange-900' : 'text-gray-900'
          }`}>
            {isLoading ? '...' : metric.value}
          </p>
          
          {subtitle && (
            <p className={`text-sm ${
              metric.isDemo ? 'text-orange-600' : 'text-gray-500'
            }`}>
              {subtitle}
            </p>
          )}
          
          {/* Last updated info */}
          <p className="text-xs text-gray-400">
            Updated: {metric.lastUpdated.toLocaleTimeString()}
          </p>
        </div>

        {/* Demo data disclaimer */}
        {metric.isDemo && (
          <div className="mt-4 p-3 bg-orange-100 border border-orange-200 rounded-lg">
            <p className="text-xs text-orange-700">
              <strong>Preview Data:</strong> This shows sample data for upcoming features. 
              Real functionality coming soon!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Grid component for displaying multiple metrics
interface MetricGridProps {
  metrics: Array<{
    icon: LucideIcon
    iconColor: string
    label: string
    metric: MetricValue
    subtitle?: string
  }>
  isLoading?: boolean
  className?: string
}

export function MetricGrid({ metrics, isLoading = false, className = '' }: MetricGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {metrics.map((metric, index) => (
        <MetricCard
          key={`${metric.label}-${index}`}
          icon={metric.icon}
          iconColor={metric.iconColor}
          label={metric.label}
          metric={metric.metric}
          subtitle={metric.subtitle}
          isLoading={isLoading}
        />
      ))}
    </div>
  )
} 