'use client';

import { useState, useEffect } from 'react';
import { Mail, X } from 'lucide-react';
import { toast } from 'sonner';
import { resendConfirmationEmail } from '@/services/supabase/auth';
import { cn } from '@/lib/utils';

interface EmailConfirmationBannerProps {
  /** User's email confirmation timestamp - if set, email is confirmed */
  emailConfirmedAt: string | null | undefined;
  /** User ID for session-based dismissal tracking */
  userId: string;
  /** Additional CSS classes */
  className?: string;
}

const DISMISS_KEY_PREFIX = 'orangecat-email-banner-dismissed-';

/**
 * Non-intrusive email confirmation reminder banner.
 *
 * Behavior:
 * - Only shows for authenticated users with unconfirmed email
 * - Dismissable per session (uses sessionStorage)
 * - Never shows again once email is confirmed
 * - One-click resend functionality
 */
export function EmailConfirmationBanner({
  emailConfirmedAt,
  userId,
  className,
}: EmailConfirmationBannerProps) {
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash
  const [resending, setResending] = useState(false);

  // Check if already dismissed this session
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const dismissKey = `${DISMISS_KEY_PREFIX}${userId}`;
    const wasDismissed = sessionStorage.getItem(dismissKey) === 'true';
    setDismissed(wasDismissed);
  }, [userId]);

  // Email is confirmed - never show
  if (emailConfirmedAt) {
    return null;
  }

  // Already dismissed this session
  if (dismissed) {
    return null;
  }

  const handleDismiss = () => {
    const dismissKey = `${DISMISS_KEY_PREFIX}${userId}`;
    sessionStorage.setItem(dismissKey, 'true');
    setDismissed(true);
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { error } = await resendConfirmationEmail();
      if (error) {
        toast.error('Failed to send confirmation email. Please try again.');
      } else {
        toast.success('Confirmation email sent! Check your inbox.');
        handleDismiss(); // Auto-dismiss after successful resend
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className={cn('bg-amber-50 border-b border-amber-200', className)}
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Mail className="w-4 h-4 text-amber-600 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm text-amber-800">
            <span className="hidden sm:inline">
              Please confirm your email to secure your account.{' '}
            </span>
            <span className="sm:hidden">Confirm your email. </span>
            <button
              onClick={handleResend}
              disabled={resending}
              className="font-medium text-amber-900 hover:text-amber-950 underline underline-offset-2 disabled:opacity-50 disabled:cursor-wait"
            >
              {resending ? 'Sending...' : 'Resend'}
            </button>
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-amber-600 hover:text-amber-800 p-1.5 rounded-md hover:bg-amber-100 transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
