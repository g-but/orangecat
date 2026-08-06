'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, Key, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import supabase from '@/lib/supabase/browser';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { GRADIENTS } from '@/config/gradients';
import { ROUTES } from '@/config/routes';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'loading' | 'reset' | 'success' | 'error'>('loading');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase v2 may deliver tokens via hash fragment. Merge hash into search params if present.
    const url = typeof window !== 'undefined' ? new URL(window.location.href) : null;
    const hashParams = new URLSearchParams(url?.hash.startsWith('#') ? url.hash.substring(1) : '');

    const qp = searchParams || new URLSearchParams();
    const accessToken = qp.get('access_token') || hashParams.get('access_token');
    const refreshToken = qp.get('refresh_token') || hashParams.get('refresh_token');
    const type = qp.get('type') || hashParams.get('type');

    if (type === 'recovery' && accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            setStep('error');
            setError('Invalid or expired reset link. Please request a new password reset.');
          } else {
            setStep('reset');
          }
        });
    } else {
      setStep('error');
      setError('Invalid reset link. Please request a new password reset from the login page.');
    }
  }, [searchParams]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate passwords
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        throw new Error(passwordError);
      }

      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      setStep('success');
    } catch (error: unknown) {
      const catchError = error as { message?: string };
      setError(catchError.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnToLogin = () => {
    router.push(ROUTES.AUTH_LOGIN);
  };

  const handleRequestNewReset = () => {
    router.push(ROUTES.AUTH_FORGOT_PASSWORD);
  };

  if (step === 'loading') {
    return (
      <div
        className={cn(GRADIENTS.pageBgSolid, 'min-h-screen flex items-center justify-center px-4')}
      >
        <Card className="max-w-md w-full p-8 shadow-sm">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-fg-primary mb-6" />
            <h2 className="text-xl font-semibold text-fg-primary mb-2">Verifying Reset Link</h2>
            <p className="text-fg-secondary">
              Please wait while we verify your password reset link...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div
        className={cn(GRADIENTS.pageBgSolid, 'min-h-screen flex items-center justify-center px-4')}
      >
        <Card className="max-w-md w-full p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-status-negative-subtle mb-6">
              <AlertCircle className="h-8 w-8 text-status-negative" />
            </div>
            <h1 className="text-2xl font-bold text-fg-primary mb-3">Reset Link Invalid</h1>
            <p className="text-fg-secondary mb-6">{error}</p>
            <div className="space-y-3">
              <Button onClick={handleRequestNewReset} variant="primary" className="w-full">
                Request New Reset Link
              </Button>
              <Button onClick={handleReturnToLogin} variant="outline" className="w-full">
                Back to Login
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div
        className={cn(GRADIENTS.pageBgSolid, 'min-h-screen flex items-center justify-center px-4')}
      >
        <Card className="max-w-md w-full p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-status-positive-subtle mb-6">
              <CheckCircle2 className="h-8 w-8 text-status-positive" />
            </div>
            <h1 className="text-2xl font-bold text-fg-primary mb-3">
              Password Updated Successfully
            </h1>
            <p className="text-fg-secondary mb-6">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <Button onClick={handleReturnToLogin} variant="primary" className="w-full">
              Sign In Now
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn(GRADIENTS.pageBgSolid, 'min-h-screen flex items-center justify-center px-4')}
    >
      <Card className="max-w-md w-full p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-surface-base border border-default mb-6">
            <Key className="h-8 w-8 text-fg-primary" />
          </div>
          <h1 className="text-2xl font-bold text-fg-primary mb-2">Create New Password</h1>
          <p className="text-fg-secondary">Enter a strong password to secure your account</p>
        </div>

        {error && (
          <div className="oc-error-surface mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder="New password"
              disabled={isLoading}
              className="w-full"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="min-h-11 min-w-11 inline-flex items-center justify-center text-fg-tertiary hover:text-fg-secondary dark:hover:text-fg-primary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div>
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={formData.confirmPassword}
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              disabled={isLoading}
              className="w-full"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="min-h-11 min-w-11 inline-flex items-center justify-center text-fg-tertiary hover:text-fg-secondary dark:hover:text-fg-primary"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Password Requirements */}
          <div className="bg-surface-raised rounded-lg p-4">
            <h3 className="text-sm font-medium text-fg-primary mb-2">Password Requirements:</h3>
            <ul className="text-xs text-fg-secondary space-y-1">
              <li className={formData.password.length >= 8 ? 'text-status-positive' : ''}>
                • At least 8 characters long
              </li>
              <li className={/(?=.*[a-z])/.test(formData.password) ? 'text-status-positive' : ''}>
                • One lowercase letter
              </li>
              <li className={/(?=.*[A-Z])/.test(formData.password) ? 'text-status-positive' : ''}>
                • One uppercase letter
              </li>
              <li className={/(?=.*\d)/.test(formData.password) ? 'text-status-positive' : ''}>
                • One number
              </li>
            </ul>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading || !formData.password || !formData.confirmPassword}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating Password...
              </>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href={`${ROUTES.AUTH}?mode=login`}
            className="inline-flex items-center text-sm text-fg-secondary hover:text-fg-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Login
          </Link>
        </div>
      </Card>
    </div>
  );
}
