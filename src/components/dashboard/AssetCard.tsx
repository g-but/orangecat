'use client'

import { useState } from 'react'
import { Wallet } from 'lucide-react'
import BaseDashboardCard, { 
  DashboardCardHeader, 
  DashboardCardContent, 
  MetricDisplay 
} from './BaseDashboardCard'
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
      <BaseDashboardCard onSettingsClick={handleComingSoon}>
        <DashboardCardHeader
          icon={<Wallet className="w-6 h-6 text-red-600" />}
          iconBgColor="bg-gradient-to-r from-red-100 to-orange-100"
          title={asset.title}
          subtitle={
            <span className={`px-2 py-1 text-xs rounded-full ${asset.color}`}>
              {asset.type}
            </span>
          }
          status={asset.status}
          statusColor={
            asset.status === 'Available' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-orange-100 text-orange-700'
          }
        />
        
        <DashboardCardContent>
          <MetricDisplay 
            label="Daily Rate" 
            value={`${asset.dailyRate.toLocaleString('en-US')} sats`} 
          />
          <MetricDisplay 
            label="Total Earnings" 
            value={`${asset.totalEarnings.toLocaleString('en-US')} sats`} 
          />
          <MetricDisplay 
            label="Total Rentals" 
            value={asset.rentals} 
          />
          <MetricDisplay 
            label="Availability" 
            value={asset.availability} 
          />
        </DashboardCardContent>
      </BaseDashboardCard>

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