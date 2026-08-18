'use client';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

/**
 * One multi-select filter toggle. DiscoverFilters rendered this exact
 * markup twice (status pills, category pills) with only the selected-state
 * class differing — pulled out once so a third filter group doesn't make it
 * three.
 */
export function FilterChip({ label, selected, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        selected
          ? 'border-strong bg-surface-raised text-fg-primary'
          : 'border-default bg-surface-base text-fg-primary hover:bg-surface-raised/80'
      }`}
    >
      {label}
    </button>
  );
}
