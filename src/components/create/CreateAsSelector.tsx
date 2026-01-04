/**
 * Create As Selector Component
 *
 * Allows users to select whether to create an entity as themselves or on behalf of a group.
 * Per-action contextual selector (not a global switcher).
 */

'use client';

import { useEffect, useState } from 'react';
import { User, Users } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GROUP_LABELS, type GroupLabel } from '@/config/group-labels';
import supabase from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';
import { DATABASE_TABLES } from '@/config/database-tables';

interface UserGroup {
  id: string;
  name: string;
  slug: string;
  label: GroupLabel;
  avatar_url?: string | null;
  role: string;
}

interface CreateAsSelectorProps {
  value: string | null; // null = self, string = group_id
  onChange: (groupId: string | null) => void;
  userId?: string;
  className?: string;
  disabled?: boolean;
}

export function CreateAsSelector({
  value,
  onChange,
  userId,
  className,
  disabled,
}: CreateAsSelectorProps) {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; avatar_url?: string; username?: string } | null>(
    null
  );

  useEffect(() => {
    async function loadData() {
      if (!userId) {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (authUser) {
          // Get user profile
          const { data: profile } = await supabase
            .from(DATABASE_TABLES.PROFILES)
            .select('avatar_url, username')
            .eq('id', authUser.id)
            .single();

          setUser({
            id: authUser.id,
            avatar_url: profile?.avatar_url,
            username: profile?.username,
          });

          await loadUserGroups(authUser.id);
        }
      } else {
        await loadUserGroups(userId);
      }
      setLoading(false);
    }

    async function loadUserGroups(uid: string) {
      // Try new groups table first
      const { data: groupMemberships } = await supabase
        .from(DATABASE_TABLES.GROUP_MEMBERS)
        .select(
          `
          role,
          groups (
            id,
            name,
            slug,
            label,
            avatar_url
          )
        `
        )
        .eq('user_id', uid);

      if (groupMemberships && groupMemberships.length > 0) {
        const userGroups: UserGroup[] = groupMemberships
          .filter((m) => m.groups)
          .map((m) => ({
            id: (m.groups as any).id,
            name: (m.groups as any).name,
            slug: (m.groups as any).slug,
            label: (m.groups as any).label as GroupLabel,
            avatar_url: (m.groups as any).avatar_url,
            role: m.role,
          }));
        setGroups(userGroups);
        return;
      }

      // No fallback needed - groups table is the only source
    }

    loadData();
  }, [userId]);

  const selectedGroup = value ? groups.find((g) => g.id === value) : null;

  // If no groups, show disabled state
  if (!loading && groups.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-muted/50',
          className
        )}
      >
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">Creating as yourself</span>
      </div>
    );
  }

  return (
    <Select
      value={value ?? 'self'}
      onValueChange={(v) => onChange(v === 'self' ? null : v)}
      disabled={disabled || loading}
    >
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue placeholder="Create as...">
          {loading ? (
            <span className="text-muted-foreground">Loading...</span>
          ) : selectedGroup ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={selectedGroup.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {selectedGroup.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedGroup.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={user?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <span>Yourself</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="self">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user?.avatar_url || undefined} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span>Yourself</span>
              {user?.username && (
                <span className="text-xs text-muted-foreground">@{user.username}</span>
              )}
            </div>
          </div>
        </SelectItem>

        {groups.length > 0 && (
          <>
            <SelectSeparator />
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Your Groups
            </div>

            {groups.map((group) => {
              const labelConfig = GROUP_LABELS[group.label];

              return (
                <SelectItem key={group.id} value={group.id}>
                  <div className="flex items-center gap-2 w-full">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={group.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {group.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate">{group.name}</span>
                      <span className="text-xs text-muted-foreground">{group.role}</span>
                    </div>
                    <Badge variant="outline" className="ml-auto shrink-0 text-xs">
                      {labelConfig?.name ?? group.label}
                    </Badge>
                  </div>
                </SelectItem>
              );
            })}
          </>
        )}
      </SelectContent>
    </Select>
  );
}

/**
 * Hook to get user's groups for the selector
 */
export function useUserGroups(userId?: string) {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGroups() {
      let uid = userId;
      if (!uid) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        uid = user?.id;
      }

      if (!uid) {
        setLoading(false);
        return;
      }

      // Try new groups table
      const { data: groupMemberships } = await supabase
        .from(DATABASE_TABLES.GROUP_MEMBERS)
        .select('role, groups(id, name, slug, label, avatar_url)')
        .eq('user_id', uid);

      if (groupMemberships && groupMemberships.length > 0) {
        const userGroups: UserGroup[] = groupMemberships
          .filter((m) => m.groups)
          .map((m) => ({
            id: (m.groups as any).id,
            name: (m.groups as any).name,
            slug: (m.groups as any).slug,
            label: (m.groups as any).label as GroupLabel,
            avatar_url: (m.groups as any).avatar_url,
            role: m.role,
          }));
        setGroups(userGroups);
        setLoading(false);
        return;
      }

      // No fallback needed - groups table is the only source

      setLoading(false);
    }

    loadGroups();
  }, [userId]);

  return { groups, loading };
}
