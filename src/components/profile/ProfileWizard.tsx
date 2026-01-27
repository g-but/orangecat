/**
 * PROFILE WIZARD RE-EXPORT
 *
 * This file re-exports from the modular ProfileWizard folder for backward compatibility.
 * The actual implementation is now split into smaller, maintainable modules.
 *
 * @see ./ProfileWizard/index.tsx - Main orchestrator component
 * @see ./ProfileWizard/hooks/ - Custom hooks for wizard state
 * @see ./ProfileWizard/components/ - Subcomponents for each step
 */

export { default } from './ProfileWizard/index';
