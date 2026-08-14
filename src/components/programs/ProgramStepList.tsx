'use client';

/**
 * The entity list of a program: what will be created, why it is in the program,
 * and — once the run starts — what happened to it.
 *
 * Every row is a real entity type from ENTITY_REGISTRY, and every row can be
 * switched off. A user who already has a group, or who does not want a handover
 * event, unchecks it and creates the rest.
 *
 * Created: 2026-08-14
 */

import Link from 'next/link';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import type { BlueprintStep } from '@/config/program-blueprints';
import type { StepResult } from '@/services/programs/runBlueprint';
import { cn } from '@/lib/utils';

interface ProgramStepListProps {
  steps: BlueprintStep[];
  enabled: Record<string, boolean>;
  results: Record<string, StepResult>;
  onToggle: (key: string) => void;
  /** Locks the checkboxes once a run has started. */
  locked: boolean;
}

function StepStatusIcon({ result }: { result?: StepResult }) {
  if (!result || result.status === 'pending') {
    return null;
  }
  if (result.status === 'running') {
    return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-fg-secondary" />;
  }
  if (result.status === 'created') {
    return <Check className="h-4 w-4 shrink-0 text-status-positive" />;
  }
  return <AlertCircle className="h-4 w-4 shrink-0 text-status-negative" />;
}

export function ProgramStepList({
  steps,
  enabled,
  results,
  onToggle,
  locked,
}: ProgramStepListProps) {
  return (
    <ul className="divide-y divide-subtle rounded-lg border border-default bg-surface-base">
      {steps.map(step => {
        const meta = ENTITY_REGISTRY[step.entityType];
        const Icon = meta.icon;
        const result = results[step.key];
        const isOn = enabled[step.key] !== false;
        const title = (step.payload.title ?? step.payload.name ?? meta.name) as string;

        return (
          <li key={step.key} className={cn('flex gap-3 p-3', !isOn && 'opacity-50')}>
            <input
              type="checkbox"
              checked={isOn}
              disabled={locked}
              onChange={() => onToggle(step.key)}
              aria-label={`Include the ${meta.name.toLowerCase()}: ${title}`}
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent-primary)]"
            />
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-subtle bg-surface-raised">
              <Icon className="h-4 w-4 text-fg-secondary" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-fg-primary">{title}</span>
                <span className="shrink-0 text-xs uppercase tracking-caps text-fg-tertiary">
                  {meta.name}
                </span>
                <StepStatusIcon result={result} />
              </div>
              <p className="mt-0.5 text-sm text-fg-secondary">{step.role}</p>
              {step.children && (
                <p className="mt-0.5 text-xs text-fg-tertiary">
                  + {step.children.payloads.length} {step.children.label}
                </p>
              )}
              {result?.status === 'created' && (
                <p className="mt-1 text-xs text-fg-secondary">
                  {result.href ? (
                    <Link href={result.href} className="underline hover:text-fg-primary">
                      Created — open it
                    </Link>
                  ) : (
                    'Created'
                  )}
                  {typeof result.childrenCreated === 'number' && step.children && (
                    <>
                      {' · '}
                      {result.childrenCreated} of {step.children.payloads.length}{' '}
                      {step.children.label} added
                      {result.childrenFailed ? ` (${result.childrenFailed} failed)` : ''}
                    </>
                  )}
                </p>
              )}
              {result?.status === 'failed' && (
                <p className="mt-1 text-xs text-status-negative">{result.error}</p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
