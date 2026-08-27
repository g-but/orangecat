import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { looseClient } from '@/lib/supabase/untyped';
import { getTableName } from '@/config/entity-registry';
import { checkOwnership } from '@/services/actors';
import { CivicAllocationService } from '@/domain/civic/service';
import { AllocationProfile } from '@/components/civic/AllocationProfile';
import { AllocationSplitEditor } from '@/components/civic/AllocationSplitEditor';
import { isJurisdictionLevel, type JurisdictionLevel } from '@/config/jurisdictions';
import type { EditableLine } from '@/hooks/useAllocationSplit';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Allocation detail (owner).
 *
 * The published page, unchanged, with the split editor above it. Same page a
 * reader gets and in the same order, deliberately: a directive is a public
 * argument, and its author should be editing directly above the thing everyone
 * else will see, not on a separate screen that only resembles it.
 *
 * Drafts are visible here (and only here) because RLS lets an owner read their
 * own — which is also what makes this page the natural place to finish one.
 */
export default async function AllocationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await looseClient(supabase)
    .from(getTableName('allocation'))
    .select('id, actor_id, status, residency_jurisdiction_id')
    .eq('id', id)
    .maybeSingle();

  if (!data) {
    notFound();
  }
  const allocation = data as Record<string, unknown>;

  const isOwner = user
    ? await checkOwnership(allocation as { actor_id: string | null }, user.id, supabase)
    : false;

  if (!isOwner) {
    // Not an error — a signed-in person may legitimately open someone else's
    // public directive from the dashboard URL. They just get the reader's view.
    return <AllocationProfile id={id} />;
  }

  const service = new CivicAllocationService(supabase);
  const [lines, options] = await Promise.all([
    service.getResolvedLines(id),
    service.getSplitOptions((allocation.residency_jurisdiction_id as string | null) ?? null),
  ]);

  const initialLines: EditableLine[] = lines.map((line, index) => ({
    key: `saved-${index}`,
    share_percent: line.share_percent,
    jurisdiction_id: line.jurisdiction_id,
    recipient_entity_type: line.recipient_entity_type,
    recipient_entity_id: line.recipient_entity_id,
    external_name: line.external_name,
    external_url: line.external_url,
    note: line.note,
    recipientName: line.recipientName,
    recipientLevel: toLevel(line.recipientLevel),
  }));

  return (
    <div className="space-y-10">
      <div className="mx-auto max-w-shell px-4 pt-10 sm:px-6 lg:px-8">
        <AllocationSplitEditor
          allocationId={id}
          initialLines={initialLines}
          initialStatus={allocation.status as string}
          chain={options.flatMap(option => {
            const level = toLevel(option.level);
            // A body whose tier isn't one this build knows about is dropped
            // rather than rendered with a blank label — the tier is how the
            // split bar encodes it, so a line without one has no place on it.
            return level ? [{ id: option.id, title: option.title, level }] : [];
          })}
        />
      </div>
      <AllocationProfile id={id} />
    </div>
  );
}

function toLevel(value: string | null): JurisdictionLevel | null {
  return value && isJurisdictionLevel(value) ? value : null;
}
