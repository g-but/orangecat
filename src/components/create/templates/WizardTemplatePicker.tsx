/**
 * WizardTemplatePicker - Featured template selector for wizard flows
 *
 * Displays templates prominently as cards in a grid layout, designed to be
 * the main content of a wizard step (unlike TemplatePicker which is a helper).
 *
 * Features:
 * - Responsive grid layout (1 col mobile, 2 col tablet+)
 * - "Start from scratch" option
 * - Visual highlighting on selection
 * - Works with any entity's templates
 * - Touch-friendly (44px+ touch targets)
 *
 * Created: 2026-01-20
 */

'use client';

import { useState, useEffect } from 'react';
import { Check, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EntityTemplate } from '../types';

interface WizardTemplatePickerProps<T extends EntityTemplate> {
  templates: T[];
  onSelectTemplate: (template: T | null) => void;
  selectedTemplateId?: string | null;
  showStartFromScratch?: boolean;
  className?: string;
}

export function WizardTemplatePicker<T extends EntityTemplate>({
  templates,
  onSelectTemplate,
  selectedTemplateId,
  showStartFromScratch = true,
  className,
}: WizardTemplatePickerProps<T>) {
  const [selected, setSelected] = useState<string | null>(selectedTemplateId ?? null);

  // Sync with external state
  useEffect(() => {
    if (selectedTemplateId !== undefined) {
      setSelected(selectedTemplateId);
    }
  }, [selectedTemplateId]);

  const handleSelect = (templateId: string | null) => {
    setSelected(templateId);
    if (templateId === null) {
      onSelectTemplate(null);
    } else {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        onSelectTemplate(template);
      }
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Start from scratch option */}
        {showStartFromScratch && (
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={cn(
              'relative flex flex-col items-start p-4 sm:p-5 rounded-xl border-2 transition-all text-left min-h-[120px]',
              'hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
              selected === null
                ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-200'
                : 'border-gray-200 bg-white'
            )}
          >
            {selected === null && (
              <div className="absolute top-3 right-3">
                <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center mb-3 sm:mb-4">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
              Start from scratch
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Create your project with a blank canvas
            </p>
          </button>
        )}

        {/* Template options */}
        {templates.map(template => {
          const isSelected = selected === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => handleSelect(template.id)}
              className={cn(
                'relative flex flex-col items-start p-4 sm:p-5 rounded-xl border-2 transition-all text-left min-h-[120px]',
                'hover:border-orange-300 hover:bg-orange-50/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
                isSelected
                  ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-200'
                  : 'border-gray-200 bg-white'
              )}
            >
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
              <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center mb-3 sm:mb-4 border border-orange-200">
                {template.icon}
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 pr-8">
                {template.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">{template.tagline}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
