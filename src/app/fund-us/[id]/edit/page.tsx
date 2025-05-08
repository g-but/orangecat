'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Loader2 } from 'lucide-react'

export default function EditFundingPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadPage = useCallback(async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data, error } = await supabase
        .from('funding_pages')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setPage(data)
    } catch (err) {
      console.error('Error loading page:', err)
      toast.error('Failed to load funding page')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (user) {
      loadPage()
    }
  }, [user, loadPage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
        .from('funding_pages')
        .update({
          title: page.title,
          description: page.description,
          bitcoin_address: page.bitcoin_address,
          is_public: page.is_public
        })
        .eq('id', params.id)

      if (error) throw error
      toast.success('Funding page updated successfully')
      router.push(`/fund-us/${params.id}`)
    } catch (err) {
      console.error('Error updating page:', err)
      toast.error('Failed to update funding page')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-tiffany-500" />
      </div>
    )
  }

  if (!page) {
    return (
      <div className="text-center text-red-500 p-4">
        Funding page not found
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Funding Page</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Page Title"
            id="title"
            value={page.title}
            onChange={(e) => setPage({ ...page, title: e.target.value })}
            required
          />
          <Input
            label="Description"
            id="description"
            value={page.description}
            onChange={(e) => setPage({ ...page, description: e.target.value })}
            required
          />
          <Input
            label="Bitcoin Address"
            id="bitcoin_address"
            value={page.bitcoin_address}
            onChange={(e) => setPage({ ...page, bitcoin_address: e.target.value })}
            required
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_public"
              checked={page.is_public}
              onChange={(e) => setPage({ ...page, is_public: e.target.checked })}
              className="h-4 w-4 text-tiffany-500 focus:ring-tiffany-500 border-gray-300 rounded"
            />
            <label htmlFor="is_public" className="text-sm text-gray-600">
              Make this page public
            </label>
          </div>
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/fund-us/${params.id}`)}
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