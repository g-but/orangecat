'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Building, Users, Globe, Bitcoin, ArrowLeft, Plus, Target, Zap } from 'lucide-react'
import { toast } from 'sonner'

export default function OrganizationDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState<any | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'projects' | 'members'>('overview')
  const { user } = useAuth()

  const fetchOrg = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/organizations/${params.slug}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data?.error || 'Failed to load organization')
      setOrg(data.data)
      if (data?.data?.id) {
        fetchMembers(data.data.id)
        fetchCampaigns(data.data.id)
        fetchProjects(data.data.id)
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrg()
  }, [params.slug])

  const fetchCampaigns = async (orgId: string) => {
    try {
      const res = await fetch(`/api/organizations/${orgId}/campaigns`)
      const data = await res.json()
      if (res.ok) {
        setCampaigns(data.data || [])
      }
    } catch (e) {
      console.error('Failed to fetch campaigns:', e)
    }
  }

  const fetchProjects = async (orgId: string) => {
    try {
      const res = await fetch(`/api/organizations/${orgId}/projects`)
      const data = await res.json()
      if (res.ok) {
        setProjects(data.data || [])
      }
    } catch (e) {
      console.error('Failed to fetch projects:', e)
    }
  }

  const fetchMembers = async (orgId: string) => {
    try {
      // This would need an API endpoint for organization members
      // For now, we'll just show the member count
    } catch (e) {
      console.error('Failed to fetch members:', e)
    }
  }

  const handleJoin = async () => {
    if (!org?.id) return
    try {
      const res = await fetch(`/api/organizations/${org.id}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to join')
      toast.success('Joined organization')
      fetchMembers(org.id)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleLeave = async () => {
    if (!org?.id) return
    try {
      const res = await fetch(`/api/organizations/${org.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to leave')
      toast.success('Left organization')
      fetchMembers(org.id)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  if (loading) {
    return <Loading fullScreen />
  }

  if (!org) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">Organization not found.</p>
          <Button onClick={() => router.push('/organizations')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to organizations
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50">
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => router.push('/organizations')} className="mr-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
                <p className="text-gray-600">{org.slug}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Building },
              { id: 'campaigns', label: 'Campaigns', icon: Target },
              { id: 'projects', label: 'Projects', icon: Zap },
              { id: 'members', label: 'Members', icon: Users }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <Target className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <Zap className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Members</p>
                    <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              {org.description ? (
                <p className="text-gray-700 mb-4">{org.description}</p>
              ) : (
                <p className="text-gray-500 mb-4">No description provided.</p>
              )}
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span className="inline-flex items-center"><Users className="w-4 h-4 mr-2" />Members: {members.length || org.member_count || 0}</span>
                {org.website_url && (
                  <a href={org.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-orange-600">
                    <Globe className="w-4 h-4 mr-2" />Website
                  </a>
                )}
                {org.treasury_address && (
                  <span className="inline-flex items-center"><Bitcoin className="w-4 h-4 mr-2" />Treasury Enabled</span>
                )}
              </div>
              <div className="mt-6">
                {members.some(m => m.profile?.id === user?.id) ? (
                  <Button onClick={handleLeave} variant="outline">Leave Organization</Button>
                ) : (
                  <Button onClick={handleJoin} className="bg-green-600 hover:bg-green-700 text-white">Join Organization</Button>
                )}
                <Button
                  variant="outline"
                  className="ml-2"
                  onClick={() => {
                    const url = typeof window !== 'undefined' ? window.location.href : ''
                    navigator.clipboard.writeText(url)
                    toast.success('Invite link copied!')
                  }}
                >
                  Copy Invite Link
                </Button>
              </div>
            </Card>
          </>
        )}

        {activeTab === 'campaigns' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Campaigns</h3>
              <Button onClick={() => toast.info('Campaign creation coming soon!')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </div>
            {campaigns.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No campaigns yet.</p>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="p-4 border rounded-lg">
                    <h4 className="font-semibold">{campaign.title}</h4>
                    <p className="text-gray-600 text-sm">{campaign.description}</p>
                    <div className="mt-2 flex justify-between">
                      <span className="text-sm font-medium">
                        {campaign.raised_amount} / {campaign.goal_amount} sats
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${campaign.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'projects' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
              <Button onClick={() => toast.info('Project creation coming soon!')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
            {projects.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No projects yet.</p>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="p-4 border rounded-lg">
                    <h4 className="font-semibold">{project.name}</h4>
                    <p className="text-gray-600 text-sm">{project.description}</p>
                    <div className="mt-2 flex justify-between">
                      <span className="text-sm font-medium">{project.category}</span>
                      <span className={`text-xs px-2 py-1 rounded ${project.visibility === 'public' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {project.visibility}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'members' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Members</h3>
            {members.length === 0 ? (
              <p className="text-gray-500">No members yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {members.map((m) => (
                  <li key={m.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        {(m.profile?.display_name || m.profile?.username || '?').slice(0,1).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-gray-900 text-sm">{m.profile?.display_name || m.profile?.username}</div>
                        <div className="text-gray-500 text-xs capitalize">{m.role}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}