/**
 * UNIFIED CAMPAIGNS HOOK - SINGLE SOURCE OF TRUTH
 * 
 * This hook replaces the messy useDrafts hook and provides a clean interface
 * to the unified campaign service. It respects DRY principles and eliminates
 * the multiple sources of truth problem.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { 
  campaignService, 
  UnifiedCampaign, 
  getAllCampaigns, 
  getDrafts, 
  getActiveCampaigns 
} from '@/services/campaigns'

export interface CampaignState {
  campaigns: UnifiedCampaign[]
  drafts: UnifiedCampaign[]
  activeCampaigns: UnifiedCampaign[]
  pausedCampaigns: UnifiedCampaign[]
  isLoading: boolean
  error: string | null
  stats: {
    totalCampaigns: number
    totalDrafts: number
    totalActive: number
    totalPaused: number
    totalRaised: number
    hasLocalDraft: boolean
  }
}

export function useCampaigns() {
  const { user, hydrated, isLoading: authLoading } = useAuth()
  const [state, setState] = useState<CampaignState>({
    campaigns: [],
    drafts: [],
    activeCampaigns: [],
    pausedCampaigns: [],
    isLoading: true,
    error: null,
    stats: {
      totalCampaigns: 0,
      totalDrafts: 0,
      totalActive: 0,
      totalPaused: 0,
      totalRaised: 0,
      hasLocalDraft: false
    }
  })

  const loadCampaigns = useCallback(async () => {
    if (!user || !hydrated || authLoading) {
      setState(prev => ({ ...prev, isLoading: false }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Single call to get ALL campaign data
      const campaigns = await getAllCampaigns(user.id)
      
      // Categorize campaigns
      const drafts = campaigns.filter(c => c.isDraft)
      const activeCampaigns = campaigns.filter(c => c.isActive)
      const pausedCampaigns = campaigns.filter(c => c.isPaused)
      
      // Calculate stats
      const totalRaised = campaigns.reduce((sum, c) => sum + (c.total_funding || 0), 0)
      const hasLocalDraft = campaigns.some(c => c.source === 'local')

      setState({
        campaigns,
        drafts,
        activeCampaigns,
        pausedCampaigns,
        isLoading: false,
        error: null,
        stats: {
          totalCampaigns: campaigns.length,
          totalDrafts: drafts.length,
          totalActive: activeCampaigns.length,
          totalPaused: pausedCampaigns.length,
          totalRaised,
          hasLocalDraft
        }
      })

    } catch (error) {
      console.error('Error loading campaigns:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load campaigns'
      }))
    }
  }, [user?.id, hydrated, authLoading])

  useEffect(() => {
    loadCampaigns()
  }, [loadCampaigns])

  // Convenience methods
  const saveDraft = useCallback(async (formData: any, currentStep?: number, draftId?: string) => {
    if (!user) throw new Error('User not authenticated')
    
    const savedDraftId = await campaignService.saveDraft(user.id, formData, currentStep, draftId)
    await loadCampaigns() // Refresh data
    return savedDraftId
  }, [user, loadCampaigns])

  const publishCampaign = useCallback(async (campaignId: string, formData: any) => {
    if (!user) throw new Error('User not authenticated')
    
    const published = await campaignService.publishCampaign(user.id, campaignId, formData)
    await loadCampaigns() // Refresh data
    return published
  }, [user, loadCampaigns])

  const clearLocalDraft = useCallback(() => {
    if (!user) return
    
    campaignService.clearLocalDraft(user.id)
    loadCampaigns() // Refresh data
  }, [user, loadCampaigns])

  const getLocalDraft = useCallback(() => {
    if (!user) return null
    return campaignService.getLocalDraft(user.id)
  }, [user])

  const getPrimaryDraft = useCallback(() => {
    if (state.drafts.length === 0) return null
    
    // Prioritize local draft, then most recent database draft
    const localDraft = state.drafts.find(d => d.source === 'local')
    if (localDraft) return localDraft
    
    // Return most recent database draft
    return state.drafts
      .filter(d => d.source === 'database')
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0] || null
  }, [state.drafts])

  // Legacy compatibility (for gradual migration)
  const hasAnyDraft = state.stats.totalDrafts > 0
  const hasLocalDraft = state.stats.hasLocalDraft
  const hasDrafts = state.drafts.some(d => d.source === 'database')

  return {
    // New unified interface
    ...state,
    
    // Actions
    saveDraft,
    publishCampaign,
    clearLocalDraft,
    getLocalDraft,
    getPrimaryDraft,
    refresh: loadCampaigns,
    
    // Legacy compatibility
    hasAnyDraft,
    hasLocalDraft,
    hasDrafts,
    latestDraft: getPrimaryDraft(),
    localDraft: getLocalDraft() ? {
      formData: getLocalDraft()?.formData || {},
      currentStep: getLocalDraft()?.currentStep || 1,
      draftId: getLocalDraft()?.draftId,
      lastSaved: getLocalDraft()?.lastSaved || null
    } : null
  }
} 