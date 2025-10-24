'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft,
  Bitcoin, 
  Heart,
  Users,
  Target,
  Calendar,
  Sparkles,
  CheckCircle,
  TrendingUp,
  ExternalLink,
  Share2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DefaultAvatar from '@/components/ui/DefaultAvatar'

export default function OrangeCatCampaignPage() {
  const [supportAmount, setSupportAmount] = useState('')

  // Sample data for Orange Cat project
  const project = {
    title: "Orange Cat",
    description: "A Bitcoin education platform making cryptocurrency knowledge accessible to everyone through interactive tutorials, guides, and community resources.",
    profile_type: "project",
    creator: {
      name: "Mao",
      username: "mao",
      avatar_url: null,
      verified: true
    },
    category_tags: ["bitcoin_education", "technology", "community"],
    inspiration_statement: "We believe Bitcoin education should be free, accessible, and fun. Every satoshi donated helps us create better content and reach more people worldwide.",
    bitcoin_address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    stats: {
      raised: "0.45123456",
      goal: "1.00000000",
      supporters: 23,
      days_running: 45
    },
    impact_metrics: [
      { label: "People Educated", value: "1,250+", icon: "📚" },
      { label: "Content Created", value: "45 guides", icon: "📖" },
      { label: "Community Members", value: "850", icon: "👥" }
    ]
  }

  const getColorClasses = (color: string) => {
    const colorMap = {
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200'
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.orange
  }

  const tags = [
    { key: 'bitcoin_education', label: 'Bitcoin Education', icon: '₿', color: 'orange' },
    { key: 'technology', label: 'Technology', icon: '💻', color: 'blue' },
    { key: 'community', label: 'Community Building', icon: '🤝', color: 'green' }
  ]

  const progressPercentage = (parseFloat(project.stats.raised) / parseFloat(project.stats.goal)) * 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Back Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/discover" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Discover
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Campaign Header */}
        <div className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white rounded-xl overflow-hidden mb-8">
          <div className="absolute inset-0 bg-black/20" />
          
          <div className="relative p-8">
            <div className="flex items-start gap-6">
              {/* Campaign Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30">
                  <span className="text-4xl">🎯</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm border-4 border-white">
                  🎯
                </div>
                <CheckCircle className="absolute -top-2 -right-2 w-8 h-8 text-blue-400 bg-white rounded-full" />
              </div>

              {/* Campaign Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{project.title}</h1>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700 border border-orange-200">
                    Campaign
                  </span>
                </div>
                
                <p className="text-orange-100 leading-relaxed mb-4 max-w-2xl">
                  {project.description}
                </p>

                {/* Creator Association */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-orange-200">Created by:</span>
                  <Link 
                    href={`/profile/${project.creator.username}`}
                    className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 hover:bg-white/20 transition-colors"
                  >
                    <DefaultAvatar size={24} />
                    <span className="font-medium">{project.creator.name}</span>
                    {project.creator.verified && <CheckCircle className="w-4 h-4 text-blue-400" />}
                    <span className="text-orange-200">• Individual</span>
                  </Link>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map((tag) => (
                    <span 
                      key={tag.key}
                      className={`px-3 py-1 rounded-full text-sm font-medium border bg-white/10 text-white border-white/20`}
                    >
                      <span className="mr-1">{tag.icon}</span>
                      {tag.label}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">₿{project.stats.raised}</div>
                    <div className="text-sm text-orange-200">of ₿{project.stats.goal} goal</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{project.stats.supporters}</div>
                    <div className="text-sm text-orange-200">supporters</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{project.stats.days_running}</div>
                    <div className="text-sm text-orange-200">days running</div>
                  </div>
                </div>
              </div>

              {/* Quick Support Button */}
              <div className="flex-shrink-0">
                <Button className="bg-white text-orange-600 hover:bg-orange-50">
                  <Heart className="w-4 h-4 mr-2" />
                  Support Now
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Inspiration Statement */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-orange-600" />
                  <h3 className="text-xl font-semibold text-gray-900">Why Support Orange Cat?</h3>
                </div>
                <div className="bg-white/80 rounded-lg p-4">
                  <p className="text-gray-700 italic text-lg leading-relaxed">
                    "{project.inspiration_statement}"
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Impact Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Impact So Far
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {project.impact_metrics.map((metric, index) => (
                    <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl mb-2">{metric.icon}</div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                      <div className="text-sm text-gray-600">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Funding Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  Funding Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>₿{project.stats.raised} raised</span>
                      <span>{progressPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <Button 
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      onClick={() => window.open(`bitcoin:${project.bitcoin_address}`, '_blank')}
                    >
                      <Bitcoin className="w-4 h-4 mr-2" />
                      Send Bitcoin
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Campaign Type</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <span className="font-medium text-orange-600">Campaign</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Creator</span>
                    <Link 
                      href={`/profile/${project.creator.username}`}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <span className="font-medium">{project.creator.name}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Supporters</span>
                    <span className="font-medium">{project.stats.supporters}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Days Active</span>
                    <span className="font-medium">{project.stats.days_running} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share */}
            <Card>
              <CardContent className="p-6 text-center">
                <Share2 className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                <h3 className="font-semibold text-gray-900 mb-2">Share Orange Cat</h3>
                <p className="text-sm text-gray-600 mb-4">Help spread the word about Bitcoin education</p>
                <Button variant="outline" className="w-full">
                  Share Campaign
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 