/**
 * Consolidated Template Data
 *
 * Re-exports all template arrays from modular files.
 * This file is kept for backward compatibility.
 * New code should import directly from individual template files or from './index'.
 *
 * Created: 2025-12-27
 * Last Modified: 2025-01-30
 * Last Modified Summary: Refactored to re-export from modular template files
 */

// Re-export all templates from modular files
export {
  PRODUCT_TEMPLATES,
  SERVICE_TEMPLATES,
  CAUSE_TEMPLATES,
  LOAN_TEMPLATES,
  AI_ASSISTANT_TEMPLATES,
  PROJECT_TEMPLATES,
  ASSET_TEMPLATES,
  EVENT_TEMPLATES,
  type ProjectDefaults,
  type AssetDefaults,
} from './index';
