'use client'

import { ReactNode } from 'react'
import { Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

/**
 * Base Dashboard Card Component
 * 
 * Eliminates DRY violations by providing a consistent card structure
 * for all dashboard card types (Asset, Project, Event, Organization, Person).
 * 
 * ♻️ REFACTORED: Eliminates ~200 lines of duplicate UI structure
 */

interface BaseDashboardCardProps {
  className?: string
  children: ReactNode
  showSettings?: boolean
  onSettingsClick?: () => void
  settingsLabel?: string
}

export default function BaseDashboardCard({ 
  className = '',
  children,
  showSettings = true,
  onSettingsClick,
  settingsLabel = 'Settings'
}: BaseDashboardCardProps) {
  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-6">
        {children}
        
        {showSettings && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              onClick={onSettingsClick}
              className="w-full flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {settingsLabel}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Header Component for Dashboard Cards
 */
interface CardHeaderProps {
  icon?: ReactNode
  iconBgColor?: string
  title: string
  subtitle?: string
  status?: string
  statusColor?: string
  rightContent?: ReactNode
}

export function DashboardCardHeader({
  icon,
  iconBgColor = 'bg-gradient-to-r from-blue-100 to-indigo-100',
  title,
  subtitle,
  status,
  statusColor = 'bg-green-100 text-green-700',
  rightContent
}: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`${iconBgColor} p-3 rounded-full`}>
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      </div>
      
      {(status || rightContent) && (
        <div className="flex flex-col items-end gap-2">
          {status && (
            <span className={`px-2 py-1 text-xs rounded-full ${statusColor}`}>
              {status}
            </span>
          )}
          {rightContent}
        </div>
      )}
    </div>
  )
}

/**
 * Content Section Component for Dashboard Cards
 */
interface CardContentSectionProps {
  children: ReactNode
  className?: string
}

export function DashboardCardContent({ 
  children, 
  className = '' 
}: CardContentSectionProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {children}
    </div>
  )
}

/**
 * Metric Display Component for Dashboard Cards
 */
interface MetricDisplayProps {
  label: string
  value: string | number
  change?: string
  changeColor?: string
}

export function MetricDisplay({ 
  label, 
  value, 
  change, 
  changeColor = 'text-green-600' 
}: MetricDisplayProps) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-semibold">{value}</span>
        {change && (
          <span className={`text-xs ${changeColor}`}>
            {change}
          </span>
        )}
      </div>
    </div>
  )
}