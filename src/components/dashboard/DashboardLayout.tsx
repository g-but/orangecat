'use client';

import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Profile } from '@/types/database';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
  profile: Profile | null;
}

export default function DashboardLayout({ children, user: _user, profile }: DashboardLayoutProps) {
  const _router = useRouter();

  return (
    <div className="w-full">
      {/* Show CTA only if profile is missing required fields */}
      {profile && (!profile.username || !profile.name || !profile.bio) && (
        <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded">
          <div className="flex">
            <div className="py-1">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-3" />
            </div>
            <div>
              <p className="font-bold">Complete Your Profile</p>
              <p className="text-sm">Please update your profile details to enable all features.</p>
              <Link
                href={
                  profile?.username
                    ? `/profiles/${profile.username}?tab=info`
                    : '/profiles/me?tab=info'
                }
                className="mt-2 inline-block text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
              >
                Go to Edit Profile
              </Link>
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
