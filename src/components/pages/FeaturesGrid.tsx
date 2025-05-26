'use client'

import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  color: string
}

interface FeaturesGridProps {
  title: string
  subtitle: string
  features: Feature[]
}

export default function FeaturesGrid({ title, subtitle, features }: FeaturesGridProps) {
  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-lg text-gray-600">
          {subtitle}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className={`inline-flex p-3 rounded-xl ${feature.color} mb-4`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 