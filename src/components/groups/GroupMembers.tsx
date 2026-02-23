/**
 * Group Members Component
 *
 * Unified member management for groups using config-based types.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-12-29
 * Last Modified Summary: Updated to use config-based types
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Crown, Shield, User } from 'lucide-react';
import { STATUS } from '@/config/database-constants';
import type { GroupMember, GroupRole } from '@/types/group';
import groupsService from '@/services/groups';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

// Extended member type with profile info (from queries/members.ts)
interface MemberWithProfile extends GroupMember {
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
}

interface GroupMembersProps {
  groupId: string;
  members: MemberWithProfile[];
  onUpdate?: () => void;
}

export function GroupMembers({ groupId, members, onUpdate }: GroupMembersProps) {
  const { user } = useAuth();
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    try {
      setJoining(true);
      const result = await groupsService.joinGroup(groupId);
      if (result.success) {
        toast.success('Successfully joined group!');
        onUpdate?.();
      } else {
        toast.error(result.error || 'Failed to join group');
      }
    } catch (error) {
      logger.error('Failed to join group:', error);
      toast.error('Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  const isMember = members.some(m => m.user_id === user?.id);

  const getRoleIcon = (role: GroupRole) => {
    switch (role) {
      case STATUS.GROUP_MEMBERS.FOUNDER:
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case STATUS.GROUP_MEMBERS.ADMIN:
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: GroupRole) => {
    switch (role) {
      case STATUS.GROUP_MEMBERS.FOUNDER:
        return <Badge variant="default">Founder</Badge>;
      case STATUS.GROUP_MEMBERS.ADMIN:
        return <Badge variant="secondary">Admin</Badge>;
      default:
        return <Badge variant="outline">Member</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Join Button (if not member) */}
      {!isMember && (
        <Card>
          <CardContent className="pt-6">
            <Button onClick={handleJoin} disabled={joining} className="w-full">
              <UserPlus className="h-4 w-4 mr-2" />
              {joining ? 'Joining...' : 'Join Group'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members ({members.length})
          </CardTitle>
          <CardDescription>People who are part of this group</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No members yet</div>
          ) : (
            <div className="space-y-3">
              {members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center border-2 border-orange-300">
                      {(member.display_name || member.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {member.display_name || member.username || 'Anonymous'}
                        </p>
                        {getRoleIcon(member.role)}
                      </div>
                      <p className="text-sm text-gray-500 truncate">@{member.username || 'user'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">{getRoleBadge(member.role)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
