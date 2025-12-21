/**
 * Asset Schema - Domain Layer
 * 
 * Re-exports from centralized validation schema.
 * This maintains the domain layer interface while using the centralized schema.
 * 
 * Created: 2025-01-XX
 * Last Modified: 2025-01-XX
 * Last Modified Summary: Consolidated to use centralized validation schema
 */

// Re-export from centralized validation
export { assetSchema, type AssetFormData as AssetInput } from '@/lib/validation'

