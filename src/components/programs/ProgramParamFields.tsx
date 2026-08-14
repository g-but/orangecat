'use client';

/**
 * The knobs at the top of a program blueprint — seat counts, destination, cost
 * per machine. Editing one rebuilds every entity payload underneath, which is
 * what makes a blueprint a reusable program rather than a canned demo.
 *
 * Created: 2026-08-14
 */

import Input from '@/components/ui/Input';
import type { BlueprintParam, BlueprintParamValues } from '@/config/program-blueprints';

interface ProgramParamFieldsProps {
  params: BlueprintParam[];
  values: BlueprintParamValues;
  onChange: (key: string, value: string | number) => void;
  disabled?: boolean;
}

export function ProgramParamFields({
  params,
  values,
  onChange,
  disabled,
}: ProgramParamFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {params.map(param => (
        <div key={param.key} className="relative">
          <Input
            label={param.label}
            description={param.help}
            type={param.type === 'number' ? 'number' : 'text'}
            inputMode={param.type === 'number' ? 'decimal' : undefined}
            min={param.min}
            max={param.max}
            step="any"
            value={String(values[param.key] ?? '')}
            disabled={disabled}
            onChange={event =>
              onChange(
                param.key,
                param.type === 'number' ? event.target.valueAsNumber : event.target.value
              )
            }
          />
          {param.suffix && (
            <span className="pointer-events-none absolute right-3 top-9 text-xs text-fg-tertiary">
              {param.suffix}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
