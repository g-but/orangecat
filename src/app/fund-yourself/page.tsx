'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { PageLayout, PageHeader, PageSection } from '@/components/layout/PageLayout'
import { Plus, Edit2, Share2, BarChart2, Loader2, ArrowRight, Bitcoin, Zap, Users, Globe } from 'lucide-react'
import { getFundingPage } from '@/services/supabase/client'
import { toast } from 'sonner'
import { getRegionalToolsTitle, getRegionalToolsDescription, fundingTools } from '@/data/marketTools'

export default function FundYourselfPage() {
  const router = useRouter()
  const { user, session } = useAuth()
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) {
      router.push('/auth?mode=login')
      return
    }

    const loadPages = async () => {
      try {
        const { data, error } = await getFundingPage(user!.id)
        if (error) throw error
        setPages(data || [])
      } catch (err) {
        console.error('Error loading pages:', err)
        setError('Failed to load your funding pages')
        toast.error('Failed to load your funding pages')
      } finally {
        setLoading(false)
      }
    }

    loadPages()
  }, [user, session, router])

  const handleCreatePage = () => {
    router.push('/create')
  }

  if (!session) {
    return null
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-tiffany-500" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <PageHeader
        title="Fund Yourself with Bitcoin"
        description="Create your funding page and start receiving Bitcoin donations for your projects, ideas, and dreams"
      />

      <PageSection>
        <h2 className="text-2xl font-bold mb-6">Why Choose Bitcoin Funding?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <Bitcoin className="w-8 h-8 text-tiffany-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Bitcoin Payments</h3>
            <p className="text-gray-600">
              Accept Bitcoin donations directly to your wallet with no platform fees
            </p>
          </Card>
          <Card className="p-6">
            <Zap className="w-8 h-8 text-tiffany-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Instant Setup</h3>
            <p className="text-gray-600">
              Create your funding page in minutes and start receiving donations immediately
            </p>
          </Card>
          <Card className="p-6">
            <Users className="w-8 h-8 text-tiffany-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Global Reach</h3>
            <p className="text-gray-600">
              Connect with Bitcoin supporters worldwide who want to fund your projects
            </p>
          </Card>
          <Card className="p-6">
            <Globe className="w-8 h-8 text-tiffany-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Limits</h3>
            <p className="text-gray-600">
              Fund any project, from creative works to business ventures, with no restrictions
            </p>
          </Card>
        </div>
      </PageSection>

      <PageSection background="tiffany">
        <h2 className="text-2xl font-bold mb-6">What Can You Fund?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Creative Projects</h3>
            <ul className="text-gray-600 space-y-2">
              <li>• Art and Music</li>
              <li>• Writing and Books</li>
              <li>• Video Content</li>
              <li>• Podcasts</li>
            </ul>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Business Ventures</h3>
            <ul className="text-gray-600 space-y-2">
              <li>• Startups</li>
              <li>• Product Development</li>
              <li>• Research</li>
              <li>• Innovation</li>
            </ul>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Personal Goals</h3>
            <ul className="text-gray-600 space-y-2">
              <li>• Education</li>
              <li>• Travel</li>
              <li>• Community Projects</li>
              <li>• Personal Development</li>
            </ul>
          </Card>
        </div>
      </PageSection>

      <PageSection>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Your Funding Pages</h2>
          <Button onClick={handleCreatePage}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Page
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {pages.length === 0 ? (
          <Card className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Start Your Journey</h3>
            <p className="text-gray-600 mb-6">
              Create your first funding page and join the Bitcoin funding revolution
            </p>
            <Button onClick={handleCreatePage}>
              Create Your First Page
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6">
            {pages.map((page) => (
              <Card key={page.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{page.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{page.description}</p>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <BarChart2 className="w-4 h-4 mr-2" />
                        <span className="mr-1">Total:</span>
                        <CurrencyDisplay 
                          bitcoin={page.total_funding || 0}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {page.contributor_count || 0} contributors
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/fund-us/${page.id}/edit`)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/fund-us/${page.id}`)}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageSection>

      <PageSection background="gray">
        <h2 className="text-2xl font-bold mb-4">{getRegionalToolsTitle('funding')}</h2>
        <p className="text-gray-600 mb-8">{getRegionalToolsDescription('funding')}</p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fundingTools.map((tool) => (
            <Card key={tool.name} className="p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${tool.color}`}>
                  <tool.icon className="w-6 h-6" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">{tool.name}</h3>
              <p className="text-gray-600 mb-4">{tool.description}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(tool.url, '_blank')}
                className="w-full"
              >
                Visit Platform
              </Button>
            </Card>
          ))}
        </div>
      </PageSection>
    </PageLayout>
  )
} 