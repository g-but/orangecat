/**
 * Groups Dashboard Component
 *
 * Unified dashboard for groups using EntityListShell for consistency.
 * Displays user's groups and available groups for discovery with tabs.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Refactored to use EntityListShell, removed duplicate buttons, updated paths
 */

'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Users, Target, TrendingUp, Building2 } from 'lucide-react';
import groupsService from '@/services/groups';
import type { Group } from '@/types/group';
import { GROUP_LABELS, type GroupLabel } from '@/config/group-labels';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { GroupList } from './GroupList';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EntityListShell from '@/components/entity/EntityListShell';
import Loading from '@/components/Loading';

export function GroupsDashboard() {
  const router = useRouter();
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load user's groups
      const groupsResult = await groupsService.getUserGroups();
      if (groupsResult.success) {
        setMyGroups(groupsResult.groups || []);
      }

      // Load available groups for discovery
      const availableResult = await groupsService.getAvailableGroups();
      if (availableResult.success) {
        setAvailableGroups(availableResult.groups || []);
      }
    } catch (error) {
      logger.error('Failed to load groups data:', error);
      toast.error('Failed to load groups data');
    } finally {
      setLoading(false);
    }
  };

  // Reload data when returning from create page
  useEffect(() => {
    const handleFocus = () => {
      loadDashboardData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  if (loading) {
    return <Loading fullScreen message="Loading your groups..." />;
  }

  // Calculate stats by label type
  const countByLabel = (groups: Group[], label: GroupLabel) =>
    groups.filter((g) => g.label === label).length;

  // Informal groups (circles, families)
  const informalCount = myGroups.filter((g) =>
    ['circle', 'family'].includes(g.label)
  ).length;

  // Formal groups (everything else)
  const formalCount = myGroups.length - informalCount;

  const headerActions = (
    <Link href="/dashboard/groups/create">
      <Button className="gap-2 bg-gradient-to-r from-purple-600 to-purple-700">
        <Plus className="h-4 w-4" />
        Create Group
      </Button>
    </Link>
  );

  return (
    <EntityListShell
      title="My Groups"
      description="Create groups, join communities, and collaborate with like-minded people"
      headerActions={headerActions}
    >
      {/* Tabs for My Groups and Discover */}
      <Tabs defaultValue="my-groups" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-groups" className="gap-2 text-xs sm:text-sm">
            <Users className="h-4 w-4" />
            <span className="truncate">My Groups ({myGroups.length})</span>
          </TabsTrigger>
          <TabsTrigger value="discover" className="gap-2 text-xs sm:text-sm">
            <Building2 className="h-4 w-4" />
            <span className="truncate">Discover ({availableGroups.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-groups" className="space-y-4">
          {myGroups.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
              <p className="text-muted-foreground mb-6">Create your first group to get started</p>
              <Link href="/dashboard/groups/create">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Group
                </Button>
              </Link>
            </div>
          ) : (
            <GroupList
              groups={myGroups}
              onGroupClick={(group) => router.push(`/dashboard/groups/${group.slug}`)}
            />
          )}
        </TabsContent>

        <TabsContent value="discover" className="space-y-4">
          {availableGroups.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">No groups available</h3>
              <p className="text-muted-foreground mb-6">Be the first to create a group!</p>
              <Link href="/dashboard/groups/create">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Group
                </Button>
              </Link>
            </div>
          ) : (
            <GroupList
              groups={availableGroups}
              onGroupClick={(group) => router.push(`/dashboard/groups/${group.slug}`)}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Stats Cards - Show Last (Optional Info) - Hidden on Mobile */}
      <div className="hidden md:grid md:grid-cols-3 gap-4 pt-6 border-t mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myGroups.length}</div>
            <p className="text-xs text-muted-foreground">
              {informalCount} informal, {formalCount} formal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Group Types</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(GROUP_LABELS).filter((label) =>
                myGroups.some((g) => g.label === label)
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Different labels used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableGroups.length}</div>
            <p className="text-xs text-muted-foreground">Groups to discover</p>
          </CardContent>
        </Card>
      </div>
    </EntityListShell>
  );
}
