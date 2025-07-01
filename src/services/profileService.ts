/**
 * PROFILE SERVICE - CLEAN MODULAR ARCHITECTURE
 * 
 * Created: 2025-01-08
 * Last Modified: 2025-01-09
 * Last Modified Summary: ✅ REFACTORED from 808-line monolith to modular architecture - Option A Phase 1 Complete
 * 
 * BEFORE: 808 lines in single file (102% over 400-line limit)
 * AFTER: Clean imports from 5 focused modules (~200 lines each)
 * 
 * Performance Impact: Improved tree-shaking, better code splitting, easier maintenance
 * Architecture: Follows Single Responsibility Principle, DRY principles
 * 
 * Module Structure:
 * - types.ts: All TypeScript interfaces and types
 * - mapper.ts: Database schema mapping logic
 * - reader.ts: All read operations (getProfile, searchProfiles, etc.)
 * - writer.ts: All write operations (updateProfile, createProfile, etc.)
 * - index.ts: Combined service interface
 */

// Export everything from the modular architecture
export {
  ProfileService,
  ProfileMapper,
  ProfileReader,
  ProfileWriter,
  type ScalableProfile,
  type ScalableProfileFormData,
  type ProfileAnalytics,
  type ProfileServiceResponse
} from './profile/index';

// Legacy compatibility exports
export type { Profile, ProfileFormData } from '@/types/database';

// Re-export some common functions for backward compatibility
import { ProfileService } from './profile/index';

export const getProfile = ProfileService.getProfile.bind(ProfileService);
export const updateProfile = ProfileService.updateProfile.bind(ProfileService);
export const createProfile = ProfileService.createProfile.bind(ProfileService);
export const deleteProfile = ProfileService.deleteProfile.bind(ProfileService);
export const getAllProfiles = ProfileService.getAllProfiles.bind(ProfileService);
export const searchProfiles = ProfileService.searchProfiles.bind(ProfileService);
export const updateAnalytics = ProfileService.updateAnalytics.bind(ProfileService);
export const incrementProfileViews = ProfileService.incrementProfileViews.bind(ProfileService);
export const fallbackProfileUpdate = ProfileService.fallbackProfileUpdate.bind(ProfileService);

// Default export for backward compatibility
export default ProfileService; 