'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getUserDrafts } from '@/services/supabase/client'

export interface DraftCampaign {
  id: string
  title: string
  description?: string
  created_at: string
  updated_at: string
  goal_amount?: number
  category?: string
  progress?: number
  source: 'database' | 'local'
}

export interface UnifiedDraft {
  id: string
  title: string
  description?: string
  formData?: any
  currentStep?: number
  lastSaved: Date | null
  source: 'database' | 'local'
  draftId?: string | null
}

export interface DraftState {
  drafts: UnifiedDraft[]
  isLoading: boolean
  error: string | null
  totalCount: number
}

export function useDrafts() {
  const { user, hydrated, isLoading: authLoading } = useAuth()
  const loadingRef = useRef(false)
  const [state, setState] = useState<DraftState>({
    drafts: [],
    isLoading: true,
    error: null,
    totalCount: 0
  })

  const getLocalDraft = useCallback((): UnifiedDraft | null => {
    if (!user || !hydrated) return null
    
    try {
      const savedDraft = localStorage.getItem(`funding-draft-${user.id}`)
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft)
        const title = draftData.formData?.title?.trim()
        
        if (title) {
          return {
            id: `local-${user.id}`,
            title,
            description: draftData.formData?.description,
            formData: draftData.formData,
            currentStep: draftData.currentStep || 1,
            lastSaved: draftData.lastSaved ? new Date(draftData.lastSaved) : null,
            source: 'local',
            draftId: draftData.draftId
          }
        }
      }
    } catch (error) {
      console.error('Error loading local draft:', error)
    }
    
    return null
  }, [user?.id, hydrated])

  const loadAllDrafts = useCallback(async () => {
    if (!user || !hydrated || authLoading || loadingRef.current) {
      if (!user || !hydrated) {
        setState(prev => ({ ...prev, isLoading: false }))
      }
      return
    }

    loadingRef.current = true
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      // Load database drafts
      const { data: dbDrafts, error } = await getUserDrafts(user.id)
      
      if (error) {
        console.error('Error loading database drafts:', error)
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error.message 
        }))
        return
      }

      // Convert database drafts to unified format
      const databaseDrafts: UnifiedDraft[] = (dbDrafts || []).map(draft => ({
        id: draft.id,
        title: draft.title,
        description: draft.description,
        lastSaved: new Date(draft.updated_at),
        source: 'database' as const,
        draftId: draft.id
      }))

      // Load local draft
      const localDraft = getLocalDraft()
      
      // Combine and deduplicate drafts
      const allDrafts: UnifiedDraft[] = []
      
      // Add local draft first (highest priority)
      if (localDraft) {
        allDrafts.push(localDraft)
      }
      
      // Add database drafts that don't conflict with local draft
      databaseDrafts.forEach(dbDraft => {
        // Only add if not already represented by local draft
        const isLocalVersion = localDraft?.draftId === dbDraft.draftId
        if (!isLocalVersion) {
          allDrafts.push(dbDraft)
        }
      })

      setState({
        drafts: allDrafts,
        isLoading: false,
        error: null,
        totalCount: allDrafts.length
      })
      
    } catch (err) {
      console.error('Error loading drafts:', err)
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: err instanceof Error ? err.message : 'Failed to load drafts' 
      }))
    } finally {
      loadingRef.current = false
    }
  }, [user?.id, hydrated, authLoading, getLocalDraft])

  // Load drafts when conditions are met
  useEffect(() => {
    if (hydrated && user && !authLoading) {
      const timeoutId = setTimeout(loadAllDrafts, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [user?.id, hydrated, authLoading, loadAllDrafts])

  const refresh = useCallback(() => {
    if (hydrated && user && !authLoading && !loadingRef.current) {
      loadAllDrafts()
    }
  }, [loadAllDrafts, hydrated, user, authLoading])

  const clearLocalDraft = useCallback(() => {
    if (!user || !hydrated) return
    
    try {
      localStorage.removeItem(`funding-draft-${user.id}`)
      refresh()
    } catch (error) {
      console.error('Error clearing local draft:', error)
    }
  }, [user?.id, hydrated, refresh])

  // Get the primary draft (most relevant to show user)
  const getPrimaryDraft = useCallback((): UnifiedDraft | null => {
    if (state.drafts.length === 0) return null
    
    // Prioritize local draft, then most recently updated database draft
    const localDraft = state.drafts.find(d => d.source === 'local')
    if (localDraft) return localDraft
    
    const dbDrafts = state.drafts.filter(d => d.source === 'database')
    if (dbDrafts.length > 0) {
      return dbDrafts.sort((a, b) => {
        const aTime = a.lastSaved?.getTime() || 0
        const bTime = b.lastSaved?.getTime() || 0
        return bTime - aTime
      })[0]
    }
    
    return null
  }, [state.drafts])

  // Computed values for backwards compatibility
  const hasAnyDraft = state.totalCount > 0
  const hasLocalDraft = state.drafts.some(d => d.source === 'local')
  const hasDrafts = state.drafts.some(d => d.source === 'database')
  const latestDraft = getPrimaryDraft()
  const localDraft = state.drafts.find(d => d.source === 'local')

  // Legacy format for compatibility
  const drafts = state.drafts
    .filter(d => d.source === 'database')
    .map(d => ({
      id: d.id,
      title: d.title,
      description: d.description,
      created_at: d.lastSaved?.toISOString() || '',
      updated_at: d.lastSaved?.toISOString() || '',
      goal_amount: 0,
      category: '',
      progress: 0
    }))

  return {
    // New unified interface
    allDrafts: state.drafts,
    totalCount: state.totalCount,
    
    // Legacy interface for backwards compatibility
    drafts,
    isLoading: state.isLoading,
    error: state.error,
    hasDrafts,
    hasLocalDraft,
    hasAnyDraft,
    latestDraft,
    localDraft: localDraft ? {
      formData: localDraft.formData || {},
      currentStep: localDraft.currentStep || 1,
      draftId: localDraft.draftId,
      lastSaved: localDraft.lastSaved
    } : null,
    
    // Methods
    refresh,
    getLocalDraft,
    clearLocalDraft,
    getPrimaryDraft
  }
} 