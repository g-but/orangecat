'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { 
  Users, 
  Target, 
  Building, 
  Rocket, 
  ArrowRight,
  ExternalLink,
  Star,
  Loader2
} from 'lucide-react'
import { PROFILE_CATEGORIES } from '@/types/profile'
import AssociationService from '@/services/supabase/associations'
import type { Association } from '@/services/supabase/associations'

// Legacy interface for backward compatibility
interface LegacyAssociation {
  type: 'creator' | 'founder' | 'collaborator' | 'supporter' | 'maintainer'
  entity: {
    username: string
    name: string
    type: 'individual' | 'campaign' | 'organization' | 'collective' | 'project'
    description?: string
    url?: string
  }
  relationship: 'created' | 'founded' | 'supports' | 'collaborates' | 'maintains'
  metadata?: {
    role?: string
    since?: string
    status?: 'active' | 'inactive' | 'completed'
  }
}

interface ProfileAssociationsProps {
  profileId?: string // New: for fetching real associations
  associations?: LegacyAssociation[] // Legacy: for backward compatibility
  className?: string
  showAll?: boolean
  maxVisible?: number
}

export default function ProfileAssociations({ 
  profileId,
  associations = [], // Legacy fallback
  className = '',
  showAll = false,
  maxVisible = 3
}: ProfileAssociationsProps) {
  const [realAssociations, setRealAssociations] = useState<Association[]>([])
  const [loading, setLoading] = useState(!!profileId)
  const [error, setError] = useState<string | null>(null)

  // Fetch real associations when profileId is provided
  useEffect(() => {
    if (!profileId) {
      setLoading(false)
      return
    }

    const fetchAssociations = async () => {
      try {
        setLoading(true)
        const data = await AssociationService.getProfileAssociations(profileId)
        setRealAssociations(data)
        setError(null)
      } catch (err) {
        setError('Failed to load associations')
      } finally {
        setLoading(false)
      }
    }

    fetchAssociations()
  }, [profileId])

  // Convert real associations to display format
  const convertRealAssociation = (association: Association): LegacyAssociation => {
    return {
      type: association.relationship_type === 'created' ? 'creator' : 
            association.relationship_type === 'founded' ? 'founder' :
            association.relationship_type === 'collaborates' ? 'collaborator' :
            association.relationship_type === 'supports' ? 'supporter' : 'maintainer',
      entity: {
        username: association.target_entity_id, // This will be resolved to actual names via service
        name: association.target_entity_id, // Placeholder - will be resolved
        type: association.target_entity_type,
        description: association.metadata?.description || undefined,
        url: association.metadata?.url || undefined
      },
      relationship: association.relationship_type,
      metadata: {
        role: association.role,
        since: new Date(association.created_at).getFullYear().toString(),
        status: association.status === 'active' ? 'active' : 
                association.status === 'completed' ? 'completed' : 'inactive'
      }
    }
  }

  // Use real associations if available, otherwise fall back to legacy
  const displayAssociations = profileId && realAssociations.length > 0 
    ? realAssociations.map(convertRealAssociation)
    : associations

  const visibleAssociations = showAll ? displayAssociations : displayAssociations.slice(0, maxVisible)
  const hasMore = !showAll && displayAssociations.length > maxVisible

  const getAssociationIcon = (entityType: string) => {
    const category = PROFILE_CATEGORIES[entityType as keyof typeof PROFILE_CATEGORIES]
    return category?.icon || '🔗'
  }

  const getAssociationColor = (entityType: string) => {
    const category = PROFILE_CATEGORIES[entityType as keyof typeof PROFILE_CATEGORIES]
    return category?.color || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const getRelationshipText = (relationship: string, entityType: string) => {
    const entityName = PROFILE_CATEGORIES[entityType as keyof typeof PROFILE_CATEGORIES]?.name.toLowerCase() || 'entity'
    
    switch (relationship) {
      case 'created': return `Created this ${entityName}`
      case 'founded': return `Founded this ${entityName}`
      case 'supports': return `Supports this ${entityName}`
      case 'collaborates': return `Collaborates with this ${entityName}`
      case 'maintains': return `Maintains this ${entityName}`
      default: return `Connected to this ${entityName}`
    }
  }

  // Loading state
  if (loading) {
    return (
      <Card className={`shadow-xl border-0 bg-white/80 backdrop-blur-sm ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Connections
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600">Loading connections...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={`shadow-xl border-0 bg-white/80 backdrop-blur-sm ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">{error}</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (displayAssociations.length === 0) {
    return (
      <Card className={`shadow-xl border-0 bg-white/80 backdrop-blur-sm ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No connections yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Start by creating campaigns or joining organizations
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`shadow-xl border-0 bg-white/80 backdrop-blur-sm ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          Connections
          {displayAssociations.length > 0 && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
              {displayAssociations.length}
            </span>
          )}
          {profileId && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              Live
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {visibleAssociations.map((association, index) => (
          <div
            key={index}
            className="group p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all bg-gradient-to-r from-white to-purple-50/20"
          >
            <div className="flex items-start gap-3">
              {/* Entity Icon & Type Badge */}
              <div className="flex flex-col items-center gap-1">
                <div className={`p-2 rounded-lg bg-orange-100`}>
                  <span className="text-lg">{getAssociationIcon(association.entity.type)}</span>
                </div>
                <div className={`px-2 py-1 text-xs rounded-full border ${getAssociationColor(association.entity.type)}`}>
                  {PROFILE_CATEGORIES[association.entity.type as keyof typeof PROFILE_CATEGORIES]?.name || 'Entity'}
                </div>
              </div>

              {/* Connection Details */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                    {association.entity.name}
                  </h4>
                  {association.entity.name.toLowerCase().includes('orange cat') && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full border border-orange-200">
                      <Star className="w-3 h-3" />
                      Featured
                    </div>
                  )}
                  {association.metadata?.status && (
                    <div className={`px-2 py-1 text-xs rounded-full ${
                      association.metadata.status === 'active' 
                        ? 'bg-green-100 text-green-700'
                        : association.metadata.status === 'completed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}>
                      {association.metadata.status}
                    </div>
                  )}
                </div>

                <p className="text-sm text-purple-600 font-medium mb-1">
                  {getRelationshipText(association.relationship, association.entity.type)}
                </p>

                {association.entity.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {association.entity.description}
                  </p>
                )}

                {association.metadata?.role && (
                  <p className="text-xs text-gray-500">
                    Role: {association.metadata.role}
                  </p>
                )}

                {association.metadata?.since && (
                  <p className="text-xs text-gray-500">
                    Since: {association.metadata.since}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="flex flex-col items-end gap-2">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {association.entity.url ? (
                    <Link href={association.entity.url}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/profile/${association.entity.username}`}>
                      <Button variant="outline" size="sm">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {hasMore && (
          <div className="text-center pt-2">
            <Button variant="outline" size="sm">
              View All {displayAssociations.length} Connections
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 