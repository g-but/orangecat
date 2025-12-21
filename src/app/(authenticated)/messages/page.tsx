"use client";

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import MessagePanel from '@/components/messaging/MessagePanel'
import { useRequireAuth } from '@/hooks/useAuth'
import Loading from '@/components/Loading'

function MessagesContent() {
  const searchParams = useSearchParams()
  const id = searchParams?.get('id') || searchParams?.get('c') || undefined
  const { isLoading, isAuthenticated } = useRequireAuth()

  // Show loading while auth is being checked
  if (isLoading) {
    return <Loading fullScreen contextual message="Loading messages..." />
  }

  // useRequireAuth will redirect if not authenticated
  if (!isAuthenticated) {
    return <Loading fullScreen contextual message="Redirecting to login..." />
  }

  return (
    <MessagePanel isOpen fullPage initialConversationId={id} onClose={() => {}} />
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<Loading fullScreen contextual message="Loading messages..." />}>
      <MessagesContent />
    </Suspense>
  )
}
