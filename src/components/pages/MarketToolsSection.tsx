'use client'

import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

interface MarketTool {
  name: string
  description: string
  url: string
  icon: LucideIcon
  color: string
}

interface MarketToolsSectionProps {
  title: string
  description: string
  tools: MarketTool[]
  footerMessage: string
}

export default function MarketToolsSection({ 
  title, 
  description, 
  tools, 
  footerMessage 
}: MarketToolsSectionProps) {
  return (
    <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-white">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-gray-900">{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${tool.color}`}>
                <tool.icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{tool.name}</h4>
                <p className="text-sm text-gray-600">{tool.description}</p>
                <a href={tool.url} target="_blank" rel="noopener noreferrer" 
                   className="text-xs text-blue-600 hover:underline">{tool.url.replace('https://', '')} →</a>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {footerMessage}
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 