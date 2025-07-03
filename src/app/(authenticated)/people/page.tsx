'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Search, 
  Filter, 
  MapPin, 
  Briefcase, 
  Star, 
  Plus, 
  MessageCircle,
  ExternalLink,
  Bitcoin,
  Zap,
  Code,
  GraduationCap,
  Megaphone
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Loading from '@/components/Loading'
import PersonCard from '@/components/people/PersonCard'
import { toast } from 'sonner'

interface Person {
  id: string
  username?: string
  display_name?: string
  bio?: string
  avatar_url?: string
  website?: string
  bitcoin_address?: string
  lightning_address?: string
  created_at: string
  profile_views?: number
  campaign_count?: number
  total_raised?: number
}

interface PersonFilters {
  search: string
  skills: string[]
  location: string
  sortBy: 'recent' | 'popular' | 'verified'
}

export default function PeoplePage() {
  const { user, hydrated, isLoading } = useAuth()
  const router = useRouter()
  
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [filters, setFilters] = useState<PersonFilters>({
    search: '',
    skills: [],
    location: '',
    sortBy: 'recent'
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
    fetchPeople()
  }, [filters.sortBy])

  const fetchPeople = async () => {
    try {
      setSearchLoading(true)
      
      // For now, we'll fetch from the profiles table since that's where people data is stored
      const response = await fetch(`/api/profiles?limit=20&sort=${filters.sortBy}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch people')
      }

      const data = await response.json()
      setPeople(data.data || [])
    } catch (error) {
      console.error('Error fetching people:', error)
      toast.error('Failed to load people')
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!filters.search.trim()) {
      fetchPeople()
      return
    }

    try {
      setSearchLoading(true)
      
      const response = await fetch(`/api/profiles/search?q=${encodeURIComponent(filters.search)}`)
      
      if (!response.ok) {
        throw new Error('Failed to search people')
      }

      const data = await response.json()
      setPeople(data.data || [])
    } catch (error) {
      console.error('Error searching people:', error)
      toast.error('Failed to search people')
    } finally {
      setSearchLoading(false)
    }
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
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">People</h1>
                <p className="text-gray-600">Connect with Bitcoin enthusiasts and builders</p>
              </div>
            </div>
            
            <Button 
              onClick={() => router.push('/profile')}
              className="bg-gradient-to-r from-orange-600 to-teal-600 hover:from-orange-700 hover:to-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Update Profile
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
                  placeholder="Search by name, skills, or bio..."
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="popular">Most Popular</option>
                    <option value="verified">Verified</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <Input
                    placeholder="Enter location..."
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({
                        search: '',
                        skills: [],
                        location: '',
                        sortBy: 'recent'
                      })
                      fetchPeople()
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
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{people.length}</div>
                <div className="text-sm text-gray-500">Total People</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Code className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {people.filter(p => p.bio?.toLowerCase().includes('developer')).length}
                </div>
                <div className="text-sm text-gray-500">Developers</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {people.filter(p => p.bitcoin_address || p.lightning_address).length}
                </div>
                <div className="text-sm text-gray-500">Bitcoin Enabled</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {people.filter(p => p.campaign_count && p.campaign_count > 0).length}
                </div>
                <div className="text-sm text-gray-500">Active Creators</div>
              </div>
            </div>
          </Card>
        </div>

        {/* People Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {people.map((person) => (
            <PersonCard 
              key={person.id} 
              person={person}
              onConnect={(personId) => {
                // TODO: Implement connect functionality
                toast.info('Connect feature coming soon!')
              }}
              onTip={(personId) => {
                // TODO: Implement Bitcoin tipping functionality
                toast.info('Bitcoin tipping feature coming soon!')
              }}
            />
          ))}
        </div>

        {/* Empty State */}
        {people.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No people found</h3>
            <p className="text-gray-500 mb-6">
              {filters.search ? 'Try adjusting your search terms' : 'Be the first to create a profile!'}
            </p>
            <Button onClick={() => router.push('/profile')}>
              <Plus className="w-4 h-4 mr-2" />
              Update Your Profile
            </Button>
          </div>
        )}

        {/* Loading State */}
        {searchLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="text-gray-500 mt-2">Searching people...</p>
          </div>
        )}
      </div>
    </div>
  )
}