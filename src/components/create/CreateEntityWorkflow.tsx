'use client';

/**
 * CREATE ENTITY WORKFLOW
 *
 * Unified workflow component for entity creation with optional template selection.
 * Handles the template selection → form flow in a reusable, DRY way.
 *
 * Features:
 * - Optional template selection screen
 * - Seamless transition to form
 * - Consistent UX across all entity types
 * - Modular and maintainable
 *
 * @example
 * ```tsx
 * <CreateEntityWorkflow
 *   config={circleConfig}
 *   TemplateComponent={CircleTemplates}
 * />
 * ```
 */

import { useState, useCallback } from 'react';
import { EntityForm } from './EntityForm';
import type { EntityConfig } from './types';

interface CreateEntityWorkflowProps<T extends Record<string, any>> {
  /** Entity configuration */
  config: EntityConfig<T>;
  /** Optional template selection component */
  TemplateComponent?: React.ComponentType<{
    onSelectTemplate: (template: Partial<T>) => void;
  }>;
  /** Optional initial values (from URL params, etc.) */
  initialValues?: Partial<T>;
  /** Custom page header (optional) */
  pageHeader?: {
    title: string;
    description: string;
  };
  /** Whether to show templates by default */
  showTemplatesByDefault?: boolean;
}

export function CreateEntityWorkflow<T extends Record<string, any>>({
  config,
  TemplateComponent,
  initialValues,
  pageHeader,
  showTemplatesByDefault = true,
}: CreateEntityWorkflowProps<T>) {
  const [selectedTemplate, setSelectedTemplate] = useState<Partial<T> | null>(
    initialValues || null
  );
  const [showTemplates, setShowTemplates] = useState(
    showTemplatesByDefault && TemplateComponent && !initialValues
  );

  const handleTemplateSelect = useCallback((template: Partial<T>) => {
    // Merge template values with defaults
    const templateData: Partial<T> = {
      ...config.defaultValues,
      ...template,
    };
    setSelectedTemplate(templateData);
    setShowTemplates(false);
  }, [config.defaultValues]);

  const handleStartFromScratch = useCallback(() => {
    setSelectedTemplate(config.defaultValues as Partial<T>);
    setShowTemplates(false);
  }, [config.defaultValues]);

  // Show template selection if available and not skipped
  if (showTemplates && TemplateComponent) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {pageHeader ? (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {pageHeader.title}
            </h1>
            <p className="text-gray-600">{pageHeader.description}</p>
          </div>
        ) : (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create {config.name}
            </h1>
            <p className="text-gray-600">
              {config.pageDescription || `Create a new ${config.name.toLowerCase()}`}
            </p>
          </div>
        )}
        <TemplateComponent onSelectTemplate={handleTemplateSelect} />
        <div className="text-center pt-6 border-t border-gray-200 mt-6">
          <button
            type="button"
            onClick={handleStartFromScratch}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Or start from scratch →
          </button>
        </div>
      </div>
    );
  }

  // Show form with selected template or initial values
  return (
    <EntityForm
      config={config}
      initialValues={selectedTemplate || initialValues || undefined}
    />
  );
}











