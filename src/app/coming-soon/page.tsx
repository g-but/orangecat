'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
// import { createClient } from '@/lib/supabase/client' // Old import
import supabase from '@/services/supabase/client' // New default import
import Link from 'next/link'

export default function ComingSoon() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      // const supabase = createClient() // No longer needed, supabase is imported directly
      if (!supabase) return

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/')
      }
    }
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Coming Soon</h1>
        <p className="text-xl text-gray-600 mb-8">
          We&apos;re working hard to bring you something amazing. Stay tuned!
        </p>
        <div className="animate-pulse">
          <div className="h-2 w-20 bg-gray-300 rounded mx-auto"></div>
        </div>
      </div>
    </div>
  )
} 