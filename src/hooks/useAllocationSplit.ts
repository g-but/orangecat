/**
 * State and mutations for editing an allocation's split.
 *
 * Split out from the editor component for the reason `useEntityDashboard` was:
 * the arithmetic here is the interesting part and deserves to be readable
 * without scrolling past JSX. It is also the part with a rule — shares must
 * total exactly 100 before a directive can be published — and that rule is
 * stated once, here, in the same terms Postgres states it.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ALLOCATION_TOTAL_PERCENT,
  allocationRemainder,
  isAllocationBalanced,
  presetShares,
  type AllocationPreset,
} from '@/config/civic-allocation';
import type { JurisdictionLevel } from '@/config/jurisdictions';

/** A line as the editor holds it: server fields plus the name to show. */
export interface EditableLine {
  /** Stable only within this editing session — lines have no identity a person assigns. */
  key: string;
  share_percent: number;
  jurisdiction_id: string | null;
  recipient_entity_type: string | null;
  recipient_entity_id: string | null;
  external_name: string | null;
  external_url: string | null;
  note: string | null;
  /** Display only; never sent. */
  recipientName: string;
  recipientLevel: JurisdictionLevel | null;
}

interface UseAllocationSplitOptions {
  allocationId: string;
  initialLines: EditableLine[];
  initialStatus: string;
}

let keyCounter = 0;
function nextKey(): string {
  keyCounter += 1;
  return `line-${keyCounter}`;
}

export function makeJurisdictionLine(jurisdiction: {
  id: string;
  title: string;
  level: JurisdictionLevel;
}): EditableLine {
  return {
    key: nextKey(),
    share_percent: 0,
    jurisdiction_id: jurisdiction.id,
    recipient_entity_type: null,
    recipient_entity_id: null,
    external_name: null,
    external_url: null,
    note: null,
    recipientName: jurisdiction.title,
    recipientLevel: jurisdiction.level,
  };
}

export function makeExternalLine(name: string): EditableLine {
  return {
    key: nextKey(),
    share_percent: 0,
    jurisdiction_id: null,
    recipient_entity_type: null,
    recipient_entity_id: null,
    external_name: name,
    external_url: null,
    note: null,
    recipientName: name,
    recipientLevel: null,
  };
}

