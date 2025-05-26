'use client'

import { ExternalLink, LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'

interface FeaturePreviewCardProps {
  title: string
  description: string
  icon: LucideIcon
  iconColor: string
  borderColor: string
  backgroundColor: string
  timeline: string
  demoCount: string
  href: string
}

export default function FeaturePreviewCard({
  title,
  description,
  icon: Icon,
  iconColor,
  borderColor,
  backgroundColor,
  timeline,
  demoCount,
  href
}: FeaturePreviewCardProps) {
  return (
    <Link href={href}>
      <Card className={`hover:shadow-md transition-shadow cursor-pointer ${borderColor} ${backgroundColor}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <Icon className={`w-8 h-8 ${iconColor}`} />
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
              {timeline}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-700 text-sm mb-3">{description}</p>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{demoCount}</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
} 