'use client'

import { Handshake, BarChart3, Settings } from 'lucide-react'
import GenericDashboardCard, { getStatusColor, cardStyles } from './GenericDashboardCard'
import { CampaignData } from '@/data/dashboardConfigs'

interface CampaignCardProps {
  campaign: CampaignData
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
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
      title={campaign.title}
      type={campaign.type}
      typeColor={campaign.color}
      status={campaign.status}
      statusColor={getStatusColor(campaign.status)}
      icon={Handshake}
      iconGradient={cardStyles.campaign.iconGradient}
      iconColor={cardStyles.campaign.iconColor}
      actions={actions}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Raised</span>
        <span className="font-medium">{campaign.raised.toLocaleString('en-US')} sats</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Goal</span>
        <span className="font-medium">{campaign.goal.toLocaleString('en-US')} sats</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Supporters</span>
        <span className="font-medium">{campaign.supporters.toLocaleString('en-US')}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Days Left</span>
        <span className="font-medium">{campaign.daysLeft > 0 ? campaign.daysLeft : 'Completed'}</span>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{campaign.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-teal-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${campaign.progress}%` }}
          ></div>
        </div>
      </div>
    </GenericDashboardCard>
  )
} 