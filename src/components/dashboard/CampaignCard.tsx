'use client'

import { Handshake, BarChart3, Settings } from 'lucide-react'
import GenericDashboardCard, { getStatusColor, cardStyles } from './GenericDashboardCard'
import { CampaignData } from '@/data/dashboardConfigs'

interface CampaignCardProps {
  project: CampaignData
}

export default function CampaignCard({ project }: CampaignCardProps) {
  const actions = [
    {
      label: 'Analytics',
      icon: BarChart3,
      onClick: () => {},
      variant: 'secondary' as const,
      comingSoon: true
    },
    {
      label: 'Manage', 
      icon: Settings,
      onClick: () => {},
      variant: 'secondary' as const,
      comingSoon: true
    }
  ]

  return (
    <GenericDashboardCard
      title={project.title}
      type={project.type}
      typeColor={project.color}
      status={project.status}
      statusColor={getStatusColor(project.status)}
      icon={Handshake}
      iconGradient={cardStyles.project.iconGradient}
      iconColor={cardStyles.project.iconColor}
      actions={actions}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Raised</span>
        <span className="font-medium">{project.raised.toLocaleString('en-US')} sats</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Goal</span>
        <span className="font-medium">{project.goal.toLocaleString('en-US')} sats</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Supporters</span>
        <span className="font-medium">{project.supporters.toLocaleString('en-US')}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Days Left</span>
        <span className="font-medium">{project.daysLeft > 0 ? project.daysLeft : 'Completed'}</span>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-teal-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>
    </GenericDashboardCard>
  )
} 