'use client'

import { useAuth } from '@/hooks/useAuth'
import { useCampaignStore, Campaign } from '@/stores/campaignStore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ShareButton from '@/components/sharing/ShareButton'
import CampaignDetailsModal from './CampaignDetailsModal'
import { 
  Plus, 
  Edit, 
  DollarSign,
  TrendingUp,
  FileText,
  Pause
} from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

interface CampaignDashboardProps {
  className?: string
}

export default function CampaignDashboard({ className = '' }: CampaignDashboardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { 
    isLoading, 
    drafts, 
    activeProjects,
    pausedProjects,
    pauseCampaign,
    resumeCampaign,
    loadCampaignForEdit,
    updateCampaign,
    getStats
  } = useCampaignStore()
  
  const stats = getStats()
  
  // Modal state
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const getProgress = (project: any) => {
    if (!project.goal_amount) {return 0}
    return Math.min(((project.total_funding || 0) / project.goal_amount) * 100, 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const primaryDraft = drafts.length > 0 ? drafts[0] : null

  const handlePauseCampaign = async (projectId: string) => {
    if (!user?.id) {return}
    try {
      await pauseCampaign(user.id, projectId)
      toast.success('Campaign paused successfully')
    } catch (error) {
      toast.error('Failed to pause project')
    }
  }

  const handleResumeCampaign = async (projectId: string) => {
    if (!user?.id) {return}
    try {
      await resumeCampaign(user.id, projectId)
      toast.success('Campaign resumed successfully')
    } catch (error) {
      toast.error('Failed to resume project')
    }
  }

  const openCampaignModal = (project: Campaign) => {
    setSelectedCampaign(project)
    setIsModalOpen(true)
  }

  const closeCampaignModal = () => {
    setSelectedCampaign(null)
    setIsModalOpen(false)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
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

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paused</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalPaused}</p>
              </div>
              <Pause className="w-5 h-5 text-orange-400" />
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
              <Button href="/projects/create" size="sm">
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
                    draft.syncStatus === 'pending' 
                      ? 'bg-orange-50 border-orange-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{draft.title}</h3>
                      <p className={`text-sm ${
                        draft.syncStatus === 'pending' 
                          ? 'text-orange-600' 
                          : 'text-gray-500'
                      }`}>
                        {draft.syncStatus === 'pending' 
                          ? 'Unsaved changes' 
                          : `Updated ${formatDate(draft.updated_at)}`
                        }
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      href={draft.syncStatus === 'pending' ? '/projects/create' : `/projects/create?draft=${draft.id}`}
                    >
                      {draft.syncStatus === 'pending' ? 'Continue' : 'Edit'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Projects */}
      {stats.totalActive > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Active Projects ({stats.totalActive})
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              {activeProjects.map((project) => (
                <div key={project.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{project.title}</h3>
                      <p className="text-sm text-gray-500">
                        {formatAmount(project.total_funding || 0)} / {formatAmount(project.goal_amount || 0)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <ShareButton
                        projectId={project.id}
                        projectTitle={project.title || 'Untitled Campaign'}
                        projectDescription={project.description || undefined}
                        variant="icon"
                        size="sm"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCampaignModal(project)}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePauseCampaign(project.id)}
                        className="text-gray-500 hover:text-orange-600"
                      >
                        <Pause className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgress(project)}%` }}
                    />
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    {Math.round(getProgress(project))}% funded
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paused Projects */}
      {pausedProjects.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Paused Projects ({pausedProjects.length})
            </h2>
            
            <div className="space-y-3">
              {pausedProjects.map((project) => (
                <div key={project.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Pause className="w-4 h-4 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900">{project.title}</h3>
                        <p className="text-sm text-gray-500">
                          Raised {formatAmount(project.total_funding || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCampaignModal(project)}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleResumeCampaign(project.id)}>
                        Resume
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {stats.totalProjects === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No projects yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first Bitcoin fundraising project
            </p>
            <Button href="/projects/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedCampaign && (
        <CampaignDetailsModal
          project={selectedCampaign}
          isOpen={isModalOpen}
          onClose={closeCampaignModal}
        />
      )}
    </div>
  )
} 
