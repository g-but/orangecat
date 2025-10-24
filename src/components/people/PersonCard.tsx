'use client'

import { useRouter } from 'next/navigation'
import { 
  Users, 
  ExternalLink, 
  MessageCircle, 
  Bitcoin, 
  Zap, 
  Code, 
  GraduationCap, 
  Megaphone,
  Briefcase,
  MapPin,
  Calendar,
  Star
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

interface Person {
  id: string
  username?: string
  name?: string
  bio?: string
  avatar_url?: string
  website?: string
  bitcoin_address?: string
  lightning_address?: string
  created_at: string
  project_count?: number
  total_raised?: number
}

interface PersonCardProps {
  person: Person
  onConnect?: (personId: string) => void
  onTip?: (personId: string) => void
  showActions?: boolean
}

export default function PersonCard({ 
  person, 
  onConnect, 
  onTip, 
  showActions = true 
}: PersonCardProps) {
  const router = useRouter()
  
  const getPersonTypeIcon = (person: Person) => {
    if (person.bitcoin_address || person.lightning_address) {return Bitcoin}
    if (person.bio?.toLowerCase().includes('developer')) {return Code}
    if (person.bio?.toLowerCase().includes('educator')) {return GraduationCap}
    if (person.bio?.toLowerCase().includes('advocate')) {return Megaphone}
    return Users
  }

  const getPersonTypeColor = (person: Person) => {
    if (person.bitcoin_address || person.lightning_address) {return 'text-orange-600 bg-orange-100'}
    if (person.bio?.toLowerCase().includes('developer')) {return 'text-blue-600 bg-blue-100'}
    if (person.bio?.toLowerCase().includes('educator')) {return 'text-green-600 bg-green-100'}
    if (person.bio?.toLowerCase().includes('advocate')) {return 'text-purple-600 bg-purple-100'}
    return 'text-gray-600 bg-gray-100'
  }

  const getPersonTypeLabel = (person: Person) => {
    if (person.bitcoin_address || person.lightning_address) {return 'Bitcoin Enabled'}
    if (person.bio?.toLowerCase().includes('developer')) {return 'Developer'}
    if (person.bio?.toLowerCase().includes('educator')) {return 'Educator'}
    if (person.bio?.toLowerCase().includes('advocate')) {return 'Advocate'}
    return 'Member'
  }

  const TypeIcon = getPersonTypeIcon(person)
  const typeColor = getPersonTypeColor(person)
  const typeLabel = getPersonTypeLabel(person)

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow group">
      <div className="flex items-start space-x-4">
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-teal-500 rounded-full flex items-center justify-center">
            {person.avatar_url ? (
              <img 
                src={person.avatar_url} 
                alt={person.name || person.username} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <Users className="w-8 h-8 text-white" />
            )}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${typeColor} rounded-full flex items-center justify-center border-2 border-white`}>
            <TypeIcon className="w-3 h-3" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {person.name || person.username || 'Anonymous User'}
          </h3>
          
          <div className="flex items-center space-x-2 mb-2">
            {person.username && person.name && (
              <span className="text-sm text-gray-500">@{person.username}</span>
            )}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeColor}`}>
              <TypeIcon className="w-3 h-3 mr-1" />
              {typeLabel}
            </span>
          </div>
          
          {person.bio && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {person.bio}
            </p>
          )}
          
          {/* Stats */}
          <div className="flex items-center space-x-4 mb-4 text-xs text-gray-500">
            {person.project_count && person.project_count > 0 && (
              <div className="flex items-center">
                <Briefcase className="w-3 h-3 mr-1" />
                {person.project_count} projects
              </div>
            )}
            {person.total_raised && person.total_raised > 0 && (
              <div className="flex items-center">
                <Bitcoin className="w-3 h-3 mr-1" />
                {person.total_raised} sats
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(person.created_at).getFullYear()}
            </div>
          </div>
          
          {/* Action Buttons */}
          {showActions && (
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/profile/${person.id}`)}
                className="flex-1"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onConnect?.(person.id)}
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Connect
              </Button>
              
              {(person.bitcoin_address || person.lightning_address) && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  onClick={() => onTip?.(person.id)}
                  title={person.lightning_address ? "Send Lightning tip" : "Send Bitcoin tip"}
                >
                  {person.lightning_address ? (
                    <Zap className="w-3 h-3" />
                  ) : (
                    <Bitcoin className="w-3 h-3" />
                  )}
                </Button>
              )}
              
              {person.website && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open(person.website, '_blank')}
                  title="Visit website"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}