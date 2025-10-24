'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Bitcoin,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Loader2,
  AlertCircle,
  Globe,
  ShieldCheck,
  Users,
  Eye,
  EyeOff,
  RefreshCw,
  Mail,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Loading from '@/components/Loading';
import AuthRecovery from '@/components/AuthRecovery';
import { useAuth, useRedirectIfAuthenticated } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { resetPassword } from '@/services/supabase/auth';

// Normalize unknown error values to a user-friendly string
function getReadableError(
  error: unknown,
  fallback: string = 'An unexpected error occurred'
): string {
  if (!error) {
    return fallback;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === 'object') {
    const maybe = error as Record<string, unknown>;
    const message = maybe.message ?? maybe.error;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return fallback;
    }
  }
  return String(error);
}

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signUp, isLoading: authLoading, hydrated, session, profile, clear } = useAuth();
  const { isLoading: redirectLoading } = useRedirectIfAuthenticated();

  // Determine initial mode based on URL parameter
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'login' || modeParam === 'register') {
      setMode(modeParam);
    }
  }, [searchParams]);

  // Clear any stale auth state when visiting auth page
  useEffect(() => {
    if (hydrated && !session && !profile) {
      clear();
    }
  }, [hydrated, session, profile, clear]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Combined loading state
  const loading = localLoading || authLoading;

  // Combined loading state for better UX
  const isCurrentlyLoading = loading || redirectLoading;

  // Enhanced timeout handling with exponential backoff
  useEffect(() => {
    if (localLoading) {
      const timeout = Math.min(15000 + retryCount * 5000, 45000); // 15s, 20s, 25s, max 45s
      const timer = setTimeout(() => {
        setLocalLoading(false);
        setError(
          'Authentication request timed out. This usually means environment variables are not configured properly.'
        );
      }, timeout);

      return () => clearTimeout(timer);
    }
    return () => {}; // Return empty cleanup function when not loading
  }, [localLoading, retryCount]);

  // Check if we already have a valid session and redirect
  useEffect(() => {
    // If we have a session after hydration, redirect immediately
    if (session?.user && hydrated) {
      const redirectUrl = searchParams.get('from') || '/onboarding';
      router.replace(redirectUrl); // Use replace to avoid back button issues
    }
  }, [session, hydrated, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Basic client-side validation
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all required fields');
      }

      if (mode === 'register' && formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (mode === 'register' && formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const result =
        mode === 'login'
          ? await signIn(formData.email, formData.password)
          : await signUp(formData.email, formData.password);

      if (result.error) {
        // Enhanced error handling
        let errorMessage = getReadableError(result.error);

        // Provide more user-friendly error messages
        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage =
            'Please check your email and click the confirmation link before signing in.';
        } else if (errorMessage.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
        } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
          errorMessage = 'Connection timeout. Please check your internet connection and try again.';
        }

        throw new Error(errorMessage);
      }

      if (mode === 'register' && result.data && !result.data.session) {
        setSuccess(
          'Registration successful! Please check your email to verify your account before signing in.'
        );
        setFormData({ email: '', password: '', confirmPassword: '' });
        setMode('login');
      } else if (result.data && result.data.user) {
        // Successful login - redirect will happen automatically via useRedirectIfAuthenticated
        setSuccess('Login successful! Redirecting...');
      }
    } catch (error) {
      const errorMessage = getReadableError(error, 'An unexpected error occurred');
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!formData.email) {
        throw new Error('Please enter your email address');
      }

      const result = await resetPassword({ email: formData.email });

      if (result.error) {
        throw new Error(getReadableError(result.error, 'Failed to send reset email'));
      }

      setSuccess('Password reset email sent! Check your inbox and follow the instructions.');
    } catch (error) {
      const errorMessage = getReadableError(error, 'Failed to send password reset email');
      setError(errorMessage);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setSuccess(null);
    if (mode === 'forgot') {
      handleForgotPassword(new Event('submit') as any);
    } else {
      handleSubmit(new Event('submit') as any);
    }
  };

  const handleClearError = () => {
    setError(null);
    setSuccess(null);
    setRetryCount(0);
  };

  // Show initial loading
  const isInitialLoading = !hydrated && redirectLoading;

  if (session && hydrated) {
    return <Loading fullScreen message="Welcome back! Setting up your dashboard..." />;
  }

  if (isInitialLoading) {
    return <Loading fullScreen message="Loading your account..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Left: Clean Hero Section */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12 bg-white border-r border-gray-200">
        <div className="max-w-lg text-center lg:text-left">
          {/* Logo */}
          <div className="mb-8 flex justify-center lg:justify-start">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-4xl shadow-lg">
              🐾
            </div>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900 leading-tight">
            Fund Everything with
            <span className="block text-orange-600">Bitcoin</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            The decentralized platform for Bitcoin-powered crowdfunding. Beautiful, transparent, and
            built for everyone.
          </p>

          {/* Feature highlights */}
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-lg text-gray-700 font-medium">Bitcoin-First Platform</span>
            </div>
            <div className="flex items-center justify-center lg:justify-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-tiffany-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-tiffany-600" />
              </div>
              <span className="text-lg text-gray-700 font-medium">Self-Custody & Secure</span>
            </div>
            <div className="flex items-center justify-center lg:justify-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-lg text-gray-700 font-medium">Global & Transparent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Clean Form Section */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 text-gray-900">
              {mode === 'login'
                ? 'Welcome back'
                : mode === 'register'
                  ? 'Get started'
                  : 'Reset password'}
            </h2>
            <p className="text-gray-600">
              {mode === 'login'
                ? 'Sign in to your OrangeCat account'
                : mode === 'register'
                  ? 'Create your OrangeCat account'
                  : 'Enter your email to receive reset instructions'}
            </p>
          </div>

          {/* Single, Clean Error/Success Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-800 mb-3">{error}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      disabled={loading}
                      className="text-red-700 border-red-200 hover:bg-red-50"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearError}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          )}

          {/* Clean Form */}
          <form
            onSubmit={mode === 'forgot' ? handleForgotPassword : handleSubmit}
            className="space-y-6"
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
                placeholder="Enter your email"
                className="w-full h-12 px-4 rounded-lg border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
                required
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    disabled={loading}
                    placeholder="Enter your password"
                    className="w-full h-12 px-4 pr-12 rounded-lg border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    disabled={loading}
                    placeholder="Confirm your password"
                    className="w-full h-12 px-4 pr-12 rounded-lg border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>
                    {mode === 'login'
                      ? 'Signing in...'
                      : mode === 'register'
                        ? 'Creating account...'
                        : 'Sending email...'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>
                    {mode === 'login'
                      ? 'Sign in'
                      : mode === 'register'
                        ? 'Create account'
                        : 'Send reset email'}
                  </span>
                  {mode === 'forgot' ? (
                    <Mail className="w-5 h-5" />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                </div>
              )}
            </Button>
          </form>

          {/* Navigation Links */}
          <div className="mt-6 space-y-4 text-center">
            {mode === 'login' && (
              <div>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            )}

            <div>
              <p className="text-gray-600 text-sm">
                {mode === 'login'
                  ? "Don't have an account?"
                  : mode === 'register'
                    ? 'Already have an account?'
                    : 'Remember your password?'}
              </p>
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                disabled={loading}
                className="mt-1 font-semibold text-orange-600 hover:text-orange-700"
              >
                {mode === 'login' ? 'Create an account' : 'Sign in instead'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
