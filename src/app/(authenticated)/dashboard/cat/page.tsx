/**
 * Cat Hub Page - Unified AI Assistant Interface
 *
 * Single page with tabs for:
 * - Chat: Conversation with My Cat
 * - Context: Documents that inform the AI
 * - Settings: Model selection and permissions
 *
 * Created: 2026-01-22
 * Last Modified: 2026-01-22
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import { ModernChatPanel } from '@/components/ai-chat/ModernChatPanel';
import { CatContextTab } from '@/components/ai-chat/CatContextTab';
import { CatSettingsTab } from '@/components/ai-chat/CatSettingsTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageSquare, FolderOpen, Settings, Cat } from 'lucide-react';

type TabValue = 'chat' | 'context' | 'settings';

export default function CatHubPage() {
  const { user, isLoading, hydrated } = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabValue>('chat');

  // Get initial tab from URL
  useEffect(() => {
    const tab = searchParams?.get('tab') as TabValue | null;
    if (tab && ['chat', 'context', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue);
    const url = new URL(window.location.href);
    if (value === 'chat') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', value);
    }
    window.history.replaceState({}, '', url.toString());
  };

  if (isLoading) {
    return <Loading fullScreen message="Loading..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl shadow-sm">
                <Cat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">My Cat</h1>
                <p className="text-xs text-gray-500">Your personal AI assistant</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Tab Navigation - Fixed at top on mobile, inline on desktop */}
          <div className="sticky top-[73px] z-20 bg-gradient-to-br from-orange-50/80 via-white/80 to-tiffany-50/80 backdrop-blur-sm px-4 py-2">
            <TabsList className="w-full grid grid-cols-3 h-12 bg-white/80 border border-gray-200 shadow-sm">
              <TabsTrigger
                value="chat"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Chat</span>
              </TabsTrigger>
              <TabsTrigger
                value="context"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Context</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-600 data-[state=active]:to-gray-700 data-[state=active]:text-white"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="px-4 pb-24 sm:pb-8">
            {/* Chat Tab */}
            <TabsContent value="chat" className="mt-4 focus:outline-none">
              <ModernChatPanel />
            </TabsContent>

            {/* Context Tab */}
            <TabsContent value="context" className="mt-4 focus:outline-none">
              <div className="max-w-xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">My Context</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Add documents to help My Cat understand your goals, skills, and situation
                  </p>
                </div>
                <CatContextTab />
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-4 focus:outline-none">
              <div className="max-w-xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">My AI</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure how your AI assistant works
                  </p>
                </div>
                <CatSettingsTab />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
