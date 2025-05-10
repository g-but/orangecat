'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import supabase from '@/services/supabase/client'
import { Bitcoin, Zap, FileText, Target } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'sonner'

interface FundingPageFormData {
  title: string
  description: string
  bitcoin_address: string
  lightning_address: string
  goal_amount: number
  is_public: boolean
  is_active: boolean
}

export default function NewFundingPage() {
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<FundingPageFormData>({
    title: '',
    description: '',
    bitcoin_address: '',
    lightning_address: '',
    goal_amount: 0,
    is_public: true,
    is_active: true
  })

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        bitcoin_address: profile.bitcoin_address || '',
        lightning_address: profile.lightning_address || ''
      }))
    }
  }, [profile])

  const validateBitcoinAddress = (address: string) => {
    // Basic validation - can be enhanced with more specific checks
    return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || /^bc1[a-zA-HJ-NP-Z0-9]{25,90}$/i.test(address)
  }

  const validateLightningAddress = (address: string) => {
    // Basic validation - can be enhanced with more specific checks
    // Allows for LUD-06 format (user@domain.com) and LUD-16 (lnurl1...)
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/.test(address) || /^lnurl1[a-zA-HJ-NP-Z0-9]+$/i.test(address)
  }

  const handleInputChange = (field: keyof FundingPageFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'goal_amount' ? parseFloat(e.target.value) : e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!formData.title.trim()) {
        throw new Error('Title is required.')
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required.')
      }
      if (!formData.bitcoin_address.trim()) {
        throw new Error('Bitcoin address is required.')
      }
      if (!validateBitcoinAddress(formData.bitcoin_address)) {
        throw new Error('Invalid Bitcoin address format.')
      }

      if (formData.lightning_address && !validateLightningAddress(formData.lightning_address)) {
        throw new Error('Invalid Lightning address format.')
      }
      
      if (formData.goal_amount <= 0) {
        throw new Error('Funding goal must be greater than 0.')
      }

      const { error } = await supabase
        .from('funding_pages')
        .insert({
          user_id: user!.id,
          title: formData.title,
          description: formData.description,
          bitcoin_address: formData.bitcoin_address,
          lightning_address: formData.lightning_address || null,
          goal_amount: formData.goal_amount,
          is_public: formData.is_public,
          is_active: formData.is_active,
          total_funding: 0,
          contributor_count: 0
        })

      if (error) throw error

      toast.success('Funding page created successfully!')
      router.push('/dashboard/pages')
    } catch (error) {
      console.error('Error creating funding page:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create funding page')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Create New Funding Page
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <Input
                  label="Title"
                  value={formData.title}
                  onChange={handleInputChange('title')}
                  placeholder="Enter a title for your funding page"
                  required
                  icon={FileText}
                />
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your funding goal"
                    required
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-tiffany-500 focus:ring-tiffany-500 sm:text-sm p-2"
                    rows={4}
                  />
                </div>
              </div>

              {/* Payment Info */}
              <div className="space-y-4">
                <Input
                  label="Bitcoin Address"
                  value={formData.bitcoin_address}
                  onChange={handleInputChange('bitcoin_address')}
                  placeholder="Your Bitcoin address (e.g., bc1...)"
                  required
                  icon={Bitcoin}
                  error={formData.bitcoin_address && !validateBitcoinAddress(formData.bitcoin_address) ? 'Invalid Bitcoin address' : undefined}
                />
                <Input
                  label="Lightning Address (Optional)"
                  value={formData.lightning_address}
                  onChange={handleInputChange('lightning_address')}
                  placeholder="Your Lightning address (e.g., user@domain.com or lnurl1...)"
                  icon={Zap}
                  error={formData.lightning_address && !validateLightningAddress(formData.lightning_address) ? 'Invalid Lightning address' : undefined}
                />
              </div>

              {/* Goal Amount */}
              <Input
                label="Funding Goal (BTC)"
                type="number"
                step="0.00000001"
                min="0.00000001"
                value={formData.goal_amount}
                onChange={handleInputChange('goal_amount')}
                placeholder="Enter your funding goal in BTC"
                required
                icon={Target}
              />

              {/* Visibility Settings */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="is_public"
                    name="is_public"
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                    className="h-4 w-4 text-tiffany-600 focus:ring-tiffany-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                    Make this funding page public (visible on 'Fund Others')
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-tiffany-600 focus:ring-tiffany-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Set this funding page as active (accepting donations)
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push('/dashboard/pages')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !formData.title || !formData.description || !formData.bitcoin_address || !validateBitcoinAddress(formData.bitcoin_address) || (formData.lightning_address && !validateLightningAddress(formData.lightning_address)) || formData.goal_amount <= 0}
                  isLoading={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Page'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 