'use client'

import { Building, Vote, Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { OrganizationData } from '@/types/dashboard'

interface OrganizationCardProps {
  organization: OrganizationData
}

export default function OrganizationCard({ organization }: OrganizationCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-3 rounded-full">
              <Building className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{organization.title}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${organization.color}`}>
                {organization.type}
              </span>
            </div>
          </div>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            {organization.role}
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Members</span>
            <span className="font-medium">{organization.members}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Treasury</span>
            <span className="font-medium">{organization.treasury.toLocaleString()} sats</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Active Proposals</span>
            <span className="font-medium">{organization.proposals}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Vote className="w-4 h-4 mr-1" />
              Vote
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Settings className="w-4 h-4 mr-1" />
              Manage
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 