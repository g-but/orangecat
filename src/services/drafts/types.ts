/**
 * TESLA-GRADE DRAFT MANAGEMENT SYSTEM
 * Sophisticated event-sourced architecture with real-time sync
 */

export interface DraftEvent {
  id: string
  draftId: string
  type: DraftEventType
  payload: any
  timestamp: number
  userId: string
  sessionId: string
  clientId: string
  version: number
}

export enum DraftEventType {
  DRAFT_CREATED = 'DRAFT_CREATED',
  FIELD_UPDATED = 'FIELD_UPDATED',
  STEP_CHANGED = 'STEP_CHANGED',
  AUTOSAVE_TRIGGERED = 'AUTOSAVE_TRIGGERED',
  MANUAL_SAVE = 'MANUAL_SAVE',
  SYNC_COMPLETED = 'SYNC_COMPLETED',
  CONFLICT_DETECTED = 'CONFLICT_DETECTED',
  CONFLICT_RESOLVED = 'CONFLICT_RESOLVED'
}

export interface DraftState {
  id: string
  userId: string
  title: string
  formData: CampaignFormData
  currentStep: number
  version: number
  status: DraftStatus
  metadata: DraftMetadata
  conflicts: DraftConflict[]
  lastSyncedAt: number
  lastModifiedAt: number
  createdAt: number
}

export enum DraftStatus {
  CREATING = 'CREATING',
  SYNCING = 'SYNCING',
  SYNCED = 'SYNCED',
  CONFLICT = 'CONFLICT',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR'
}

export interface DraftMetadata {
  deviceType: 'desktop' | 'mobile' | 'tablet'
  browser: string
  sessionDuration: number
  wordCount: number
  completionPercentage: number
  autoSaveCount: number
  manualSaveCount: number
}

export interface DraftConflict {
  id: string
  field: string
  localValue: any
  remoteValue: any
  timestamp: number
  resolved: boolean
  resolution?: 'local' | 'remote' | 'merge'
}

export interface CampaignFormData {
  title: string
  description: string
  bitcoin_address: string
  lightning_address: string
  website_url: string
  goal_amount: number
  categories: string[]
  images: string[]
  tags: string[]
}

export interface SyncResult {
  success: boolean
  conflicts: DraftConflict[]
  newVersion: number
  syncedAt: number
  error?: string
}

export interface DraftQuery {
  userId?: string
  status?: DraftStatus[]
  limit?: number
  offset?: number
  sortBy?: 'lastModified' | 'created' | 'title'
  sortOrder?: 'asc' | 'desc'
} 