/**
 * TESLA DRAFT ENGINE - Event-Sourced Architecture
 * Real-time synchronization with conflict resolution
 */

import { createBrowserClient } from '@supabase/ssr'
import { 
  DraftState, 
  DraftEvent, 
  DraftEventType, 
  DraftStatus, 
  DraftConflict, 
  SyncResult,
  CampaignFormData,
  DraftQuery
} from './types'

export class DraftEngine {
  private static instance: DraftEngine
  private supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  private drafts = new Map<string, DraftState>()
  private eventStore: DraftEvent[] = []
  private subscribers = new Map<string, Set<(draft: DraftState) => void>>()
  private syncTimer: NodeJS.Timeout | null = null
  private clientId = this.generateClientId()
  private sessionId = this.generateSessionId()

  static getInstance(): DraftEngine {
    if (!DraftEngine.instance) {
      DraftEngine.instance = new DraftEngine()
    }
    return DraftEngine.instance
  }

  /**
   * REAL-TIME DRAFT CREATION
   */
  async createDraft(userId: string, initialData?: Partial<CampaignFormData>): Promise<DraftState> {
    const draftId = this.generateDraftId()
    const now = Date.now()
    
    const draft: DraftState = {
      id: draftId,
      userId,
      title: initialData?.title || 'Untitled Campaign',
      formData: {
        title: initialData?.title || '',
        description: initialData?.description || '',
        bitcoin_address: initialData?.bitcoin_address || '',
        lightning_address: initialData?.lightning_address || '',
        website_url: initialData?.website_url || '',
        goal_amount: initialData?.goal_amount || 0,
        categories: initialData?.categories || [],
        images: initialData?.images || [],
        tags: initialData?.tags || []
      },
      currentStep: 1,
      version: 1,
      status: DraftStatus.CREATING,
      metadata: {
        deviceType: this.detectDeviceType(),
        browser: navigator.userAgent,
        sessionDuration: 0,
        wordCount: this.calculateWordCount(initialData?.description || ''),
        completionPercentage: this.calculateCompletion(initialData),
        autoSaveCount: 0,
        manualSaveCount: 0
      },
      conflicts: [],
      lastSyncedAt: 0,
      lastModifiedAt: now,
      createdAt: now
    }

    // Store locally first
    this.drafts.set(draftId, draft)
    this.saveToLocalStorage(draft)
    
    // Emit creation event
    await this.emitEvent({
      id: this.generateEventId(),
      draftId,
      type: DraftEventType.DRAFT_CREATED,
      payload: { initialData },
      timestamp: now,
      userId,
      sessionId: this.sessionId,
      clientId: this.clientId,
      version: 1
    })

    // Start auto-sync
    this.startAutoSync(draftId)
    
    return draft
  }

  /**
   * INTELLIGENT FIELD UPDATES WITH DEBOUNCING
   */
  async updateField(
    draftId: string, 
    field: keyof CampaignFormData, 
    value: any,
    debounceMs = 500
  ): Promise<void> {
    const draft = this.drafts.get(draftId)
    if (!draft) throw new Error(`Draft ${draftId} not found`)

    // Optimistic update
    const updatedDraft = {
      ...draft,
      formData: { ...draft.formData, [field]: value },
      lastModifiedAt: Date.now(),
      version: draft.version + 1,
      status: DraftStatus.SYNCING,
      metadata: {
        ...draft.metadata,
        wordCount: field === 'description' ? this.calculateWordCount(value) : draft.metadata.wordCount,
        completionPercentage: this.calculateCompletion({ ...draft.formData, [field]: value })
      }
    }

    this.drafts.set(draftId, updatedDraft)
    this.notifySubscribers(draftId, updatedDraft)
    
    // Debounced sync
    this.debouncedSync(draftId, debounceMs)
    
    // Emit field update event
    await this.emitEvent({
      id: this.generateEventId(),
      draftId,
      type: DraftEventType.FIELD_UPDATED,
      payload: { field, value, previousValue: draft.formData[field] },
      timestamp: Date.now(),
      userId: draft.userId,
      sessionId: this.sessionId,
      clientId: this.clientId,
      version: updatedDraft.version
    })
  }

