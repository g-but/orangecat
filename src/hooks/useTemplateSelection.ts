/**
 * useTemplateSelection Hook
 *
 * Reusable hook for template selection in entity creation pages.
 * Eliminates duplication of template handling logic across pages.
 *
 * USAGE:
 * ```tsx
 * const { mergedConfig, handleSelectTemplate } = useTemplateSelection(productConfig);
 *
 * return (
 *   <>
 *     <ProductTemplates onSelectTemplate={handleSelectTemplate} />
 *     <EntityForm config={mergedConfig} />
 *   </>
 * );
 * ```
 *
 * Created: 2025-12-16
 * Last Modified: 2025-12-16
 * Last Modified Summary: Initial implementation
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import type { EntityConfig, EntityTemplate, UseTemplateSelectionReturn } from '@/components/create/types';

/**
 * Hook for managing template selection state in entity creation forms.
 *
 * Handles:
 * - Template selection state
 * - Merging template defaults with config defaults
 * - Resetting template selection
 *
 * @param config - The entity configuration object
 * @returns Template selection state and handlers
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useTemplateSelection<T extends Record<string, any>>(
  config: EntityConfig<T>
): UseTemplateSelectionReturn<T> {
  const [templateValues, setTemplateValues] = useState<Partial<T>>({});

  // Merge config defaults with selected template values
  const mergedConfig = useMemo(() => ({
    ...config,
    defaultValues: { ...config.defaultValues, ...templateValues } as T,
  }), [config, templateValues]);

  // Handler for when a template is selected
  const handleSelectTemplate = useCallback((template: EntityTemplate<T>) => {
    setTemplateValues(template.defaults);

    // Optionally scroll to top of form after selection
    if (typeof window !== 'undefined') {
      // Small delay to allow state update before scroll
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }, []);

  // Reset template selection
  const resetTemplate = useCallback(() => {
    setTemplateValues({});
  }, []);

  // Check if a template has been selected
  const hasTemplateSelected = Object.keys(templateValues).length > 0;

  return {
    templateValues,
    mergedConfig,
    handleSelectTemplate,
    resetTemplate,
    hasTemplateSelected,
  };
}

export default useTemplateSelection;
