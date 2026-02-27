'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, Settings, LogOut, Handshake, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth';
import { useDropdown } from '@/hooks/useDropdown';
import { toast } from 'sonner';
import DefaultAvatar from '@/components/ui/DefaultAvatar';
import { logger } from '@/utils/logger';
import { UserProfileDropdownPanel } from '@/components/ui/UserProfileDropdownPanel';
import type { MenuItem } from '@/components/ui/UserProfileDropdownPanel';

export interface UserProfileDropdownProps {
  variant?: 'simple' | 'advanced';
  showAvatar?: boolean;
  showDescriptions?: boolean;
  showUserInfo?: boolean;
  className?: string;
}

export default function UserProfileDropdown({
  variant = 'advanced',
  showAvatar = true,
  showDescriptions = true,
  showUserInfo = true,
  className = '',
}: UserProfileDropdownProps) {
  const router = useRouter();
  const { user, profile, session, signOut, isAuthenticated: _isAuthenticated } = useAuth();

  // ✅ FIXED: Call useAuthStore at component top level, not conditionally
  const { fetchProfile } = useAuthStore();

  // Menu items configuration
  const menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: BarChart3,
      href: '/dashboard',
      description: 'Overview and analytics',
    },
    {
      label: 'My Projects',
      icon: Handshake,
      href: '/dashboard/projects',
      description: 'Manage your projects',
    },
    {
      label: 'Edit Profile',
      icon: Settings,
      href: '/dashboard/info/edit',
      description: 'Update your information',
    },
  ];

  const {
    isOpen,
    focusedIndex,
    dropdownRef,
    buttonRef,
    itemRefs,
    toggle,
    close,
    setFocusedIndex,
    handleTriggerKeyDown,
  } = useDropdown({
    closeOnRouteChange: true,
    keyboardNavigation: variant === 'advanced',
    itemCount: menuItems.length,
  });

  const [avatarError, setAvatarError] = useState(false);

  // ✅ FIXED: Move useEffect before any conditional returns to follow Rules of Hooks
  useEffect(() => {
    if ((user || session) && !profile) {
      logger.debug(
        'User exists but no profile, fetching profile',
        { userId: user?.id || session?.user?.id },
        'UserProfileDropdown'
      );
      fetchProfile().catch(e => {
        logger.warn('Failed to fetch profile', e, 'UserProfileDropdown');
      });
    }
  }, [user, session, profile, fetchProfile]);

  const handleSignOut = async () => {
    close();

    if (variant === 'advanced') {
      // Advanced variant - show loading toast
      const loadingToast = toast.loading('Signing out...');

      const { error } = await signOut();

      if (error) {
        toast.dismiss(loadingToast);
        toast.error('Failed to sign out. Please try again.');
        logger.error(
          'UserProfileDropdown: Sign out error',
          { error: error.message },
          'UserProfileDropdown'
        );
      } else {
        toast.dismiss(loadingToast);
        toast.success('Signed out successfully!');
        router.push('/');
      }
    } else {
      // Simple variant - direct signout
      await signOut();
    }
  };

  const handleNavigation = (path: string) => {
    close();
    router.push(path);
  };

  const handlePublicProfileClick = () => {
    const username = profile?.username;
    if (username) {
      handleNavigation('/profile');
    } else {
      if (variant === 'advanced') {
        toast.error('Please set up your username first');
      }
      handleNavigation('/profile');
    }
  };

  // Guard clause - don't render if no user
  if (!user && !session) {
    return null;
  }

  // User display logic - prioritize profile data, but show loading state while fetching
  const avatarUrl = profile?.avatar_url;
  const email = user?.email || session?.user?.email || '';

  // Show loading state while profile is being fetched
  const isProfileLoading = !!(user && !profile);

  // PRIORITY: Profile data first, then fallback to user metadata, then email
  let displayName = 'Loading...';
  if (!isProfileLoading) {
    if (profile?.name) {
      displayName = profile.name;
    } else if (profile?.username) {
      displayName = profile.username;
    } else if (user?.user_metadata?.full_name) {
      displayName = user.user_metadata.full_name;
    } else if (email) {
      // Extract name from email safely
      const atIndex = email.indexOf('@');
      const emailName = atIndex > 0 ? email.slice(0, atIndex) : email;
      displayName = emailName.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    } else {
      displayName = 'User';
    }
  }

  const firstName = (displayName || '').split(' ')[0] || 'User';
  const username = profile?.username;

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    // REMOVED: logger.info statement for security
  }

  // Simple variant rendering
  if (variant === 'simple') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          ref={buttonRef}
          onClick={toggle}
          disabled={isProfileLoading}
          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none disabled:opacity-50"
        >
          <span className="text-sm font-medium">{displayName}</span>
          {isProfileLoading && (
            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin ml-2" />
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1" role="menu" aria-orientation="vertical">
              {menuItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavigation(item.href)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    role="menuitem"
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </button>
                );
              })}
              <hr className="my-1 border-gray-100" />
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                role="menuitem"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Advanced variant rendering
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={toggle}
        onKeyDown={handleTriggerKeyDown}
        disabled={isProfileLoading}
        className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 rounded-xl px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 md:py-2.5 min-h-[36px] sm:min-h-[40px] md:min-h-[44px] disabled:opacity-50"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="User menu"
      >
        {showAvatar && (
          <span className="relative">
            {avatarUrl && !avatarError ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={32}
                height={32}
                className="rounded-full object-cover ring-2 ring-orange-200 hover:ring-orange-300 transition-all duration-200 sm:w-9 sm:h-9 md:w-[36px] md:h-[36px]"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <DefaultAvatar
                size={36}
                className="rounded-full ring-2 ring-orange-200 hover:ring-orange-300 transition-all duration-200"
              />
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 border-2 border-white rounded-full shadow-sm"></div>
          </span>
        )}
        <span className="font-medium text-sm sm:text-base max-w-[80px] sm:max-w-[100px] md:max-w-[140px] truncate flex items-center hidden sm:flex">
          {firstName}
          {isProfileLoading && (
            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin ml-1 sm:ml-2" />
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-300 ease-out ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <UserProfileDropdownPanel
          buttonRef={buttonRef}
          close={close}
          showUserInfo={showUserInfo}
          showDescriptions={showDescriptions}
          avatarUrl={avatarUrl}
          avatarError={avatarError}
          setAvatarError={setAvatarError}
          displayName={displayName}
          username={username}
          email={email}
          handlePublicProfileClick={handlePublicProfileClick}
          menuItems={menuItems}
          itemRefs={itemRefs}
          focusedIndex={focusedIndex}
          setFocusedIndex={setFocusedIndex}
          isOpen={isOpen}
          handleNavigation={handleNavigation}
          handleSignOut={handleSignOut}
        />
      )}
    </div>
  );
}
