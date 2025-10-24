'use client'

import { useState } from 'react'
import { Bitcoin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import BitcoinPaymentModal from './BitcoinPaymentModal'

interface BitcoinPaymentButtonProps {
  projectId: string
  projectTitle: string
  suggestedAmount?: number
}

export default function BitcoinPaymentButton({
  projectId,
  projectTitle,
  suggestedAmount = 10000
}: BitcoinPaymentButtonProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        variant="gradient"
        className="flex items-center gap-2"
      >
        <Bitcoin className="w-4 h-4" />
        Fund with Bitcoin
      </Button>

      <BitcoinPaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        projectId={projectId}
        projectTitle={projectTitle}
        suggestedAmount={suggestedAmount}
      />
    </>
  )
} 