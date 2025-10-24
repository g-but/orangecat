/**
 * LEGACY DRAFT MIGRATION UTILITY
 * 
 * Safely migrates from the old multiple-system approach to the new unified store.
 * Recovers localStorage drafts and ensures no data is lost.
 */

import { useCampaignStore, CampaignFormData } from '@/stores/campaignStore'
import { logger } from './logger'

interface LegacyLocalStorageDraft {
  formData: CampaignFormData
  currentStep: number
  draftId?: string
  lastSaved: string
}

/**
 * Migrate all legacy drafts to the new unified system
 */
export async function migrateLegacyDrafts(userId: string): Promise<{
  migrated: number
  recovered: string[]
  errors: string[]
}> {
  const results = {
    migrated: 0,
    recovered: [] as string[],
    errors: [] as string[]
  }

  try {
    // 1. Check for legacy localStorage drafts
    const legacyKeys = Object.keys(localStorage).filter(key => 
      key.includes('funding-draft') || key.includes('draft-')
    )

    // Found legacy localStorage keys for migration

    for (const key of legacyKeys) {
      try {
        const rawData = localStorage.getItem(key)
        if (!rawData) {continue}

        const legacyDraft: LegacyLocalStorageDraft = JSON.parse(rawData)
        const title = legacyDraft.formData?.title?.trim()

        if (!title) {
          // Skipping empty draft
          continue
        }

        // Migrate to new store
        const { saveDraft } = useCampaignStore.getState()
        const newDraftId = await saveDraft(userId, legacyDraft.formData)

        results.migrated++
        results.recovered.push(title)

        // Remove legacy draft
        localStorage.removeItem(key)
        
                  // Migrated draft successfully

      } catch (error) {
        results.errors.push(`Failed to migrate ${key}: ${error}`)
      }
    }

    // 2. Clean up other legacy localStorage
    const legacyPatterns = [
      'useDrafts-',
      'tesla-draft-',
      'project-service-'
    ]

    legacyPatterns.forEach(pattern => {
      Object.keys(localStorage).forEach(key => {
        if (key.includes(pattern)) {
          localStorage.removeItem(key)
          // Cleaned up legacy key
        }
      })
    })

          // Migration complete
    return results

  } catch (error) {
    results.errors.push(`Migration failed: ${error}`)
    return results
  }
}

/**
 * Check if user has any legacy drafts that need migration
 */
export function hasLegacyDrafts(): boolean {
  const legacyKeys = Object.keys(localStorage).filter(key => 
    key.includes('funding-draft') || 
    key.includes('draft-') ||
    key.includes('tesla-draft')
  )
  
  return legacyKeys.length > 0
}

/**
 * Get preview of legacy drafts before migration
 */
export function getLegacyDraftPreview(): Array<{
  key: string
  title: string
  lastSaved: string
  size: number
}> {
  const previews: Array<{
    key: string
    title: string
    lastSaved: string
    size: number
  }> = []

  Object.keys(localStorage).forEach(key => {
    if (key.includes('funding-draft') || key.includes('draft-')) {
      try {
        const rawData = localStorage.getItem(key)
        if (!rawData) {return}

        const data = JSON.parse(rawData)
        const title = data.formData?.title || 'Untitled'
        const lastSaved = data.lastSaved || 'Unknown'

        previews.push({
          key,
          title,
          lastSaved,
          size: rawData.length
        })
      } catch (error) {
      }
    }
  })

  return previews
}

/**
 * Force recover a specific draft by key
 */
export async function recoverSpecificDraft(
  userId: string, 
  storageKey: string
): Promise<string | null> {
  try {
    const rawData = localStorage.getItem(storageKey)
    if (!rawData) {
      throw new Error('Draft not found in localStorage')
    }

    const legacyDraft: LegacyLocalStorageDraft = JSON.parse(rawData)
    
    if (!legacyDraft.formData?.title?.trim()) {
      throw new Error('Draft has no title')
    }

    const { saveDraft } = useCampaignStore.getState()
    const newDraftId = await saveDraft(userId, legacyDraft.formData)

            if (process.env.NODE_ENV === 'development') {logger.info(`Recovered draft "${legacyDraft.formData.title}" -> ${newDraftId}`)}
    return newDraftId

  } catch (error) {
    throw error
  }
}

/**
 * Create the "mao" draft if it's missing
 */
export async function recreateMaoDraft(userId: string): Promise<string> {
  const { saveDraft } = useCampaignStore.getState()
  
  const maoDraft: CampaignFormData = {
    title: 'mao',
    description: '',
    bitcoin_address: '',
    lightning_address: '',
    website_url: '',
    goal_amount: 0,
    categories: [],
    images: []
  }

  const draftId = await saveDraft(userId, maoDraft)
  // REMOVED: console.log statement
  
  return draftId
} 