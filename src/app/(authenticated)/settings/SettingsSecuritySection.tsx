'use client';

import { useState } from 'react';
import { Shield, Link2, Loader2, MonitorSmartphone } from 'lucide-react';
import { toast } from 'sonner';
import { MFAStatus } from '@/components/auth/MFASetup';
import { NostrConnectionCard } from '@/components/nostr/NostrConnectionCard';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/browser';
import { ROUTES } from '@/config/routes';
import { logger } from '@/utils/logger';

interface Props {
  mfaStatusKey: number;
  onEnableMFA: () => void;
  onViewRecoveryCodes: () => void;
  onMFADisableComplete: () => void;
}

export function SettingsSecuritySection({
  mfaStatusKey,
  onEnableMFA,
  onViewRecoveryCodes,
  onMFADisableComplete,
}: Props) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Revokes every refresh token for the account (scope: 'global'), then sends
  // this browser to the sign-in page. Other devices are signed out as their
  // access tokens expire (~1h max).
  const handleSignOutEverywhere = async () => {
    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        throw error;
      }
      window.location.assign(ROUTES.AUTH);
    } catch (err) {
      logger.error('Global sign-out failed', err, 'Settings');
      toast.error('Could not sign out everywhere. Try again.');
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <div className="border-t border-subtle pt-10">
        <h3 className="text-lg font-semibold text-fg-primary mb-4 flex items-center">
          <Shield className="w-6 h-6 mr-2 text-fg-secondary" />
          Two-Factor Authentication
        </h3>
        <p className="text-fg-secondary mb-6">
          Add an extra layer of security to your account by requiring a code from your authenticator
          app when signing in.
        </p>
        <div className="bg-surface-raised border border-default rounded-lg p-6 max-w-md">
          <MFAStatus
            key={mfaStatusKey}
            onEnableClick={onEnableMFA}
            onDisableComplete={() => {
              toast.success('Two-factor authentication has been disabled');
              onMFADisableComplete();
            }}
          />
          <div className="mt-4 pt-4 border-t border-default">
            <button
              type="button"
              onClick={onViewRecoveryCodes}
              className="text-sm text-fg-primary hover:text-fg-primary font-medium underline-offset-4 hover:underline"
            >
              View Recovery Codes
            </button>
            <p className="text-xs text-fg-secondary mt-1">
              Backup codes for when you lose access to your authenticator
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-subtle pt-10">
        <h3 className="text-lg font-semibold text-fg-primary mb-4 flex items-center">
          <MonitorSmartphone className="w-6 h-6 mr-2 text-fg-secondary" />
          Active Sessions
        </h3>
        <p className="text-fg-secondary mb-6">
          Lost a device, or signed in somewhere you don&apos;t trust? Sign out of your account on
          every device, including this one. You&apos;ll need to sign in again.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={handleSignOutEverywhere}
          disabled={isSigningOut}
          className="px-6 py-2"
        >
          {isSigningOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing out…
            </>
          ) : (
            'Sign out all devices'
          )}
        </Button>
      </div>

      <div className="border-t border-subtle pt-10">
        <h3 className="text-lg font-semibold text-fg-primary mb-4 flex items-center">
          <Link2 className="w-6 h-6 mr-2 text-fg-secondary" />
          Connected Accounts
        </h3>
        <p className="text-fg-secondary mb-6">
          Connect external services for enhanced features like Lightning payments.
        </p>
        <div className="max-w-md">
          <NostrConnectionCard />
        </div>
      </div>
    </>
  );
}
