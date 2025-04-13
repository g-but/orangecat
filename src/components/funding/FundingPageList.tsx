'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Plus, BarChart2, Share2, Settings } from 'lucide-react'
import { getFundingPages, createFundingPage } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export default function FundingPageList() {
  const router = useRouter()
  const { user } = useAuth()
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadPages()
    }
  }, [user])

  const loadPages = async () => {
    try {
      setLoading(true)
      const data = await getFundingPages(user!.id)
      setPages(data)
    } catch (err) {
      console.error('Error loading pages:', err)
      setError('Failed to load funding pages')
      toast.error('Failed to load funding pages')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePage = async () => {
    try {
      const newPage = await createFundingPage({
        user_id: user!.id,
        title: 'New Funding Page',
        description: 'Describe your project here',
        bitcoin_address: '',
        is_verified: false,
        verification_level: 0,
        is_public: true
      })
      
      setPages([...pages, newPage])
      router.push(`/fund/${newPage.id}/edit`)
      toast.success('Funding page created successfully')
    } catch (err) {
      console.error('Error creating page:', err)
      toast.error('Failed to create funding page')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Funding Pages</h2>
        <Button onClick={handleCreatePage}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Page
        </Button>
      </div>

      {pages.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-gray-500">You haven't created any funding pages yet.</p>
          <Button className="mt-4" onClick={handleCreatePage}>
            Create Your First Page
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => (
            <Card key={page.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{page.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{page.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/fund/${page.id}`)}
                  >
                    <BarChart2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/fund/${page.id}/share`)}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/fund/${page.id}/edit`)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className={`px-2 py-1 rounded-full ${
                  page.is_verified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {page.is_verified ? 'Verified' : 'Unverified'}
                </span>
                <span className="text-gray-500">
                  {new Date(page.created_at).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 