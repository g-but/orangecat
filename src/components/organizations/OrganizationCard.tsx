'use client'

import { useRouter } from 'next/navigation'
import { 
  Building, 
  Users, 
  Calendar, 
  Globe, 
  Star, 
  Bitcoin, 
  ExternalLink,
  Vote,
  Briefcase,
  Award,
  Network,
  Shield,
  X
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import type { Organization, OrganizationType } from '@/types/organization'

interface OrganizationCardProps {
  organization: Organization
  onJoin?: (orgId: string) => void
  onTip?: (orgId: string) => void
  showActions?: boolean
}

export default function OrganizationCard({ 
  organization, 
  onJoin, 
  onTip, 
  showActions = true 
}: OrganizationCardProps) {
  const router = useRouter()
  
  const getOrgTypeIcon = (type: OrganizationType) => {
    switch (type) {
      case 'dao': return Vote
      case 'company': return Briefcase
      case 'nonprofit': return Award
      case 'community': return Users
      case 'cooperative': return Network
      case 'foundation': return Shield
      default: return Building
    }
  }

  const getOrgTypeColor = (type: OrganizationType) => {
    switch (type) {
      case 'dao': return 'text-blue-600 bg-blue-100 border-blue-200'
      case 'company': return 'text-orange-600 bg-orange-100 border-orange-200'
      case 'nonprofit': return 'text-green-600 bg-green-100 border-green-200'
      case 'community': return 'text-purple-600 bg-purple-100 border-purple-200'
      case 'cooperative': return 'text-teal-600 bg-teal-100 border-teal-200'
      case 'foundation': return 'text-indigo-600 bg-indigo-100 border-indigo-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 0.8) {return 'text-green-600 bg-green-100'}
    if (score >= 0.6) {return 'text-yellow-600 bg-yellow-100'}
    if (score >= 0.4) {return 'text-orange-600 bg-orange-100'}
    return 'text-red-600 bg-red-100'
  }

  const TypeIcon = getOrgTypeIcon(organization.type)
  const typeColor = getOrgTypeColor(organization.type)
  const trustScoreColor = getTrustScoreColor(organization.trust_score)

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
            {organization.avatar_url ? (
              <img 
                src={organization.avatar_url} 
                alt={organization.name} 
                className="w-full h-full rounded-lg object-cover"
              />
            ) : (
              <Building className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{organization.name}</h3>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeColor}`}>
              <TypeIcon className="w-3 h-3 mr-1" />
              {organization.type.toUpperCase()}
            </div>
          </div>
        </div>
        
        {organization.trust_score > 0 && (
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${trustScoreColor}`}>
            <Star className="w-3 h-3 mr-1" />
            {(organization.trust_score * 100).toFixed(0)}%
          </div>
        )}
      </div>
      
      {organization.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {organization.description}
        </p>
      )}
      
      {/* Tags */}
      {organization.tags && organization.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {organization.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
            >
              {tag}
            </span>
          ))}
          {organization.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{organization.tags.length - 3} more</span>
          )}
        </div>
      )}
      
      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <Users className="w-3 h-3 mr-1" />
            {/* This would need to be fetched from memberships */}
            0 members
          </div>
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {new Date(organization.founded_at).getFullYear()}
          </div>
        </div>
        
        {organization.is_public && (
          <div className="flex items-center text-green-600">
            <Globe className="w-3 h-3 mr-1" />
            Public
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      {showActions && (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/organizations/${organization.slug}`)}
            className="flex-1"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View
          </Button>
          
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            onClick={() => onJoin?.(organization.id)}
          >
            Join
          </Button>
          
          {organization.treasury_address && (
            <Button 
              size="sm" 
              variant="outline" 
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
              onClick={() => onTip?.(organization.id)}
              title="Send Bitcoin tip"
            >
              <Bitcoin className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}