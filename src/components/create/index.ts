/**
 * Create Components - Barrel Export
 *
 * Unified entity creation system components.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-03
 */

// Main form component
export { EntityForm } from './EntityForm';
export { CreateEntityWorkflow } from './CreateEntityWorkflow';

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
} from './types';



























