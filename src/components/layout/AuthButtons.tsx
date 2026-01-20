'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import UserProfileDropdown from '@/components/ui/UserProfileDropdown';
import { useAuth } from '@/hooks/useAuth';
import { authNavigationItems } from '@/config/navigation';
import { getAuthStatus } from '@/lib/auth/utils';
import { Loader2 } from 'lucide-react';

interface AuthButtonsProps {
  className?: string;
}

export default function AuthButtons({ className = '' }: AuthButtonsProps) {
  const authState = useAuth();
  const authStatus = getAuthStatus(authState);
  const isMobileNav = className.includes('flex-col');

  // Show minimal loading while hydrating
  if (!authState.hydrated) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    );
  }

  // Show spinner while loading
  if (authStatus.showLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-tiffany-500" />
      </div>
    );
  }

  // If authenticated, show user profile dropdown
  if (authStatus.authenticated) {
    return <UserProfileDropdown variant="advanced" />;
  }

  // Get auth button links from config (SSOT)
  const [signIn, getStarted] = authNavigationItems;

  // Show auth buttons for unauthenticated users
  return (
    <div
      className={`flex items-center ${isMobileNav ? 'flex-col space-y-2 w-full' : 'space-x-2'} ${className}`}
    >
      {/* Mobile: Single prominent login button */}
      <Link href={getStarted.href} className="sm:hidden">
        <Button size="sm" className="min-h-[36px] min-w-[72px] text-sm font-medium">
          Login
        </Button>
      </Link>
      {/* Desktop: Both sign in and get started buttons */}
      <Link href={signIn.href} className={`hidden sm:block ${isMobileNav ? 'w-full' : ''}`}>
        <Button
          variant="ghost"
          size="sm"
          className={`${isMobileNav ? 'w-full justify-center' : ''} min-h-[36px] text-sm`}
        >
          {signIn.name}
        </Button>
      </Link>
      <Link href={getStarted.href} className={`hidden sm:block ${isMobileNav ? 'w-full' : ''}`}>
        <Button
          size="sm"
          className={`${isMobileNav ? 'w-full justify-center' : ''} min-h-[36px] text-sm`}
        >
          {getStarted.name}
        </Button>
      </Link>
    </div>
  );
}
