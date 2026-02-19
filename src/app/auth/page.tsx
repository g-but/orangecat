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
