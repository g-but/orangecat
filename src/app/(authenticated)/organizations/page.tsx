'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, Users, Building, MapPin, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface Organization {
  id: string
  name: string
  description: string
  location?: string
  website?: string
  members_count: number
  verified: boolean
  avatar_url?: string
}

export default function OrganizationsPage() {
  const { user } = useAuthStore()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for now - replace with actual API call
    const mockOrganizations: Organization[] = [
      {
        id: '1',
        name: 'Bitcoin Foundation',
        description: 'Standardize, protect and promote the use of bitcoin cryptographic money for the benefit of users worldwide.',
        location: 'Global',
        website: 'https://bitcoinfoundation.org',
        members_count: 150,
        verified: true,
        avatar_url: '/images/bitcoin-foundation.png'
      },
      {
        id: '2',
        name: 'Chaincode Labs',
        description: 'Research and development organization focused on Bitcoin and cryptocurrency technologies.',
        location: 'New York, USA',
        website: 'https://chaincode.com',
        members_count: 25,
        verified: true
      },
      {
        id: '3',
        name: 'Lightning Labs',
        description: 'Building the future of Bitcoin payments with the Lightning Network.',
        location: 'San Francisco, USA',
        website: 'https://lightning.engineering',
        members_count: 45,
        verified: true
      }
    ]
    
    setOrganizations(mockOrganizations)
    setLoading(false)
  }, [])

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
          <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-600 mt-2">
            Discover and connect with Bitcoin-focused organizations worldwide
          </p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Organization
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org) => (
          <Card key={org.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {org.avatar_url ? (
                    <img
                      src={org.avatar_url}
                      alt={org.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <Building className="w-6 h-6 text-orange-600" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      {org.name}
                      {org.verified && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Verified
                        </Badge>
                      )}
                    </CardTitle>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4 line-clamp-3">
                {org.description}
              </CardDescription>
              
              <div className="space-y-2 mb-4">
                {org.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    {org.location}
                  </div>
                )}
                {org.website && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
                    <a 
                      href={org.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-orange-600 truncate"
                    >
                      {org.website.replace('https://', '')}
                    </a>
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                  {org.members_count} members
                </div>
              </div>

              <Button variant="outline" className="w-full">
                View Organization
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {organizations.length === 0 && (
        <div className="text-center py-12">
          <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
          <p className="text-gray-600 mb-6">
            Be the first to create an organization in the Bitcoin community.
          </p>
          <Button className="bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 mr-2" />
            Create First Organization
          </Button>
        </div>
      )}
    </div>
  )
}