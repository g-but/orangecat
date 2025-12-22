import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import EntityDetailLayout from '@/components/entity/EntityDetailLayout';
import Link from 'next/link';
import Button from '@/components/ui/Button';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CircleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) {
    redirect('/auth?mode=login&from=/circles');
  }

  // Check if user is a member of this circle or if it's public
  const { data: circle, error: circleError } = await supabase
    .from('circles')
    .select('*')
    .eq('id', id)
    .single();

  if (circleError || !circle) {
    notFound();
  }

  // Check membership for private circles
  if (circle.visibility !== 'public') {
    const { data: membership } = await supabase
      .from('circle_members')
      .select('id')
      .eq('circle_id', id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership && circle.created_by !== user.id) {
      notFound();
    }
  }

  // Get member count
  const { count: memberCount } = await supabase
    .from('circle_members')
    .select('*', { count: 'exact', head: true })
    .eq('circle_id', id)
    .eq('status', 'active');

  const headerActions =
    circle.created_by === user.id ? (
      <Link href={`/circles/create?edit=${circle.id}`}>
        <Button>Edit</Button>
      </Link>
    ) : null;

  const visibilityLabels: Record<string, string> = {
    public: 'Public',
    private: 'Private',
    hidden: 'Hidden',
  };

  const approvalLabels: Record<string, string> = {
    auto: 'Auto-approve',
    manual: 'Manual approval',
    invite: 'Invite-only',
  };

  const activityLabels: Record<string, string> = {
    casual: 'Casual',
    regular: 'Regular',
    intensive: 'Intensive',
  };

  const meetingLabels: Record<string, string> = {
    none: 'No regular meetings',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
  };

  return (
    <EntityDetailLayout
      title={circle.name}
      subtitle={circle.description || ''}
      headerActions={headerActions}
      left={
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-gray-500">Category</div>
            <div className="font-medium">{circle.category || 'Uncategorized'}</div>
            <div className="text-gray-500">Visibility</div>
            <div className="font-medium">
              {visibilityLabels[circle.visibility] || circle.visibility}
            </div>
            <div className="text-gray-500">Member Approval</div>
            <div className="font-medium">
              {approvalLabels[circle.member_approval] || circle.member_approval}
            </div>
            {circle.max_members && (
              <>
                <div className="text-gray-500">Max Members</div>
                <div className="font-medium">{circle.max_members}</div>
              </>
            )}
            <div className="text-gray-500">Current Members</div>
            <div className="font-medium">{memberCount || 0}</div>
            <div className="text-gray-500">Activity Level</div>
            <div className="font-medium">
              {activityLabels[circle.activity_level] || circle.activity_level}
            </div>
            <div className="text-gray-500">Meeting Frequency</div>
            <div className="font-medium">
              {meetingLabels[circle.meeting_frequency] || circle.meeting_frequency}
            </div>
            {circle.location_restricted && (
              <>
                <div className="text-gray-500">Location Restricted</div>
                <div className="font-medium">
                  Yes{circle.location_radius_km ? ` (${circle.location_radius_km} km)` : ''}
                </div>
              </>
            )}
            {circle.contribution_required && (
              <>
                <div className="text-gray-500">Contribution Required</div>
                <div className="font-medium">
                  Yes{circle.contribution_amount ? ` (${circle.contribution_amount} SATS)` : ''}
                </div>
              </>
            )}
            {circle.treasury_balance !== undefined && circle.treasury_balance !== null && (
              <>
                <div className="text-gray-500">Treasury Balance</div>
                <div className="font-medium">{circle.treasury_balance} SATS</div>
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-gray-500">Features</div>
            <div className="space-y-1">
              {circle.enable_projects && <div className="text-xs">✓ Projects</div>}
              {circle.enable_events && <div className="text-xs">✓ Events</div>}
              {circle.enable_discussions && <div className="text-xs">✓ Discussions</div>}
              {circle.require_member_intro && <div className="text-xs">✓ Member Introductions</div>}
            </div>
          </div>
          {circle.bitcoin_address && (
            <div className="text-sm space-y-2">
              <div className="text-gray-500">Bitcoin Wallet</div>
              <div className="mt-1">
                <span className="font-mono text-xs break-all">{circle.bitcoin_address}</span>
              </div>
              {circle.wallet_purpose && (
                <div className="text-xs text-gray-500 mt-1">{circle.wallet_purpose}</div>
              )}
            </div>
          )}
        </div>
      }
      right={
        <div className="space-y-3 text-sm">
          <div className="text-gray-500">Created</div>
          <div className="font-medium">{new Date(circle.created_at).toLocaleString()}</div>
          {circle.updated_at && (
            <>
              <div className="text-gray-500">Updated</div>
              <div className="font-medium">{new Date(circle.updated_at).toLocaleString()}</div>
            </>
          )}
        </div>
      }
    />
  );
}
