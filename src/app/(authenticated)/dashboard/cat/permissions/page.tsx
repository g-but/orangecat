'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Cat, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { ROUTES } from '@/config/routes';
import { API_ROUTES } from '@/config/api-routes';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import { TooltipProvider } from '@/components/ui/Tooltip';
import type { PermissionData } from './types';
import { PermissionStats } from './PermissionStats';
import { CategoryRow } from './CategoryRow';
import { SpendCapsCard } from './SpendCapsCard';
import { PermissionPresets } from './PermissionPresets';
import { PermissionInfo } from './PermissionInfo';

export default function CatPermissionsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
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
        toast.error(json.error?.message || 'Failed to update permission');
      }
    } catch {
      setData(previousData);
      toast.error('Failed to update permission');
    } finally {
      setSaving(null);
    }
  };

  const toggleAction = async (actionId: string, category: string, enabled: boolean) => {
    setSaving(actionId);
    const previousData = data;
    try {
      const res = await fetch(API_ROUTES.CAT.PERMISSIONS, {
        method: enabled ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, category, requiresConfirmation: true }),
      });
      const json = await res.json();
      if (json.success && json.data?.summary) {
        setData(prev => (prev ? { ...prev, summary: json.data.summary } : null));
      } else {
        setData(previousData);
        toast.error(json.error?.message || 'Failed to update permission');
      }
    } catch {
      setData(previousData);
      toast.error('Failed to update permission');
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
      <div className="min-h-screen bg-surface-page p-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-md border border-status-negative/20 bg-status-negative/10 p-4 text-status-negative">
            {error || 'Failed to load permissions'}
          </div>
        </div>
      </div>
    );
  }

  const { summary, availableActions } = data;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-surface-page p-4 pb-20 sm:p-6 sm:pb-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link
              href={ROUTES.DASHBOARD.CAT}
              className="inline-flex items-center gap-2 text-fg-secondary hover:text-fg-primary mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Cat
            </Link>
            <div className="flex items-center gap-4">
              <div className="rounded-md border border-subtle bg-surface-raised p-3">
                <Cat className="h-8 w-8 text-fg-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-fg-primary">Cat Permissions</h1>
                <p className="text-fg-secondary">
                  Control what actions Cat can perform on your behalf
                </p>
              </div>
            </div>
          </div>

          <PermissionStats summary={summary} />

          {summary.highRiskEnabled && (
            <div className="mb-6 flex items-start gap-3 rounded-md border border-subtle bg-status-warning-subtle p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-status-warning dark:text-status-warning" />
              <div>
                <p className="font-medium text-status-warning dark:text-status-warning">
                  High-risk actions enabled
                </p>
                <p className="text-base text-fg-secondary">
                  You have enabled actions that can send Bitcoin or post public content. Cat will
                  always ask for confirmation before executing them.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {summary.categories.map(cat => (
              <div key={cat.category} className="space-y-4">
                <CategoryRow
                  cat={cat}
                  actions={availableActions.filter(a => a.category === cat.category)}
                  isExpanded={expandedCategories.has(cat.category)}
                  saving={saving}
                  onToggleExpanded={toggleExpanded}
                  onToggleCategory={toggleCategory}
                  onToggleAction={toggleAction}
                />
                {cat.category === 'payments' && cat.enabled && (
                  <SpendCapsCard
                    caps={data.spendCaps}
                    disabled={saving !== null}
                    onSaved={caps => setData(prev => (prev ? { ...prev, spendCaps: caps } : prev))}
                  />
                )}
              </div>
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
