"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/projects/create')
  }, [router])
  return null
}
