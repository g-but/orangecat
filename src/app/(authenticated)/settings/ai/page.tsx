'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bot, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAISettings } from '@/hooks/useAISettings';
import Loading from '@/components/Loading';
import Button from '@/components/ui/Button';
import { AISettingsStatus } from '@/components/ai/AISettingsStatus';
import { AIKeyManager } from '@/components/ai/AIKeyManager';
import { AIModelPreferences, type AIPreferences } from '@/components/ai/AIModelPreferences';
import { AIUsageStats } from '@/components/ai/AIUsageStats';
import { AIGuidanceSidebar } from '@/components/ai/AIGuidanceSidebar';
import type { AIFieldType } from '@/lib/ai-guidance';

export default function AISettingsPage() {
  const { user, hydrated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [focusedField, setFocusedField] = useState<AIFieldType>(null);

  // Wrapper to handle string | null to AIFieldType conversion
  const handleFieldFocus = (field: string | null) => {
    setFocusedField(field as AIFieldType);
  };

  const {
    preferences,
    keys,
    isLoading: settingsLoading,
    hasByok,
    primaryKey,
    platformUsage,
    updatePreferences,
    addKey,
    deleteKey,
    setPrimaryKey,
  } = useAISettings();

  // Show loading state while hydrating
  if (!hydrated || authLoading) {
    return <Loading fullScreen />;
  }

  // Redirect if not authenticated
  if (!user) {
    router.push('/auth');
    return <Loading fullScreen />;
  }

  // Convert preferences to component format
  const componentPreferences: AIPreferences = preferences
    ? {
        defaultModelId: preferences.default_model_id,
        defaultTier: preferences.default_tier,
        autoRouterEnabled: preferences.auto_router_enabled,
        maxCostSats: preferences.max_cost_sats,
        requireVision: preferences.require_vision,
        requireFunctionCalling: preferences.require_function_calling,
      }
    : {
        defaultModelId: null,
        defaultTier: 'economy',
        autoRouterEnabled: true,
        maxCostSats: 100,
        requireVision: false,
        requireFunctionCalling: false,
      };

  const handlePreferencesChange = async (updates: Partial<AIPreferences>) => {
    // Map component preferences to DB preferences
    const dbUpdates: Record<string, any> = {};
    if (updates.defaultModelId !== undefined) {
      dbUpdates.default_model_id = updates.defaultModelId;
    }
    if (updates.defaultTier !== undefined) {
      dbUpdates.default_tier = updates.defaultTier;
    }
    if (updates.autoRouterEnabled !== undefined) {
      dbUpdates.auto_router_enabled = updates.autoRouterEnabled;
    }
    if (updates.maxCostSats !== undefined) {
      dbUpdates.max_cost_sats = updates.maxCostSats;
    }
    if (updates.requireVision !== undefined) {
      dbUpdates.require_vision = updates.requireVision;
    }
    if (updates.requireFunctionCalling !== undefined) {
      dbUpdates.require_function_calling = updates.requireFunctionCalling;
    }

    try {
      await updatePreferences(dbUpdates);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/settings" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-tiffany-600" />
                <h1 className="text-xl font-semibold text-gray-900">AI Settings</h1>
              </div>
            </div>
            {!hasByok && !preferences?.onboarding_completed && (
              <Link href="/settings/ai/onboarding">
                <Button variant="primary" size="sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Setup
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Status Card */}
            <section>
              <AISettingsStatus
                hasByok={hasByok}
                byokProvider={primaryKey?.provider}
                dailyUsage={
                  platformUsage
                    ? {
                        used: platformUsage.daily_requests,
                        limit: platformUsage.daily_limit,
                      }
                    : undefined
                }
                onSetupClick={() => router.push('/settings/ai/onboarding')}
              />
            </section>

            {/* API Keys */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">API Keys</h2>
              <AIKeyManager
                keys={keys}
                onAdd={addKey}
                onDelete={deleteKey}
                onSetPrimary={setPrimaryKey}
                isLoading={settingsLoading}
                onFieldFocus={handleFieldFocus}
              />
            </section>

            {/* Model Preferences */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Model Preferences</h2>
              <AIModelPreferences
                preferences={componentPreferences}
                onChange={handlePreferencesChange}
                onFieldFocus={handleFieldFocus}
                disabled={settingsLoading}
              />
            </section>

            {/* Usage Stats */}
            <section>
              <AIUsageStats
                usage={{
                  totalRequests: preferences?.cached_total_requests || 0,
                  totalTokens: preferences?.cached_total_tokens || 0,
                  totalCostSats: preferences?.cached_total_cost_sats || 0,
                  periodLabel: 'All time',
                }}
              />
            </section>
          </div>

          {/* Guidance Sidebar */}
          <div className="hidden lg:block">
            <AIGuidanceSidebar focusedField={focusedField} />
          </div>
        </div>
      </div>
    </div>
  );
}
