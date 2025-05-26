'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { DashboardActivity } from '@/types/dashboard'

interface ActivityFeedProps {
  title: string
  activities: DashboardActivity[]
}

export default function ActivityFeed({ title, activities }: ActivityFeedProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = activity.icon
              return (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.context}</p>
                  </div>
                  <span className="text-sm text-gray-500">{activity.time}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 