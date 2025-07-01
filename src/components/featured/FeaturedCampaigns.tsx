'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { 
  Star, 
  TrendingUp, 
  Users, 
  Target, 
  Clock,
  ArrowRight,
  Sparkles,
  Crown,
  Zap
} from 'lucide-react'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { getFeaturedCampaigns, FeaturedCampaign } from '@/services/featured'

interface FeaturedCampaignsProps {
  limit?: number
  showHeader?: boolean
  variant?: 'hero' | 'grid' | 'carousel'
  className?: string
}

export default function FeaturedCampaigns({ 
  limit = 6, 
  showHeader = true, 
  variant = 'grid',
  className = '' 
}: FeaturedCampaignsProps) {
  const [campaigns, setCampaigns] = useState<FeaturedCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadFeaturedCampaigns()
  }, [limit]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadFeaturedCampaigns = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getFeaturedCampaigns(limit)
      setCampaigns(data)
    } catch (err: any) {
      setError('Failed to load featured campaigns')
    } finally {
      setLoading(false)
    }
  }

  const formatProgress = (campaign: FeaturedCampaign) => {
    if (!campaign.goal_amount) return 0
    return Math.min((campaign.total_funding / campaign.goal_amount) * 100, 100)
  }

  const formatTimeLeft = (endDate?: string) => {
    if (!endDate) return null
    
    const now = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 0) return 'Ended'
    if (diffDays === 1) return '1 day left'
    if (diffDays <= 30) return `${diffDays} days left`
    
    const diffMonths = Math.ceil(diffDays / 30)
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} left`
  }

  const getFeaturedBadge = (campaign: FeaturedCampaign) => {
    switch (campaign.featured_type) {
      case 'trending':
        return { icon: TrendingUp, label: 'Trending', color: 'bg-green-100 text-green-700' }
      case 'staff_pick':
        return { icon: Star, label: 'Staff Pick', color: 'bg-purple-100 text-purple-700' }
      case 'community_choice':
        return { icon: Users, label: 'Community Choice', color: 'bg-blue-100 text-blue-700' }
      case 'nearly_funded':
        return { icon: Target, label: 'Nearly Funded', color: 'bg-orange-100 text-orange-700' }
      case 'new_and_noteworthy':
        return { icon: Sparkles, label: 'New & Noteworthy', color: 'bg-teal-100 text-teal-700' }
      default:
        return { icon: Crown, label: 'Featured', color: 'bg-yellow-100 text-yellow-700' }
    }
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {showHeader && (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>
        )}
        <div className={`grid gap-6 ${
          variant === 'hero' ? 'grid-cols-1 lg:grid-cols-2' :
          variant === 'carousel' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-64"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || campaigns.length === 0) {
    return null // Gracefully hide if no featured campaigns
  }

  const renderCampaignCard = (campaign: FeaturedCampaign, isHero = false) => {
    const progress = formatProgress(campaign)
    const timeLeft = formatTimeLeft(campaign.end_date)
    const badge = getFeaturedBadge(campaign)
    const BadgeIcon = badge.icon

    return (
      <Card
        key={campaign.id}
        className={`group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden ${
          isHero ? 'h-96' : 'h-80'
        }`}
        onClick={() => router.push(`/campaign/${campaign.slug || campaign.id}`)}
      >
        <div className="relative h-48 overflow-hidden">
          {campaign.featured_image_url ? (
            <Image
              src={campaign.featured_image_url}
              alt={campaign.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
              <Target className="w-16 h-16 text-orange-400" />
            </div>
          )}
          
          {/* Featured Badge */}
          <div className="absolute top-3 left-3">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
              <BadgeIcon className="w-3 h-3 mr-1" />
              {badge.label}
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <div className="w-full bg-white/20 rounded-full h-1.5">
              <div 
                className="bg-white h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="flex-1">
            <h3 className={`font-semibold text-gray-900 group-hover:text-orange-600 transition-colors mb-2 line-clamp-2 ${
              isHero ? 'text-lg' : 'text-base'
            }`}>
              {campaign.title}
            </h3>
            
            {campaign.profiles && (
              <p className="text-sm text-gray-600 mb-2">
                by {campaign.profiles.display_name || campaign.profiles.username}
              </p>
            )}
            
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {campaign.description}
            </p>
          </div>

          <div className="space-y-3">
            {/* Funding Info */}
            <div className="flex items-center justify-between text-sm">
              <div>
                <CurrencyDisplay 
                  amount={campaign.total_funding}
                  currency="BTC"
                  size="sm"
                  className="font-medium text-gray-900"
                />
                <span className="text-gray-500 ml-1">raised</span>
              </div>
              <span className="font-medium text-gray-900">{progress.toFixed(0)}%</span>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  {campaign.contributor_count}
                </span>
                {timeLeft && (
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {timeLeft}
                  </span>
                )}
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {showHeader && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Zap className="w-6 h-6 text-orange-500" />
            Featured Campaigns
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover exceptional projects and causes that are making a real impact. 
            These campaigns have been selected for their innovation, community support, and potential for success.
          </p>
        </div>
      )}

      {variant === 'hero' && campaigns.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {campaigns.slice(0, 2).map(campaign => renderCampaignCard(campaign, true))}
        </div>
      )}

      <div className={`grid gap-6 ${
        variant === 'hero' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
        variant === 'carousel' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      }`}>
        {(variant === 'hero' ? campaigns.slice(2) : campaigns).map(campaign => 
          renderCampaignCard(campaign)
        )}
      </div>

      {campaigns.length >= limit && (
        <div className="text-center">
          <Button 
            href="/discover?featured=true" 
            variant="outline"
            className="group"
          >
            View All Featured Campaigns
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      )}
    </div>
  )
} 