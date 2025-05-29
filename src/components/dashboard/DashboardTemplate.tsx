'use client'

import DashboardHeader from './DashboardHeader'
import FeatureBanner from './FeatureBanner'
import DashboardStatsGrid from './DashboardStatsGrid'
import ActivityFeed from './ActivityFeed'
import { DashboardConfig, DashboardStats, DashboardActivity } from '@/types/dashboard'

interface DashboardTemplateProps {
  config: DashboardConfig
  stats: DashboardStats[]
  activities: DashboardActivity[]
  children: React.ReactNode // The items grid (organizations, events, projects)
}

export default function DashboardTemplate({ 
  config, 
  stats, 
  activities, 
  children 
}: DashboardTemplateProps) {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <DashboardHeader
        title={config.title}
        subtitle={config.subtitle}
        createButtonLabel={config.createButtonLabel}
        createButtonHref={config.createButtonHref}
        backButtonHref={config.backButtonHref}
        featureName={config.featureName}
        timeline={config.timeline}
        learnMoreUrl={config.learnMoreUrl}
      />

      {/* Coming Soon Banner */}
      {config.featureBanner && <FeatureBanner banner={config.featureBanner} />}

      {/* Stats Grid */}
      <DashboardStatsGrid stats={stats} />

      {/* Items Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{config.itemsTitle}</h2>
        {children}
      </div>

      {/* Recent Activity */}
      <ActivityFeed 
        title={config.activityTitle} 
        activities={activities} 
      />

    </div>
  )
} 