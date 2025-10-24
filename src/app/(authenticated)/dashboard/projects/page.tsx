'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Loading from '@/components/Loading'
import EntityListPage from '@/components/entities/EntityListPage'
import { Target } from 'lucide-react'
import { useCampaignStore, Campaign } from '@/stores/campaignStore'
import Button from '@/components/ui/Button'

export default function ProjectsDashboardPage() {
  const { user, isLoading, hydrated, session } = useAuth()
  const router = useRouter()
  const { projects, loadProjects } = useCampaignStore()

  // Handle loading states
  if (!hydrated || isLoading) {
    return <Loading fullScreen />
  }

  // Handle unauthenticated state
  if (!user || !session) {
    router.push('/auth?from=projects')
    return <Loading fullScreen />
  }

  useEffect(() => {
    if (user?.id) {
      loadProjects(user.id)
    }
  }, [user?.id, loadProjects])

  const items = useMemo(() => projects, [projects])

  return (
    <EntityListPage<Campaign>
      title="Projects"
      description="Manage your Bitcoin projects and initiatives."
      icon={<Target className="w-5 h-5" />}
      primaryHref="/projects/create"
      primaryLabel="Create New Project"
      secondaryHref="/discover?section=projects"
      secondaryLabel="Browse Existing Projects"
      items={items}
      emptyTitle="No projects yet"
      emptyDescription="Create your first project to start accepting Bitcoin donations and building support for your cause."
      explanation="A project is any initiative, cause, or endeavor that needs funding. From personal projects to organizations and community efforts - accept Bitcoin donations directly to your wallet."
      examples={[
        { title: "Community Garden Project", description: "Creating a shared community space with raised garden beds and educational workshops." },
        { title: "Local Animal Shelter", description: "Supporting animal rescue operations and veterinary care for abandoned pets." },
        { title: "Art Exhibition Fundraiser", description: "Organizing a traveling art show featuring local artists and cultural exhibits." }
      ]}
      renderItem={(c) => (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">{c.title || 'Untitled Project'}</h3>
              {c.description ? (
                <p className="text-sm text-gray-600 line-clamp-2">{c.description}</p>
              ) : null}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : c.isDraft ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
              {c.isActive ? 'Active' : c.isDraft ? 'Draft' : 'Completed'}
            </span>
          </div>
          <div className="text-sm text-gray-700">
            <span>
              {(c.current_amount || 0) > 0 ? `${(c.current_amount || 0)} sats raised` : 'No funds raised yet'}
              {c.goal_amount ? ` of ${c.goal_amount} sats` : ''}
            </span>
          </div>
          <div className="pt-2 flex gap-2">
            {c.isActive ? (
              <Button href={`/projects/${c.id}`} size="sm" variant="outline">View</Button>
            ) : (
              <Button href={`/projects/create?edit=${c.id}`} size="sm" variant="outline">Edit</Button>
            )}
          </div>
        </div>
      )}
    />
  )
}