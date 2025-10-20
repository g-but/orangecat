'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useAuth } from '@/hooks/useAuth'

interface CreateOrganizationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (organization: any) => void
}

export default function CreateOrganizationModal({
  isOpen,
  onClose,
  onSuccess
}: CreateOrganizationModalProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    type: 'community',
    governance_model: 'hierarchical',
    website_url: '',
    treasury_address: '',
    is_public: true
  })

  const organizationTypes = [
    { value: 'dao', label: 'DAO - Decentralized Autonomous Organization' },
    { value: 'company', label: 'Company - For-profit business' },
    { value: 'nonprofit', label: 'Non-profit - Charitable organization' },
    { value: 'community', label: 'Community - Community group' },
    { value: 'cooperative', label: 'Cooperative - Co-owned organization' },
    { value: 'foundation', label: 'Foundation - Educational foundation' },
    { value: 'collective', label: 'Collective - Member-owned collective' },
    { value: 'guild', label: 'Guild - Professional association' },
    { value: 'syndicate', label: 'Syndicate - Investment syndicate' }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const generateSlug = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setFormData(prev => ({ ...prev, slug }))
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, name: value }))
    if (!formData.slug || formData.slug === '') {
      generateSlug(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Validate form data
      if (!formData.name.trim() || !formData.slug.trim() || !formData.type) {
        setError('Please fill in all required fields')
        setIsLoading(false)
        return
      }

      // Call the API to create organization
      const response = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          type: formData.type,
          governance_model: formData.governance_model,
          website_url: formData.website_url || undefined,
          treasury_address: formData.treasury_address || undefined,
          is_public: formData.is_public
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create organization')
        setIsLoading(false)
        return
      }

      // Show success state
      setSuccess(true)
      setFormData({
        name: '',
        slug: '',
        description: '',
        type: 'community',
        governance_model: 'hierarchical',
        website_url: '',
        treasury_address: '',
        is_public: true
      })

      // Call success callback after a delay
      setTimeout(() => {
        onSuccess(data)
        setSuccess(false)
      }, 1500)

    } catch (err) {
      console.error('Error creating organization:', err)
      setError(err instanceof Error ? err.message : 'Failed to create organization')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
          {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">Create Organization</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-blue-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
                >
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-800">Organization created successfully!</p>
                    <p className="text-sm text-green-700">Redirecting to your new organization...</p>
          </div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
                >
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-800">Error</p>
                    <p className="text-sm text-red-700">{error}</p>
          </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name *
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g., Bitcoin Education Foundation"
                    required
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">The official name of your organization</p>
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization URL (Slug) *
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        placeholder="bitcoin-education"
                        required
                        className="w-full"
                      />
                    </div>
                    <Button
                          type="button"
                      variant="outline"
                      onClick={() => generateSlug(formData.name)}
                      disabled={!formData.name}
                    >
                      Auto-generate
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">URL-friendly identifier (lowercase, hyphens only)</p>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {organizationTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Choose the type that best describes your organization</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Tell us about your organization, its mission, and goals..."
                    rows={4}
                    className="w-full resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Helps supporters understand your organization</p>
                </div>

                {/* Website URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL
                  </label>
                  <Input
                    type="url"
                    name="website_url"
                    value={formData.website_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your organization's website</p>
                </div>

                {/* Treasury Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bitcoin Treasury Address
                  </label>
                  <Input
                    type="text"
                    name="treasury_address"
                    value={formData.treasury_address}
                    onChange={handleInputChange}
                    placeholder="bc1q..."
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Where Bitcoin donations will be received</p>
                </div>

                {/* Visibility */}
                <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                    name="is_public"
                      checked={formData.is_public}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Make this organization public
                    </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || success}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : success ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Created!
                      </>
                    ) : (
                      'Create Organization'
                    )}
                  </Button>
                </div>
          </form>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
