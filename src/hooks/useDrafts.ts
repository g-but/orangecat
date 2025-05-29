'use client'

import { useState, useEffect, useCallback } from 'react'
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
}

export interface LocalDraft {
  formData: any
  currentStep: number
  draftId: string | null
  lastSaved: Date | null
}

export interface DraftState {
  drafts: DraftCampaign[]
  isLoading: boolean
  error: string | null
  hasDrafts: boolean
  hasLocalDraft: boolean
  hasAnyDraft: boolean
  latestDraft: DraftCampaign | null
  localDraft: LocalDraft | null
}

export function useDrafts() {
  const { user, hydrated } = useAuth()
  const [state, setState] = useState<DraftState>({
    drafts: [],
    isLoading: true,
    error: null,
    hasDrafts: false,
    hasLocalDraft: false,
    hasAnyDraft: false,
    latestDraft: null,
    localDraft: null
  })

  const getLocalDraft = useCallback((): LocalDraft | null => {
    if (!user || !hydrated) return null
    
    try {
      const savedDraft = localStorage.getItem(`funding-draft-${user.id}`)
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft)
        return {
          formData: draftData.formData || {},
          currentStep: draftData.currentStep || 1,
          draftId: draftData.draftId || null,
          lastSaved: draftData.lastSaved ? new Date(draftData.lastSaved) : null
        }
      }
    } catch (error) {
      console.error('Error loading local draft:', error)
    }
    
    return null
  }, [user, hydrated])

  const loadDrafts = useCallback(async () => {
    if (!user || !hydrated) {
      setState(prev => ({ ...prev, isLoading: false }))
      return
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      // Load database drafts
      const { data, error } = await getUserDrafts(user.id)
      
      if (error) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error.message 
        }))
        return
      }

      const drafts = data || []
      const latestDraft = drafts.length > 0 ? drafts[0] : null

      // Load local draft
      const localDraft = getLocalDraft()
      const hasLocalDraft = !!(localDraft && localDraft.formData?.title?.trim())
      const hasDrafts = drafts.length > 0
      const hasAnyDraft = hasDrafts || hasLocalDraft

      setState({
        drafts,
        isLoading: false,
        error: null,
        hasDrafts,
        hasLocalDraft,
        hasAnyDraft,
        latestDraft,
        localDraft
      })
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: err instanceof Error ? err.message : 'Failed to load drafts' 
      }))
    }
  }, [user, hydrated, getLocalDraft])

  useEffect(() => {
    if (hydrated) {
      loadDrafts()
    }
  }, [loadDrafts, hydrated])

  const refresh = useCallback(() => {
    if (hydrated) {
      loadDrafts()
    }
  }, [loadDrafts, hydrated])

  const clearLocalDraft = useCallback(() => {
    if (!user || !hydrated) return
    
    try {
      localStorage.removeItem(`funding-draft-${user.id}`)
      // Refresh state after clearing
      refresh()
    } catch (error) {
      console.error('Error clearing local draft:', error)
    }
  }, [user, hydrated, refresh])

  // Get the most relevant draft to show to the user
  const getPrimaryDraft = useCallback(() => {
    // Prioritize local draft if it's more recent or has more content
    if (state.hasLocalDraft && state.localDraft) {
      const localTitle = state.localDraft.formData?.title?.trim()
      if (localTitle) {
        // If we have a local draft with content, prioritize it
        return {
          type: 'local' as const,
          title: localTitle,
          lastUpdated: state.localDraft.lastSaved,
          step: state.localDraft.currentStep,
          draftId: state.localDraft.draftId
        }
      }
    }

    // Fall back to database draft
    if (state.hasDrafts && state.latestDraft) {
      return {
        type: 'database' as const,
        title: state.latestDraft.title,
        lastUpdated: new Date(state.latestDraft.updated_at),
        draftId: state.latestDraft.id
      }
    }

    return null
  }, [state])

  return {
    ...state,
    refresh,
    getLocalDraft,
    clearLocalDraft,
    getPrimaryDraft
  }
} 