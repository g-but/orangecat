'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getPublicFundingPage, updateFundingPage } from '@/lib/supabase'
import { toast } from 'sonner'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { Loader2 } from 'lucide-react'

export default function EditFundingPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState({
    title: '',
    description: '',
    bitcoin_address: '',
    is_public: true
  })

  useEffect(() => {
    if (user) {
      loadPage()
    }
  }, [user])

  const loadPage = async () => {
    try {
      setLoading(true)
      const data = await getPublicFundingPage(params.id)
      if (data.user_id !== user?.id) {
        router.push('/')
        return
      }
      setPage({
        title: data.title,
        description: data.description,
        bitcoin_address: data.bitcoin_address,
        is_public: data.is_public
      })
    } catch (err) {
      console.error('Error loading page:', err)
      toast.error('Failed to load funding page')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await updateFundingPage(params.id, {
        ...page,
        updated_at: new Date().toISOString()
      })
      toast.success('Funding page updated successfully')
      router.push(`/fund/${params.id}`)
    } catch (err) {
      console.error('Error updating page:', err)
      toast.error('Failed to update funding page')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Funding Page</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title
            </label>
            <Input
              id="title"
              value={page.title}
              onChange={(e) => setPage({ ...page, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <Textarea
              id="description"
              value={page.description}
              onChange={(e) => setPage({ ...page, description: e.target.value })}
              required
              rows={4}
            />
          </div>

          <div>
            <label htmlFor="bitcoin_address" className="block text-sm font-medium mb-1">
              Bitcoin Address
            </label>
            <Input
              id="bitcoin_address"
              value={page.bitcoin_address}
              onChange={(e) => setPage({ ...page, bitcoin_address: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_public"
              checked={page.is_public}
              onChange={(e) => setPage({ ...page, is_public: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="is_public" className="text-sm font-medium">
              Make this page public
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/fund/${params.id}`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
} 