'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import { Cat as CatIcon, Settings } from 'lucide-react';
import Link from 'next/link';
import { CatChatPanel } from '@/components/ai-chat/CatChatPanel';

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20 p-4 sm:p-6 lg:p-8 pb-20 sm:pb-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          ← Back to Dashboard
        </Link>
        <div className="inline-flex items-center gap-4">
          <div className="inline-flex items-center gap-2 text-gray-800">
            <CatIcon className="h-5 w-5 text-orange-600" />
            <span className="font-semibold">My Cat</span>
          </div>
          <Link
            href="/settings/ai"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">AI Settings</span>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <CatChatPanel />
      </div>
    </div>
  );
}
