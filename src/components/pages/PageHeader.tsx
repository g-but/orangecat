'use client'

import { Clock, LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  icon: LucideIcon
  iconColors: string
  title: string
  description: string
  comingSoonDate?: string
}

export default function PageHeader({ 
  icon: Icon, 
  iconColors, 
  title, 
  description, 
  comingSoonDate = "Q1 2025" 
}: PageHeaderProps) {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className={`p-4 ${iconColors} rounded-2xl`}>
          <Icon className="w-12 h-12" />
        </div>
      </div>
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {title}
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          {description}
        </p>
      </div>
      
      <div className="flex items-center justify-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium w-fit mx-auto">
        <Clock className="w-4 h-4" />
        Coming Soon - {comingSoonDate}
      </div>
    </div>
  )
} 