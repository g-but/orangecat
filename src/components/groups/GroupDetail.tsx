/**
 * Group Detail Component
 *
 * Unified detail page component for groups using config-based labels.
 * Uses EntityDetailLayout pattern for consistency.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-12-29
 * Last Modified Summary: Updated to use config-based labels and new types
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import EntityDetailLayout from '@/components/entity/EntityDetailLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Wallet,
  Settings,
  Globe,
  Lock,
  Eye,
  Bitcoin,
  Zap,
  Calendar,
} from 'lucide-react';
import groupsService from '@/services/groups';
import type { Group, GroupMember } from '@/types/group';
import { GROUP_LABELS, type GroupLabel } from '@/config/group-labels';
import { GOVERNANCE_PRESETS, type GovernancePreset } from '@/config/governance-presets';
import { GroupMembers } from './GroupMembers';
import { GroupWallets } from './GroupWallets';
import { ProposalsList } from './proposals/ProposalsList';
import { EventsList } from './events/EventsList';
import { toast } from 'sonner';
import Link from 'next/link';
import { logger } from '@/utils/logger';

interface GroupDetailProps {
  groupSlug: string;
}

export function GroupDetail({ groupSlug }: GroupDetailProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [wallets, setWallets] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [canCreateProposal, setCanCreateProposal] = useState(false);
  const [canVote, setCanVote] = useState(false);

  useEffect(() => {
    loadGroupData();
  }, [groupSlug]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get group by slug
      const groupResult = await groupsService.getGroup(groupSlug, true);
      if (!groupResult.success || !groupResult.group) {
        setError('Group not found');
        return;
      }

      setGroup(groupResult.group);

      // Load members - cast GroupMemberDetail[] to GroupMember[] for component state
      const membersResult = await groupsService.getGroupMembers(groupResult.group.id);
      if (membersResult.success) {
        setMembers((membersResult.members || []) as unknown as GroupMember[]);
      }

      // Load wallets
      const walletsResult = await groupsService.getGroupWallets(groupResult.group.id);
      if (walletsResult.success) {
        setWallets(walletsResult.wallets || []);
      }

      // Check permissions for proposals
      if (user) {
        try {
          const { checkGroupPermission } = await import('@/services/groups/permissions');
          const canCreate = await checkGroupPermission(groupResult.group.id, user.id, 'canCreateProposals');
          const canVotePerm = await checkGroupPermission(groupResult.group.id, user.id, 'canVote');
          setCanCreateProposal(canCreate);
          setCanVote(canVotePerm);
        } catch (err) {
          logger.error('Failed to check permissions:', err);
        }
      }
    } catch (err) {
      logger.error('Failed to load group data:', err);
      setError('Failed to load group data');
      toast.error('Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
        <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Group not found'}</p>
        <Button onClick={() => router.push('/groups')} className="mt-4">
          Back to Groups
        </Button>
      </div>
    );
  }

  // Get config from SSOT
  const labelConfig = GROUP_LABELS[group.label as GroupLabel];
  const governanceConfig = GOVERNANCE_PRESETS[group.governance_preset as GovernancePreset];
  const LabelIcon = labelConfig?.icon || Users;
  const isOwner = user?.id === group.created_by;

  // Check if group has governance features (proposals/voting)
  const hasGovernanceFeatures = governanceConfig?.votingThreshold !== null;

  // Determine header actions
  const headerActions = isOwner ? (
    <Link href={`/groups/${group.slug}/settings`}>
      <Button variant="outline">
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>
    </Link>
  ) : null;

  // Build left sidebar content
  const leftContent = (
    <div className="space-y-6">
      {/* Group Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LabelIcon className={`h-5 w-5 text-${labelConfig?.color || 'gray'}-500`} />
            Group Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-gray-500">Label</div>
            <div className="font-medium">
              <Badge variant="secondary">{labelConfig?.name || group.label}</Badge>
            </div>

            {group.tags && group.tags.length > 0 && (
              <>
                <div className="text-gray-500">Tags</div>
                <div className="flex flex-wrap gap-1">
                  {group.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </>
            )}

            <div className="text-gray-500">Visibility</div>
            <div className="font-medium flex items-center gap-1">
              {group.visibility === 'public' ? (
                <>
                  <Globe className="h-4 w-4" />
                  Public
                </>
              ) : group.visibility === 'members_only' ? (
                <>
                  <Eye className="h-4 w-4" />
                  Members Only
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Private
                </>
              )}
            </div>

            <div className="text-gray-500">Listed</div>
            <div className="font-medium">{group.is_public ? 'Yes' : 'No'}</div>

            <div className="text-gray-500">Governance</div>
            <div className="font-medium">{governanceConfig?.name || group.governance_preset}</div>

            {group.voting_threshold && (
              <>
                <div className="text-gray-500">Voting Threshold</div>
                <div className="font-medium">{group.voting_threshold}%</div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bitcoin Addresses Card */}
      {(group.bitcoin_address || group.lightning_address) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bitcoin className="h-5 w-5 text-orange-500" />
              Bitcoin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.bitcoin_address && (
              <div>
                <div className="text-sm text-gray-500 mb-1">On-chain Address</div>
                <div className="font-mono text-xs break-all bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {group.bitcoin_address}
                </div>
              </div>
            )}
            {group.lightning_address && (
              <div>
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Lightning Address
                </div>
                <div className="font-mono text-xs break-all bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {group.lightning_address}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{members.length}</div>
              <div className="text-sm text-gray-500">Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{wallets.length}</div>
              <div className="text-sm text-gray-500">Wallets</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Build main content with tabs
  const mainContent = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
        <TabsTrigger value="wallets">Wallets ({wallets.length})</TabsTrigger>
        <TabsTrigger value="events">
          <Calendar className="h-4 w-4 mr-1" />
          Events
        </TabsTrigger>
        {hasGovernanceFeatures && <TabsTrigger value="proposals">Proposals</TabsTrigger>}
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {group.description || 'No description provided.'}
            </p>
          </CardContent>
        </Card>

        {/* Suggested Features from Label */}
        {labelConfig?.suggestedFeatures && labelConfig.suggestedFeatures.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Suggested Features</CardTitle>
              <CardDescription>
                Features commonly used by {labelConfig.name.toLowerCase()} groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {labelConfig.suggestedFeatures.map((feature) => (
                  <Badge key={feature} variant="outline">
                    {feature.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="members">
        <GroupMembers groupId={group.id} members={members} onUpdate={loadGroupData} />
      </TabsContent>

      <TabsContent value="wallets">
        <GroupWallets groupId={group.id} groupSlug={group.slug} wallets={wallets} onUpdate={loadGroupData} />
      </TabsContent>

      <TabsContent value="events">
        <EventsList
          groupId={group.id}
          groupSlug={group.slug}
          canCreateEvent={isOwner || members.some((m) => m.user_id === user?.id && ['founder', 'admin'].includes(m.role))}
        />
      </TabsContent>

      {hasGovernanceFeatures && (
        <TabsContent value="proposals">
          <ProposalsList
            groupId={group.id}
            groupSlug={group.slug}
            canCreateProposal={canCreateProposal}
          />
        </TabsContent>
      )}

      <TabsContent value="activity">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Activity feed coming soon...</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );

  return (
    <EntityDetailLayout
      title={group.name}
      subtitle={group.description || undefined}
      headerActions={headerActions}
      left={mainContent}
      right={leftContent}
    />
  );
}
