'use client';

/**
 * Shared guidance card rendering
 *
 * Used by both GuidancePanel (entity creation) and DynamicSidebar
 * (project/profile editing) — the two panels render the same default,
 * fallback and field-guidance cards and only differ in their wrappers
 * and appended extra content.
 *
 * Created: 2026-08-02
 * Last Modified: 2026-08-02
 * Last Modified Summary: Extracted from GuidancePanel/DynamicSidebar duplication (jscpd dedup)
 */

import { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { GuidanceContent, DefaultGuidance } from './types';

/** Default state: intro content shown when no field is focused. */
export function GuidanceDefaultCard({ content }: { content: DefaultGuidance }) {
  return (
    <div className="p-4 rounded-lg border border-subtle bg-surface-raised/40">
      <h2 className="font-semibold text-fg-primary mb-2">{content.title}</h2>
      <p className="text-sm text-fg-primary mb-3">{content.description}</p>
      <ul className="text-sm text-fg-primary space-y-2">
        {content.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="mt-0.5 flex-shrink-0">{feature.icon}</span>
            <span>{feature.text}</span>
          </li>
        ))}
      </ul>
      {content.hint && <p className="text-xs text-fg-secondary mt-3">{content.hint}</p>}
    </div>
  );
}

/** Fallback when the active field has no guidance entry. */
export function GuidanceFallbackCard() {
  return (
    <Card className="p-4">
      <p className="text-sm text-fg-secondary">No guidance available for this field.</p>
    </Card>
  );
}

/**
 * Field guidance card: header, description, tips and examples.
 * `children` is rendered after the examples (e.g. a currency converter).
 */
export function GuidanceFieldCard({
  content,
  children,
}: {
  content: GuidanceContent;
  children?: ReactNode;
}) {
  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-subtle">
        <div className="w-10 h-10 rounded-lg bg-surface-raised flex items-center justify-center flex-shrink-0">
          {content.icon}
        </div>
        <div>
          <h3 className="text-base font-semibold text-fg-primary">{content.title}</h3>
          <p className="text-xs text-fg-secondary">Guidance</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-fg-primary mb-3">{content.description}</p>

      {/* Tips */}
      <div>
        <h4 className="text-xs font-semibold text-fg-primary uppercase tracking-wide mb-2">
          Best Practices
        </h4>
        <ul className="space-y-1.5">
          {content.tips.map((tip, index) => (
            <li key={index} className="flex items-start gap-2 text-xs text-fg-secondary">
              <CheckCircle2 className="w-4 h-4 text-status-positive mt-0.5 flex-shrink-0" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Examples */}
      {content.examples && content.examples.length > 0 && (
        <div className="mt-3 pt-3 border-t border-subtle">
          <h4 className="text-xs font-semibold text-fg-primary uppercase tracking-wide mb-2">
            Examples
          </h4>
          <div className="space-y-1.5">
            {content.examples.map((example, index) => (
              <div
                key={index}
                className="text-xs text-fg-secondary bg-surface-raised rounded px-2 py-1.5 border border-default"
              >
                {example}
              </div>
            ))}
          </div>
        </div>
      )}

      {children}
    </Card>
  );
}
