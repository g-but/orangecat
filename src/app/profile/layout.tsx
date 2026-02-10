'use client';

import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useRequireAuth();

  if (isLoading) {
    return <Loading fullScreen message="Loading your profile..." />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
