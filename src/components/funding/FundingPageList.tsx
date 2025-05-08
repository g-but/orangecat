'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Plus, BarChart2, Share2, Settings, Users } from 'lucide-react'
import { createClient } from '@/services/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export default function FundingPageList() {
  const router = useRouter()
  const { user } = useAuth()
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPages = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('funding_pages')
        .select(`
          id,
          title,
          description,
          bitcoin_address,
          is_active,
          is_public,
          total_funding,
          contributor_count,
          created_at,
          updated_at
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPages(data || [])
    } catch (err) {
      console.error('Error loading pages:', err)
      setError('Failed to load funding pages')
      toast.error('Failed to load funding pages')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadPages()
    }
  }, [user, loadPages])

  const handleCreatePage = async () => {
    try {
      const supabase = createClient()
      const { data: newPage, error } = await supabase
        .from('funding_pages')
        .insert({
          user_id: user!.id,
          title: 'New Funding Page',
          description: 'Describe your project here',
          bitcoin_address: '',
          is_active: true,
          is_public: true,
          total_funding: 0,
          contributor_count: 0
        })
        .select()
        .single()

      if (error) throw error
      
      setPages([...pages, newPage])
      router.push(`/fund-us/${newPage.id}/edit`)
      toast.success('Funding page created successfully')
    } catch (err) {
      console.error('Error creating page:', err)
      toast.error('Failed to create funding page')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center text-red-500 p-4">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Funding Pages</h2>
          <Button onClick={handleCreatePage}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Page
          </Button>
        </div>

        {pages.length === 0 ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Card className="p-8 text-center max-w-md">
              <p className="text-gray-500 mb-6">You haven&apos;t created any funding pages yet.</p>
              <Button onClick={handleCreatePage}>
                Create Your First Page
              </Button>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => (
              <Card key={page.id} className="p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">{page.title}</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/fund-us/${page.id}/edit`)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/fund-us/${page.id}`)}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-gray-600 mb-6 line-clamp-2">{page.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <BarChart2 className="w-4 h-4 mr-1" />
                    <span>{page.total_funding} sats</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{page.contributor_count} contributors</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 