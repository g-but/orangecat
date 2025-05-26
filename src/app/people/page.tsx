'use client'

import { useAuth } from '@/hooks/useAuth'
import { Users } from 'lucide-react'
import InitiativePage from '@/components/pages/InitiativePage'
import { INITIATIVES } from '@/data/initiatives'

export default function PeoplePage() {
  const { user, hydrated } = useAuth()
  
  if (!hydrated) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"></div>
    </div>
  }

  return (
    <InitiativePage 
      initiative={INITIATIVES.people}
    />
  )
} 