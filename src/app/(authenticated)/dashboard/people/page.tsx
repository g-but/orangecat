"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'
import EntityListPage from '@/components/entities/EntityListPage'
import { Users } from 'lucide-react'
import Button from '@/components/ui/Button'

type Person = {
  id: string
  username?: string
  name?: string
  bio?: string
  avatar_url?: string
}

export default function PeopleDashboardPage() {
  const { user, hydrated, isLoading } = useAuth()
  const router = useRouter()
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      try {
        const res = await fetch(`/api/social/following/${user.id}`)
        if (!res.ok) throw new Error('Failed to fetch following')
        const json = await res.json()
        const items = (json.data || []).map((f: any) => f.profiles)
        setPeople(items)
      } catch (e) {
        setPeople([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  if (!hydrated || isLoading) {
    return <Loading fullScreen />
  }

  if (!user) {
    router.push('/auth')
    return <Loading fullScreen />
  }

  if (loading) {
    return <Loading fullScreen />
  }

  return (
    <EntityListPage<Person>
      title="People"
      description="Manage your network and connections."
      icon={<Users className="w-5 h-5" />}
      primaryHref="/profile" // Assuming update own profile as primary
      primaryLabel="Update Your Profile"
      secondaryHref="/discover?section=people"
      secondaryLabel="Browse People"
      items={people}
      emptyTitle="No connections yet"
      emptyDescription="Build your network by connecting with others in the community."
      explanation="People are individual users on OrangeCat. Building connections helps in collaboration, support, and community growth."
      examples={[
        { title: "Bitcoin Enthusiast", description: "A user passionate about Bitcoin technology and education." },
        { title: "Nonprofit Organizer", description: "Someone organizing charitable events and projects." },
        { title: "Developer Contributor", description: "A coder contributing to open-source Bitcoin projects." }
      ]}
      renderItem={(p) => (
        <div>
          <div className="font-semibold text-gray-900">{p.name || p.username}</div>
          {p.bio ? <p className="text-sm text-gray-600 line-clamp-2">{p.bio}</p> : null}
          <div className="pt-2">
            <Button href={`/people/${p.id}`} size="sm" variant="outline">Open</Button>
          </div>
        </div>
      )}
    />
  )
}
