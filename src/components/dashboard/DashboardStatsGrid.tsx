'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { DashboardStats } from '@/types/dashboard'

interface DashboardStatsGridProps {
  stats: DashboardStats[]
}

export default function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`${stat.iconColor} p-3 rounded-full`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-gray-600 text-sm">{stat.subtitle}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 