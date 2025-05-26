'use client'

import { useState } from 'react'
import { Users, MessageCircle, UserPlus, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ComingSoonModal from '@/components/ui/ComingSoonModal'
import { PersonData } from '@/data/dashboardConfigs'

interface PersonCardProps {
  person: PersonData
}

export default function PersonCard({ person }: PersonCardProps) {
  const [showModal, setShowModal] = useState(false)

  const handleComingSoon = () => {
    setShowModal(true)
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{person.name}</h3>
                <p className="text-sm text-gray-600">{person.username}</p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${person.color}`}>
              {person.relationship}
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Mutual Connections</span>
              <span className="font-medium">{person.mutualConnections}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Last Interaction</span>
              <span className="font-medium">{person.lastInteraction}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-gray-600">{person.location}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Skills: </span>
              <span className="font-medium">{person.skills.join(', ')}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleComingSoon}>
                <MessageCircle className="w-4 h-4 mr-1" />
                Message
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={handleComingSoon}>
                <UserPlus className="w-4 h-4 mr-1" />
                Connect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ComingSoonModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        featureName="People & Networking"
        timeline="Q2 2025"
        learnMoreUrl="/people"
      />
    </>
  )
} 