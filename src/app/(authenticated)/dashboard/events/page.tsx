"use client"

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'
import EntityListPage from '@/components/entities/EntityListPage'
import { Calendar } from 'lucide-react'

type Event = {
  id: string
  name: string
  description?: string | null
}

export default function EventsDashboardPage() {
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
    <EntityListPage<Event>
      title="Events"
      description="Manage your events."
      icon={<Calendar className="w-5 h-5" />}
      primaryHref="/events/create"
      primaryLabel="Create New Event"
      secondaryHref="/discover?section=events"
      secondaryLabel="Browse Existing Events"
      items={[]}
      emptyTitle="No events yet"
      emptyDescription="Organize your first event or explore community gatherings."
      explanation="An event is a scheduled gathering or occasion for networking, fundraising, or community building in the Bitcoin space."
      examples={[
        { title: "Bitcoin Conference 2025", description: "A large-scale conference with speakers and workshops on Bitcoin technology." },
        { title: "Local Meetup", description: "A casual gathering for Bitcoin enthusiasts to network and discuss ideas." },
        { title: "Fundraising Gala", description: "An event to raise funds for a specific cause with auctions and donations." }
      ]}
      renderItem={(e) => (
        <div>
          <div className="font-semibold text-gray-900">{e.name}</div>
          {e.description ? <p className="text-sm text-gray-600 line-clamp-2">{e.description}</p> : null}
        </div>
      )}
    />
  )
}