  /**
   * CONFLICT-AWARE SYNCHRONIZATION
   */
  async syncDraft(draftId: string): Promise<SyncResult> {
    const draft = this.drafts.get(draftId)
    if (!draft) throw new Error(`Draft ${draftId} not found`)

    try {
      // Check for remote changes
      const { data: remoteDraft, error } = await this.supabase
        .from('campaign_drafts')
        .select('*')
        .eq('id', draftId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      let conflicts: DraftConflict[] = []
      
      if (remoteDraft && remoteDraft.version > draft.lastSyncedAt) {
        // Detect conflicts
        conflicts = this.detectConflicts(draft, remoteDraft)
        
        if (conflicts.length > 0) {
          // Handle conflicts intelligently
          const resolvedDraft = await this.resolveConflicts(draft, remoteDraft, conflicts)
          this.drafts.set(draftId, resolvedDraft)
          this.notifySubscribers(draftId, resolvedDraft)
        }
      }

      // Sync to remote
      const syncData = {
        id: draftId,
        user_id: draft.userId,
        title: draft.title,
        form_data: draft.formData,
        current_step: draft.currentStep,
        version: draft.version,
        metadata: draft.metadata,
        last_modified_at: new Date(draft.lastModifiedAt).toISOString(),
        client_id: this.clientId,
        session_id: this.sessionId
      }

      const { error: syncError } = await this.supabase
        .from('campaign_drafts')
        .upsert(syncData)

      if (syncError) throw syncError

      // Update local state
      const syncedDraft = {
        ...draft,
        status: DraftStatus.SYNCED,
        lastSyncedAt: Date.now(),
        conflicts
      }

      this.drafts.set(draftId, syncedDraft)
      this.saveToLocalStorage(syncedDraft)
      this.notifySubscribers(draftId, syncedDraft)

      // Emit sync event
      await this.emitEvent({
        id: this.generateEventId(),
        draftId,
        type: DraftEventType.SYNC_COMPLETED,
        payload: { conflicts: conflicts.length },
        timestamp: Date.now(),
        userId: draft.userId,
        sessionId: this.sessionId,
        clientId: this.clientId,
        version: syncedDraft.version
      })

      return {
        success: true,
        conflicts,
        newVersion: syncedDraft.version,
        syncedAt: syncedDraft.lastSyncedAt
      }

    } catch (error) {
      const errorDraft = { ...draft, status: DraftStatus.ERROR }
      this.drafts.set(draftId, errorDraft)
      this.notifySubscribers(draftId, errorDraft)
      
      return {
        success: false,
        conflicts: [],
        newVersion: draft.version,
        syncedAt: draft.lastSyncedAt,
        error: error instanceof Error ? error.message : 'Unknown sync error'
      }
    }
  }

  /**
   * INTELLIGENT CONFLICT RESOLUTION
   */
  private async resolveConflicts(
    localDraft: DraftState, 
    remoteDraft: any, 
    conflicts: DraftConflict[]
  ): Promise<DraftState> {
    const resolved = { ...localDraft }
    
    for (const conflict of conflicts) {
      let resolution: 'local' | 'remote' | 'merge'
      
      // Smart conflict resolution rules
      if (conflict.field === 'title' || conflict.field === 'description') {
        // For text fields, prefer the longer/more complete version
        resolution = conflict.localValue.length > conflict.remoteValue.length ? 'local' : 'remote'
      } else if (conflict.field === 'goal_amount') {
        // For amounts, prefer non-zero values
        resolution = conflict.localValue > 0 ? 'local' : 'remote'
      } else {
        // Default to most recent
        resolution = localDraft.lastModifiedAt > remoteDraft.last_modified_at ? 'local' : 'remote'
      }

      if (resolution === 'remote') {
        resolved.formData = { ...resolved.formData, [conflict.field]: conflict.remoteValue }
      }
      
      conflict.resolved = true
      conflict.resolution = resolution
    }

    resolved.conflicts = conflicts
    resolved.status = DraftStatus.CONFLICT
    
    return resolved
  }

  /**
   * REAL-TIME SUBSCRIPTIONS
   */
  subscribe(draftId: string, callback: (draft: DraftState) => void): () => void {
    if (!this.subscribers.has(draftId)) {
      this.subscribers.set(draftId, new Set())
    }
    
    this.subscribers.get(draftId)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.subscribers.get(draftId)?.delete(callback)
    }
  }

