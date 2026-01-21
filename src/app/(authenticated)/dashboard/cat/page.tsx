'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import { ModernChatPanel } from '@/components/ai-chat/ModernChatPanel';
import { CatContextPanel } from '@/components/ai-chat/CatContextPanel';
import Link from 'next/link';
import { Info, X, Settings } from 'lucide-react';

export default function CatDashboardPage() {
  const { user, isLoading, hydrated } = useAuth();
  const router = useRouter();
  const [showContext, setShowContext] = useState(false);
  const [hasSeenContext, setHasSeenContext] = useState(false);

  useEffect(() => {
    if (hydrated && !isLoading && !user) {
      router.push('/auth');
    }
  }, [hydrated, isLoading, user, router]);

  // Check if user has seen the context panel before
  useEffect(() => {
    try {
      const seen = localStorage.getItem('cat_context_seen');
      setHasSeenContext(!!seen);
    } catch {}
  }, []);

  // Mark as seen when panel is opened
  const handleShowContext = () => {
    setShowContext(true);
    try {
      localStorage.setItem('cat_context_seen', '1');
      setHasSeenContext(true);
    } catch {}
  };

  if (!hydrated || isLoading) {
    return <Loading fullScreen message="Loading..." />;
  }
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20 p-2 sm:p-4 lg:p-6 pb-20 sm:pb-6">
      <div className="max-w-6xl mx-auto h-full">
        <div className="flex gap-4">
          {/* Main chat panel */}
          <div className="flex-1 min-w-0">
            <ModernChatPanel />
          </div>

          {/* Context panel - desktop sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <CatContextPanel className="sticky top-4" />
          </div>
        </div>

        {/* Mobile buttons */}
        <div className="lg:hidden fixed bottom-24 right-4 z-40 flex flex-col gap-2">
          <Link
            href="/dashboard/cat/permissions"
            className="flex items-center justify-center p-3 bg-white border border-gray-200 text-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <Settings className="h-5 w-5" />
          </Link>
          <button
            onClick={handleShowContext}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <Info className="h-5 w-5" />
            <span className="text-sm font-medium">What My Cat Knows</span>
            {!hasSeenContext && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
            )}
          </button>
        </div>

        {/* Mobile context panel - slide up modal */}
        {showContext && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowContext(false)}
            />

            {/* Panel */}
            <div className="relative w-full max-h-[85vh] bg-white rounded-t-2xl overflow-hidden animate-slide-up">
              {/* Handle */}
              <div className="flex items-center justify-center py-3 border-b border-gray-100">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowContext(false)}
                className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(85vh-56px)]">
                <CatContextPanel showGreeting={true} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add slide-up animation - using global style via useEffect */}
    </div>
  );
}
