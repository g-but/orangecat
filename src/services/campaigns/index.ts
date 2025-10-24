/**
 * UNIFIED CAMPAIGN SERVICE - SINGLE SOURCE OF TRUTH
 * 
 * This service is the ONLY place where project/draft data is managed.
 * All other parts of the app should use this service instead of direct database calls.
 * 
 * FIXES:
 * 1. Multiple sources of truth (localStorage vs database)
 * 2. Duplicated queries across 15+ files
 * 3. Inconsistent data flows
 * 4. Violation of DRY principles
 */

import { FundingPage } from '@/types/funding'
import type { CampaignFormData, CampaignDraftData, safeParseCampaignGoal } from '@/types/project'
import { getErrorMessage, type CatchError } from '@/types/common'
import { logger } from '@/utils/logger'
import supabase from '@/lib/supabase/browser'

export interface CampaignFilters {
  userId?: string
  status?: 'draft' | 'active' | 'paused' | 'all'
  limit?: number
  offset?: number
}

export interface LocalDraft {
  id: string
  title: string
  formData: CampaignDraftData
  currentStep: number
  lastSaved: Date
  draftId?: string // Linked database draft ID
}

export interface UnifiedCampaign extends FundingPage {
  source: 'database' | 'local'
  isDraft: boolean
  isActive: boolean
  isPaused: boolean
}

/**
 * SINGLE SOURCE OF TRUTH FOR ALL CAMPAIGNS
 */
export class CampaignService {
  private static instance: CampaignService
  private localStorageKey = (userId: string) => `funding-draft-${userId}`
  private supabase: any

  static getInstance(): CampaignService {
    if (!CampaignService.instance) {
      CampaignService.instance = new CampaignService()
    }
    return CampaignService.instance
  }

