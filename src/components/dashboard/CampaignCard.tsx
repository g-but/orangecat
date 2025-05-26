'use client'

import { useState } from 'react'
import { Handshake, Users, Target, Settings, BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ComingSoonModal from '@/components/ui/ComingSoonModal'
import { CampaignData } from '@/data/dashboardConfigs'

interface CampaignCardProps {
  campaign: CampaignData
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
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
              <div className="bg-gradient-to-r from-teal-100 to-cyan-100 p-3 rounded-full">
                <Handshake className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{campaign.title}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${campaign.color}`}>
                  {campaign.type}
                </span>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              campaign.status === 'Active' 
                ? 'bg-green-100 text-green-700' 
                : campaign.status === 'Completed'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {campaign.status}
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Raised</span>
              <span className="font-medium">{campaign.raised.toLocaleString()} sats</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Goal</span>
              <span className="font-medium">{campaign.goal.toLocaleString()} sats</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Supporters</span>
              <span className="font-medium">{campaign.supporters}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Days Left</span>
              <span className="font-medium">{campaign.daysLeft > 0 ? campaign.daysLeft : 'Completed'}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{campaign.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-teal-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${campaign.progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleComingSoon}>
                <BarChart3 className="w-4 h-4 mr-1" />
                Analytics
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={handleComingSoon}>
                <Settings className="w-4 h-4 mr-1" />
                Manage
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ComingSoonModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        featureName="Advanced Fundraising"
        timeline="Q1 2025"
        learnMoreUrl="/fundraising"
      />
    </>
  )
} 