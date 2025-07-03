'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  X, 
  Building, 
  Upload, 
  Bitcoin, 
  Globe, 
  Users,
  Vote,
  Briefcase,
  Award,
  Network,
  Shield,
  Loader2
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Textarea from '@/components/ui/Textarea'
import { toast } from 'sonner'
import type { 
  OrganizationFormData, 
  OrganizationType, 
  GovernanceModel,
  ORGANIZATION_TYPES,
  GOVERNANCE_MODELS
} from '@/types/organization'

interface CreateOrganizationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (organization: any) => void
}

const ORGANIZATION_TYPES_CONFIG = [
  { value: 'dao' as OrganizationType, label: 'DAO', description: 'Decentralized Autonomous Organization', icon: Vote },
  { value: 'company' as OrganizationType, label: 'Company', description: 'Business organization', icon: Briefcase },
  { value: 'nonprofit' as OrganizationType, label: 'Non-Profit', description: 'Non-profit organization', icon: Award },
  { value: 'community' as OrganizationType, label: 'Community', description: 'Community group', icon: Users },
  { value: 'cooperative' as OrganizationType, label: 'Cooperative', description: 'Member-owned cooperative', icon: Network },
  { value: 'foundation' as OrganizationType, label: 'Foundation', description: 'Charitable foundation', icon: Shield },
  { value: 'collective' as OrganizationType, label: 'Collective', description: 'Informal collective', icon: Users },
  { value: 'guild' as OrganizationType, label: 'Guild', description: 'Professional guild', icon: Award },
  { value: 'syndicate' as OrganizationType, label: 'Syndicate', description: 'Investment syndicate', icon: Briefcase }
]

const GOVERNANCE_MODELS_CONFIG = [
  { value: 'hierarchical' as GovernanceModel, label: 'Hierarchical', description: 'Traditional top-down structure' },
  { value: 'flat' as GovernanceModel, label: 'Flat', description: 'Flat organizational structure' },
  { value: 'democratic' as GovernanceModel, label: 'Democratic', description: 'One person, one vote' },
  { value: 'consensus' as GovernanceModel, label: 'Consensus', description: 'Consensus-based decisions' },
  { value: 'liquid_democracy' as GovernanceModel, label: 'Liquid Democracy', description: 'Delegatable voting' },
  { value: 'quadratic_voting' as GovernanceModel, label: 'Quadratic Voting', description: 'Quadratic voting system' },
  { value: 'stake_weighted' as GovernanceModel, label: 'Stake Weighted', description: 'Voting power based on stake' },
  { value: 'reputation_based' as GovernanceModel, label: 'Reputation Based', description: 'Voting based on reputation' }
]

export default function CreateOrganizationModal({ isOpen, onClose, onSuccess }: CreateOrganizationModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // Multi-step form: 1=Basic, 2=Details, 3=Settings
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    description: '',
    website_url: '',
    avatar_url: '',
    banner_url: '',
    type: 'community',
    category: '',
    tags: [],
    governance_model: 'hierarchical',
    treasury_address: '',
    is_public: true,
    requires_approval: true,
    contact_info: {},
    settings: {}
  })
  const [tagInput, setTagInput] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Organization name is required')
      return
    }

    if (!formData.type) {
      toast.error('Organization type is required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create organization')
      }

      const data = await response.json()
      toast.success('Organization created successfully!')
      
      if (onSuccess) {
        onSuccess(data.data)
      }
      
      onClose()
      
      // Navigate to the new organization page
      router.push(`/organizations/${data.data.slug}`)
      
    } catch (error: any) {
      console.error('Error creating organization:', error)
      toast.error(error.message || 'Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const nextStep = () => setStep(step + 1)
  const prevStep = () => setStep(step - 1)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create Organization</h2>
                <p className="text-sm text-gray-600">Step {step} of 3</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter organization name..."
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {ORGANIZATION_TYPES_CONFIG.map((type) => {
                      const Icon = type.icon
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.type === type.value
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-5 h-5 mx-auto mb-1" />
                          <div className="text-xs font-medium">{type.label}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <Textarea
                    placeholder="Describe your organization's mission and goals..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="button" onClick={nextStep}>
                    Next: Details
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                  <Input
                    type="url"
                    placeholder="https://yourorganization.com"
                    value={formData.website_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <Input
                    placeholder="e.g., Technology, Education, Finance..."
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-green-600 hover:text-green-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      Add
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Avatar URL</label>
                  <Input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                  />
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button type="button" onClick={nextStep}>
                    Next: Settings
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Settings */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Settings</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Governance Model</label>
                  <select
                    value={formData.governance_model}
                    onChange={(e) => setFormData(prev => ({ ...prev, governance_model: e.target.value as GovernanceModel }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {GOVERNANCE_MODELS_CONFIG.map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label} - {model.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bitcoin Treasury Address</label>
                  <Input
                    placeholder="bc1q... (optional)"
                    value={formData.treasury_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, treasury_address: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Members can send contributions to this Bitcoin address
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="is_public"
                      checked={formData.is_public}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="is_public" className="flex items-center text-sm text-gray-700">
                      <Globe className="w-4 h-4 mr-2 text-gray-400" />
                      Make organization publicly visible
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="requires_approval"
                      checked={formData.requires_approval}
                      onChange={(e) => setFormData(prev => ({ ...prev, requires_approval: e.target.checked }))}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="requires_approval" className="flex items-center text-sm text-gray-700">
                      <Shield className="w-4 h-4 mr-2 text-gray-400" />
                      Require approval for new members
                    </label>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Organization'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </Card>
    </div>
  )
}