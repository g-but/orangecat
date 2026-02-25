/**
 * Create Components - Barrel Export
 *
 * Unified entity creation system components.
 *
 * Created: 2025-12-03
 * Last Modified: 2026-01-22
 * Last Modified Summary: Removed CreateEntityWorkflow (replaced by EntityCreationWizard)
 */

// Main form component
export { EntityForm } from './EntityForm';
export { EntityCreationWizard } from './EntityCreationWizard';
export { EntityFormDialog } from './EntityFormDialog';

// Sub-components
export { FormField } from './FormField';
export { GuidancePanel } from './GuidancePanel';

// Existing dynamic sidebar (kept for backward compatibility)
export { DynamicSidebar } from './DynamicSidebar';

// Types
export type {
  EntityConfig,
  FieldConfig,
  FieldGroup,
  FieldInputType,
  SelectOption,
  GuidanceContent,
  DefaultGuidance,
  FormState,
  FormActions,
  EntityFormProps,
  FormFieldProps,
  GuidancePanelProps,
  WizardStep,
  WizardConfig,
} from './types';
