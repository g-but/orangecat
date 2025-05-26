'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

interface CapabilitiesListProps {
  title: string
  description: string
  capabilities: string[]
  accentColor?: string
}

export default function CapabilitiesList({ 
  title, 
  description, 
  capabilities, 
  accentColor = "tiffany" 
}: CapabilitiesListProps) {
  return (
    <Card className={`border-${accentColor}-200 bg-gradient-to-br from-${accentColor}-50 to-white`}>
      <CardHeader className="text-center">
        <CardTitle className={`text-2xl text-${accentColor}-900`}>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {capabilities.map((capability, index) => (
            <div key={index} className={`flex items-center gap-3 p-3 bg-white rounded-lg border border-${accentColor}-100`}>
              <div className={`w-2 h-2 bg-${accentColor}-500 rounded-full flex-shrink-0`}></div>
              <span className="text-sm text-gray-800">{capability}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 