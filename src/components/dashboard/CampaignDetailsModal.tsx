'use client'

import { X } from 'lucide-react'
import { Campaign } from '@/stores/campaignStore'
import CampaignManagement from './CampaignManagement'

interface CampaignDetailsModalProps {
  project: Campaign | null
  isOpen: boolean
  onClose: () => void
}

export default function CampaignDetailsModal({ project, isOpen, onClose }: CampaignDetailsModalProps) {
  if (!isOpen || !project) {return null}

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Campaign Management</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <CampaignManagement project={project} onClose={onClose} />
          </div>
        </div>
      </div>
    </div>
  )
} 