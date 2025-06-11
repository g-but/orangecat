/**
 * CLIENT-SIDE INITIATIVES HOOKS
 * 
 * React hooks for lazy loading initiatives data in client components.
 * Separated from the main data file to avoid server/client conflicts.
 * 
 * Created: 2025-01-14
 * Last Modified: 2025-01-14
 * Last Modified Summary: Client-side hooks for lazy initiatives loading
 */

'use client'

import { useEffect, useState } from 'react'
import { Initiative, loadInitiatives, loadInitiative } from '@/data/initiatives-lazy'

/**
 * React hook for lazy loading all initiatives
 */
export function useInitiatives() {
  const [initiatives, setInitiatives] = useState<Record<string, Initiative> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadInitiatives()
      .then(setInitiatives)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { initiatives, loading, error }
}

/**
 * React hook for lazy loading specific initiative
 */
export function useInitiative(id: string) {
  const [initiative, setInitiative] = useState<Initiative | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadInitiative(id)
      .then(result => {
        setInitiative(result || null)
        setLoading(false)
      })
      .catch(setError)
  }, [id])

  return { initiative, loading, error }
} 