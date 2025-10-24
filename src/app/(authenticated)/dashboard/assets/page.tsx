"use client"

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'
import EntityListPage from '@/components/entities/EntityListPage'
import { Package } from 'lucide-react'

type Asset = {
  id: string
  name: string
  description?: string | null
}

export default function AssetsDashboardPage() {
  const { user, hydrated, isLoading } = useAuth()
  const router = useRouter()

  if (!hydrated || isLoading) {
    return <Loading fullScreen />
  }

  if (!user) {
    router.push('/auth')
    return <Loading fullScreen />
  }

  return (
    <EntityListPage<Asset>
      title="Assets"
      description="Manage your digital assets."
      icon={<Package className="w-5 h-5" />}
      primaryHref="/assets/create"
      primaryLabel="Create New Asset"
      secondaryHref="/discover?section=assets"
      secondaryLabel="Browse Existing Assets"
      items={[]}
      emptyTitle="No assets yet"
      emptyDescription="Create or acquire digital assets and collectibles."
      explanation="Assets are digital items or collectibles that can be owned, traded, or used within the OrangeCat platform."
      examples={[
        { title: "Bitcoin NFT", description: "A unique digital artwork related to Bitcoin." },
        { title: "Virtual Event Ticket", description: "A digital ticket for access to exclusive events." },
        { title: "Collectible Badge", description: "A badge representing achievement or membership." }
      ]}
      renderItem={(a) => (
        <div>
          <div className="font-semibold text-gray-900">{a.name}</div>
          {a.description ? <p className="text-sm text-gray-600 line-clamp-2">{a.description}</p> : null}
        </div>
      )}
    />
  )
}
