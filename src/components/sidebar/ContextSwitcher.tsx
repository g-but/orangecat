'use client';

/**
 * Context Switcher
 *
 * Dropdown in the sidebar header that allows switching between
 * individual and group navigation contexts.
 *
 * - Shows current context (user avatar or group avatar)
 * - Lists user's groups for quick switching
 * - Links to group creation
 *
 * Created: 2026-02-25
 */

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronDown, User, Users, Plus } from 'lucide-react';
import { useNavigationContext } from '@/hooks/useNavigationContext';
import type { GroupContextInfo } from '@/hooks/useNavigationContext';
import { NWCStatusBadge } from '@/components/nostr/NWCStatusBadge';
import DefaultAvatar from '@/components/ui/DefaultAvatar';
import type { Profile } from '@/types/database';
import { cn } from '@/lib/utils';

interface ContextSwitcherProps {
  profile: Profile;
  isExpanded: boolean;
  className?: string;
}

export function ContextSwitcher({ profile, isExpanded, className }: ContextSwitcherProps) {
  const router = useRouter();
  const { context, userGroups, loadingGroups, switchToIndividual, switchToGroup, isGroupContext } =
    useNavigationContext();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSwitchToIndividual = () => {
    switchToIndividual();
    setIsOpen(false);
    router.push('/dashboard');
  };

  const handleSwitchToGroup = (group: GroupContextInfo) => {
    switchToGroup(group);
    setIsOpen(false);
    router.push(`/groups/${group.slug}`);
  };

  const displayName = isGroupContext
    ? context.group?.name || 'Group'
    : profile.name || profile.username || 'You';

  const avatarUrl = isGroupContext ? context.group?.avatar_url : profile.avatar_url;

  // Collapsed mode: just show the avatar, no dropdown
  if (!isExpanded) {
    return (
      <div className={cn('px-2 py-3 border-b border-gray-100 flex justify-center', className)}>
        <div className="relative">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={32}
              height={32}
              className="rounded-full object-cover"
              unoptimized={avatarUrl?.includes('supabase.co')}
            />
          ) : (
            <DefaultAvatar size={32} className="rounded-full" />
          )}
          {/* Context indicator dot */}
          <div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white rounded-full',
              isGroupContext ? 'bg-purple-500' : 'bg-green-500'
            )}
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={cn('relative px-2 py-3 border-b border-gray-100', className)}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
      >
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={40}
              height={40}
              className="rounded-full object-cover"
              unoptimized={avatarUrl?.includes('supabase.co')}
            />
          ) : isGroupContext ? (
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          ) : (
            <DefaultAvatar size={40} className="rounded-full" />
          )}
          <div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white rounded-full',
              isGroupContext ? 'bg-purple-500' : 'bg-green-500'
            )}
          />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
            <NWCStatusBadge />
          </div>
          <p className="text-xs text-gray-500 truncate">
            {isGroupContext ? 'Group' : `@${profile.username || 'user'}`}
          </p>
        </div>
        <ChevronDown
          className={cn('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-2 right-2 top-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-1 max-h-80 overflow-y-auto">
          {/* Individual context option */}
          <button
            onClick={handleSwitchToIndividual}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors',
              !isGroupContext && 'bg-tiffany-50'
            )}
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile.name || profile.username || 'You'}
              </p>
              <p className="text-xs text-gray-500">Personal</p>
            </div>
            {!isGroupContext && <div className="w-2 h-2 bg-tiffany rounded-full flex-shrink-0" />}
          </button>

          {/* Groups section */}
          {(userGroups.length > 0 || loadingGroups) && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <div className="px-3 py-1.5">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Groups</p>
              </div>
            </>
          )}

          {loadingGroups ? (
            <div className="px-3 py-2 text-xs text-gray-400">Loading groups...</div>
          ) : (
            userGroups.map(group => (
              <button
                key={group.id}
                onClick={() => handleSwitchToGroup(group)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors',
                  isGroupContext && context.group?.id === group.id && 'bg-purple-50'
                )}
              >
                <div className="flex-shrink-0">
                  {group.avatar_url ? (
                    <Image
                      src={group.avatar_url}
                      alt={group.name}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                      unoptimized={group.avatar_url?.includes('supabase.co')}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{group.name}</p>
                  <p className="text-xs text-gray-500 truncate">{group.slug}</p>
                </div>
                {isGroupContext && context.group?.id === group.id && (
                  <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />
                )}
              </button>
            ))
          )}

          {/* Create group option */}
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => {
              setIsOpen(false);
              router.push('/dashboard/groups/create');
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Plus className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-sm text-gray-600">Create a group</p>
          </button>
        </div>
      )}
    </div>
  );
}
