'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Loading from '@/components/Loading'
import { 
  Search, 
  Star, 
  GitBranch, 
  Users, 
  Plus, 
  Code, 
  Zap, 
  Shield, 
  Bitcoin,
  ExternalLink,
  Heart,
  MessageCircle,
  Share2,
  Filter,
  Calendar,
  Award,
  TrendingUp,
  Eye,
  GitFork
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ProjectsEmptyState } from '@/components/ui/EmptyState'
import { ProjectsSearchAndFilter } from '@/components/ui/SearchAndFilter'
import { toast } from 'sonner'

interface Project {
  id: string
  name: string
  description: string
  category: string
  status: 'active' | 'completed' | 'archived' | 'seeking_contributors'
  stars: number
  contributors: number
  language: string
  license: string
  repository_url?: string
  website_url?: string
  tags: string[]
  last_updated: string
  bitcoin_enabled?: boolean
  funding_goal?: number
  funding_raised?: number
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
  looking_for?: string[]
  owner?: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }
}

interface ProjectFilters {
  search: string
  category: string
  status: string
  language: string
  difficulty: string
  sortBy: 'recent' | 'popular' | 'stars' | 'contributors'
  showOnlyBookmarked: boolean
}

export default function ProjectsPage() {
  const { user, hydrated, isLoading } = useAuth()
  const router = useRouter()
  
  const [projects, setProjects] = useState<Project[]>([])
  const [myProjects, setMyProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    category: 'all',
    status: 'all',
    language: 'all',
    difficulty: 'all',
    sortBy: 'recent',
    showOnlyBookmarked: false
  })
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState<'discover' | 'my-projects'>('discover')

  const categories = ['all', 'wallet', 'lightning', 'mining', 'exchange', 'tools', 'education', 'defi', 'nft', 'gaming']
  const languages = ['all', 'JavaScript', 'Python', 'Rust', 'Go', 'C++', 'Java', 'TypeScript', 'Solidity']
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced']

  // Check authentication
  if (!hydrated || isLoading) {
    return <Loading fullScreen />
  }

  if (!user) {
    router.push('/auth')
    return <Loading fullScreen />
  }

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchProjects()
    } else {
      fetchMyProjects()
    }
  }, [filters.sortBy, filters.category, filters.status, filters.language, filters.difficulty, activeTab])

  const fetchProjects = async () => {
    try {
      setSearchLoading(true)
      
      // Mock data for now - replace with actual API call
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'Bitcoin Core',
          description: 'Bitcoin Core is the reference implementation of Bitcoin. It includes a wallet, RPC server, and P2P network node.',
          category: 'wallet',
          status: 'active',
          stars: 75000,
          contributors: 500,
          language: 'C++',
          license: 'MIT',
          repository_url: 'https://github.com/bitcoin/bitcoin',
          website_url: 'https://bitcoincore.org',
          tags: ['Core', 'Reference', 'Full Node'],
          last_updated: '2025-01-01',
          bitcoin_enabled: true,
          difficulty_level: 'advanced',
          looking_for: ['C++ Developers', 'Security Researchers', 'Testers'],
          owner: {
            id: 'bitcoin-org',
            username: 'bitcoin',
            display_name: 'Bitcoin Organization'
          }
        },
        {
          id: '2',
          name: 'Lightning Network Daemon',
          description: 'The Lightning Network Daemon (lnd) is a complete implementation of a Lightning Network node.',
          category: 'lightning',
          status: 'seeking_contributors',
          stars: 7500,
          contributors: 150,
          language: 'Go',
          license: 'MIT',
          repository_url: 'https://github.com/lightningnetwork/lnd',
          website_url: 'https://lightning.engineering',
          tags: ['Lightning', 'Payments', 'Layer 2'],
          last_updated: '2024-12-28',
          bitcoin_enabled: true,
          difficulty_level: 'intermediate',
          looking_for: ['Go Developers', 'Protocol Designers', 'Mobile Developers'],
          funding_goal: 100000,
          funding_raised: 45000,
          owner: {
            id: 'lightning-labs',
            username: 'lightninglabs',
            display_name: 'Lightning Labs'
          }
        },
        {
          id: '3',
          name: 'Electrum',
          description: 'Electrum is a lightweight Bitcoin wallet focused on speed and simplicity, with low resource usage.',
          category: 'wallet',
          status: 'active',
          stars: 5200,
          contributors: 80,
          language: 'Python',
          license: 'MIT',
          repository_url: 'https://github.com/spesmilo/electrum',
          website_url: 'https://electrum.org',
          tags: ['SPV', 'Lightweight', 'Desktop'],
          last_updated: '2024-12-20',
          bitcoin_enabled: true,
          difficulty_level: 'beginner',
          looking_for: ['Python Developers', 'UI/UX Designers', 'Translators'],
          owner: {
            id: 'spesmilo',
            username: 'spesmilo',
            display_name: 'Spesmilo'
          }
        },
        {
          id: '4',
          name: 'BTCPay Server',
          description: 'BTCPay Server is a self-hosted, open-source cryptocurrency payment processor.',
          category: 'tools',
          status: 'seeking_contributors',
          stars: 6000,
          contributors: 200,
          language: 'C#',
          license: 'MIT',
          repository_url: 'https://github.com/btcpayserver/btcpayserver',
          website_url: 'https://btcpayserver.org',
          tags: ['Payments', 'Merchant', 'Self-hosted'],
          last_updated: '2024-12-30',
          bitcoin_enabled: true,
          difficulty_level: 'intermediate',
          looking_for: ['C# Developers', 'DevOps Engineers', 'Documentation Writers'],
          funding_goal: 50000,
          funding_raised: 32000,
          owner: {
            id: 'btcpayserver',
            username: 'btcpayserver',
            display_name: 'BTCPay Server'
          }
        },
        {
          id: '5',
          name: 'Bisq',
          description: 'Bisq is a peer-to-peer decentralized Bitcoin exchange network.',
          category: 'exchange',
          status: 'active',
          stars: 4500,
          contributors: 100,
          language: 'Java',
          license: 'AGPL-3.0',
          repository_url: 'https://github.com/bisq-network/bisq',
          website_url: 'https://bisq.network',
          tags: ['P2P', 'Decentralized', 'Exchange'],
          last_updated: '2024-12-25',
          bitcoin_enabled: true,
          difficulty_level: 'advanced',
          looking_for: ['Java Developers', 'Security Auditors', 'Network Engineers'],
          owner: {
            id: 'bisq-network',
            username: 'bisq',
            display_name: 'Bisq Network'
          }
        }
      ]
      
      setProjects(mockProjects)
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
  }

  const fetchMyProjects = async () => {
    try {
      setSearchLoading(true)
      // Mock data for user's projects
      setMyProjects([])
    } catch (error) {
      console.error('Error fetching my projects:', error)
      toast.error('Failed to load your projects')
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
  }

  const handleSearch = () => {
    if (activeTab === 'discover') {
      fetchProjects()
    } else {
      fetchMyProjects()
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         project.description.toLowerCase().includes(filters.search.toLowerCase()) ||
                         project.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()))
    
    const matchesCategory = filters.category === 'all' || project.category === filters.category
    const matchesStatus = filters.status === 'all' || project.status === filters.status
    const matchesLanguage = filters.language === 'all' || project.language === filters.language
    const matchesDifficulty = filters.difficulty === 'all' || project.difficulty_level === filters.difficulty
    
    return matchesSearch && matchesCategory && matchesStatus && matchesLanguage && matchesDifficulty
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'seeking_contributors': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'wallet': return <Shield className="w-4 h-4" />
      case 'lightning': return <Zap className="w-4 h-4" />
      case 'tools': return <Code className="w-4 h-4" />
      case 'mining': return <Award className="w-4 h-4" />
      default: return <Code className="w-4 h-4" />
    }
  }

  const handleJoinProject = (projectId: string) => {
    toast.success('Interest submitted! Project owner will be notified.')
  }

  const handleStarProject = (projectId: string) => {
    toast.success('Project starred!')
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
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Code className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                <p className="text-gray-600">Discover open-source projects and creative initiatives to contribute to</p>
              </div>
            </div>
            
            <Button 
              onClick={() => router.push('/projects/submit')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Submit Project
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('discover')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'discover'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Search className="w-4 h-4 inline mr-2" />
                Discover Projects
              </button>
              <button
                onClick={() => setActiveTab('my-projects')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-projects'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Code className="w-4 h-4 inline mr-2" />
                My Projects ({myProjects.length})
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'discover' ? (
          <>
            {/* Search and Filters */}
            <ProjectsSearchAndFilter
              searchValue={filters.search}
              onSearchChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
              onSearch={handleSearch}
              isLoading={searchLoading}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
              filters={[
                {
                  key: 'category',
                  label: 'Category',
                  type: 'select',
                  options: categories.map(cat => ({
                    value: cat,
                    label: cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)
                  })),
                  value: filters.category,
                  onChange: (value) => setFilters(prev => ({ ...prev, category: value }))
                },
                {
                  key: 'status',
                  label: 'Status',
                  type: 'select',
                  options: [
                    { value: 'all', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'seeking_contributors', label: 'Seeking Contributors' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'archived', label: 'Archived' }
                  ],
                  value: filters.status,
                  onChange: (value) => setFilters(prev => ({ ...prev, status: value }))
                },
                {
                  key: 'language',
                  label: 'Language',
                  type: 'select',
                  options: languages.map(lang => ({
                    value: lang,
                    label: lang === 'all' ? 'All Languages' : lang
                  })),
                  value: filters.language,
                  onChange: (value) => setFilters(prev => ({ ...prev, language: value }))
                },
                {
                  key: 'difficulty',
                  label: 'Difficulty',
                  type: 'select',
                  options: difficulties.map(diff => ({
                    value: diff,
                    label: diff === 'all' ? 'All Levels' : diff.charAt(0).toUpperCase() + diff.slice(1)
                  })),
                  value: filters.difficulty,
                  onChange: (value) => setFilters(prev => ({ ...prev, difficulty: value }))
                },
                {
                  key: 'sortBy',
                  label: 'Sort By',
                  type: 'select',
                  options: [
                    { value: 'recent', label: 'Most Recent' },
                    { value: 'popular', label: 'Most Popular' },
                    { value: 'stars', label: 'Most Stars' },
                    { value: 'contributors', label: 'Most Contributors' }
                  ],
                  value: filters.sortBy,
                  onChange: (value) => setFilters(prev => ({ ...prev, sortBy: value }))
                }
              ]}
              onClearFilters={() => {
                setFilters({
                  search: '',
                  category: 'all',
                  status: 'all',
                  language: 'all',
                  difficulty: 'all',
                  sortBy: 'recent',
                  showOnlyBookmarked: false
                })
                fetchProjects()
              }}
            />

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Code className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{filteredProjects.length}</div>
                    <div className="text-sm text-gray-500">Total Projects</div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {filteredProjects.filter(p => p.status === 'seeking_contributors').length}
                    </div>
                    <div className="text-sm text-gray-500">Seeking Contributors</div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Bitcoin className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {filteredProjects.filter(p => p.bitcoin_enabled).length}
                    </div>
                    <div className="text-sm text-gray-500">Bitcoin Enabled</div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {filteredProjects.reduce((sum, p) => sum + p.contributors, 0)}
                    </div>
                    <div className="text-sm text-gray-500">Total Contributors</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Projects Grid */}
            <div className="space-y-6">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        {getCategoryIcon(project.category)}
                        <div className="text-white text-xs font-bold ml-1">
                          {project.category.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(project.status)}>
                              {project.status.replace('_', ' ')}
                            </Badge>
                            {project.difficulty_level && (
                              <Badge className={getDifficultyColor(project.difficulty_level)}>
                                {project.difficulty_level}
                              </Badge>
                            )}
                            {project.bitcoin_enabled && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Bitcoin className="w-3 h-3 mr-1" />
                                Bitcoin
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center">
                            <Star className="w-4 h-4 mr-1" />
                            {project.stars.toLocaleString()}
                          </span>
                          <span className="flex items-center">
                            <GitFork className="h-4 w-4 mr-1" />
                            {project.contributors.toLocaleString()}
                          </span>
                          <span className="flex items-center">
                            <Code className="w-4 h-4 mr-1" />
                            {project.language}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(project.last_updated).toLocaleDateString()}
                          </span>
                        </div>

                        {project.looking_for && project.looking_for.length > 0 && (
                          <div className="mb-3">
                            <span className="text-sm font-medium text-gray-700">Looking for: </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {project.looking_for.map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {project.funding_goal && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Funding Progress</span>
                              <span className="font-medium">
                                ${project.funding_raised?.toLocaleString()} / ${project.funding_goal.toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-purple-600 h-2 rounded-full" 
                                style={{ width: `${((project.funding_raised || 0) / project.funding_goal) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {project.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStarProject(project.id)}
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(project.repository_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleJoinProject(project.id)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Join Project
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredProjects.length === 0 && !loading && (
              <ProjectsEmptyState
                onCreateProject={() => router.push('/projects/submit')}
                onDiscoverProjects={() => {
                  setFilters({
                    search: '',
                    category: 'all',
                    status: 'all',
                    language: 'all',
                    difficulty: 'all',
                    sortBy: 'recent',
                    showOnlyBookmarked: false
                  })
                  fetchProjects()
                }}
              />
            )}
          </>
        ) : (
          /* My Projects Tab */
          <div>
            {myProjects.length === 0 ? (
              <ProjectsEmptyState
                onCreateProject={() => router.push('/projects/submit')}
                onDiscoverProjects={() => setActiveTab('discover')}
                size="md"
              />
            ) : (
              <div className="space-y-6">
                {/* User's projects would go here */}
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {searchLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <p className="text-gray-500 mt-2">Loading projects...</p>
          </div>
        )}
      </div>
    </div>
  )
}