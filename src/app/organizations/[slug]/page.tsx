'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/services/supabase/core/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PageLayout, PageSection } from '@/components/layout/PageLayout'
import {
  Building,
  Users,
  Settings,
  Plus,
  Crown,
  User,
  Mail,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react'
import type { Organization, OrganizationMember } from '@/types/database'

export default function OrganizationPage() {
  const params = useParams()
  const router = useRouter()
  const { user, session } = useAuth()

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [currentMember, setCurrentMember] = useState<OrganizationMember | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const slug = params.slug as string

  useEffect(() => {
    if (slug) {
      loadOrganization()
    }
  }, [slug, session])

  const loadOrganization = async () => {
    try {
      setIsLoading(true)

      // Load organization from database
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single()

      if (orgError) {
        throw orgError
      }

      setOrganization(orgData)

      // Load members from database
      const { data: membersData, error: membersError } = await supabase
        .from('organization_members')
        .select(`
          *,
          profiles!inner (
            username,
            name,
            avatar_url
          )
        `)
        .eq('organization_id', orgData.id)
        .eq('status', 'active')

      if (membersError) {
        console.error('Error loading members:', membersError)
        setMembers([])
      } else {
        setMembers(membersData || [])
      }

      // Find current user's membership
      if (session?.user && membersData) {
        const currentUserMembership = membersData.find(
          (member: any) => member.user_id === session.user.id
        )
        setCurrentMember(currentUserMembership || null)
      } else {
        setCurrentMember(null)
      }

    } catch (err: any) {
      console.error('Error loading organization:', err)
      setError(err?.message || 'Failed to load organization')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInviteMember = () => {
    // TODO: Implement member invitation modal/form
    alert('Member invitation feature coming soon!')
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'admin':
        return <Settings className="w-4 h-4 text-blue-500" />
      default:
        return <User className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Owner'
      case 'admin':
        return 'Admin'
      default:
        return 'Member'
    }
  }

  if (isLoading) {
    return (
      <PageLayout>
        <PageSection>
          <div className="flex justify-center items-center min-h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading organization...</span>
          </div>
        </PageSection>
      </PageLayout>
    )
  }

  if (isLoading) {
    return (
      <PageLayout>
        <PageSection>
          <div className="flex justify-center items-center min-h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading organization...</span>
          </div>
        </PageSection>
      </PageLayout>
    )
  }

  if (error || !organization) {
    return (
      <PageLayout>
        <PageSection>
          <Card className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Organization Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || 'The organization you\'re looking for doesn\'t exist or you don\'t have access to it.'}
            </p>
            <Button onClick={() => router.push('/organizations')}>
              Browse Organizations
            </Button>
          </Card>
        </PageSection>
      </PageLayout>
    )
  }

  const isOwner = currentMember?.role === 'owner'
  const isAdmin = currentMember?.role === 'admin'
  const canManageMembers = isOwner || isAdmin

  return (
    <PageLayout>
      {/* Organization Header */}
      <PageSection>
        <Card className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Building className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{organization.name}</h1>
                {organization.description && (
                  <p className="text-gray-600 mb-3">{organization.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>@{organization.slug}</span>
                  {organization.website && (
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {canManageMembers && (
              <div className="flex gap-2">
                <Button
                  onClick={handleInviteMember}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
                <Button
                  onClick={() => router.push(`/organizations/${slug}/settings`)}
                  variant="outline"
                  size="sm"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            )}
          </div>

          {/* Organization Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{members.length}</div>
              <div className="text-sm text-gray-600">Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-600">Active Projects</div>
            </div>
          </div>
        </Card>
      </PageSection>

      {/* Members Section */}
      <PageSection>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Team Members</h2>
          {canManageMembers && (
            <Button onClick={handleInviteMember}>
              <Plus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          )}
        </div>

        <div className="grid gap-4">
          {members.map((member) => (
            <Card key={member.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {member.profiles?.avatar_url ? (
                      <img
                        src={member.profiles.avatar_url}
                        alt={member.profiles.name || member.profiles.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">
                      {member.profiles?.name || member.profiles?.username || 'Unknown User'}
                    </div>
                    <div className="text-sm text-gray-500">
                      @{member.profiles?.username}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getRoleIcon(member.role)}
                  <span className="text-sm font-medium">{getRoleLabel(member.role)}</span>
                </div>
              </div>
            </Card>
          ))}

          {members.length === 0 && (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Members Yet</h3>
              <p className="text-gray-600 mb-4">
                Start building your team by inviting the first members to join your organization.
              </p>
              {canManageMembers && (
                <Button onClick={handleInviteMember}>
                  <Plus className="w-4 h-4 mr-2" />
                  Invite First Member
                </Button>
              )}
            </Card>
          )}
        </div>
      </PageSection>

      {/* Organization Actions */}
      {currentMember && (
        <PageSection>
          <h2 className="text-2xl font-bold mb-6">Organization Actions</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
              <Building className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Create Project</h3>
              <p className="text-sm text-gray-600">Launch a new project under this organization</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
              <Users className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">View Members</h3>
              <p className="text-sm text-gray-600">Manage team members and permissions</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
              <Settings className="w-8 h-8 text-gray-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Organization Settings</h3>
              <p className="text-sm text-gray-600">Update organization details and preferences</p>
            </Card>
          </div>
        </PageSection>
      )}

      {/* Membership Status */}
      {!currentMember && (
        <PageSection>
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">Not a Member</h3>
                <p className="text-sm text-blue-800">
                  You're viewing this organization but are not a member. Contact an organization admin to be invited.
                </p>
              </div>
            </div>
          </Card>
        </PageSection>
      )}
    </PageLayout>
  )
}
