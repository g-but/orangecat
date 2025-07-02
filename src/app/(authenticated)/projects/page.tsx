'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Search, Star, GitBranch, Users, Plus, Code, Zap, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface Project {
  id: string
  name: string
  description: string
  category: string
  status: 'active' | 'completed' | 'archived'
  stars: number
  contributors: number
  language: string
  license: string
  repository_url?: string
  website_url?: string
  tags: string[]
  last_updated: string
}

export default function ProjectsPage() {
  const { user } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = ['all', 'wallet', 'lightning', 'mining', 'exchange', 'tools', 'education']

  useEffect(() => {
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
        last_updated: '2025-01-01'
      },
      {
        id: '2',
        name: 'Lightning Network Daemon',
        description: 'The Lightning Network Daemon (lnd) is a complete implementation of a Lightning Network node.',
        category: 'lightning',
        status: 'active',
        stars: 7500,
        contributors: 150,
        language: 'Go',
        license: 'MIT',
        repository_url: 'https://github.com/lightningnetwork/lnd',
        website_url: 'https://lightning.engineering',
        tags: ['Lightning', 'Payments', 'Layer 2'],
        last_updated: '2024-12-28'
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
        last_updated: '2024-12-20'
      },
      {
        id: '4',
        name: 'BTCPay Server',
        description: 'BTCPay Server is a self-hosted, open-source cryptocurrency payment processor.',
        category: 'tools',
        status: 'active',
        stars: 6000,
        contributors: 200,
        language: 'C#',
        license: 'MIT',
        repository_url: 'https://github.com/btcpayserver/btcpayserver',
        website_url: 'https://btcpayserver.org',
        tags: ['Payments', 'Merchant', 'Self-hosted'],
        last_updated: '2024-12-30'
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
        last_updated: '2024-12-25'
      }
    ]
    
    setProjects(mockProjects)
    setLoading(false)
  }, [])

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'wallet': return <Shield className="w-4 h-4" />
      case 'lightning': return <Zap className="w-4 h-4" />
      case 'tools': return <Code className="w-4 h-4" />
      default: return <Code className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-2">
            Discover open-source Bitcoin projects and contribute to the ecosystem
          </p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Submit Project
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "primary" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? "bg-orange-600 hover:bg-orange-700" : ""}
            >
              {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    {getCategoryIcon(project.category)}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {project.language}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(project.status)}`}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4 line-clamp-3">
                {project.description}
              </CardDescription>
              
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  {project.stars.toLocaleString()}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {project.contributors}
                </div>
                <div className="flex items-center">
                  <GitBranch className="w-4 h-4 mr-1" />
                  {project.license}
                </div>
              </div>

              {project.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {project.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {project.tags.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{project.tags.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <a 
                  href={project.repository_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    <GitBranch className="w-4 h-4 mr-2" />
                    Repository
                  </Button>
                </a>
                {project.website_url && (
                  <a 
                    href={project.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full">
                      Website
                    </Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <Code className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? `No results for "${searchTerm}". Try a different search term.`
              : 'Be the first to submit a Bitcoin project.'
            }
          </p>
          <Button className="bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 mr-2" />
            Submit First Project
          </Button>
        </div>
      )}
    </div>
  )
}