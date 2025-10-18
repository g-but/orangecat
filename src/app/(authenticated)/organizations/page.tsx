'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { 
  Building, 
  Search, 
  Filter, 
  Plus, 
  Users, 
  ExternalLink,
  Bitcoin,
  Globe,
  Calendar,
  Star,
  Shield,
  Vote,
  Briefcase,
  Award,
  BarChart3,
  Network,
  ChevronRight
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Loading from '@/components/Loading'
import CreateOrganizationModal from '@/components/organizations/CreateOrganizationModal'
import OrganizationCard from '@/components/organizations/OrganizationCard'
import { toast } from 'sonner'
import type { Organization, OrganizationType, OrganizationSearchParams } from '@/types/organization'

interface OrganizationFilters {
  search: string
  type?: OrganizationType
  category?: string
  sortBy: 'name' | 'created_at' | 'trust_score'
  order: 'asc' | 'desc'
}

export default function OrganizationsPage() {
  const { user, hydrated, isLoading } = useAuth()
  const router = useRouter()
  
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filters, setFilters] = useState<OrganizationFilters>({
    search: '',
    sortBy: 'created_at',
    order: 'desc'
  })
  const [showFilters, setShowFilters] = useState(false)

  // Check authentication
  if (!hydrated || isLoading) {
    return <Loading fullScreen />
  }

  if (!user) {
    router.push('/auth')
    return <Loading fullScreen />
  }

  useEffect(() => {
    fetchOrganizations()
  }, [filters.sortBy, filters.order, filters.type])

  const fetchOrganizations = async () => {
    try {
      setSearchLoading(true)
      
      const params = new URLSearchParams({
        sort: filters.sortBy,
        order: filters.order,
        limit: '20'
      })

      if (filters.type) {params.append('type', filters.type)}
      if (filters.category) {params.append('category', filters.category)}
      if (filters.search) {params.append('q', filters.search)}

      const response = await fetch(`/api/organizations?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch organizations')
      }

      const data = await response.json()
      setOrganizations(data.data || [])
    } catch (error) {
      toast.error('Failed to load organizations')
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
  }

  const handleSearch = () => {
    fetchOrganizations()
  }

  if (loading) {
    return <Loading fullScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
                <p className="text-gray-600">Discover and join Bitcoin organizations</p>
              </div>
            </div>
            
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Organization
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search organizations by name or description..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-4"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button onClick={handleSearch} disabled={searchLoading}>
                {searchLoading ? 'Searching...' : 'Search'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization Type</label>
                  <select
                    value={filters.type || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as OrganizationType || undefined }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="dao">DAO</option>
                    <option value="company">Company</option>
                    <option value="nonprofit">Non-Profit</option>
                    <option value="community">Community</option>
                    <option value="cooperative">Cooperative</option>
                    <option value="foundation">Foundation</option>
                    <option value="collective">Collective</option>
                    <option value="guild">Guild</option>
                    <option value="syndicate">Syndicate</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <Input
                    placeholder="Enter category..."
                    value={filters.category || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="created_at">Date Created</option>
                    <option value="name">Name</option>
                    <option value="trust_score">Trust Score</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({
                        search: '',
                        sortBy: 'created_at',
                        order: 'desc'
                      })
                      fetchOrganizations()
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{organizations.length}</div>
                <div className="text-sm text-gray-500">Total Organizations</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Vote className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {organizations.filter(o => o.type === 'dao').length}
                </div>
                <div className="text-sm text-gray-500">DAOs</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {organizations.filter(o => o.type === 'company').length}
                </div>
                <div className="text-sm text-gray-500">Companies</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {organizations.filter(o => o.type === 'community').length}
                </div>
                <div className="text-sm text-gray-500">Communities</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <OrganizationCard 
              key={org.id} 
              organization={org}
              onJoin={(orgId) => {
                // TODO: Implement join organization functionality
                toast.info('Join organization feature coming soon!')
              }}
              onTip={(orgId) => {
                // TODO: Implement Bitcoin tipping functionality
                toast.info('Bitcoin tipping feature coming soon!')
              }}
            />
          ))}
        </div>

        {/* Empty State */}
        {organizations.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
            <p className="text-gray-500 mb-6">
              {filters.search ? 'Try adjusting your search terms' : 'Be the first to create an organization!'}
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Organization
            </Button>
          </div>
        )}

        {/* Loading State */}
        {searchLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <p className="text-gray-500 mt-2">Searching organizations...</p>
          </div>
        )}
      </div>

      {/* Create Organization Modal */}
      <CreateOrganizationModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(newOrg) => {
          setOrganizations(prev => [newOrg, ...prev])
          fetchOrganizations() // Refresh the list
        }}
      />
    </div>
  )
}