  /**
   * QUERY INTERFACE
   */
  async queryDrafts(query: DraftQuery): Promise<DraftState[]> {
    let drafts = Array.from(this.drafts.values())
    
    if (query.userId) {
      drafts = drafts.filter(d => d.userId === query.userId)
    }
    
    if (query.status) {
      drafts = drafts.filter(d => query.status!.includes(d.status))
    }
    
    // Sort
    const sortBy = query.sortBy || 'lastModified'
    const sortOrder = query.sortOrder || 'desc'
    
    drafts.sort((a, b) => {
      let aVal: number, bVal: number
      
      switch (sortBy) {
        case 'lastModified':
          aVal = a.lastModifiedAt
          bVal = b.lastModifiedAt
          break
        case 'created':
          aVal = a.createdAt
          bVal = b.createdAt
          break
        case 'title':
          return sortOrder === 'asc' 
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title)
        default:
          aVal = a.lastModifiedAt
          bVal = b.lastModifiedAt
      }
      
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })
    
    // Pagination
    const offset = query.offset || 0
    const limit = query.limit || 50
    
    return drafts.slice(offset, offset + limit)
  }

  /**
   * PRIVATE HELPER METHODS
   */
  private detectConflicts(local: DraftState, remote: any): DraftConflict[] {
    const conflicts: DraftConflict[] = []
    const fields: (keyof CampaignFormData)[] = [
      'title', 'description', 'bitcoin_address', 'lightning_address', 
      'website_url', 'goal_amount', 'categories', 'tags'
    ]
    
    for (const field of fields) {
      const localValue = local.formData[field]
      const remoteValue = remote.form_data?.[field]
      
      if (JSON.stringify(localValue) !== JSON.stringify(remoteValue)) {
        conflicts.push({
          id: this.generateConflictId(),
          field,
          localValue,
          remoteValue,
          timestamp: Date.now(),
          resolved: false
        })
      }
    }
    
    return conflicts
  }

  private notifySubscribers(draftId: string, draft: DraftState): void {
    this.subscribers.get(draftId)?.forEach(callback => callback(draft))
  }

  private debouncedSync = this.debounce((draftId: string) => {
    this.syncDraft(draftId)
  }, 500)

  private debounce(func: Function, wait: number) {
    const timeouts = new Map<string, NodeJS.Timeout>()
    
    return (key: string, ...args: any[]) => {
      const existingTimeout = timeouts.get(key)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }
      
      const timeout = setTimeout(() => {
        timeouts.delete(key)
        func(key, ...args)
      }, wait)
      
      timeouts.set(key, timeout)
    }
  }

  private startAutoSync(draftId: string): void {
    if (this.syncTimer) return
    
    this.syncTimer = setInterval(() => {
      const draft = this.drafts.get(draftId)
      if (draft && draft.status !== DraftStatus.SYNCING) {
        this.syncDraft(draftId)
      }
    }, 30000) // Sync every 30 seconds
  }

  private async emitEvent(event: DraftEvent): Promise<void> {
    this.eventStore.push(event)
    
    // Persist to database for audit trail
    await this.supabase
      .from('draft_events')
      .insert({
        id: event.id,
        draft_id: event.draftId,
        type: event.type,
        payload: event.payload,
        timestamp: new Date(event.timestamp).toISOString(),
        user_id: event.userId,
        session_id: event.sessionId,
        client_id: event.clientId,
        version: event.version
      })
  }

  private saveToLocalStorage(draft: DraftState): void {
    try {
      localStorage.setItem(`draft_${draft.id}`, JSON.stringify(draft))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }

  private calculateWordCount(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  private calculateCompletion(data: Partial<CampaignFormData> = {}): number {
    const requiredFields = ['title', 'description', 'bitcoin_address', 'goal_amount']
    const completed = requiredFields.filter(field => {
      const value = data[field as keyof CampaignFormData]
      return value && value !== '' && value !== 0
    }).length
    
    return (completed / requiredFields.length) * 100
  }

  private detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  private generateDraftId(): string {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export const draftEngine = DraftEngine.getInstance() 