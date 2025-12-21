"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { EntityForm } from '@/components/create/EntityForm'
import { assetConfig, type AssetFormData } from '@/config/entity-configs'
import Loading from '@/components/Loading'

export default function EditAssetPage() {
  const params = useParams()
  const assetId = params?.id as string | undefined

  const [initialValues, setInitialValues] = useState<Partial<AssetFormData> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!assetId) return
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/assets/${assetId}`, { credentials: 'include' })
        if (!res.ok) {
          throw new Error('Unable to load asset')
        }
        const json = await res.json()
        if (!cancelled) {
          setInitialValues(json.data)
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load asset')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()
    return () => { cancelled = true }
  }, [assetId])

  if (!assetId) {
    return <div className="p-6">Missing asset id</div>
  }

  if (loading) {
    return <Loading />
  }

  if (error || !initialValues) {
    return <div className="p-6 text-red-600">{error || 'Asset not found'}</div>
  }

  return (
    <div className="space-y-10">
      <EntityForm
        config={assetConfig}
        initialValues={initialValues}
        mode="edit"
        entityId={assetId}
      />
    </div>
  )
}


































