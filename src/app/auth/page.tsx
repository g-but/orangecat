'use client';

import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Mail,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/Loading';
import { TurnstileCaptcha } from '@/components/auth/TurnstileCaptcha';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { MFAVerify } from '@/components/auth/MFAVerify';
import { AuthHeroPanel } from './AuthHeroPanel';
import { useAuthForm } from './useAuthForm';
import type { OAuthProvider } from './useAuthForm';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="#1877F2"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const OAUTH_PROVIDERS: {
  id: OAuthProvider;
  name: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'google', name: 'Google', icon: GoogleIcon },
  { id: 'github', name: 'GitHub', icon: GitHubIcon },
  { id: 'facebook', name: 'Facebook', icon: FacebookIcon },
  { id: 'x', name: 'X', icon: XIcon },
];

export default function AuthPage() {
  const {
    mode,
    setMode,
    formData,
    setFormData,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    loading,
    error,
    success,
    rememberMe,
    setRememberMe,
    isPasswordFocused,
    setIsPasswordFocused,
    showMFAVerify,
    session,
    hydrated,
    captchaEnabled,
    turnstileSiteKey,
    handleCaptchaSuccess,
    handleCaptchaError,
    handleCaptchaExpire,
    handleSubmit,
    handleForgotPassword,
    handleRetry,
    handleClearError,
    handleMFAVerificationComplete,
    handleMFACancelled,
    handleOAuthSignIn,
  } = useAuthForm();

  // Only show loading if we have a session and are already hydrated (redirecting to dashboard)
  if (session && hydrated) {
    return <Loading fullScreen message="Welcome back! Setting up your dashboard..." />;
  }

  // Show MFA verification if needed
  if (showMFAVerify) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <MFAVerify
          onVerificationComplete={handleMFAVerificationComplete}
          onCancel={handleMFACancelled}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Left: Clean Hero Section */}
      <AuthHeroPanel />

      {/* Right: Clean Form Section */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-2 text-gray-900">
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
            className="space-y-4"
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
                autoComplete="email"
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
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    disabled={loading}
                    placeholder="Enter your password"
                    className="w-full h-12 px-4 pr-12 rounded-lg border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {/* Password Strength Indicator for Registration */}
                {mode === 'register' && (
                  <PasswordStrengthIndicator
                    password={formData.password}
                    isFocused={isPasswordFocused}
                    showOnlyWhenFocused={false}
                  />
                )}
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
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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

            {/* CAPTCHA for Registration */}
            {mode === 'register' && captchaEnabled && turnstileSiteKey && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verify you&apos;re human
                </label>
                <TurnstileCaptcha
                  siteKey={turnstileSiteKey}
                  onSuccess={handleCaptchaSuccess}
                  onError={handleCaptchaError}
                  onExpire={handleCaptchaExpire}
                  theme="light"
                />
              </div>
            )}

            {/* Remember Me Checkbox for Login */}
            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
                >
                  Forgot password?
                </button>
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

          {/* Social Login */}
          {mode !== 'forgot' && (
            <div className="mt-6">
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-gray-50 px-3 text-gray-500">or continue with</span>
                </div>
              </div>

              {/* Provider Buttons */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {OAUTH_PROVIDERS.map(({ id, name, icon: Icon }) => (
                  <Button
                    key={id}
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => handleOAuthSignIn(id)}
                    className="h-11 w-full border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    aria-label={`Sign in with ${name}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="ml-2 text-sm font-medium sm:hidden">{name}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="mt-6 space-y-4 text-center">
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
