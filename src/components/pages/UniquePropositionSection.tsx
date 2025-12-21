'use client'

import { Coins,  Brain, Code } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

interface UniquePropositionSectionProps {
  title: string
  subtitle: string
  bitcoinTitle: string
  bitcoinDescription: string
  aiTitle: string
  aiDescription: string
  openSourceTitle: string
  openSourceDescription: string
}

export default function UniquePropositionSection({
  title,
  subtitle,
  bitcoinTitle,
  bitcoinDescription,
  aiTitle,
  aiDescription,
  openSourceTitle,
  openSourceDescription
}: UniquePropositionSectionProps) {
  return (
    <Card className="border-0 bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-gray-900 mb-2">{title}</CardTitle>
        <CardDescription className="text-lg text-gray-700">
          {subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="inline-flex p-4 bg-orange-100 rounded-2xl mb-4">
              <Coins className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{bitcoinTitle}</h3>
            <p className="text-gray-600 leading-relaxed">
              {bitcoinDescription}
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex p-4 bg-blue-100 rounded-2xl mb-4">
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{aiTitle}</h3>
            <p className="text-gray-600 leading-relaxed">
              {aiDescription}
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex p-4 bg-green-100 rounded-2xl mb-4">
              <Code className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{openSourceTitle}</h3>
            <p className="text-gray-600 leading-relaxed">
              {openSourceDescription}
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-green-100 px-6 py-3 rounded-full">
            <Sparkles className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-gray-900">Bitcoin × AI × Open Source = The Future</span>
            <Sparkles className="w-5 h-5 text-green-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 