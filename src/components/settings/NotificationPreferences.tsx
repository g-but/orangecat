'use client';

/**
 * Notification Preferences Settings Component
 *
 * Lets users manage notification email preferences:
 * - Category toggles (Economic, Social, Group, Progress, Re-engagement)
 * - Digest frequency selector (Daily / Weekly / Never)
 * - Auto-saves on toggle change
 *
 * Reads from GET /api/notifications/preferences
 * Updates via PUT /api/notifications/preferences
 *
 * Created: 2026-03-28
 */

import { useState, useEffect, useCallback } from 'react';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import { Bell, DollarSign, Users, UserPlus, TrendingUp, RotateCcw, Loader2 } from 'lucide-react';
import {
  NOTIFICATION_CATEGORY_LABELS,
  type NotificationCategory,
} from '@/config/notification-config';
import type {
  NotificationPreferences as NotificationPreferencesType,
  DigestFrequency,
} from '@/types/notification-preferences';

// =====================================================================
// CATEGORY CONFIG
// =====================================================================

interface CategoryConfig {
  key: keyof Pick<
    NotificationPreferencesType,
    'economic_emails' | 'social_emails' | 'group_emails' | 'progress_emails' | 'reengagement_emails'
  >;
  label: string;
  description: string;
  icon: typeof Bell;
  category: NotificationCategory;
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    key: 'economic_emails',
    label: NOTIFICATION_CATEGORY_LABELS.economic,
    description: 'Payment confirmations, contributions, order updates, and funding milestones',
    icon: DollarSign,
    category: 'economic',
  },
  {
    key: 'social_emails',
    label: NOTIFICATION_CATEGORY_LABELS.social,
    description: 'New followers, direct messages, mentions, and comments',
    icon: UserPlus,
    category: 'social',
  },
  {
    key: 'group_emails',
    label: NOTIFICATION_CATEGORY_LABELS.group,
    description: 'Group invitations, proposals, vote reminders, and treasury activity',
    icon: Users,
    category: 'group',
  },
  {
    key: 'progress_emails',
    label: NOTIFICATION_CATEGORY_LABELS.progress,
    description: 'Milestones, onboarding tips, and weekly digest',
    icon: TrendingUp,
    category: 'progress',
  },
  {
    key: 'reengagement_emails',
    label: NOTIFICATION_CATEGORY_LABELS.reengagement,
    description: 'Periodic check-ins if you have been away for a while',
    icon: RotateCcw,
    category: 'reengagement',
  },
];

const DIGEST_OPTIONS: { value: DigestFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'never', label: 'Never' },
];

// =====================================================================
// COMPONENT
// =====================================================================

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<NotificationPreferencesType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingField, setSavingField] = useState<string | null>(null);

  // Fetch preferences on mount
  useEffect(() => {
    async function fetchPrefs() {
      try {
        const res = await fetch('/api/notifications/preferences');
        if (!res.ok) {
          throw new Error('Failed to load preferences');
        }
        const json = await res.json();
        setPrefs(json.data);
      } catch {
        toast.error('Could not load notification preferences');
      } finally {
        setIsLoading(false);
      }
    }
    fetchPrefs();
  }, []);

  // Save a single field update
  const saveUpdate = useCallback(async (update: Record<string, unknown>, fieldKey: string) => {
    setSavingField(fieldKey);
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      if (!res.ok) {
        throw new Error('Failed to save');
      }
      const json = await res.json();
      setPrefs(json.data);
    } catch {
      toast.error('Failed to save notification preferences');
      // Revert optimistic update by re-fetching
      try {
        const res = await fetch('/api/notifications/preferences');
        if (res.ok) {
          const json = await res.json();
          setPrefs(json.data);
        }
      } catch {
        // Ignore refetch error
      }
    } finally {
      setSavingField(null);
    }
  }, []);

  const handleCategoryToggle = useCallback(
    (key: string, checked: boolean) => {
      // Optimistic update
      setPrefs(prev => (prev ? { ...prev, [key]: checked } : prev));
      saveUpdate({ [key]: checked }, key);
    },
    [saveUpdate]
  );

  const handleDigestChange = useCallback(
    (value: DigestFrequency) => {
      setPrefs(prev => (prev ? { ...prev, digest_frequency: value } : prev));
      saveUpdate({ digest_frequency: value }, 'digest_frequency');
    },
    [saveUpdate]
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-gray-100">
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>
    );
  }

  if (!prefs) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Bell className="w-8 h-8 mx-auto mb-3 text-gray-400" />
        <p>Unable to load notification preferences.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-tiffany-600 hover:text-tiffany-700 font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category toggles */}
      <div className="space-y-1">
        {CATEGORY_CONFIGS.map(config => {
          const Icon = config.icon;
          const isEnabled = prefs[config.key];
          const isSaving = savingField === config.key;

          return (
            <div
              key={config.key}
              className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
            >
              <div className="flex items-start gap-3 pr-4">
                <Icon className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                <div>
                  <Label className="text-sm font-medium text-gray-900 cursor-pointer">
                    {config.label}
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
                <Switch
                  checked={isEnabled}
                  onCheckedChange={checked => handleCategoryToggle(config.key, checked)}
                  disabled={isSaving}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Digest frequency */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium text-gray-900">Digest frequency</Label>
            <p className="text-xs text-gray-500 mt-0.5">
              How often to receive a summary of your activity
            </p>
          </div>
          <div className="flex items-center gap-2">
            {savingField === 'digest_frequency' && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
            )}
            <Select
              value={prefs.digest_frequency}
              onValueChange={value => handleDigestChange(value as DigestFrequency)}
              disabled={savingField === 'digest_frequency'}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIGEST_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Info note */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs text-gray-600">
          Security and account notifications (password resets, sign-in alerts) are always sent and
          cannot be disabled.
        </p>
      </div>
    </div>
  );
}
