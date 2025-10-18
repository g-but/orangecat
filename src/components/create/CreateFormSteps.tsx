'use client'

import React from 'react'
import Card, { CardContent } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { 
  Bitcoin, 
  Loader2, 
  ArrowRight, 
  Target,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  X,
  Globe,
  Zap,
  Users,
  Heart
} from 'lucide-react'
import { simpleCategories } from '@/config/categories'
import { getColorClasses } from '@/lib/theme'
import type { CampaignFormData } from './CreateCampaignForm'

interface StepProps {
  formData: CampaignFormData
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleCategoryToggle: (category: string) => void
  handleFileUpload: (file: File, type: 'banner' | 'gallery') => Promise<void>
  handleDrop: (e: React.DragEvent, type: 'banner' | 'gallery') => void
  handleDragOver: (e: React.DragEvent) => void
  uploadProgress: { [key: string]: number }
  isUploading: boolean
  nextStep: () => void
  prevStep: () => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>
  loading: boolean
  error: string | null
  canProceedToStep2: boolean
  canProceedToStep3: boolean
  canProceedToStep4: boolean
}

// Step 1: Project Details
export function Step1({ formData, handleChange, handleCategoryToggle, nextStep, canProceedToStep2 }: StepProps) {
  return (
    <div className="space-y-6">
      {/* Guest mode welcome message */}
      <div className="bg-gradient-to-r from-orange-50 to-tiffany-50 border border-orange-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <Target className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-orange-900 mb-1">Welcome! 👋</h3>
            <p className="text-sm text-orange-700">
              You're in guest mode. Feel free to explore the full campaign creation process.
              We'll ask you to sign in or create an account only when you're ready to publish your campaign.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your project</h2>
        <p className="text-gray-600">Share what you're building and why it matters</p>
      </div>

      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 shadow-lg">
        <CardContent className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Project Title *
            </label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="Enter your project title..."
              value={formData.title}
              onChange={handleChange}
              className="w-full text-lg"
              maxLength={100}
            />
            <div className="mt-1 text-xs text-gray-500 flex justify-between">
              <span>Make it catchy and memorable</span>
              <span>{formData.title.length}/100</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Project Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              placeholder="Describe your project, its goals, and why people should support it..."
              value={formData.description}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm"
              maxLength={2000}
            />
            <div className="mt-1 text-xs text-gray-500 flex justify-between">
              <span>Tell your story and explain your vision</span>
              <span>{formData.description.length}/2000</span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Categories (select up to 3)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {simpleCategories.map((category) => {
                const isSelected = formData.categories.includes(category.value)
                return (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => handleCategoryToggle(category.value)}
                    disabled={!isSelected && formData.categories.length >= 3}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? `${getColorClasses.bitcoin} border-orange-500 text-white shadow-lg transform scale-105`
                        : 'border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                    } ${!isSelected && formData.categories.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-center mb-1">
                      <span className="text-lg">{category.icon}</span>
                    </div>
                    {category.label}
                  </button>
                )
              })}
            </div>
            {formData.categories.length >= 3 && (
              <p className="mt-2 text-xs text-orange-600">Maximum 3 categories selected</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button
          onClick={nextStep}
          disabled={!canProceedToStep2}
          className="px-6 py-3"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// Step 2: Payment Setup
export function Step2({ formData, handleChange, nextStep, prevStep, canProceedToStep3 }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Setup</h2>
        <p className="text-gray-600">Configure how supporters can send you Bitcoin</p>
      </div>

      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 shadow-lg">
        <CardContent className="p-6 space-y-6">
          {/* Bitcoin Address */}
          <div>
            <label htmlFor="bitcoin_address" className="block text-sm font-medium text-gray-700 mb-2">
              <Bitcoin className="w-4 h-4 inline mr-2" />
              Bitcoin Address
            </label>
            <Input
              id="bitcoin_address"
              name="bitcoin_address"
              type="text"
              placeholder="bc1... or 1... or 3..."
              value={formData.bitcoin_address}
              onChange={handleChange}
              className="w-full font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Your Bitcoin wallet address where funds will be sent. No wallet yet?{' '}
              <a href="/wallets" className="text-orange-600 hover:text-orange-700 underline">Get a wallet</a>.
            </p>
          </div>

          {/* Lightning Address */}
          <div>
            <label htmlFor="lightning_address" className="block text-sm font-medium text-gray-700 mb-2">
              <Zap className="w-4 h-4 inline mr-2" />
              Lightning Address
            </label>
            <Input
              id="lightning_address"
              name="lightning_address"
              type="email"
              placeholder="user@domain.com"
              value={formData.lightning_address}
              onChange={handleChange}
              className="w-full"
            />
            <p className="mt-1 text-xs text-gray-500">
              Lightning address for instant micropayments (optional).{' '}
              <a href="/wallets" className="text-orange-600 hover:text-orange-700 underline">Learn about wallets</a>.
            </p>
          </div>

          {/* Goal Amount */}
          <div>
            <label htmlFor="goal_amount" className="block text-sm font-medium text-gray-700 mb-2">
              <Target className="w-4 h-4 inline mr-2" />
              Funding Goal (Optional)
            </label>
            <div className="relative">
              <Input
                id="goal_amount"
                name="goal_amount"
                type="number"
                step="0.00000001"
                min="0"
                placeholder="0.1"
                value={formData.goal_amount}
                onChange={handleChange}
                className="w-full pr-12"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                BTC
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Set a funding target to show progress (leave blank for no limit)
            </p>
          </div>

          {!canProceedToStep3 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                ⚠️ Please provide at least one payment address (Bitcoin or Lightning) to continue
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={prevStep}
          className="px-6 py-3"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={nextStep}
          disabled={!canProceedToStep3}
          className="px-6 py-3"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// Step 3: Final Details
export function Step3({ formData, handleChange, nextStep, prevStep }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Final Details</h2>
        <p className="text-gray-600">Add website and finishing touches</p>
      </div>

      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 shadow-lg">
        <CardContent className="p-6 space-y-6">
          {/* Website URL */}
          <div>
            <label htmlFor="website_url" className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 inline mr-2" />
              Website or Social Media (Optional)
            </label>
            <Input
              id="website_url"
              name="website_url"
              type="url"
              placeholder="https://your-website.com"
              value={formData.website_url}
              onChange={handleChange}
              className="w-full"
            />
            <p className="mt-1 text-xs text-gray-500">
              Link to your website, GitHub, Twitter, or other relevant page
            </p>
          </div>

          {/* Preview Card */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Campaign Preview
            </h3>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-lg text-gray-900 mb-2">
                {formData.title || 'Your Project Title'}
              </h4>
              <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                {formData.description || 'Your project description will appear here...'}
              </p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">
                    {formData.categories.length} categories
                  </span>
                  {formData.goal_amount && (
                    <span className="text-orange-600 font-medium">
                      Goal: {formData.goal_amount} BTC
                    </span>
                  )}
                </div>
                {formData.website_url && (
                  <Globe className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={prevStep}
          className="px-6 py-3"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={nextStep}
          className="px-6 py-3"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// Step 4: Media & Launch
export function Step4({ 
  formData, 
  handleFileUpload, 
  handleDrop, 
  handleDragOver, 
  uploadProgress, 
  isUploading, 
  prevStep, 
  handleSubmit, 
  loading, 
  error 
}: StepProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Media & Launch</h2>
        <p className="text-gray-600">Add images and launch your campaign</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 shadow-lg">
          <CardContent className="p-6 space-y-6">
            {/* Banner Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Banner Image (Optional)
              </label>
              <div
                onDrop={(e) => handleDrop(e, 'banner')}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.banner_url ? (
                  <div className="relative">
                    <img
                      src={formData.banner_url}
                      alt="Banner"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-sm">Click to change</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Drop an image here or click to browse</p>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB</p>
                  </div>
                )}
                {uploadProgress.banner > 0 && (
                  <div className="mt-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.banner}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{uploadProgress.banner}% uploaded</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {handleFileUpload(file, 'banner')}
                }}
                className="hidden"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={prevStep}
            className="px-6 py-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            type="submit"
            disabled={loading || isUploading}
            className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 mr-2" />
                Launch Campaign
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 