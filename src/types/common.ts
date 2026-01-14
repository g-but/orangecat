/**
 * Common Types - Replacing 'any' with Proper TypeScript Types
 * 
 * This file defines reusable types that eliminate the need for 'any' 
 * throughout the codebase, improving type safety and developer experience.
 * 
 * Created: 2025-06-08
 * Last Modified: 2025-06-08
 * Last Modified Summary: Initial creation of common types for TypeScript cleanup
 */

// ==================== ERROR HANDLING ====================

/**
 * Standard error type for catch blocks and error handling
 * Replaces: catch (error: any)
 */
export interface AppError extends Error {
  code?: string
  status?: number
  details?: unknown
}

/**
 * Generic error that can be Error, string, or unknown
 * Useful for catch blocks where error type is uncertain
 */
export type CatchError = Error | string | unknown

/**
 * API Error response structure
 */
export interface ApiErrorResponse {
  message: string
  code?: string
  status?: number
  details?: Record<string, unknown>
}

// ==================== API RESPONSES ====================

/**
 * Generic API response wrapper
 * Replaces: { data: any, error: any }
 */
export interface ApiResponse<T = unknown> {
  data: T | null
  error: ApiErrorResponse | null
  status?: number
}

/**
 * Supabase-style response
 * Replaces: { data: any, error: Error | null }
 */
export interface SupabaseResponse<T = unknown> {
  data: T | null
  error: Error | null
  status?: number
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T = unknown> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error: ApiErrorResponse | null
}

// ==================== FORM DATA ====================

/**
 * Generic form field value
 * Replaces: value: any in form handlers
 */
export type FormValue = string | number | boolean | Date | null | undefined

/**
 * Generic form data object
 * Replaces: formData: any
 */
export type FormData = Record<string, FormValue | FormValue[]>

/**
 * Form validation error
 */
export interface FormError {
  field: string
  message: string
  code?: string
}

// ==================== UTILITY TYPES ====================

/**
 * Generic cache entry
 * Replaces: { data: any; timestamp: number }
 */
export interface CacheEntry<T = unknown> {
  data: T
  timestamp: number
  expiresAt?: number
}

/**
 * Generic key-value object
 * Replaces: { [key: string]: any }
 */
export type KeyValueObject<T = unknown> = Record<string, T>

/**
 * Logger data type
 * Replaces: data?: any in logger functions
 */
export type LoggerData = Record<string, unknown> | string | number | boolean | null | undefined

/**
 * Event handler data
 * Replaces: ...args: any[] in event handlers
 */
export type EventHandlerArgs = unknown[]

// ==================== JSON TYPES ====================

/**
 * JSON-serializable value
 * Replaces: any for JSON data
 */
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray

/**
 * JSON object
 */
export type JsonObject = { [key: string]: JsonValue }

/**
 * JSON array
 */
export type JsonArray = JsonValue[]

// ==================== ENTITY STATUS TYPES (SSOT) ====================

/**
 * Base entity status - used across most entity types
 * SSOT: Use this instead of inline union types
 */
export type EntityStatus = 'draft' | 'active' | 'paused' | 'archived';

/**
 * Extended entity status including 'completed' state
 * Used for entities that can be marked as finished (e.g., causes, projects)
 */
export type EntityStatusWithCompleted = 'draft' | 'active' | 'completed' | 'paused' | 'archived';

/**
 * Asset verification status levels
 */
export type VerificationStatus = 'unverified' | 'user_provided' | 'third_party_verified';

/**
 * Common visibility levels for entities
 */
export type VisibilityLevel = 'public' | 'private' | 'unlisted' | 'hidden';

// ==================== DATABASE TYPES ====================

/**
 * Generic database record
 * Replaces: any for database rows
 */
export interface DatabaseRecord {
  id: string
  created_at: string
  updated_at: string
}

/**
 * Database insert data (without generated fields)
 */
export type DatabaseInsert<T extends DatabaseRecord> = Omit<T, 'id' | 'created_at' | 'updated_at'>

/**
 * Database update data (optional fields, no generated fields)
 */
export type DatabaseUpdate<T extends DatabaseRecord> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>

// ==================== TYPE GUARDS ====================

/**
 * Type guard to check if value is an Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error
}

/**
 * Type guard to check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Type guard to check if value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Type guard to check if error has a message
 */
export function hasMessage(error: unknown): error is { message: string } {
  return isObject(error) && 'message' in error && isString(error.message)
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Safe error message extraction
 * Replaces: error instanceof Error ? error.message : 'Unknown error'
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {return error.message}
  if (isString(error)) {return error}
  if (hasMessage(error)) {return error.message}
  return 'Unknown error occurred'
}

/**
 * Safe error code extraction
 */
export function getErrorCode(error: unknown): string | undefined {
  if (isObject(error) && 'code' in error && isString(error.code)) {
    return error.code
  }
  return undefined
} 