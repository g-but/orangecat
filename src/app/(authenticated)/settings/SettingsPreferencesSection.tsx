'use client';

/**
 * SettingsPreferencesSection — display preferences on the account settings page.
 *
 * The value lives in profiles.currency (the SSOT read by useUserCurrency →
 * useDisplayCurrency platform-wide) and is written through the same
 * PUT /api/profile path as the profile editor — this is a second door to the
 * same column, not a second copy of the data.
 */

import { useCallback, useEffect, useState } from 'react';
import { Coins, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/stores/auth';
import { API_ROUTES } from '@/config/api-routes';
import { currencySelectOptions, PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import { logger } from '@/utils/logger';

export function SettingsPreferencesSection() {
  const profile = useAuthStore(state => state.profile);
  const fetchProfile = useAuthStore(state => state.fetchProfile);

  const savedCurrency =
    ((profile as Record<string, unknown> | null)?.currency as string | undefined) ||
    PLATFORM_DEFAULT_CURRENCY;
  const [currency, setCurrency] = useState(savedCurrency);
  const [isSaving, setIsSaving] = useState(false);

  // Adopt the profile value once it loads; don't clobber an in-progress pick.
  useEffect(() => {
    setCurrency(prev => (prev === PLATFORM_DEFAULT_CURRENCY ? savedCurrency : prev));
  }, [savedCurrency]);

  const handleSave = useCallback(async () => {
    if (!profile?.username) {
      toast.error('Profile still loading — try again in a moment.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(API_ROUTES.PROFILE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: profile.username, currency }),
      });
      if (!res.ok) {
        throw new Error(`save failed (${res.status})`);
      }
      await fetchProfile();
      toast.success(`Display currency set to ${currency}`);
    } catch (err) {
      logger.error('Currency preference save failed', err, 'Settings');
      toast.error('Could not save your currency. Try again.');
    } finally {
      setIsSaving(false);
    }
  }, [currency, profile?.username, fetchProfile]);

  return (
    <div className="border-t border-subtle pt-10">
      <h3 className="mb-4 flex items-center text-lg font-semibold text-fg-primary">
        <Coins className="mr-2 h-6 w-6 text-fg-secondary" />
        Display Currency
      </h3>
      <p className="mb-6 text-fg-secondary">
        Amounts across OrangeCat show in this currency (converted from BTC). Bitcoin stays the
        canonical unit underneath.
      </p>
      <div className="flex max-w-md items-center gap-3">
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencySelectOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          onClick={handleSave}
          disabled={isSaving || currency === savedCurrency}
          className="px-5 py-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </div>
  );
}
