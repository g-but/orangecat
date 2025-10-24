"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LegacyCreateRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/projects/create')
  }, [router])
  return null
}
