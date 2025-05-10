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

interface Props {
  params: {
    id: string
  }
}

export default function EditFundingPage({ params }: Props) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState<FundingPageFormData>({
    title: '',
    description: '',
    bitcoin_address: '',
    lightning_address: '',
    goal_amount: 0,
    is_public: true,
    is_active: true
  })

  const validateBitcoinAddress = (address: string) => {
    // Basic validation - can be enhanced with more specific checks
    return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)
  }

  const validateLightningAddress = (address: string) => {
    // Basic validation - can be enhanced with more specific checks
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(address)
  }

  useEffect(() => {
    loadFundingPage()
  }, [])

  const loadFundingPage = async () => {
    try {
      const { data, error } = await supabase
        .from('funding_pages')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user!.id)
        .single()

      if (error) throw error

      if (!data) {
        toast.error('Funding page not found')
        router.push('/dashboard/pages')
        return
      }

      setFormData({
        title: data.title,
        description: data.description,
        bitcoin_address: data.bitcoin_address,
        lightning_address: data.lightning_address || '',
        goal_amount: data.goal_amount,
        is_public: data.is_public,
        is_active: data.is_active
      })
    } catch (error) {
      console.error('Error loading funding page:', error)
      toast.error('Failed to load funding page')
      router.push('/dashboard/pages')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof FundingPageFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'goal_amount' ? parseFloat(e.target.value) : e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate Bitcoin address
      if (!validateBitcoinAddress(formData.bitcoin_address)) {
        throw new Error('Invalid Bitcoin address')
      }

      // Validate Lightning address if provided
      if (formData.lightning_address && !validateLightningAddress(formData.lightning_address)) {
        throw new Error('Invalid Lightning address')
      }

      const { error } = await supabase
        .from('funding_pages')
        .update({
          title: formData.title,
          description: formData.description,
          bitcoin_address: formData.bitcoin_address,
          lightning_address: formData.lightning_address,
          goal_amount: formData.goal_amount,
          is_public: formData.is_public,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('user_id', user!.id)

      if (error) throw error

      toast.success('Funding page updated successfully')
      router.push('/dashboard/pages')
    } catch (error) {
      console.error('Error updating funding page:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update funding page')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-tiffany-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Edit Funding Page
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your funding goal"
                    required
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-tiffany-500 focus:ring-tiffany-500 sm:text-sm"
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
                  placeholder="Your Bitcoin address"
                  required
                  icon={Bitcoin}
                  error={formData.bitcoin_address && !validateBitcoinAddress(formData.bitcoin_address) ? 'Invalid Bitcoin address' : undefined}
                />
                <Input
                  label="Lightning Address (Optional)"
                  value={formData.lightning_address}
                  onChange={handleInputChange('lightning_address')}
                  placeholder="Your Lightning address"
                  icon={Zap}
                  error={formData.lightning_address && !validateLightningAddress(formData.lightning_address) ? 'Invalid Lightning address' : undefined}
                />
              </div>

              {/* Goal Amount */}
              <Input
                label="Funding Goal (BTC)"
                type="number"
                step="0.00000001"
                min="0"
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
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                    className="h-4 w-4 text-tiffany-600 focus:ring-tiffany-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                    Make this funding page public
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-tiffany-600 focus:ring-tiffany-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Keep this funding page active
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
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
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 