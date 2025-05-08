'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Bitcoin, Zap, Loader2, ArrowRight, Info } from 'lucide-react'
import { createFundingPage } from '@/services/supabase/client'
import { toast } from 'sonner'

export default function CreatePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bitcoin_address: '',
    lightning_address: '',
    goal_amount: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!user) {
        throw new Error('You must be logged in to create a funding page')
      }

      const newPage = await createFundingPage({
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        bitcoin_address: formData.bitcoin_address,
        lightning_address: formData.lightning_address,
        is_active: true,
        total_funding: 0,
        contributor_count: 0,
        goal_amount: formData.goal_amount ? parseInt(formData.goal_amount) : 0,
        status: 'active'
      })

      if (!newPage.data) {
        throw new Error('Failed to create funding page')
      }

      toast.success('Funding page created successfully')
      router.push(`/fund-us/${newPage.data.id}/edit`)
    } catch (err) {
      console.error('Error creating page:', err)
      setError(err instanceof Error ? err.message : 'Failed to create funding page')
      toast.error('Failed to create funding page')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    router.push('/auth?mode=login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Your Funding Page</h1>
          <p className="mt-2 text-gray-600">
            Set up your page to start receiving Bitcoin donations
          </p>
        </div>

        <Card className="w-full">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <Input
                id="title"
                name="title"
                label="Page Title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="Give your page a title"
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-tiffany-500"
              />

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe what you're raising funds for"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-tiffany-500 focus:ring-2 focus:ring-tiffany-500/20 transition-colors"
                />
              </div>

              <div className="bg-tiffany-50 p-4 rounded-lg">
                <div className="flex">
                  <Bitcoin className="h-5 w-5 text-tiffany-500 flex-shrink-0" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-tiffany-800">Bitcoin Address</h3>
                    <p className="mt-1 text-sm text-tiffany-700">
                      Add your Bitcoin address to receive donations. You can update this later.
                    </p>
                  </div>
                </div>
              </div>

              <Input
                id="bitcoin_address"
                name="bitcoin_address"
                label="Bitcoin Address"
                type="text"
                value={formData.bitcoin_address}
                onChange={handleChange}
                placeholder="Enter your Bitcoin address"
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-tiffany-500"
              />

              <div className="bg-tiffany-50 p-4 rounded-lg">
                <div className="flex">
                  <Zap className="h-5 w-5 text-tiffany-500 flex-shrink-0" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-tiffany-800">Lightning Address (Optional)</h3>
                    <p className="mt-1 text-sm text-tiffany-700">
                      Add your Lightning address for instant, low-fee Bitcoin payments.
                    </p>
                  </div>
                </div>
              </div>

              <Input
                id="lightning_address"
                name="lightning_address"
                label="Lightning Address"
                type="text"
                value={formData.lightning_address}
                onChange={handleChange}
                placeholder="Enter your Lightning address"
                className="transition-all duration-200 focus:ring-2 focus:ring-tiffany-500"
              />

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex">
                  <Info className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Funding Goal (Optional)</h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Set a goal amount in sats to track your progress. You can update this later.
                    </p>
                  </div>
                </div>
              </div>

              <Input
                id="goal_amount"
                name="goal_amount"
                label="Goal Amount (sats)"
                type="number"
                value={formData.goal_amount}
                onChange={handleChange}
                placeholder="Enter your goal amount in sats"
                className="transition-all duration-200 focus:ring-2 focus:ring-tiffany-500"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="flex items-center"
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Creating...
                  </div>
                ) : (
                  <>
                    Create Page
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help? Check out our{' '}
            <a href="/docs" className="text-tiffany-600 hover:text-tiffany-700">
              documentation
            </a>
            {' '}or{' '}
            <a href="/support" className="text-tiffany-600 hover:text-tiffany-700">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
} 