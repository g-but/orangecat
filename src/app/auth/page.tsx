'use client';

import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import Loading from '@/components/Loading';
import { MFAVerify } from '@/components/auth/MFAVerify';
import { AuthHeroPanel } from './AuthHeroPanel';
import { AuthFormBody } from './AuthFormBody';
import { AuthSocialLogin } from './AuthSocialLogin';
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
    handleOAuthSignIn,
    handleAnonymousSignIn,
  } = useAuthForm();

  if (session && hydrated) {
    return <Loading fullScreen message="Welcome back! Setting up your dashboard..." />;
  }

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
      <AuthHeroPanel />

      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md">
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

          <AuthFormBody
            mode={mode}
            setMode={setMode}
            formData={formData}
            setFormData={setFormData}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            loading={loading}
            isPasswordFocused={isPasswordFocused}
            setIsPasswordFocused={setIsPasswordFocused}
            captchaEnabled={captchaEnabled}
            turnstileSiteKey={turnstileSiteKey}
            handleCaptchaSuccess={handleCaptchaSuccess}
            handleCaptchaError={handleCaptchaError}
            handleCaptchaExpire={handleCaptchaExpire}
            rememberMe={rememberMe}
            setRememberMe={setRememberMe}
            handleSubmit={handleSubmit}
            handleForgotPassword={handleForgotPassword}
          />

          <AuthSocialLogin
            mode={mode}
            setMode={setMode}
            loading={loading}
            onOAuthSignIn={handleOAuthSignIn}
            onAnonymousSignIn={handleAnonymousSignIn}
          />
        </div>
      </div>
    </div>
  );
}
