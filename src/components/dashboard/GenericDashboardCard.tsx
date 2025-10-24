'use client'

import { useState, ReactNode } from 'react'
import { LucideIcon, Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface DashboardCardAction {
  label: string
  icon: LucideIcon
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  comingSoon?: boolean
}

interface DashboardCardProps {
  title: string
  type: string
  typeColor: string
  status?: string
  statusColor?: string
  icon: LucideIcon
  iconGradient: string
  iconColor: string
  actions?: DashboardCardAction[]
  children?: ReactNode
  className?: string
}

export default function GenericDashboardCard({
  title,
  type,
  typeColor,
  status,
  statusColor,
  icon: Icon,
  iconGradient,
  iconColor,
  actions = [],
  children,
  className = ''
}: DashboardCardProps) {
  const handleComingSoonAction = () => {
    // For now, just show an alert - can be enhanced later
    alert('This feature is coming soon!')
  }

  return (
    <>
      <Card className={`hover:shadow-md transition-shadow ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`${iconGradient} p-3 rounded-full`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${typeColor}`}>
                  {type}
                </span>
              </div>
            </div>
            {status && (
              <span className={`px-2 py-1 text-xs rounded-full ${statusColor || 'bg-gray-100 text-gray-700'}`}>
                {status}
              </span>
            )}
          </div>
          
          {children && (
            <div className="space-y-3 mb-4">
              {children}
            </div>
          )}
          
          {actions.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || 'ghost'}
                      size="sm"
                      onClick={action.comingSoon ? handleComingSoonAction : action.onClick}
                      className="text-xs"
                    >
                      <action.icon className="w-3 h-3 mr-1" />
                      {action.label}
                    </Button>
                  ))}
                </div>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
    </>
  )
}

// Utility function to generate status colors
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-700'
    case 'completed':
      return 'bg-blue-100 text-blue-700'
    case 'upcoming':
      return 'bg-green-100 text-green-700'
    case 'draft':
      return 'bg-yellow-100 text-yellow-700'
    case 'paused':
      return 'bg-orange-100 text-orange-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

// Predefined gradient and color combinations
export const cardStyles = {
  project: {
    iconGradient: 'bg-gradient-to-r from-teal-100 to-cyan-100',
    iconColor: 'text-teal-600'
  },
  organization: {
    iconGradient: 'bg-gradient-to-r from-green-100 to-emerald-100',
    iconColor: 'text-green-600'
  },
  person: {
    iconGradient: 'bg-gradient-to-r from-purple-100 to-pink-100',
    iconColor: 'text-purple-600'
  },
  event: {
    iconGradient: 'bg-gradient-to-r from-blue-100 to-indigo-100',
    iconColor: 'text-blue-600'
  },
  project: {
    iconGradient: 'bg-gradient-to-r from-orange-100 to-red-100',
    iconColor: 'text-orange-600'
  }
}