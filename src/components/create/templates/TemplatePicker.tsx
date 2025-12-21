/**
 * TemplatePicker - generic picker for prefilled entity templates.
 *
 * Keeps UI consistent across entities (projects, assets, services, products, etc.).
 *
 * Uses EntityTemplate from types.ts as the single source of truth.
 *
 * Templates are shown at the bottom of forms as quick-start helpers.
 *
 * @example
 * ```tsx
 * <TemplatePicker
 *   label="Products"
 *   templates={PRODUCT_TEMPLATES}
 *   onSelectTemplate={handleSelectTemplate}
 * />
 * ```
 */

'use client';

import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EntityTemplate } from '../types';

// Re-export for backward compatibility
export type GenericTemplate = EntityTemplate;

interface TemplatePickerProps<T extends EntityTemplate> {
  label: string;
  templates: T[];
  onSelectTemplate: (template: T) => void;
  className?: string;
}

export function TemplatePicker<T extends GenericTemplate>({
  label,
  templates,
  onSelectTemplate,
  className = '',
}: TemplatePickerProps<T>) {
  if (!templates || templates.length === 0) return null;

  return (
    <div className={cn('bg-gradient-to-br from-orange-50/50 to-amber-50/30 border border-orange-100 rounded-2xl p-5 space-y-4', className)}>
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">Need inspiration?</h3>
          <p className="text-xs text-gray-500">Quick-start with a template and customize from there.</p>
        </div>
        <span className="text-xs text-orange-600/70 font-medium">{label}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {templates.map(template => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className="w-full text-left border border-gray-200 rounded-xl p-3 hover:border-orange-300 hover:shadow-md hover:bg-white transition-all bg-white/80"
            type="button"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-orange-50 text-orange-700 flex items-center justify-center border border-orange-100 flex-shrink-0">
                {template.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">{template.name}</h4>
                <p className="text-xs text-gray-500 line-clamp-2">{template.tagline}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
















