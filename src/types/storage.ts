/**
 * Shared types for file upload operations across all storage services.
 * Single source of truth — import from here, never redefine locally.
 */

export interface FileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
