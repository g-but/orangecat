'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCampaignStore, Campaign } from '@/stores/campaignStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { 
  Edit3, 
  BarChart3, 
  Settings, 
  Save, 
  Trash2, 
  Eye, 
  Share, 
  Copy,
  ExternalLink,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface CampaignManagementProps {
  campaign: Campaign
  onClose?: () => void
}

export default function CampaignManagement({ campaign, onClose }: CampaignManagementProps) {
  const { user } = useAuth()
  const { updateCampaign, deleteCampaign } = useCampaignStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const [editForm, setEditForm] = useState({
    title: campaign.title || '',
    description: campaign.description || '',
    bitcoin_address: campaign.bitcoin_address || '',
    lightning_address: campaign.lightning_address || '',
    website_url: campaign.website_url || '',
    goal_amount: campaign.goal_amount || 0,
  })

  const formatAmount = (amount: number) => {
    if (amount >= 1) {
      return `₿${amount.toFixed(6)}`
    }
    return `${(amount * 100_000_000).toFixed(0)} sats`
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'goal_amount' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSave = async () => {
    if (!user?.id) {return}
    
    setIsSaving(true)
    try {
      await updateCampaign(user.id, campaign.id, {
        ...editForm,
        categories: [campaign.category, ...(campaign.tags || [])].filter((item): item is string => Boolean(item)),
        images: []
      })
      toast.success('Campaign updated successfully')
      setIsEditing(false)
    } catch (error) {
      toast.error('Failed to update campaign')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user?.id) {return}
    
    try {
      await deleteCampaign(campaign.id)
      toast.success('Campaign deleted successfully')
      onClose?.()
    } catch (error) {
      toast.error('Failed to delete campaign')
    }
  }

  const copyPageLink = () => {
    const url = `${window.location.origin}/fund-us/${campaign.id}`
    navigator.clipboard.writeText(url)
    toast.success('Campaign link copied!')
  }

  const viewCampaign = () => {
    window.open(`/fund-us/${campaign.id}`, '_blank')
  }

  const getProgress = () => {
    if (!campaign.goal_amount) {return 0}
    return Math.min(((campaign.total_funding || 0) / campaign.goal_amount) * 100, 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{campaign.title}</h2>
          <p className="text-gray-500">
            {campaign.isActive ? 'Active Campaign' : campaign.isPaused ? 'Paused Campaign' : 'Draft Campaign'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={viewCampaign}>
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button variant="outline" onClick={copyPageLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Raised</p>
                <p className="text-lg font-bold text-green-600">
                  {formatAmount(campaign.total_funding || 0)}
                </p>
              </div>
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Goal</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatAmount(campaign.goal_amount || 0)}
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-lg font-bold text-orange-600">{Math.round(getProgress())}%</p>
              </div>
              <BarChart3 className="w-5 h-5 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contributors</p>
                <p className="text-lg font-bold text-purple-600">{campaign.contributor_count || 0}</p>
              </div>
              <Users className="w-5 h-5 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Funding Progress</h3>
            <span className="text-sm text-gray-500">{Math.round(getProgress())}% of goal</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Campaign Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Campaign Details</CardTitle>
            <Button 
              variant={isEditing ? "outline" : "ghost"}
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <Input
                  name="title"
                  value={editForm.title}
                  onChange={handleInputChange}
                  placeholder="Campaign title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Campaign description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goal Amount (BTC)</label>
                <Input
                  name="goal_amount"
                  type="number"
                  step="0.00000001"
                  value={editForm.goal_amount}
                  onChange={handleInputChange}
                  placeholder="0.01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bitcoin Address</label>
                <Input
                  name="bitcoin_address"
                  value={editForm.bitcoin_address}
                  onChange={handleInputChange}
                  placeholder="bc1q..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lightning Address</label>
                <Input
                  name="lightning_address"
                  value={editForm.lightning_address}
                  onChange={handleInputChange}
                  placeholder="user@lightning.network"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                <Input
                  name="website_url"
                  value={editForm.website_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700">Description</h4>
                <p className="text-gray-600">{campaign.description || 'No description provided'}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700">Bitcoin Address</h4>
                  <p className="text-sm text-gray-600 font-mono break-all">
                    {campaign.bitcoin_address || 'Not configured'}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700">Lightning Address</h4>
                  <p className="text-sm text-gray-600">
                    {campaign.lightning_address || 'Not configured'}
                  </p>
                </div>
              </div>
              
              {campaign.website_url && (
                <div>
                  <h4 className="font-medium text-gray-700">Website</h4>
                  <a 
                    href={campaign.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {campaign.website_url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-600">Delete Campaign</h4>
              <p className="text-sm text-gray-600">This action cannot be undone.</p>
            </div>
            <Button 
              variant="danger" 
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
          
          {showDeleteConfirm && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 mb-3">
                Are you sure you want to delete this campaign? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button variant="danger" size="sm" onClick={handleDelete}>
                  Yes, Delete
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 