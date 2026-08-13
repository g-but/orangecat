'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, Key, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import supabase from '@/lib/supabase/browser';
import { ROUTES } from '@/config/routes';

// Mirrors the register form's policy — the two surfaces must never drift.
const RULES: { label: string; test: (pw: string) => boolean; error: string }[] = [
  {
    label: 'At least 8 characters long',
    test: pw => pw.length >= 8,
    error: 'Password must be at least 8 characters long',
  },
  {
    label: 'One lowercase letter',
    test: pw => /(?=.*[a-z])/.test(pw),
    error: 'Password must contain at least one lowercase letter',
  },
  {
    label: 'One uppercase letter',
    test: pw => /(?=.*[A-Z])/.test(pw),
    error: 'Password must contain at least one uppercase letter',
  },
  {
    label: 'One number',
    test: pw => /(?=.*\d)/.test(pw),
    error: 'Password must contain at least one number',
  },
  {
    label: 'One special character',
    test: pw => /(?=.*[^a-zA-Z0-9])/.test(pw),
    error: 'Password must contain at least one special character',
  },
];

/** The set-a-new-password form, shown once a recovery session exists. */
export function NewPasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      const failed = RULES.find(rule => !rule.test(password));
      if (failed) {
        throw new Error(failed.error);
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        throw error;
      }
      onSuccess();
    } catch (err: unknown) {
      const caught = err as { message?: string };
      setError(caught.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md w-full p-8 shadow-sm">
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
            value={password}
            onChange={e => setPassword(e.target.value)}
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
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
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

        <div className="bg-surface-raised rounded-lg p-4">
          <h3 className="text-sm font-medium text-fg-primary mb-2">Password Requirements:</h3>
          <ul className="text-xs text-fg-secondary space-y-1">
            {RULES.map(rule => (
              <li key={rule.label} className={rule.test(password) ? 'text-status-positive' : ''}>
                • {rule.label}
              </li>
            ))}
          </ul>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isLoading || !password || !confirmPassword}
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
  );
}
