/**
 * Building the split — steps 04 through 06 of the path.
 *
 * The rule this UI exists to make bearable: a directive cannot be published
 * until its shares total exactly 100%. Postgres enforces it, so the only real
 * design question is whether a person finds that out while they are still
 * deciding or after a rejected save. Everything here answers "while": a running
 * total that is always visible, a remainder stated in the direction it needs to
 * move, and a Publish button that says what is stopping it rather than simply
 * being grey.
 */

'use client';

import { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { SplitBar } from './SplitBar';
import {
  ALLOCATION_PRESETS,
  ALLOCATION_TOTAL_PERCENT,
  type AllocationPreset,
} from '@/config/civic-allocation';
import { JURISDICTION_LEVEL_META, type JurisdictionLevel } from '@/config/jurisdictions';
import {
  useAllocationSplit,
  makeJurisdictionLine,
  makeExternalLine,
  type EditableLine,
} from '@/hooks/useAllocationSplit';

export interface JurisdictionOption {
  id: string;
  title: string;
  level: JurisdictionLevel;
}

interface AllocationSplitEditorProps {
  allocationId: string;
  initialLines: EditableLine[];
  initialStatus: string;
  /** The chain resolved from the owner's location — offered first, in order. */
  chain: JurisdictionOption[];
}

export function AllocationSplitEditor({
  allocationId,
  initialLines,
  initialStatus,
  chain,
}: AllocationSplitEditorProps) {
  const split = useAllocationSplit({ allocationId, initialLines, initialStatus });
  const [externalName, setExternalName] = useState('');

  const unusedChain = chain.filter(
    option => !split.lines.some(line => line.jurisdiction_id === option.id)
  );

  const segments = split.lines.map(line => ({
    id: line.key,
    label: line.recipientName,
    share: line.share_percent,
    level: line.recipientLevel,
  }));

  const handleAddExternal = () => {
    const name = externalName.trim();
    if (!name) {
      return;
    }
    split.addLine(makeExternalLine(name));
    setExternalName('');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-baseline justify-between gap-4">
        <CardTitle className="text-lg">Build the split</CardTitle>
        <TotalReadout remainder={split.remainder} balanced={split.balanced} />
      </CardHeader>

      <CardContent className="space-y-6">
        {segments.length > 0 && <SplitBar segments={segments} showRemainder={!split.balanced} />}

        {split.lines.length === 0 && (
          <p className="text-sm text-fg-secondary">
            Nothing here yet. Add the government bodies that tax you, then say what share each
            should get.
          </p>
        )}

        <ul className="space-y-4">
          {split.lines.map(line => (
            <li key={line.key} className="border-b border-border-default pb-4 last:border-0">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-fg-primary">{line.recipientName}</p>
                  <p className="mt-0.5 text-xs uppercase tracking-caps text-fg-tertiary">
                    {line.recipientLevel
                      ? `${JURISDICTION_LEVEL_META[line.recipientLevel].label} government`
                      : 'Directed elsewhere'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="sr-only" htmlFor={`share-${line.key}`}>
                    Share for {line.recipientName}
                  </label>
                  <Input
                    id={`share-${line.key}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={ALLOCATION_TOTAL_PERCENT}
                    step={1}
                    value={String(line.share_percent)}
                    onChange={event => split.setShare(line.key, Number(event.target.value))}
                    className="w-24 text-right tabular-nums"
                  />
                  <span aria-hidden="true" className="text-sm text-fg-secondary">
                    %
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${line.recipientName}`}
                    onClick={() => split.removeLine(line.key)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Input
                aria-label={`Why ${line.recipientName} gets this share`}
                placeholder="Why this line? (optional)"
                value={line.note ?? ''}
                onChange={event => split.setNote(line.key, event.target.value)}
                className="mt-3"
              />

              {/* Offered per line rather than as one global "balance" button:
                  the remainder has to land somewhere specific, and only the
                  person knows where. */}
              {!split.balanced && (
                <button
                  type="button"
                  onClick={() => split.assignRemainder(line.key)}
                  className="mt-2 text-xs text-accent-warm hover:underline"
                >
                  {split.remainder < 0
                    ? `Give the remaining ${fmt(-split.remainder)}% to this line`
                    : `Take ${fmt(split.remainder)}% off this line`}
                </button>
              )}
            </li>
          ))}
        </ul>

        <div className="space-y-4 border-t border-border-default pt-5">
          {unusedChain.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-caps text-fg-tertiary">
                The tiers that tax you
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {unusedChain.map(option => (
                  <Button
                    key={option.id}
                    variant="outline"
                    size="sm"
                    onClick={() => split.addLine(makeJurisdictionLine(option))}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    {option.title}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="external-recipient"
              className="text-xs uppercase tracking-caps text-fg-tertiary"
            >
              Someone else entirely
            </label>
            <div className="mt-2 flex gap-2">
              <Input
                id="external-recipient"
                placeholder="e.g. the neighbourhood centre down the road"
                value={externalName}
                onChange={event => setExternalName(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddExternal();
                  }
                }}
              />
              <Button variant="outline" onClick={handleAddExternal} disabled={!externalName.trim()}>
                Add
              </Button>
            </div>
          </div>

          {split.lines.some(line => line.recipientLevel) && (
            <div>
              <p className="text-xs uppercase tracking-caps text-fg-tertiary">Start from</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALLOCATION_PRESETS.map((preset: AllocationPreset) => (
                  <Button
                    key={preset.id}
                    variant="ghost"
                    size="sm"
                    title={preset.description}
                    onClick={() => split.applyPreset(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border-default pt-5">
          <Button onClick={split.save} isLoading={split.saving} disabled={!split.dirty}>
            {split.dirty ? 'Save split' : 'Saved'}
          </Button>

          {split.status === 'draft' ? (
            <Button
              variant="accent"
              isLoading={split.publishing}
              disabled={!split.balanced || split.dirty}
              onClick={() => split.setPublished('active')}
            >
              Publish
            </Button>
          ) : (
            <Button
              variant="outline"
              isLoading={split.publishing}
              onClick={() => split.setPublished('draft')}
            >
              Move back to draft
            </Button>
          )}

          {/* The button never just sits there greyed out. Whatever is blocking
              it is named, in the order it has to be dealt with. */}
          {split.status === 'draft' && (
            <span className="text-sm text-fg-secondary">
              {!split.balanced
                ? `Shares must total ${ALLOCATION_TOTAL_PERCENT}% to publish.`
                : split.dirty
                  ? 'Save the split first.'
                  : 'Ready to publish.'}
            </span>
          )}
          {split.status !== 'draft' && split.dirty && (
            <span className="text-sm text-fg-secondary">
              Saving takes this directive off-air for a moment while the split is rewritten.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TotalReadout({ remainder, balanced }: { remainder: number; balanced: boolean }) {
  if (balanced) {
    return (
      <span className="flex items-center gap-1.5 text-sm font-medium text-status-positive">
        <Check className="h-4 w-4" />
        {ALLOCATION_TOTAL_PERCENT}% assigned
      </span>
    );
  }
  // Stated as what is left to do, not as a raw sum: "12% unassigned" is an
  // instruction, "88%" is a number the reader has to subtract from something.
  return (
    <span className="text-sm font-medium tabular-nums text-status-warning">
      {remainder < 0 ? `${fmt(-remainder)}% unassigned` : `${fmt(remainder)}% over`}
    </span>
  );
}

/** Trim the stored three decimals to what the number actually needs. */
function fmt(value: number): string {
  return Number(value.toFixed(3)).toString();
}

export default AllocationSplitEditor;
