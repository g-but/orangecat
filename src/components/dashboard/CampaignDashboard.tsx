'use client'

import { useAuth } from '@/hooks/useAuth'
import { useCampaigns } from '@/hooks/useCampaigns'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { 
  Plus, 
  Edit, 
  Share, 
  DollarSign,
  TrendingUp,
  FileText,
  Pause
} from 'lucide-react'
import { toast } from 'sonner'

interface CampaignDashboardProps {
  className?: string
}

export default function CampaignDashboard({ className = '' }: CampaignDashboardProps) {
  const { user } = useAuth()
  const { 
    isLoading, 
    stats, 
    drafts, 
    activeCampaigns, 
    pausedCampaigns,
    getPrimaryDraft 
  } = useCampaigns()

  if (isLoading) {
    return (
      <div className={`space-y-6 animate-pulse ${className}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  const copyPageLink = (pageId: string) => {
    const url = `${window.location.origin}/fund-us/${pageId}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied!')
  }

  const formatAmount = (amount: number) => {
    if (amount >= 1) {
      return `₿${amount.toFixed(6)}`
    }
    return `${(amount * 100_000_000).toFixed(0)} sats`
  }

  const getProgress = (campaign: any) => {
    if (!campaign.goal_amount) return 0
    return Math.min(((campaign.total_funding || 0) / campaign.goal_amount) * 100, 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const primaryDraft = getPrimaryDraft()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
              </div>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalActive}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalDrafts}</p>
              </div>
              <Edit className="w-5 h-5 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Raised</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatAmount(stats.totalRaised)}
                </p>
              </div>
              <DollarSign className="w-5 h-5 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drafts Section */}
      {stats.totalDrafts > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Drafts ({stats.totalDrafts})</h2>
              <Button href="/create" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </div>
            
            <div className="space-y-3">
              {/* Display all drafts using unified data */}
              {drafts.map((draft) => (
                <div 
                  key={draft.id} 
                  className={`p-4 rounded-lg border ${
                    draft.source === 'local' 
                      ? 'bg-orange-50 border-orange-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{draft.title}</h3>
                      <p className={`text-sm ${
                        draft.source === 'local' 
                          ? 'text-orange-600' 
                          : 'text-gray-500'
                      }`}>
                        {draft.source === 'local' 
                          ? 'Unsaved changes' 
                          : `Updated ${formatDate(draft.updated_at)}`
                        }
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      href={draft.source === 'local' ? '/create' : `/create?draft=${draft.id}`}
                    >
                      {draft.source === 'local' ? 'Continue' : 'Edit'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Campaigns */}
      {stats.totalActive > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Active Campaigns ({stats.totalActive})
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              {activeCampaigns.map((campaign) => (
                <div key={campaign.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{campaign.title}</h3>
                      <p className="text-sm text-gray-500">
                        {formatAmount(campaign.total_funding || 0)} / {formatAmount(campaign.goal_amount || 0)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyPageLink(campaign.id)}
                      >
                        <Share className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgress(campaign)}%` }}
                    />
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    {Math.round(getProgress(campaign))}% funded
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paused Campaigns */}
      {stats.totalPaused > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Paused Campaigns ({stats.totalPaused})
            </h2>
            
            <div className="space-y-3">
              {pausedCampaigns.map((campaign) => (
                <div key={campaign.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Pause className="w-4 h-4 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900">{campaign.title}</h3>
                        <p className="text-sm text-gray-500">
                          Raised {formatAmount(campaign.total_funding || 0)}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Reactivate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {stats.totalCampaigns === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No campaigns yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first Bitcoin fundraising campaign
            </p>
            <Button href="/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 