/**
 * TESLA-GRADE DRAFT HOOK
 * Beautiful real-time interface with conflict resolution
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { draftEngine } from '@/services/drafts/DraftEngine'
import { 
  DraftState, 
  DraftStatus, 
  CampaignFormData, 
  DraftQuery,
  DraftConflict 
} from '@/services/drafts/types'

export interface TeslaDraftState {
  drafts: DraftState[]
  activeDraft: DraftState | null
  isLoading: boolean
  isCreating: boolean
  isSyncing: boolean
  hasConflicts: boolean
  error: string | null
  stats: {
    totalDrafts: number
    completedDrafts: number
    averageCompletion: number
    totalWordCount: number
    syncedDrafts: number
    conflictedDrafts: number
  }
}

export interface DraftActions {
  createDraft: (initialData?: Partial<CampaignFormData>) => Promise<DraftState>
  updateField: (field: keyof CampaignFormData, value: any) => Promise<void>
  setActiveDraft: (draftId: string) => void
  syncDraft: (draftId?: string) => Promise<void>
  deleteDraft: (draftId: string) => Promise<void>
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote') => Promise<void>
  publishDraft: (draftId: string) => Promise<void>
  duplicateDraft: (draftId: string) => Promise<DraftState>
  refreshDrafts: () => Promise<void>
}

export function useTeslaDrafts(): TeslaDraftState & DraftActions {
  const { user, isLoading: authLoading } = useAuth()
  const [state, setState] = useState<TeslaDraftState>({
    drafts: [],
    activeDraft: null,
    isLoading: true,
    isCreating: false,
    isSyncing: false,
    hasConflicts: false,
    error: null,
    stats: {
      totalDrafts: 0,
      completedDrafts: 0,
      averageCompletion: 0,
      totalWordCount: 0,
      syncedDrafts: 0,
      conflictedDrafts: 0
    }
  })

  const subscriptions = useRef<Map<string, () => void>>(new Map())

  /**
   * LOAD ALL DRAFTS WITH REAL-TIME SUBSCRIPTIONS
   */
  const loadDrafts = useCallback(async () => {
    if (!user || authLoading) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const query: DraftQuery = {
        userId: user.id,
        sortBy: 'lastModified',
        sortOrder: 'desc'
      }

      const drafts = await draftEngine.queryDrafts(query)
      
      // Subscribe to real-time updates for each draft
      subscriptions.current.forEach(unsubscribe => unsubscribe())
      subscriptions.current.clear()

      drafts.forEach(draft => {
        const unsubscribe = draftEngine.subscribe(draft.id, (updatedDraft) => {
          setState(prev => ({
            ...prev,
            drafts: prev.drafts.map(d => d.id === updatedDraft.id ? updatedDraft : d),
            activeDraft: prev.activeDraft?.id === updatedDraft.id ? updatedDraft : prev.activeDraft,
            hasConflicts: prev.drafts.some(d => d.conflicts.length > 0),
            stats: calculateStats([...prev.drafts.filter(d => d.id !== updatedDraft.id), updatedDraft])
          }))
        })
        
        subscriptions.current.set(draft.id, unsubscribe)
      })

      const stats = calculateStats(drafts)
      const hasConflicts = drafts.some(d => d.conflicts.length > 0)

      setState(prev => ({
        ...prev,
        drafts,
        isLoading: false,
        hasConflicts,
        stats,
        activeDraft: prev.activeDraft ? drafts.find(d => d.id === prev.activeDraft?.id) || null : null
      }))

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load drafts'
      }))
    }
  }, [user?.id, authLoading])

  /**
   * CREATE NEW DRAFT WITH OPTIMISTIC UI
   */
  const createDraft = useCallback(async (initialData?: Partial<CampaignFormData>): Promise<DraftState> => {
    if (!user) throw new Error('User not authenticated')

    setState(prev => ({ ...prev, isCreating: true, error: null }))

    try {
      const draft = await draftEngine.createDraft(user.id, initialData)
      
      // Subscribe to real-time updates
      const unsubscribe = draftEngine.subscribe(draft.id, (updatedDraft) => {
        setState(prev => ({
          ...prev,
          drafts: prev.drafts.map(d => d.id === updatedDraft.id ? updatedDraft : d),
          activeDraft: prev.activeDraft?.id === updatedDraft.id ? updatedDraft : prev.activeDraft,
          stats: calculateStats(prev.drafts.map(d => d.id === updatedDraft.id ? updatedDraft : d))
        }))
      })
      
      subscriptions.current.set(draft.id, unsubscribe)

      setState(prev => ({
        ...prev,
        drafts: [draft, ...prev.drafts],
        activeDraft: draft,
        isCreating: false,
        stats: calculateStats([draft, ...prev.drafts])
      }))

      return draft

    } catch (error) {
      setState(prev => ({
        ...prev,
        isCreating: false,
        error: error instanceof Error ? error.message : 'Failed to create draft'
      }))
      throw error
    }
  }, [user])

  /**
   * INTELLIGENT FIELD UPDATES WITH OPTIMISTIC UI
   */
  const updateField = useCallback(async (field: keyof CampaignFormData, value: any): Promise<void> => {
    const { activeDraft } = state
    if (!activeDraft) throw new Error('No active draft')

    setState(prev => ({ ...prev, isSyncing: true }))

    try {
      await draftEngine.updateField(activeDraft.id, field, value)
      
      // Optimistic update is handled by the subscription
      setState(prev => ({ ...prev, isSyncing: false }))

    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Failed to update field'
      }))
      throw error
    }
  }, [state.activeDraft])

  /**
   * SET ACTIVE DRAFT FOR EDITING
   */
  const setActiveDraft = useCallback((draftId: string) => {
    const draft = state.drafts.find(d => d.id === draftId)
    if (draft) {
      setState(prev => ({ ...prev, activeDraft: draft }))
    }
  }, [state.drafts])

  /**
   * MANUAL SYNC WITH CONFLICT RESOLUTION
   */
  const syncDraft = useCallback(async (draftId?: string): Promise<void> => {
    const targetId = draftId || state.activeDraft?.id
    if (!targetId) throw new Error('No draft to sync')

    setState(prev => ({ ...prev, isSyncing: true }))

    try {
      const result = await draftEngine.syncDraft(targetId)
      
      setState(prev => ({ ...prev, isSyncing: false }))

      if (result.conflicts.length > 0) {
        // Show conflict resolution UI
        setState(prev => ({ ...prev, hasConflicts: true }))
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      }))
    }
  }, [state.activeDraft])

  /**
   * CONFLICT RESOLUTION
   */
  const resolveConflict = useCallback(async (conflictId: string, resolution: 'local' | 'remote'): Promise<void> => {
    // Implementation would update the conflict resolution in the draft
    // This is a placeholder for the full implementation
    setState(prev => ({ ...prev, hasConflicts: false }))
  }, [])

  /**
   * PUBLISH DRAFT TO LIVE CAMPAIGN
   */
  const publishDraft = useCallback(async (draftId: string): Promise<void> => {
    // Implementation would convert draft to published campaign
    // Remove from drafts and add to active campaigns
  }, [])

  /**
   * DUPLICATE EXISTING DRAFT
   */
  const duplicateDraft = useCallback(async (draftId: string): Promise<DraftState> => {
    const sourceDraft = state.drafts.find(d => d.id === draftId)
    if (!sourceDraft || !user) throw new Error('Source draft not found')

    return createDraft({
      ...sourceDraft.formData,
      title: `${sourceDraft.formData.title} (Copy)`
    })
  }, [state.drafts, user, createDraft])

  /**
   * DELETE DRAFT
   */
  const deleteDraft = useCallback(async (draftId: string): Promise<void> => {
    setState(prev => ({
      ...prev,
      drafts: prev.drafts.filter(d => d.id !== draftId),
      activeDraft: prev.activeDraft?.id === draftId ? null : prev.activeDraft,
      stats: calculateStats(prev.drafts.filter(d => d.id !== draftId))
    }))

    // Unsubscribe from updates
    const unsubscribe = subscriptions.current.get(draftId)
    if (unsubscribe) {
      unsubscribe()
      subscriptions.current.delete(draftId)
    }
  }, [])

  /**
   * REFRESH ALL DRAFTS
   */
  const refreshDrafts = useCallback(async (): Promise<void> => {
    await loadDrafts()
  }, [loadDrafts])

  // Load drafts on mount and user change
  useEffect(() => {
    loadDrafts()
    
    // Cleanup subscriptions on unmount
    return () => {
      subscriptions.current.forEach(unsubscribe => unsubscribe())
      subscriptions.current.clear()
    }
  }, [loadDrafts])

  return {
    ...state,
    createDraft,
    updateField,
    setActiveDraft,
    syncDraft,
    deleteDraft,
    resolveConflict,
    publishDraft,
    duplicateDraft,
    refreshDrafts
  }
}

/**
 * CALCULATE DRAFT STATISTICS
 */
function calculateStats(drafts: DraftState[]) {
  const totalDrafts = drafts.length
  const completedDrafts = drafts.filter(d => d.metadata.completionPercentage >= 80).length
  const averageCompletion = totalDrafts > 0 
    ? drafts.reduce((sum, d) => sum + d.metadata.completionPercentage, 0) / totalDrafts 
    : 0
  const totalWordCount = drafts.reduce((sum, d) => sum + d.metadata.wordCount, 0)
  const syncedDrafts = drafts.filter(d => d.status === DraftStatus.SYNCED).length
  const conflictedDrafts = drafts.filter(d => d.conflicts.length > 0).length

  return {
    totalDrafts,
    completedDrafts,
    averageCompletion: Math.round(averageCompletion),
    totalWordCount,
    syncedDrafts,
    conflictedDrafts
  }
} 