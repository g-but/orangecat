/**
 * REDIRECT PAGE: /profile/setup -> /profiles/me
 *
 * Profile setup is now handled by the edit modal on the profile page
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';

export default function ProfileSetupRedirect() {
  const router = useRouter();
  const { user, isLoading } = useRequireAuth();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect to profile page (edit modal will open automatically)
      router.push('/profiles/me');
    }
  }, [user, isLoading, router]);

  return <Loading fullScreen message="Redirecting to your profile..." />;
}
