import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import EntityDetailLayout from '@/components/entity/EntityDetailLayout';
import Link from 'next/link';
import Button from '@/components/ui/Button';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CauseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) {
    redirect('/auth?mode=login&from=/dashboard/causes');
  }

  const { data: cause, error } = await supabase
    .from('user_causes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !cause) {
    notFound();
  }

  const headerActions = (
    <Link href={`/dashboard/causes/create?edit=${cause.id}`}>
      <Button>Edit</Button>
    </Link>
  );

  const progressPercentage =
    cause.goal_sats && cause.goal_sats > 0
      ? Math.min(100, Math.round(((cause.total_raised_sats || 0) / cause.goal_sats) * 100))
      : null;

  return (
    <EntityDetailLayout
      title={cause.title}
      subtitle={cause.description || ''}
      headerActions={headerActions}
      left={
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-gray-500">Status</div>
            <div className="font-medium">{cause.status}</div>
            <div className="text-gray-500">Category</div>
            <div className="font-medium">{cause.cause_category}</div>
            {cause.goal_sats && (
              <>
                <div className="text-gray-500">Goal</div>
                <div className="font-medium">
                  {cause.goal_sats} {cause.currency || 'SATS'}
                </div>
              </>
            )}
            <div className="text-gray-500">Raised</div>
            <div className="font-medium">
              {cause.total_raised_sats || 0} {cause.currency || 'SATS'}
            </div>
            {cause.goal_sats && cause.goal_sats > 0 && progressPercentage !== null && (
              <>
                <div className="text-gray-500">Progress</div>
                <div className="font-medium">{progressPercentage}%</div>
              </>
            )}
            {cause.total_distributed_sats && cause.total_distributed_sats > 0 && (
              <>
                <div className="text-gray-500">Distributed</div>
                <div className="font-medium">
                  {cause.total_distributed_sats} {cause.currency || 'SATS'}
                </div>
              </>
            )}
          </div>
          {cause.goal_sats && cause.goal_sats > 0 && progressPercentage !== null && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-orange-600 h-2.5 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
          {(cause.bitcoin_address || cause.lightning_address) && (
            <div className="text-sm space-y-2">
              <div className="text-gray-500">Donation Addresses</div>
              {cause.bitcoin_address && (
                <div className="mt-1">
                  <span className="text-gray-500 text-xs">Bitcoin: </span>
                  <span className="font-mono text-xs break-all">{cause.bitcoin_address}</span>
                </div>
              )}
              {cause.lightning_address && (
                <div className="mt-1">
                  <span className="text-gray-500 text-xs">Lightning: </span>
                  <span className="font-mono text-xs break-all">{cause.lightning_address}</span>
                </div>
              )}
            </div>
          )}
        </div>
      }
      right={
        <div className="space-y-3 text-sm">
          <div className="text-gray-500">Created</div>
          <div className="font-medium">{new Date(cause.created_at).toLocaleString()}</div>
          {cause.updated_at && (
            <>
              <div className="text-gray-500">Updated</div>
              <div className="font-medium">{new Date(cause.updated_at).toLocaleString()}</div>
            </>
          )}
        </div>
      }
    />
  );
}