export function useAllocationSplit({
  allocationId,
  initialLines,
  initialStatus,
}: UseAllocationSplitOptions) {
  const [lines, setLines] = useState<EditableLine[]>(initialLines);
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // "Saved" tracks the last state written to the server, so the Save button can
  // say whether there is anything to save. Compared by value rather than by a
  // dirty flag: a person who edits a share and puts it back has changed nothing,
  // and telling them otherwise trains them to ignore the indicator.
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialLines));
  const snapshot = useMemo(() => JSON.stringify(lines), [lines]);
  const dirty = snapshot !== savedSnapshot;

  // A published directive that is being edited is off-air for the duration of
  // the save (see CivicAllocationService.replaceLines). Warn before the tab
  // closes on unsaved changes rather than discovering it afterwards.
  useEffect(() => {
    if (!dirty) {
      return;
    }
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const shares = useMemo(() => lines.map(line => line.share_percent), [lines]);
  const remainder = allocationRemainder(shares);
  const balanced = isAllocationBalanced(shares);

  const setShare = useCallback((key: string, value: number) => {
    setLines(current =>
      current.map(line =>
        line.key === key
          ? // Clamped to the legal range the column accepts, and rounded to the
            // three decimals it stores — so what the person sees is what the
            // database will hold, not a value that silently rounds on save.
            { ...line, share_percent: clampShare(value) }
          : line
      )
    );
  }, []);

  const setNote = useCallback((key: string, note: string) => {
    setLines(current =>
      current.map(line => (line.key === key ? { ...line, note: note || null } : line))
    );
  }, []);

  const addLine = useCallback((line: EditableLine) => {
    setLines(current => {
      // Refuse a duplicate government body rather than accepting two shares for
      // the same recipient — the second one is always a mistake, and summing
      // them silently would misreport what the person meant.
      if (
        line.jurisdiction_id &&
        current.some(existing => existing.jurisdiction_id === line.jurisdiction_id)
      ) {
        toast.error(`${line.recipientName} is already in this split.`);
        return current;
      }
      return [...current, line];
    });
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines(current => current.filter(line => line.key !== key));
  }, []);

  /** Give the unassigned remainder to one line — the fastest route to 100. */
  const assignRemainder = useCallback(
    (key: string) => {
      setLines(current =>
        current.map(line =>
          line.key === key
            ? { ...line, share_percent: clampShare(line.share_percent - remainder) }
            : line
        )
      );
    },
    [remainder]
  );

  /**
   * Apply a preset across the government tiers already in the split.
   *
   * Non-government lines are left exactly as they are and the preset is scaled
   * into whatever percentage remains. Someone who has put 10% into a
   * neighbourhood centre has made the decision they care most about; a preset
   * is a starting point for the rest, and overwriting that line would throw
   * away the only part of the split that was theirs.
   */
  const applyPreset = useCallback((preset: AllocationPreset) => {
    setLines(current => {
      const government = current.filter(line => line.recipientLevel);
      if (government.length === 0) {
        toast.error('Add the government bodies you want to split across first.');
        return current;
      }

      const reserved = current
        .filter(line => !line.recipientLevel)
        .reduce((sum, line) => sum + line.share_percent, 0);
      const available = ALLOCATION_TOTAL_PERCENT - reserved;
      if (available <= 0) {
        toast.error('Your non-government lines already use the whole split.');
        return current;
      }

      const levels = government.map(line => line.recipientLevel as JurisdictionLevel);
      const byLevel = new Map(
        presetShares(preset, levels).map(entry => [entry.level, entry.share])
      );

      const scaled = current.map(line => {
        if (!line.recipientLevel) {
          return line;
        }
        const share = byLevel.get(line.recipientLevel) ?? 0;
        return {
          ...line,
          share_percent: clampShare((share * available) / ALLOCATION_TOTAL_PERCENT),
        };
      });

      // Absorb rounding drift into the largest government line so the set lands
      // on exactly 100 rather than 99.999 — which the database would refuse.
      return absorbDrift(scaled);
    });
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    try {
      const response = await fetch(`/api/allocations/${allocationId}/lines`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: lines.map((line, index) => ({
            position: index,
            share_percent: line.share_percent,
            jurisdiction_id: line.jurisdiction_id,
            recipient_entity_type: line.recipient_entity_type,
            recipient_entity_id: line.recipient_entity_id,
            external_name: line.external_name,
            external_url: line.external_url,
            note: line.note,
          })),
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error ?? 'Could not save the split.');
        return false;
      }
      setSavedSnapshot(JSON.stringify(lines));
      toast.success('Split saved.');
      return true;
    } catch {
      toast.error('Could not reach the server. Your changes are still here.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [allocationId, lines]);

  const setPublished = useCallback(
    async (next: 'active' | 'draft') => {
      setPublishing(true);
      try {
        const response = await fetch(`/api/allocations/${allocationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          toast.error(payload?.error ?? 'Could not change the directive’s state.');
          return;
        }
        setStatus(next);
        toast.success(next === 'active' ? 'Published.' : 'Moved back to draft.');
      } catch {
        toast.error('Could not reach the server.');
      } finally {
        setPublishing(false);
      }
    },
    [allocationId]
  );

  return {
    lines,
    status,
    remainder,
    balanced,
    dirty,
    saving,
    publishing,
    setShare,
    setNote,
    addLine,
    removeLine,
    assignRemainder,
    applyPreset,
    save,
    setPublished,
  };
}

/** Legal range of `share_percent`, at the scale the column stores. */
function clampShare(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const bounded = Math.min(Math.max(value, 0), ALLOCATION_TOTAL_PERCENT);
  return Math.round(bounded * 1000) / 1000;
}

function absorbDrift(lines: EditableLine[]): EditableLine[] {
  const total = lines.reduce((sum, line) => sum + line.share_percent, 0);
  const drift = Math.round((ALLOCATION_TOTAL_PERCENT - total) * 1000) / 1000;
  if (drift === 0) {
    return lines;
  }
  const government = lines.filter(line => line.recipientLevel);
  if (government.length === 0) {
    return lines;
  }
  const largest = government.reduce((a, b) => (b.share_percent > a.share_percent ? b : a));
  return lines.map(line =>
    line.key === largest.key
      ? { ...line, share_percent: clampShare(line.share_percent + drift) }
      : line
  );
}
