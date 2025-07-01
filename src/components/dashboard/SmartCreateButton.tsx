'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit3, FileText } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useCampaignStore } from '@/stores/campaignStore'
import DraftContinueDialog from './DraftContinueDialog'

interface SmartCreateButtonProps {
  children?: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient'
  showIcon?: boolean
  fullWidth?: boolean
  // Force bypassing draft check (for specific use cases)
  forceNewCampaign?: boolean
}

export default function SmartCreateButton({ 
  children,
  className = '',
  size = 'md',
  variant = 'primary',
  showIcon = true,
  fullWidth = false,
  forceNewCampaign = false
}: SmartCreateButtonProps) {
  const router = useRouter()
  const { drafts } = useCampaignStore()
  const [showDraftDialog, setShowDraftDialog] = useState(false)

  const hasAnyDraft = drafts.length > 0
  const primaryDraft = hasAnyDraft ? drafts[0] : null
  const shouldShowDraftPrompt = hasAnyDraft && !forceNewCampaign

  const handleClick = () => {
    if (shouldShowDraftPrompt) {
      setShowDraftDialog(true)
    } else {
      // Clear any existing drafts from localStorage if starting fresh
      router.push('/create')
    }
  }

  const handleContinueDraft = () => {
    setShowDraftDialog(false)
    router.push('/create')
  }

  const handleStartFresh = () => {
    setShowDraftDialog(false)
    // Add query parameter to indicate starting fresh
    router.push('/create?new=true')
  }

  // Determine button content based on draft status
  const getButtonContent = () => {
    if (shouldShowDraftPrompt && primaryDraft) {
      const isPendingDraft = primaryDraft.syncStatus === 'pending'
      
      return (
        <>
          {showIcon && <Edit3 className="w-4 h-4 mr-2" />}
          {children || (isPendingDraft ? 'Continue Campaign' : 'Complete Campaign')}
        </>
      )
    }
    
    return (
      <>
        {showIcon && <Plus className="w-4 h-4 mr-2" />}
        {children || 'Create Campaign'}
      </>
    )
  }

  // Determine button styling based on draft status
  const getButtonClassName = () => {
    if (shouldShowDraftPrompt) {
      // More prominent styling for continuing drafts
      return variant === 'outline' 
        ? 'border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400'
        : variant === 'ghost'
        ? 'text-blue-700 hover:text-blue-800 hover:bg-blue-50'
        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
    }
    
    return '' // Use default styling
  }

  return (
    <>
      <Button 
        onClick={handleClick}
        className={`${getButtonClassName()} ${fullWidth ? 'w-full' : ''} ${className}`}
        size={size}
        variant={variant}
      >
        {getButtonContent()}
      </Button>

      <DraftContinueDialog
        isOpen={showDraftDialog}
        onClose={() => setShowDraftDialog(false)}
        onContinueDraft={handleContinueDraft}
        onStartFresh={handleStartFresh}
      />
    </>
  )
}

// Export a specialized version for navigation/header use
export function HeaderCreateButton() {
  return (
    <SmartCreateButton 
      className="min-h-[36px] flex items-center text-sm"
      variant="outline"
      size="sm"
      showIcon={true}
    />
  )
}

// Export a specialized version for dashboard cards
export function DashboardCreateButton({ className = '' }: { className?: string }) {
  const { drafts } = useCampaignStore()
  const hasAnyDraft = drafts.length > 0
  
  return (
    <SmartCreateButton 
      className={`${hasAnyDraft ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' : 'bg-gradient-to-r from-tiffany-600 to-orange-600 hover:from-tiffany-700 hover:to-orange-700'} min-h-[44px] ${className}`}
      size="lg"
      fullWidth={true}
    />
  )
}

// Export a specialized version that always creates new (for "Start Fresh" scenarios)
export function NewCampaignButton({ 
  children,
  className = '',
  ...props 
}: Omit<SmartCreateButtonProps, 'forceNewCampaign'>) {
  return (
    <SmartCreateButton 
      {...props}
      forceNewCampaign={true}
      className={className}
    >
      {children || 'Start New Campaign'}
    </SmartCreateButton>
  )
} 