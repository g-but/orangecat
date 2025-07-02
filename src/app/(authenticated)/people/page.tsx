'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Search, MapPin, Twitter, Github, Globe, User } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface Person {
  id: string
  username: string
  full_name: string
  bio?: string
  location?: string
  website?: string
  twitter?: string
  github?: string
  avatar_url?: string
  verified: boolean
  skills: string[]
  followers_count: number
}

export default function PeoplePage() {
  const { user } = useAuthStore()
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Mock data for now - replace with actual API call
    const mockPeople: Person[] = [
      {
        id: '1',
        username: 'satoshi',
        full_name: 'Satoshi Nakamoto',
        bio: 'Creator of Bitcoin. Disappeared into the digital ether.',
        location: 'Unknown',
        verified: true,
        skills: ['Cryptography', 'Computer Science', 'Economics'],
        followers_count: 1000000,
        avatar_url: '/images/satoshi.png'
      },
      {
        id: '2',
        username: 'hal_finney',
        full_name: 'Hal Finney',
        bio: 'Cryptographer, cypherpunk, and early Bitcoin contributor.',
        location: 'California, USA',
        website: 'https://hal-finney.org',
        twitter: 'hal_finney',
        verified: true,
        skills: ['Cryptography', 'Programming', 'Privacy'],
        followers_count: 150000
      },
      {
        id: '3',
        username: 'adam_back',
        full_name: 'Adam Back',
        bio: 'CEO of Blockstream, inventor of Hashcash.',
        location: 'UK',
        website: 'https://blockstream.com',
        twitter: 'adam3us',
        github: 'adam3us',
        verified: true,
        skills: ['Cryptography', 'Blockchain', 'Privacy'],
        followers_count: 200000
      },
      {
        id: '4',
        username: 'lightning_dev',
        full_name: 'Lightning Developer',
        bio: 'Building the future of Bitcoin payments.',
        location: 'Remote',
        github: 'lightning-dev',
        verified: false,
        skills: ['Lightning Network', 'Go', 'Bitcoin'],
        followers_count: 5000
      }
    ]
    
    setPeople(mockPeople)
    setLoading(false)
  }, [])

  const filteredPeople = people.filter(person =>
    person.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">People</h1>
        <p className="text-gray-600 mb-6">
          Connect with Bitcoin developers, entrepreneurs, and enthusiasts
        </p>
        
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPeople.map((person) => (
          <Card key={person.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start space-x-4">
                {person.avatar_url ? (
                  <img
                    src={person.avatar_url}
                    alt={person.full_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                    <User className="w-8 h-8 text-orange-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg truncate">
                      {person.full_name}
                    </CardTitle>
                    {person.verified && (
                      <Badge variant="secondary" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">@{person.username}</p>
                  <p className="text-sm text-gray-500">{person.followers_count.toLocaleString()} followers</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {person.bio && (
                <CardDescription className="mb-4 line-clamp-3">
                  {person.bio}
                </CardDescription>
              )}
              
              <div className="space-y-2 mb-4">
                {person.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    {person.location}
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  {person.website && (
                    <a 
                      href={person.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-orange-600"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                  {person.twitter && (
                    <a 
                      href={`https://twitter.com/${person.twitter}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-orange-600"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                  {person.github && (
                    <a 
                      href={`https://github.com/${person.github}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-orange-600"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {person.skills.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {person.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {person.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{person.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <Button variant="outline" className="w-full">
                View Profile
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPeople.length === 0 && (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No people found' : 'No people yet'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? `No results for "${searchTerm}". Try a different search term.`
              : 'Be the first to join the Bitcoin community on OrangeCat.'
            }
          </p>
        </div>
      )}
    </div>
  )
}