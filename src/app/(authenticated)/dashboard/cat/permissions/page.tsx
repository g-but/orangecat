'use client';

/**
 * My Cat Permissions Page
 *
 * Allows users to manage what actions My Cat can perform on their behalf.
 * Shows categories with toggles and individual action controls.
 *
 * Created: 2026-01-21
 * Last Modified: 2026-01-21
 * Last Modified Summary: Initial implementation
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/routes';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import {
  ArrowLeft,
  Cat,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Info,
  Zap,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Action {
  id: string;
  name: string;
  description: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
  requiresConfirmation: boolean;
}

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
  availableActions: Action[];
  categories: Category[];
}

const RISK_COLORS = {
  low: 'text-green-600 bg-green-50',
  medium: 'text-amber-600 bg-amber-50',
  high: 'text-red-600 bg-red-50',
};

const RISK_ICONS = {
  low: ShieldCheck,
  medium: Shield,
  high: ShieldAlert,
};

export default function CatPermissionsPage() {
  const { user, isLoading: authLoading, hydrated: _hydrated } = useRequireAuth();
  const _router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [data, setData] = useState<PermissionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchPermissions();
    }
  }, [user]);

  const fetchPermissions = async () => {
    try {
      const res = await fetch('/api/cat/permissions');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error);
      }
    } catch {
      setError('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = async (categoryId: string, enabled: boolean) => {
    setSaving(categoryId);

    // Optimistic update - update UI immediately
    const previousData = data;
    setData(prev => {
      if (!prev) {
        return prev;
      }
      const newCategories = prev.summary.categories.map(cat => {
        if (cat.category === categoryId) {
          return {
            ...cat,
            enabled,
            enabledActionCount: enabled ? cat.actionCount : 0,
          };
        }
        return cat;
      });
      const newEnabledActions = newCategories.reduce((sum, c) => sum + c.enabledActionCount, 0);
      return {
        ...prev,
        summary: {
          ...prev.summary,
          categories: newCategories,
          enabledActions: newEnabledActions,
        },
      };
    });

    try {
      const method = enabled ? 'POST' : 'DELETE';
      const res = await fetch('/api/cat/permissions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId: '*',
          category: categoryId,
          requiresConfirmation: true,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.summary) {
        // Update with server response (source of truth)
        setData(prev => (prev ? { ...prev, summary: json.data.summary } : null));
      } else {
        // Revert on failure
        setData(previousData);
        setError('Failed to update permission');
      }
    } catch {
      // Revert on error
      setData(previousData);
      setError('Failed to update permission');
    } finally {
      setSaving(null);
    }
  };

  const toggleAction = async (actionId: string, category: string, enabled: boolean) => {
    setSaving(actionId);
    try {
      const method = enabled ? 'POST' : 'DELETE';
      const res = await fetch('/api/cat/permissions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId,
          category,
          requiresConfirmation: true,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.summary) {
        setData(prev => (prev ? { ...prev, summary: json.data.summary } : null));
      }
    } catch {
      setError('Failed to update permission');
    } finally {
      setSaving(null);
    }
  };

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  if (authLoading) {
    return <Loading fullScreen message="Loading..." />;
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return <Loading fullScreen message="Loading permissions..." />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error || 'Failed to load permissions'}
          </div>
        </div>
      </div>
    );
  }

  const { summary, availableActions } = data;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20 p-4 sm:p-6 pb-20 sm:pb-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              href={ROUTES.DASHBOARD.CAT}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Cat
            </Link>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <Cat className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Cat Permissions</h1>
                <p className="text-gray-600">
                  Control what actions My Cat can perform on your behalf
                </p>
              </div>
            </div>
          </div>

          {/* Stats - Responsive: 2 cols on mobile, 3 on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {summary.enabledActions}/{summary.totalActions}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">Actions enabled</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {summary.categories.filter(c => c.enabled).length}/{summary.categories.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">Categories enabled</div>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
              <div
                className={`text-xl sm:text-2xl font-bold ${summary.highRiskEnabled ? 'text-amber-600' : 'text-green-600'}`}
              >
                {summary.highRiskEnabled ? 'Yes' : 'No'}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">High-risk enabled</div>
            </div>
          </div>

          {/* Warning for high-risk */}
          {summary.highRiskEnabled && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">High-risk actions enabled</p>
                <p className="text-sm text-amber-700">
                  You have enabled actions that can send Bitcoin or post public content. My Cat will
                  always ask for confirmation before executing these.
                </p>
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="space-y-4">
            {summary.categories.map(cat => {
              const catActions = availableActions.filter(a => a.category === cat.category);
              const isExpanded = expandedCategories.has(cat.category);

              return (
                <div
                  key={cat.category}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  {/* Category Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleExpanded(cat.category)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {cat.enabledActionCount}/{cat.actionCount}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{cat.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={cat.enabled}
                        onCheckedChange={checked => toggleCategory(cat.category, checked)}
                        disabled={saving === cat.category}
                      />
                    </div>
                  </div>

                  {/* Expanded Actions */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4">
                      <div className="space-y-3">
                        {catActions.map(action => {
                          const RiskIcon = RISK_ICONS[action.riskLevel];
                          const isCategoryEnabled = cat.enabled;
                          const isActionSaving = saving === action.id;

                          return (
                            <div
                              key={action.id}
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                isCategoryEnabled ? 'bg-white' : 'bg-gray-100 opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div
                                      className={`p-1.5 rounded ${RISK_COLORS[action.riskLevel]}`}
                                    >
                                      <RiskIcon className="h-4 w-4" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="capitalize">{action.riskLevel} risk</p>
                                  </TooltipContent>
                                </Tooltip>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 text-sm">
                                      {action.name}
                                    </span>
                                    {action.requiresConfirmation && (
                                      <Badge variant="outline" className="text-xs">
                                        <Zap className="h-3 w-3 mr-1" />
                                        Requires confirmation
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500">{action.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isCategoryEnabled ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div>
                                        <Switch
                                          checked={true}
                                          onCheckedChange={checked =>
                                            toggleAction(action.id, action.category, checked)
                                          }
                                          disabled={isActionSaving || saving === cat.category}
                                          className="data-[state=checked]:bg-tiffany"
                                        />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Toggle individual action (category must stay enabled)</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-4 w-4 text-gray-400" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Enable the category first to configure this action</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Permission Presets */}
          <div className="mt-8">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Presets</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Minimal Preset */}
              <button
                onClick={() => {
                  // Disable all, then enable only context
                  summary.categories.forEach(cat => {
                    if (cat.category === 'context') {
                      if (!cat.enabled) {
                        toggleCategory('context', true);
                      }
                    } else if (cat.enabled) {
                      toggleCategory(cat.category, false);
                    }
                  });
                }}
                disabled={saving !== null}
                className="p-4 border border-gray-200 rounded-xl text-left hover:border-green-300 hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">Minimal</span>
                </div>
                <p className="text-xs text-gray-500">
                  Only context management. Safest option for new users.
                </p>
              </button>

              {/* Creator Preset */}
              <button
                onClick={() => {
                  // Enable entities, context, communication
                  const creatorCategories = ['entities', 'context', 'communication'];
                  summary.categories.forEach(cat => {
                    if (creatorCategories.includes(cat.category)) {
                      if (!cat.enabled) {
                        toggleCategory(cat.category, true);
                      }
                    } else if (cat.enabled) {
                      toggleCategory(cat.category, false);
                    }
                  });
                }}
                disabled={saving !== null}
                className="p-4 border border-gray-200 rounded-xl text-left hover:border-tiffany hover:bg-tiffany-50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-5 w-5 text-tiffany" />
                  <span className="font-medium text-gray-900">Creator</span>
                </div>
                <p className="text-xs text-gray-500">
                  Create content & communicate. Best for most users.
                </p>
              </button>

              {/* Power User Preset */}
              <button
                onClick={() => {
                  // Enable all except payments
                  summary.categories.forEach(cat => {
                    if (cat.category !== 'payments') {
                      if (!cat.enabled) {
                        toggleCategory(cat.category, true);
                      }
                    } else if (cat.enabled) {
                      toggleCategory(cat.category, false);
                    }
                  });
                }}
                disabled={saving !== null}
                className="p-4 border border-gray-200 rounded-xl text-left hover:border-amber-300 hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-gray-900">Power User</span>
                </div>
                <p className="text-xs text-gray-500">
                  Everything except payments. For experienced users.
                </p>
              </button>
            </div>

            {/* Disable All - subtle secondary action */}
            <div className="mt-4 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  summary.categories.forEach(cat => {
                    if (cat.enabled) {
                      toggleCategory(cat.category, false);
                    }
                  });
                }}
                disabled={saving !== null}
                className="text-gray-500 hover:text-red-600"
              >
                Disable All Permissions
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-lg p-4">
            <h4 className="font-medium text-indigo-900 mb-2">How permissions work</h4>
            <ul className="text-sm text-indigo-700 space-y-1">
              <li>
                <strong>Low risk</strong> actions (like adding context) can run without asking.
              </li>
              <li>
                <strong>Medium risk</strong> actions (like creating posts) will ask for
                confirmation.
              </li>
              <li>
                <strong>High risk</strong> actions (like sending Bitcoin) always require
                confirmation.
              </li>
              <li>
                You can revoke permissions at any time and My Cat will stop performing those
                actions.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
