'use client'

import { Users, MessageCircle, UserPlus, MapPin } from 'lucide-react'
import GenericDashboardCard, { cardStyles } from './GenericDashboardCard'
import { PersonData } from '@/data/dashboardConfigs'

interface PersonCardProps {
  person: PersonData
}

export default function PersonCard({ person }: PersonCardProps) {
  const actions = [
    {
      label: 'Message',
      icon: MessageCircle,
      onClick: () => {},
      variant: 'secondary' as const,
      comingSoon: true
    },
    {
      label: 'Connect',
      icon: UserPlus,
      onClick: () => {},
      variant: 'secondary' as const,
      comingSoon: true
    }
  ]

  return (
    <GenericDashboardCard
      title={person.name}
      type={person.username}
      typeColor="text-gray-600 bg-transparent"
      status={person.relationship}
      statusColor={person.color}
      icon={Users}
      iconGradient={cardStyles.person.iconGradient}
      iconColor={cardStyles.person.iconColor}
      actions={actions}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Mutual Connections</span>
        <span className="font-medium">{person.mutualConnections}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Last Interaction</span>
        <span className="font-medium">{person.lastInteraction}</span>
      </div>
      <div className="flex items-center gap-1 text-sm">
        <MapPin className="w-3 h-3 text-gray-400" />
        <span className="text-gray-600">{person.location}</span>
      </div>
      <div className="text-sm">
        <span className="text-gray-600">Skills: </span>
        <span className="font-medium">{person.skills.join(', ')}</span>
      </div>
    </GenericDashboardCard>
  )
} 