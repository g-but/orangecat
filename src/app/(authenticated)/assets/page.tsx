"use client"

import { useEffect, useState } from 'react'
import { Briefcase } from 'lucide-react'
import EntityListPage from '@/components/entities/EntityListPage'
import Button from '@/components/ui/Button'

type AssetItem = { id: string; title: string; type: string; estimated_value: number | null; currency: string; verification_status: string; created_at?: string }

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/assets', { credentials: 'include' })
        const json = await res.json()
        if (!cancelled) setAssets(json.data || [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this asset? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/assets/${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) {
        throw new Error('Failed to delete asset')
      }
      setAssets(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error(err)
      alert('Could not delete asset. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <EntityListPage<AssetItem>
      title="Assets"
      description="List and manage your non‑Bitcoin assets. Use them as collateral for loans."
      icon={<Briefcase className="w-5 h-5" />}
      primaryHref="/assets/create"
      primaryLabel="Create Asset"
      items={assets}
      emptyTitle="No assets yet"
      emptyDescription="Create your first asset to manage and optionally use it as collateral for loans."
      explanation="Assets can be properties, businesses, vehicles, equipment, or portfolios. OrangeCat does not verify user-submitted claims; perform your own due diligence."
      renderItem={(a) => (
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="font-semibold">{a.title}</div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{a.type.replace('_', ' ')}</span>
          </div>
          <div className="text-sm text-gray-600">{a.estimated_value ? `${a.estimated_value} ${a.currency}` : '—'}</div>
          <div className="text-xs text-gray-500 mt-1">Verification: {a.verification_status.replace('_',' ')}</div>
          <div className="flex gap-2 mt-3">
            <Button href={`/assets/${a.id}`} size="sm" variant="outline">
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDelete(a.id)}
              disabled={deletingId === a.id}
            >
              {deletingId === a.id ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      )}
    />
  )
}
