"use client";

import { useSearchParams } from 'next/navigation'
import MessagePanel from '@/components/messaging/MessagePanel'

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') || searchParams.get('c') || undefined
  return (
    <MessagePanel isOpen fullPage initialConversationId={id} />
  )
}
