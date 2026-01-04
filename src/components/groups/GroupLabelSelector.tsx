/**
 * Group Label Selector Component
 *
 * Allows users to select a group label (type) and applies sensible defaults.
 * Labels are identity + template, not capability locks.
 */

'use client';

import { GROUP_LABELS, type GroupLabel, getGroupLabelDefaults } from '@/config/group-labels';
import { cn } from '@/lib/utils';

interface GroupLabelSelectorProps {
  value: GroupLabel;
  onChange: (label: GroupLabel, defaults: ReturnType<typeof getGroupLabelDefaults>) => void;
  className?: string;
  columns?: 2 | 3 | 4;
}

export function GroupLabelSelector({
  value,
  onChange,
  className,
  columns = 3,
}: GroupLabelSelectorProps) {
  const handleSelect = (label: GroupLabel) => {
    const defaults = getGroupLabelDefaults(label);
    onChange(label, defaults);
  };

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-3', gridCols[columns], className)}>
      {Object.entries(GROUP_LABELS).map(([key, config]) => {
        const Icon = config.icon;
        const isSelected = value === key;
        const label = key as GroupLabel;

        return (
          <button
            key={key}
            type="button"
            onClick={() => handleSelect(label)}
            className={cn(
              'p-4 rounded-lg border-2 text-left transition-all',
              'hover:border-primary/50 hover:bg-accent/50',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              isSelected
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-border bg-card'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  `bg-${config.color}-100 dark:bg-${config.color}-900/20`
                )}
              >
                <Icon
                  className={cn('h-5 w-5', `text-${config.color}-600 dark:text-${config.color}-400`)}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-sm">{config.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {config.description}
                </p>
              </div>
            </div>
            {isSelected && (
              <div className="mt-3 pt-3 border-t border-primary/20">
                <div className="flex flex-wrap gap-1">
                  {config.suggestedFeatures.slice(0, 3).map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary/10 text-primary"
                    >
                      {feature}
                    </span>
                  ))}
                  {config.suggestedFeatures.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{config.suggestedFeatures.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Compact variant for inline selection
 */
interface GroupLabelSelectProps {
  value: GroupLabel;
  onChange: (label: GroupLabel) => void;
  className?: string;
}

export function GroupLabelSelect({ value, onChange, className }: GroupLabelSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as GroupLabel)}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
        'text-sm ring-offset-background',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {Object.entries(GROUP_LABELS).map(([key, config]) => (
        <option key={key} value={key}>
          {config.name}
        </option>
      ))}
    </select>
  );
}
