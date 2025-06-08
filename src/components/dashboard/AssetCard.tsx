'use client'

import { useState } from 'react'
import { Wallet, Package, Settings, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ComingSoonModal from '@/components/ui/ComingSoonModal'
import { AssetData } from '@/data/dashboardConfigs'

interface AssetCardProps {
  asset: AssetData
}

export default function AssetCard({ asset }: AssetCardProps) {
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
              <div className="bg-gradient-to-r from-red-100 to-orange-100 p-3 rounded-full">
                <Wallet className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{asset.title}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${asset.color}`}>
                  {asset.type}
                </span>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              asset.status === 'Available' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-orange-100 text-orange-700'
            }`}>
              {asset.status}
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Daily Rate</span>
              <span className="font-medium">{asset.dailyRate.toLocaleString('en-US')} sats</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Earnings</span>
              <span className="font-medium">{asset.totalEarnings.toLocaleString('en-US')} sats</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Rentals</span>
              <span className="font-medium">{asset.rentals}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Availability</span>
              <span className="font-medium">{asset.availability}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleComingSoon}>
                <Eye className="w-4 h-4 mr-1" />
                View
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
        featureName="Asset Management"
        timeline="Q2 2025"
        learnMoreUrl="/assets"
      />
    </>
  )
} 