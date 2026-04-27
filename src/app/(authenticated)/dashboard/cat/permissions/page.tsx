'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Cat, AlertTriangle } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { API_ROUTES } from '@/config/api-routes';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import { TooltipProvider } from '@/components/ui/Tooltip';
import type { PermissionData } from './types';
import { PermissionStats } from './PermissionStats';
import { CategoryRow } from './CategoryRow';
import { PermissionPresets } from './PermissionPresets';
import { PermissionInfo } from './PermissionInfo';

export default function CatPermissionsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
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
      const res = await fetch(API_ROUTES.CAT.PERMISSIONS);
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
    const previousData = data;

    setData(prev => {
      if (!prev) {
        return prev;
      }
      const newCategories = prev.summary.categories.map(cat =>
        cat.category === categoryId
          ? { ...cat, enabled, enabledActionCount: enabled ? cat.actionCount : 0 }
          : cat
      );
      return {
        ...prev,
        summary: {
          ...prev.summary,
          categories: newCategories,
          enabledActions: newCategories.reduce((sum, c) => sum + c.enabledActionCount, 0),
        },
      };
    });

    try {
      const res = await fetch(API_ROUTES.CAT.PERMISSIONS, {
        method: enabled ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: '*', category: categoryId, requiresConfirmation: true }),
      });
      const json = await res.json();
      if (json.success && json.data?.summary) {
        setData(prev => (prev ? { ...prev, summary: json.data.summary } : null));
      } else {
        setData(previousData);
        setError('Failed to update permission');
      }
    } catch {
      setData(previousData);
      setError('Failed to update permission');
    } finally {
      setSaving(null);
    }
  };

  const toggleAction = async (actionId: string, category: string, enabled: boolean) => {
    setSaving(actionId);
    try {
      const res = await fetch(API_ROUTES.CAT.PERMISSIONS, {
        method: enabled ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, category, requiresConfirmation: true }),
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

          <PermissionStats summary={summary} />

          {summary.highRiskEnabled && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">High-risk actions enabled</p>
                <p className="text-base text-amber-700">
                  You have enabled actions that can send Bitcoin or post public content. My Cat will
                  always ask for confirmation before executing these.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {summary.categories.map(cat => (
              <CategoryRow
                key={cat.category}
                cat={cat}
                actions={availableActions.filter(a => a.category === cat.category)}
                isExpanded={expandedCategories.has(cat.category)}
                saving={saving}
                onToggleExpanded={toggleExpanded}
                onToggleCategory={toggleCategory}
                onToggleAction={toggleAction}
              />
            ))}
          </div>

          <PermissionPresets
            categories={summary.categories}
            saving={saving}
            onToggleCategory={toggleCategory}
          />

          <PermissionInfo />
        </div>
      </div>
    </TooltipProvider>
  );
}
