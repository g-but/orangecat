'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import { ModernChatPanel } from '@/components/ai-chat/ModernChatPanel';

export default function CatDashboardPage() {
  const { user, isLoading, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !isLoading && !user) {
      router.push('/auth');
    }
  }, [hydrated, isLoading, user, router]);

  if (!hydrated || isLoading) {
    return <Loading fullScreen message="Loading..." />;
  }
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20 p-2 sm:p-4 lg:p-6 pb-20 sm:pb-6">
      <div className="max-w-4xl mx-auto h-full">
        <ModernChatPanel />
      </div>
    </div>
  );
}
