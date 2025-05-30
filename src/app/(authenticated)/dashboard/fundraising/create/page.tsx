'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { useState } from 'react'
import { Loader2, Rocket, Target, Clock, Users } from 'lucide-react'

export default function CreateCampaignPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal: '',
    category: 'personal'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // TODO: Create campaign logic here
      // For now, just redirect to dashboard
      router.push('/dashboard/fundraising')
    } catch (error) {
      console.error('Error creating campaign:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 py-6">
        <div className="flex items-center justify-center space-x-2 text-orange-600 mb-4">
          <Rocket className="h-8 w-8" />
          <h1 className="text-3xl font-bold text-gray-900">Create Your Campaign</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Launch your Bitcoin-powered fundraising campaign in minutes. No marketing fluff, just results.
        </p>
      </div>

      {/* Quick Start Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Set a clear goal</p>
            <p className="text-xs text-gray-500">Be specific about what you're raising for</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Tell your story</p>
            <p className="text-xs text-gray-500">Connect with supporters emotionally</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Launch fast</p>
            <p className="text-xs text-gray-500">Get started now, refine later</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Form */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Campaign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campaign Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-gray-700">
                Campaign Title *
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Help me fund my startup"
                className="w-full"
                required
              />
              <p className="text-xs text-gray-500">Make it clear and compelling</p>
            </div>

            {/* Campaign Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description *
              </label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tell your story. Why are you raising funds? What will you use them for? Be authentic and specific."
                className="w-full min-h-[120px]"
                required
              />
              <p className="text-xs text-gray-500">Aim for 2-3 paragraphs. Be personal and specific.</p>
            </div>

            {/* Fundraising Goal */}
            <div className="space-y-2">
              <label htmlFor="goal" className="text-sm font-medium text-gray-700">
                Fundraising Goal (USD) *
              </label>
              <Input
                id="goal"
                name="goal"
                type="number"
                value={formData.goal}
                onChange={handleChange}
                placeholder="5000"
                className="w-full"
                required
                min="1"
              />
              <p className="text-xs text-gray-500">Set a realistic target that covers your actual needs</p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="personal">Personal</option>
                <option value="business">Business</option>
                <option value="charity">Charity</option>
                <option value="creative">Creative</option>
                <option value="community">Community</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="px-6"
              >
                Back
              </Button>
              
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  className="px-6"
                  onClick={() => {
                    // TODO: Save as draft
                    console.log('Save as draft')
                  }}
                >
                  Save Draft
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !formData.title || !formData.description || !formData.goal}
                  className="px-8 bg-orange-600 hover:bg-orange-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      Create Campaign
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Need help?</h3>
          <p className="text-xs text-blue-700">
            Check out our <a href="/docs" className="underline hover:no-underline">campaign guide</a> or 
            browse <a href="/fund-others" className="underline hover:no-underline">successful campaigns</a> for inspiration.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 