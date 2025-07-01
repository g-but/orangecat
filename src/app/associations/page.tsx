'use client'

import { useState, useEffect } from 'react'
import { Users, Network, Search, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Loading from '@/components/Loading'
import Link from 'next/link'
import AssociationService from '@/services/supabase/associations' 
import type { Association } from '@/services/supabase/associations'
import { PROFILE_CATEGORIES } from '@/types/profile'
import { SafeConsole } from '@/utils/console-cleanup'
import { SecureErrorHandler } from '@/utils/security'

export default function AssociationsPage() {
  const [associations, setAssociations] = useState<Association[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAssociations = async () => {
      try {
        setLoading(true)
        setError(null)
        // For demo purposes, get current user's associations
        // In production, this would be a public endpoint for all associations
        const data = await AssociationService.getProfileAssociations('demo-user-id', {}, { limit: 100 })
        setAssociations(data)
      } catch (error) {
        const sanitizedError = SecureErrorHandler.sanitizeErrorMessage(error)
        setError(sanitizedError)
        SafeConsole.security('Failed to fetch associations', { 
          error: sanitizedError,
          timestamp: new Date().toISOString()
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAssociations()
  }, [])

  if (loading) {
    return <Loading fullScreen />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <Network className="w-16 h-16 mx-auto mb-4 text-red-300" />
              <h3 className="text-xl font-semibold text-red-700 mb-2">Unable to Load Associations</h3>
              <p className="text-gray-500 mb-6">{error}</p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mb-6">
            <Network className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            OrangeCat Associations
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore the network of connections within the Bitcoin community
          </p>
        </div>

        <Card className="mb-8 shadow-lg">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search associations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {associations.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <Network className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Associations Found</h3>
              <p className="text-gray-500 mb-6">
                Be the first to create associations in the community!
              </p>
              <Link href="/(authenticated)/profile/me">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Users className="w-4 h-4 mr-2" />
                  Go to Your Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {associations.map((association) => (
              <Card key={association.id} className="shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {association.target_entity_id}
                    </h3>
                    {association.status === 'active' && (
                      <Star className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-purple-600 mb-2">
                    {association.relationship_type}
                  </p>
                  {association.role && (
                    <p className="text-sm text-gray-600">
                      Role: {association.role}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 