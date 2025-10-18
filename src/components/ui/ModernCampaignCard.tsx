'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  Heart, 
  MapPin, 
  Clock, 
  Users, 
  TrendingUp, 
  Star, 
  CheckCircle, 
  ExternalLink,
  Bitcoin,
  Zap,
  Target,
  Award
} from 'lucide-react'
import { CurrencyDisplay } from './CurrencyDisplay'
import BitcoinPaymentButton from '../bitcoin/BitcoinPaymentButton'

interface Campaign {
  id: string
  title: string
  description: string
  creator: string
  category: string
  goal_amount: number
  current_amount: number
  supporters_count: number
  days_left: number
  image?: string
  featured?: boolean
  location?: string
  created_at: string
  tags: string[]
  verified?: boolean
}

interface ModernCampaignCardProps {
  campaign: Campaign
  viewMode?: 'grid' | 'list'
  className?: string
}

export default function ModernCampaignCard({ 
  campaign, 
  viewMode = 'grid',
  className = '' 
}: ModernCampaignCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  const progressPercentage = Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100)
  
  const categoryColors = {
    education: 'from-blue-500/20 to-indigo-500/10',
    animals: 'from-pink-500/20 to-rose-500/10',
    technology: 'from-purple-500/20 to-violet-500/10',
    environment: 'from-green-500/20 to-emerald-500/10',
    business: 'from-orange-500/20 to-amber-500/10',
    default: 'from-gray-500/20 to-slate-500/10'
  }
  
  const categoryIconColors = {
    education: 'text-blue-600',
    animals: 'text-pink-600',
    technology: 'text-purple-600',
    environment: 'text-green-600',
    business: 'text-orange-600',
    default: 'text-gray-600'
  }

  const getBadgeStyle = (type: 'featured' | 'verified' | 'trending') => {
    switch (type) {
      case 'featured':
        return 'bg-gradient-to-r from-bitcoinOrange/90 to-orange-500/90 text-white'
      case 'verified':
        return 'bg-gradient-to-r from-tiffany-500/90 to-cyan-500/90 text-white'
      case 'trending':
        return 'bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white'
      default:
        return 'bg-white/90 text-gray-700'
    }
  }

  const formatDaysLeft = (days: number) => {
    if (days <= 0) {return 'Ended'}
    if (days === 1) {return '1 day left'}
    if (days <= 7) {return `${days} days left`}
    if (days <= 30) {return `${Math.ceil(days / 7)} weeks left`}
    return `${Math.ceil(days / 30)} months left`
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        className={`bg-white rounded-2xl border border-gray-100/50 hover:border-gray-200/80 hover:shadow-xl transition-all duration-300 overflow-hidden group ${className}`}
        whileHover={{ y: -2 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link href={`/campaign/${campaign.id}`} className="block">
          <div className="flex flex-col sm:flex-row">
            {/* Image Section */}
            <div className="relative sm:w-80 h-48 sm:h-40 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
              {campaign.image && !imageError ? (
                <Image
                  src={campaign.image}
                  alt={campaign.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${categoryColors[campaign.category as keyof typeof categoryColors] || categoryColors.default} flex items-center justify-center`}>
                  <Target className={`w-16 h-16 ${categoryIconColors[campaign.category as keyof typeof categoryIconColors] || categoryIconColors.default}`} />
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-2">
                {campaign.featured && (
                  <div className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getBadgeStyle('featured')}`}>
                    <Star className="w-3 h-3 mr-1 inline" />
                    Featured
                  </div>
                )}
                {campaign.verified && (
                  <div className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getBadgeStyle('verified')}`}>
                    <CheckCircle className="w-3 h-3 mr-1 inline" />
                    Verified
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                <div 
                  className="h-full bg-gradient-to-r from-bitcoinOrange to-orange-500 transition-all duration-700"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-bitcoinOrange transition-colors duration-200 line-clamp-2 mb-2">
                    {campaign.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">by {campaign.creator}</p>
                  <p className="text-gray-600 line-clamp-2 mb-4">
                    {campaign.description}
                  </p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{campaign.supporters_count}</span>
                  </div>
                  {campaign.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{campaign.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDaysLeft(campaign.days_left)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <CurrencyDisplay 
                    amount={campaign.current_amount}
                    currency="CHF"
                    className="text-lg font-bold text-gray-900"
                  />
                  <p className="text-sm text-gray-500">
                    {progressPercentage.toFixed(0)}% of CHF {campaign.goal_amount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Bitcoin Payment Button */}
              <div className="flex justify-end" onClick={(e) => e.preventDefault()}>
                <BitcoinPaymentButton
                  campaignId={campaign.id}
                  campaignTitle={campaign.title}
                  suggestedAmount={Math.min(50000, Math.floor(campaign.goal_amount * 0.01))}
                />
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`bg-white rounded-2xl border border-gray-100/50 hover:border-gray-200/80 hover:shadow-2xl transition-all duration-300 overflow-hidden group ${className}`}
      whileHover={{ y: -5, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link href={`/campaign/${campaign.id}`} className="block">
        {/* Image Section */}
        <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {campaign.image && !imageError ? (
            <Image
              src={campaign.image}
              alt={campaign.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${categoryColors[campaign.category as keyof typeof categoryColors] || categoryColors.default} flex items-center justify-center`}>
              <Target className={`w-20 h-20 ${categoryIconColors[campaign.category as keyof typeof categoryIconColors] || categoryIconColors.default}`} />
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {campaign.featured && (
              <motion.div 
                className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getBadgeStyle('featured')}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Star className="w-3 h-3 mr-1 inline" />
                Featured
              </motion.div>
            )}
            {campaign.verified && (
              <motion.div 
                className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getBadgeStyle('verified')}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <CheckCircle className="w-3 h-3 mr-1 inline" />
                Verified
              </motion.div>
            )}
          </div>

          {/* Like Button */}
          <motion.button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault()
              setIsLiked(!isLiked)
            }}
          >
            <Heart 
              className={`w-4 h-4 transition-colors duration-200 ${
                isLiked ? 'text-red-500 fill-red-500' : 'text-white'
              }`} 
            />
          </motion.button>

          {/* Progress Indicator */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-1.5 bg-black/20">
              <motion.div 
                className="h-full bg-gradient-to-r from-bitcoinOrange to-orange-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Title and Creator */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-bitcoinOrange transition-colors duration-200 line-clamp-2 mb-2">
              {campaign.title}
            </h3>
            <p className="text-sm text-gray-600 mb-3">by {campaign.creator}</p>
            <p className="text-gray-600 line-clamp-3 text-sm leading-relaxed">
              {campaign.description}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{campaign.supporters_count}</span>
              </div>
              {campaign.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate max-w-20">{campaign.location.split(',')[0]}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-orange-600">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{formatDaysLeft(campaign.days_left)}</span>
            </div>
          </div>

          {/* Funding Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <CurrencyDisplay 
                amount={campaign.current_amount}
                currency="CHF"
                className="text-lg font-bold text-gray-900"
              />
              <span className="text-sm font-semibold text-bitcoinOrange">
                {progressPercentage.toFixed(0)}%
              </span>
            </div>
            <p className="text-sm text-gray-500">
              of CHF {campaign.goal_amount.toLocaleString()} goal
            </p>
          </div>

          {/* Tags */}
          {campaign.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 mb-4">
              {campaign.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  {tag}
                </span>
              ))}
              {campaign.tags.length > 3 && (
                <span className="text-xs text-gray-400 self-center">
                  +{campaign.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Bitcoin Payment Button */}
          <div className="mt-4" onClick={(e) => e.preventDefault()}>
            <BitcoinPaymentButton
              campaignId={campaign.id}
              campaignTitle={campaign.title}
              suggestedAmount={Math.min(50000, Math.floor(campaign.goal_amount * 0.01))}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  )
} 