'use client'

import { useState } from 'react'
import { ArrowRight, Plus, Clock } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

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

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <DialogTitle>{featureName || title} Coming Soon</DialogTitle>
            </div>
            <DialogDescription>
              This feature is not yet available but is {(timeline || 'coming soon').toLowerCase()}.
              {learnMoreUrl && (
                <a
                  href={learnMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-tiffany-600 underline"
                >
                  Learn more
                </a>
              )}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowModal(false)} className="w-full mt-2">
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
} 