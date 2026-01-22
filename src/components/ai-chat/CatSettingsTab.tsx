/**
 * Cat Settings Tab - AI settings and permissions for the Cat hub
 *
 * Combines model selection, API keys, and permissions in one place.
 *
 * Created: 2026-01-22
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAISettings } from '@/hooks/useAISettings';
import {
  Bot,
  Key,
  Shield,
  ShieldAlert,
  ChevronRight,
  Loader2,
  Sparkles,
  Zap,
  AlertTriangle,
  Check,
  Gift,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface CategorySummary {
  category: string;
  name: string;
  description: string;
  enabled: boolean;
  actionCount: number;
  enabledActionCount: number;
}

interface PermissionData {
  summary: {
    categories: CategorySummary[];
    totalActions: number;
    enabledActions: number;
    highRiskEnabled: boolean;
  };
}

const MODEL_TIERS = [
  { id: 'free', name: 'Free', description: 'No API cost, rate limited', icon: Gift },
  { id: 'economy', name: 'Economy', description: 'Fast, cost-effective responses', icon: Zap },
  { id: 'standard', name: 'Standard', description: 'Balanced performance', icon: Bot },
  { id: 'premium', name: 'Premium', description: 'Best quality responses', icon: Sparkles },
];

export function CatSettingsTab() {
  const { user } = useAuth();
  const { preferences, hasByok, updatePreferences, isLoading: aiLoading } = useAISettings();
  const [permissions, setPermissions] = useState<PermissionData | null>(null);
  const [permLoading, setPermLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Fetch permissions
  useEffect(() => {
    async function fetchPermissions() {
      try {
        const res = await fetch('/api/cat/permissions');
        const data = await res.json();
        if (data.success) {
          setPermissions(data.data);
        }
      } catch {
        // Ignore errors
      } finally {
        setPermLoading(false);
      }
    }
    if (user) {
      fetchPermissions();
    }
  }, [user]);

  const toggleCategory = async (categoryId: string, enabled: boolean) => {
    setSaving(categoryId);
    try {
      const res = await fetch('/api/cat/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: categoryId, enabled }),
      });
      const data = await res.json();
      if (data.success) {
        // Refetch permissions
        const res2 = await fetch('/api/cat/permissions');
        const data2 = await res2.json();
        if (data2.success) {
          setPermissions(data2.data);
        }
      }
    } catch {
      // Ignore errors
    } finally {
      setSaving(null);
    }
  };

  const handleTierChange = async (tier: 'free' | 'economy' | 'standard' | 'premium') => {
    try {
      await updatePreferences({ default_tier: tier });
    } catch {
      // Ignore errors
    }
  };

  const currentTier = preferences?.default_tier || 'free';

  return (
    <div className="space-y-6">
      {/* AI Model Selection */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
          <Bot className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-semibold text-gray-900">AI Model</span>
        </div>
        <div className="p-4 space-y-3">
          {MODEL_TIERS.map(tier => {
            const Icon = tier.icon;
            const isSelected = currentTier === tier.id;
            return (
              <button
                key={tier.id}
                onClick={() =>
                  handleTierChange(tier.id as 'free' | 'economy' | 'standard' | 'premium')
                }
                disabled={aiLoading}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1 text-left">
                  <p
                    className={`text-sm font-medium ${
                      isSelected ? 'text-indigo-900' : 'text-gray-900'
                    }`}
                  >
                    {tier.name}
                  </p>
                  <p className="text-xs text-gray-500">{tier.description}</p>
                </div>
                {isSelected && <Check className="h-5 w-5 text-indigo-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* API Keys Status */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
          <Key className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-semibold text-gray-900">API Keys</span>
        </div>
        <div className="p-4">
          {hasByok ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-full">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Your own API key connected</p>
                <p className="text-xs text-green-700">Unlimited usage with your key</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">Using free tier</p>
                <p className="text-xs text-amber-700">Limited daily messages</p>
              </div>
            </div>
          )}
          <Link
            href="/settings/ai"
            className="mt-3 flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm text-gray-700">Manage API Keys</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-semibold text-gray-900">Permissions</span>
          </div>
          {permissions && (
            <span className="text-xs text-gray-500">
              {permissions.summary.enabledActions}/{permissions.summary.totalActions} enabled
            </span>
          )}
        </div>

        {permLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : permissions ? (
          <div className="divide-y divide-gray-100">
            {permissions.summary.categories.map(cat => {
              const isSaving = saving === cat.category;
              return (
                <div key={cat.category} className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-500 truncate">{cat.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                    <Switch
                      checked={cat.enabled}
                      onCheckedChange={checked => toggleCategory(cat.category, checked)}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-gray-500">Failed to load permissions</div>
        )}

        {permissions?.summary.highRiskEnabled && (
          <div className="px-4 py-3 bg-red-50 border-t border-red-100 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-600" />
            <span className="text-xs text-red-700">High-risk actions enabled</span>
          </div>
        )}
      </div>

      {/* Link to full settings */}
      <Link
        href="/settings/ai"
        className="block text-center text-sm text-indigo-600 hover:text-indigo-800 py-2"
      >
        View all AI settings
      </Link>
    </div>
  );
}

export default CatSettingsTab;
