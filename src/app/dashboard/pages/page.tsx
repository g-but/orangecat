'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { createClient } from '@/services/supabase/client'
import { Plus, Bitcoin, Users, Share2, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { toast } from 'sonner'

interface FundingPage {
  id: string
  title: string
  description: string
  bitcoin_address: string
  total_funding: number
  contributor_count: number
  is_active: boolean
  is_public: boolean
  created_at: string
}

export default function FundingPagesPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [pages, setPages] = useState<FundingPage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPages()
  }, [])

  const loadPages = async () => {
    try {
      const { data, error } = await createClient()
        .from('funding_pages')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPages(data || [])
    } catch (error) {
      console.error('Error loading funding pages:', error)
      toast.error('Failed to load funding pages')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStatus = async (page: FundingPage) => {
    try {
      const { error } = await createClient()
        .from('funding_pages')
        .update({ is_active: !page.is_active })
        .eq('id', page.id)

      if (error) throw error

      setPages(pages.map(p => 
        p.id === page.id ? { ...p, is_active: !p.is_active } : p
      ))

      toast.success(`Page ${page.is_active ? 'deactivated' : 'activated'} successfully`)
    } catch (error) {
      console.error('Error toggling page status:', error)
      toast.error('Failed to update page status')
    }
  }

  const handleToggleVisibility = async (page: FundingPage) => {
    try {
      const { error } = await createClient()
        .from('funding_pages')
        .update({ is_public: !page.is_public })
        .eq('id', page.id)

      if (error) throw error

      setPages(pages.map(p => 
        p.id === page.id ? { ...p, is_public: !p.is_public } : p
      ))

      toast.success(`Page visibility ${page.is_public ? 'hidden' : 'made public'} successfully`)
    } catch (error) {
      console.error('Error toggling page visibility:', error)
      toast.error('Failed to update page visibility')
    }
  }

  const handleDelete = async (page: FundingPage) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this funding page? This action cannot be undone.'
    )

    if (!confirmed) return

    try {
      const { error } = await createClient()
        .from('funding_pages')
        .delete()
        .eq('id', page.id)

      if (error) throw error

      setPages(pages.filter(p => p.id !== page.id))
      toast.success('Funding page deleted successfully')
    } catch (error) {
      console.error('Error deleting funding page:', error)
      toast.error('Failed to delete funding page')
    }
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Your Funding Pages
          </h1>
          <Link href="/dashboard/pages/new">
            <Button>
              <Plus className="w-5 h-5 mr-2" />
              Create New Page
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-tiffany-600 border-t-transparent" />
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No funding pages yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first funding page to start accepting Bitcoin donations.
            </p>
            <Link href="/dashboard/pages/new">
              <Button>
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Page
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {pages.map((page) => (
                <li key={page.id}>
                  <div className="px-4 py-5 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {page.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {page.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center text-sm text-gray-500">
                            <Bitcoin className="w-4 h-4 mr-1" />
                            {page.total_funding.toFixed(8)} BTC
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Users className="w-4 h-4 mr-1" />
                            {page.contributor_count} contributors
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            onClick={() => handleToggleVisibility(page)}
                            title={page.is_public ? 'Make Private' : 'Make Public'}
                          >
                            {page.is_public ? (
                              <Eye className="w-5 h-5 text-gray-500" />
                            ) : (
                              <EyeOff className="w-5 h-5 text-gray-500" />
                            )}
                          </Button>
                          <Button
                            variant={page.is_active ? 'primary' : 'secondary'}
                            onClick={() => handleToggleStatus(page)}
                          >
                            {page.is_active ? 'Active' : 'Inactive'}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => router.push(`/dashboard/pages/${page.id}/edit`)}
                          >
                            <Edit2 className="w-5 h-5 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleDelete(page)}
                          >
                            <Trash2 className="w-5 h-5 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
} 