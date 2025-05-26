'use client'

import { useState } from 'react'
import { ArrowRight, Plus } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import ComingSoonModal from '@/components/ui/ComingSoonModal'

interface DashboardHeaderProps {
  title: string
  subtitle: string
  createButtonLabel: string
  createButtonHref: string
  backButtonHref: string
  featureName?: string
  timeline?: string
  learnMoreUrl?: string
}

export default function DashboardHeader({
  title,
  subtitle,
  createButtonLabel,
  createButtonHref,
  backButtonHref,
  featureName,
  timeline,
  learnMoreUrl
}: DashboardHeaderProps) {
  const [showModal, setShowModal] = useState(false)

  const isComingSoon = createButtonHref.includes('/coming-soon')

  const handleCreateClick = () => {
    if (isComingSoon) {
      setShowModal(true)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-1">{subtitle}</p>
        </div>
        <div className="flex gap-3">
          {isComingSoon ? (
            <Button variant="outline" onClick={handleCreateClick}>
              <Plus className="w-4 h-4 mr-2" />
              {createButtonLabel}
            </Button>
          ) : (
            <Link href={createButtonHref}>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                {createButtonLabel}
              </Button>
            </Link>
          )}
          <Link href={backButtonHref}>
            <Button>
              <ArrowRight className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <ComingSoonModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        featureName={featureName || title}
        timeline={timeline || "Coming Soon"}
        learnMoreUrl={learnMoreUrl}
      />
    </>
  )
} 