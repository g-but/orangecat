'use client'

import { useEffect, useState } from 'react'
import { Shield, CheckCircle, Circle, TrendingUp, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'

interface TransparencyScoreProps {
  profileId: string
  className?: string
  showDetails?: boolean
  compact?: boolean
}

interface TransparencyScoreData {
  score: number
  maxScore: number
  factors: Record<string, number>
  calculatedAt: string
}

interface ProfileCompletion {
  username: boolean
  displayName: boolean
  avatar: boolean
  bio: boolean
  bitcoinAddress: boolean
  lightningAddress: boolean
  website: boolean
  location: boolean
  verified: boolean
}

export function TransparencyScore({
  profileId,
  className,
  showDetails = false,
  compact = false
}: TransparencyScoreProps) {
  const [scoreData, setScoreData] = useState<TransparencyScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransparencyScore = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/transparency/${profileId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch transparency score')
        }

        const data = await response.json()
        setScoreData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transparency score')
      } finally {
        setLoading(false)
      }
    }

    if (profileId) {
      fetchTransparencyScore()
    }
  }, [profileId])

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardContent className="p-4">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </CardContent>
      </Card>
    )
  }

  if (error || !scoreData) {
    return (
      <Card className={cn("border-orange-200", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-orange-600">
            <Info className="w-4 h-4" />
            <span className="text-sm">Transparency score unavailable</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { score, maxScore, factors } = scoreData
  const percentage = Math.round((score / maxScore) * 100)

  const getScoreColor = (score: number) => {
    if (score >= 80) {
      return 'text-green-600'
    }
    if (score >= 60) {
      return 'text-blue-600'
    }
    if (score >= 40) {
      return 'text-orange-600'
    }
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) {
      return 'bg-green-50 border-green-200'
    }
    if (score >= 60) {
      return 'bg-blue-50 border-blue-200'
    }
    if (score >= 40) {
      return 'bg-orange-50 border-orange-200'
    }
    return 'bg-red-50 border-red-200'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) {
      return 'Excellent'
    }
    if (score >= 80) {
      return 'Very Good'
    }
    if (score >= 70) {
      return 'Good'
    }
    if (score >= 60) {
      return 'Fair'
    }
    if (score >= 40) {
      return 'Needs Improvement'
    }
    return 'Incomplete'
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1">
          <Shield className={cn("w-4 h-4", getScoreColor(score))} />
          <span className={cn("text-sm font-medium", getScoreColor(score))}>
            {percentage}%
          </span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-3 h-3 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Transparency Score: {getScoreLabel(score)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <Card className={cn(getScoreBgColor(score), className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className={cn("w-5 h-5", getScoreColor(score))} />
          Transparency Score
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>Your transparency score reflects how complete and trustworthy your profile appears to others. Higher scores build trust and encourage more engagement.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Display */}
        <div className="flex items-center justify-between">
          <div>
            <div className={cn("text-3xl font-bold", getScoreColor(score))}>
              {percentage}%
            </div>
            <div className="text-sm text-gray-600">
              {getScoreLabel(score)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              {score.toFixed(1)} / {maxScore}
            </div>
            <div className="text-xs text-gray-400">
              Last updated: {new Date(scoreData.calculatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Score Breakdown */}
        {showDetails && Object.keys(factors).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Score Breakdown</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(factors).map(([factor, points]) => (
                <div key={factor} className="flex items-center gap-2">
                  {points > 0 ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <Circle className="w-3 h-3 text-gray-300" />
                  )}
                  <span className="capitalize">
                    {factor.replace('_', ' ')}: +{points}pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Encouragement Message */}
        {score < 80 && (
          <div className="p-3 bg-white/50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-gray-800">
                  {score >= 60 ? 'Almost there!' : 'Complete your profile'}
                </p>
                <p className="text-gray-600">
                  {score >= 60
                    ? 'Add a few more details to reach excellent transparency.'
                    : 'Complete more profile fields to build trust and increase your score.'
                  }
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={() => window.location.href = '/profile'}
            >
              Update Profile
            </Button>
          </div>
        )}

        {/* Perfect Score Message */}
        {score >= 90 && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Excellent transparency!</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Your profile demonstrates high transparency and builds strong trust with the community.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
export default TransparencyScore