  // Allow regular instantiation for testing with optional client injection
  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || supabase
  }

  /**
   * GET ALL CAMPAIGNS FOR A USER (database + local drafts)
   * This is the ONLY method to get project data
   */
  async getAllProjects(userId: string): Promise<UnifiedCampaign[]> {
    try {
      // Validate input
      if (!userId || userId.trim() === '') {
        throw new Error('User ID is required')
      }

      // 1. Get all database projects
      const supabase = await this.supabase
      const { data: dbProjects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) {throw error}

      // 2. Convert database projects to unified format
      const unifiedDbProjects: UnifiedCampaign[] = (dbProjects || []).map((project: any) => ({
        ...project,
        source: 'database' as const,
        isDraft: !project.is_active && !project.is_public,
        isActive: project.is_active && project.is_public,
        isPaused: !project.is_active && project.is_public
      }))

      // 3. Get local draft if exists
      const localDraft = this.getLocalDraft(userId)
      
      // 4. Merge and deduplicate
      const allProjects: UnifiedCampaign[] = [...unifiedDbProjects]
      
      if (localDraft) {
        // Check if local draft is already in database
        const existingDbVersion = unifiedDbProjects.find(
          db => db.id === localDraft.draftId
        )
        
        if (existingDbVersion) {
          // Replace database version with local version (local takes priority)
          const index = allProjects.findIndex(c => c.id === localDraft.draftId)
          allProjects[index] = this.localDraftToUnified(localDraft, existingDbVersion)
        } else {
          // Add local draft as new project
          allProjects.unshift(this.localDraftToUnified(localDraft))
        }
      }

      return allProjects

    } catch (error) {
      logger.error('Error loading projects', error, 'Campaign')
      throw error
    }
  }

  /**
   * FILTER CAMPAIGNS BY CRITERIA
   */
  async filterProjects(projects: UnifiedCampaign[], filters: CampaignFilters): Promise<UnifiedCampaign[]> {
    let filtered = [...projects]

    if (filters.status && filters.status !== 'all') {
      switch (filters.status) {
        case 'draft':
          filtered = filtered.filter(c => c.isDraft)
          break
        case 'active':
          filtered = filtered.filter(c => c.isActive)
          break
        case 'paused':
          filtered = filtered.filter(c => c.isPaused)
          break
      }
    }

    if (filters.limit) {
      filtered = filtered.slice(filters.offset || 0, (filters.offset || 0) + filters.limit)
    }

    return filtered
  }

  /**
   * GET CAMPAIGNS BY TYPE
   */
  async getProjectsByType(userId: string, type: 'drafts' | 'active' | 'paused' | 'all'): Promise<UnifiedCampaign[]> {
    const allProjects = await this.getAllProjects(userId)
    const filterStatus = type === 'drafts' ? 'draft' : type
    return this.filterProjects(allProjects, { status: filterStatus })
  }

  /**
   * SAVE DRAFT (unified local + database storage)
   */
  async saveDraft(userId: string, formData: CampaignDraftData, currentStep: number = 1, draftId?: string): Promise<string> {
    try {
      // Validate inputs
      if (!userId || userId.trim() === '') {
        throw new Error('User ID is required')
      }
      if (!formData) {
        throw new Error('Form data is required')
      }

      // 1. Save to localStorage first (immediate feedback)
      const localDraft: LocalDraft = {
        id: `local-${userId}`,
        title: formData.title || 'Untitled Draft',
        formData,
        currentStep,
        lastSaved: new Date(),
        draftId
      }
      
      localStorage.setItem(this.localStorageKey(userId), JSON.stringify({
        formData,
        currentStep,
        draftId,
        lastSaved: localDraft.lastSaved.toISOString()
      }))

      // Helper function to safely parse numbers
      const safeParseFloat = (value: any): number | null => {
        if (!value) {return null}
        const parsed = parseFloat(value)
        return isNaN(parsed) ? null : parsed
      }

      // 2. Save to database (background sync)
      const draftData = {
        user_id: userId,
        title: formData.title || 'Untitled Draft',
        description: formData.description || null,
        bitcoin_address: formData.bitcoin_address || null,
        lightning_address: formData.lightning_address || null,
        website_url: formData.website_url || null,
        goal_amount: safeParseFloat(formData.goal_amount),
        category: formData.categories?.[0] || null,
        tags: formData.categories?.slice(1) || [],
        currency: 'BTC',
        is_active: false,
        is_public: false,
        total_funding: 0,
        contributor_count: 0
      }

      let resultId: string

      const supabase = await this.supabase
      
      if (draftId) {
        // Update existing draft
        const { data, error } = await supabase
          .from('projects')
          .update(draftData)
          .eq('id', draftId)
          .eq('user_id', userId)
          .select()
          .single()
        
        if (error) {throw error}
        resultId = data.id
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('projects')
          .insert(draftData)
          .select()
          .single()
        
        if (error) {throw error}
        resultId = data.id
        
        // Update localStorage with new draft ID
        localStorage.setItem(this.localStorageKey(userId), JSON.stringify({
          formData,
          currentStep,
          draftId: resultId,
          lastSaved: localDraft.lastSaved.toISOString()
        }))
      }

      return resultId

    } catch (error) {
      logger.error('Error saving draft', error, 'Campaign')
      throw error
    }
  }

  /**
   * PUBLISH CAMPAIGN (convert draft to active)
   */
  async publishCampaign(userId: string, projectId: string, formData: any): Promise<UnifiedCampaign> {
    try {
      // Validate inputs
      if (!userId || userId.trim() === '') {
        throw new Error('User ID is required')
      }
      if (!projectId || projectId.trim() === '') {
        throw new Error('Campaign ID is required')
      }
      if (!formData) {
        throw new Error('Form data is required')
      }

      // Helper function to safely parse numbers
      const safeParseFloat = (value: any): number | null => {
        if (!value) {return null}
        const parsed = parseFloat(value)
        return isNaN(parsed) ? null : parsed
      }

      const publishData = {
        title: formData.title,
        description: formData.description || null,
        bitcoin_address: formData.bitcoin_address || null,
        lightning_address: formData.lightning_address || null,
        website_url: formData.website_url || null,
        goal_amount: safeParseFloat(formData.goal_amount),
        category: formData.categories?.[0] || null,
        tags: formData.categories?.slice(1) || [],
        is_active: true,
        is_public: true
      }

      const supabase = await this.supabase
      const { data, error } = await supabase
        .from('projects')
        .update(publishData)
        .eq('id', projectId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {throw error}

      // Clear local draft after successful publish
      this.clearLocalDraft(userId)

      return {
        ...data,
        source: 'database' as const,
        isDraft: false,
        isActive: true,
        isPaused: false
      }

    } catch (error) {
      logger.error('Error publishing project', error, 'Campaign')
      throw error
    }
  }

  /**
   * LOCAL DRAFT MANAGEMENT
   */
  getLocalDraft(userId: string): LocalDraft | null {
    try {
      const saved = localStorage.getItem(this.localStorageKey(userId))
      if (!saved) {return null}

      const data = JSON.parse(saved)
      const title = data.formData?.title?.trim()
      
      if (!title) {return null}

      return {
        id: `local-${userId}`,
        title,
        formData: data.formData,
        currentStep: data.currentStep || 1,
        lastSaved: new Date(data.lastSaved),
        draftId: data.draftId
      }
    } catch (error) {
      logger.error('Error loading local draft', error, 'Campaign')
      return null
    }
  }

  clearLocalDraft(userId: string): void {
    try {
      localStorage.removeItem(this.localStorageKey(userId))
    } catch (error) {
      logger.error('Error clearing local draft', error, 'Campaign')
    }
  }

  hasLocalDraft(userId: string): boolean {
    return this.getLocalDraft(userId) !== null
  }

  /**
   * PRIVATE HELPER METHODS
   */
  private localDraftToUnified(localDraft: LocalDraft, dbCampaign?: UnifiedCampaign): UnifiedCampaign {
    return {
      // Use database data as base if available
      ...(dbCampaign || {}),
      // Override with local draft data
      id: localDraft.draftId || localDraft.id,
      title: localDraft.title,
      description: localDraft.formData.description || '',
      bitcoin_address: localDraft.formData.bitcoin_address || '',
      lightning_address: localDraft.formData.lightning_address || '',
      website_url: localDraft.formData.website_url || '',
      goal_amount: localDraft.formData.goal_amount ? parseFloat(String(localDraft.formData.goal_amount)) : 0,
      category: localDraft.formData.categories?.[0] || '',
      tags: localDraft.formData.categories?.slice(1) || [],
      updated_at: localDraft.lastSaved.toISOString(),
      // Computed fields
      source: 'local' as const,
      isDraft: true,
      isActive: false,
      isPaused: false,
      is_active: false,
      is_public: false,
      total_funding: 0,
      contributor_count: 0,
      currency: 'BTC',
      user_id: localDraft.id.replace('local-', ''),
      created_at: dbCampaign?.created_at || localDraft.lastSaved.toISOString()
    } as UnifiedCampaign
  }
}

// Export singleton instance
export const projectService = CampaignService.getInstance()

// Export convenience functions
export const getAllProjects = (userId: string) => projectService.getAllProjects(userId)
export const getDrafts = (userId: string) => projectService.getProjectsByType(userId, 'drafts')
export const getActiveProjects = (userId: string) => projectService.getProjectsByType(userId, 'active')
export const saveDraft = (userId: string, formData: any, currentStep?: number, draftId?: string) => 
  projectService.saveDraft(userId, formData, currentStep, draftId)
export const publishCampaign = (userId: string, projectId: string, formData: any) => 
  projectService.publishCampaign(userId, projectId, formData) 