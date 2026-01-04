'use client';

/**
 * GUIDANCE PANEL COMPONENT
 *
 * Shows contextual guidance for form fields.
 * Displays default content when no field is focused,
 * and field-specific guidance when a field is active.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-03
 * Last Modified Summary: Initial guidance panel component
 */

import { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { GuidanceContent, DefaultGuidance } from './types';

// ==================== PROPS ====================

interface GuidancePanelProps {
  activeField: string | null;
  guidanceContent: Record<string, GuidanceContent>;
  defaultGuidance: DefaultGuidance;
  additionalContent?: ReactNode;
}

// ==================== COMPONENT ====================

export function GuidancePanel({
  activeField,
  guidanceContent,
  defaultGuidance,
  additionalContent,
}: GuidancePanelProps) {
  // Default state: Show intro content
  if (!activeField) {
    return (
      <div className="sticky top-4">
        <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/60">
          <h2 className="font-semibold text-gray-900 mb-2">{defaultGuidance.title}</h2>
          <p className="text-sm text-gray-700 mb-3">{defaultGuidance.description}</p>
          <ul className="text-sm text-gray-700 space-y-2">
            {defaultGuidance.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">{feature.icon}</span>
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>
          {defaultGuidance.hint && (
            <p className="text-xs text-gray-500 mt-3">{defaultGuidance.hint}</p>
          )}
        </div>
      </div>
    );
  }

  // Get content for active field
  const content = guidanceContent[activeField];

  // Fallback if field not found
  if (!content) {
    return (
      <div className="sticky top-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">No guidance available for this field.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="sticky top-4">
      <Card className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
            {content.icon}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{content.title}</h3>
            <p className="text-xs text-gray-500">Guidance</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 mb-3">{content.description}</p>

        {/* Tips */}
        <div>
          <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
            Best Practices
          </h4>
          <ul className="space-y-1.5">
            {content.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Examples */}
        {content.examples && content.examples.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
              Examples
            </h4>
            <div className="space-y-1.5">
              {content.examples.map((example, index) => (
                <div
                  key={index}
                  className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1.5 border border-gray-200"
                >
                  {example}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Content (e.g., currency converter) */}
        {additionalContent && (
          <div className="mt-3 pt-3 border-t border-gray-100">{additionalContent}</div>
        )}
      </Card>
    </div>
  );
}



