import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useRedirectIfAuthenticated } from '@/hooks/useAuth';
import { resetPassword, getMFAAssuranceLevel } from '@/services/supabase/auth';
import { registrationEvents, trackEvent } from '@/lib/analytics';
import { getReadableError } from '@/utils/getReadableError';
import supabase from '@/lib/supabase/browser';

export type OAuthProvider = 'google' | 'github' | 'apple' | 'twitter';

export type AuthMode = 'login' | 'register' | 'forgot';

export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export function useAuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signUp, isLoading: authLoading, hydrated, session, profile, clear } = useAuth();
  const { isLoading: redirectLoading } = useRedirectIfAuthenticated();

  // Determine initial mode based on URL parameter
  const [mode, setMode] = useState<AuthMode>('login');

  useEffect(() => {
    const modeParam = searchParams?.get('mode');
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

  const [formData, setFormData] = useState<AuthFormData>({
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
  const [rememberMe, setRememberMe] = useState(true);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showMFAVerify, setShowMFAVerify] = useState(false);

  // CAPTCHA state
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const captchaEnabled = !!turnstileSiteKey;

  // CAPTCHA handlers
  const handleCaptchaSuccess = useCallback((token: string) => {
    setCaptchaToken(token);
    setError(null);
  }, []);

  const handleCaptchaError = useCallback((err: string) => {
    setCaptchaToken(null);
    setError(err);
  }, []);

  const handleCaptchaExpire = useCallback(() => {
    setCaptchaToken(null);
  }, []);

  // Combined loading state
  const loading = localLoading || authLoading;

  // Combined loading state for better UX
  const _isCurrentlyLoading = loading || redirectLoading;

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
      const redirectUrl = searchParams?.get('from') || '/dashboard';
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

      // Use centralized password validation instead of hardcoded check
      if (mode === 'register') {
        const { validatePasswordStrength } = await import('@/lib/validation/password');
        const passwordValidation = validatePasswordStrength(formData.password);
        if (!passwordValidation.valid) {
          throw new Error(passwordValidation.errors[0] || 'Password does not meet requirements');
        }

        // Verify CAPTCHA for registration
        if (captchaEnabled && !captchaToken) {
          throw new Error('Please complete the CAPTCHA verification');
        }

        // Verify CAPTCHA token server-side
        if (captchaEnabled && captchaToken) {
          const captchaResponse = await fetch('/api/auth/verify-captcha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: captchaToken }),
          });
          const captchaResult = await captchaResponse.json();
          if (!captchaResult.success) {
            setCaptchaToken(null); // Reset CAPTCHA on failure
            throw new Error(captchaResult.error || 'CAPTCHA verification failed');
          }
        }
      }

      const result =
        mode === 'login'
          ? await signIn(formData.email, formData.password, rememberMe)
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
        registrationEvents.success({ email: formData.email });
        registrationEvents.emailSent({ email: formData.email });
        setSuccess(
          'Registration successful! Please check your email to verify your account before signing in.'
        );
        setFormData({ email: '', password: '', confirmPassword: '' });
        setCaptchaToken(null); // Reset CAPTCHA on successful registration
        setMode('login');
      } else if (result.data && result.data.user) {
        // Check if MFA is required
        if (mode === 'login') {
          const mfaResult = await getMFAAssuranceLevel();

          // If user needs to complete MFA (has aal2 factors but only aal1 authenticated)
          if (
            mfaResult.data &&
            mfaResult.data.currentLevel === 'aal1' &&
            mfaResult.data.nextLevel === 'aal2'
          ) {
            setShowMFAVerify(true);
            setLocalLoading(false);
            return; // Don't redirect yet, show MFA verification
          }
        }

        // Successful login - redirect will happen automatically via useRedirectIfAuthenticated
        trackEvent('login_success', { userId: result.data.user.id });
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
    // Create a synthetic form event for retry
    const syntheticEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
      currentTarget: document.createElement('form'),
      target: document.createElement('form'),
      nativeEvent: new Event('submit'),
      bubbles: true,
      cancelable: true,
      defaultPrevented: false,
      eventPhase: 0,
      isTrusted: false,
      timeStamp: Date.now(),
      type: 'submit',
      isDefaultPrevented: () => false,
      isPropagationStopped: () => false,
      persist: () => {},
    } as unknown as React.FormEvent<HTMLFormElement>;

    if (mode === 'forgot') {
      handleForgotPassword(syntheticEvent);
    } else {
      handleSubmit(syntheticEvent);
    }
  };

  const handleClearError = () => {
    setError(null);
    setSuccess(null);
    setRetryCount(0);
  };

  const handleMFAVerificationComplete = () => {
    // MFA verification completed successfully
    setSuccess('Login successful! Redirecting...');
    setShowMFAVerify(false);
    // Redirect will happen automatically via useRedirectIfAuthenticated
  };

  const handleMFACancelled = () => {
    setShowMFAVerify(false);
    // Sign out to clear partial authentication
    clear();
  };

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setLocalLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        throw error;
      }
      // Browser will redirect to provider's OAuth page
    } catch (err) {
      setError(getReadableError(err, `Failed to sign in with ${provider}`));
      setLocalLoading(false);
    }
  };

  return {
    // State
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

    // CAPTCHA
    captchaToken,
    captchaEnabled,
    turnstileSiteKey,
    handleCaptchaSuccess,
    handleCaptchaError,
    handleCaptchaExpire,

    // Handlers
    handleSubmit,
    handleForgotPassword,
    handleRetry,
    handleClearError,
    handleMFAVerificationComplete,
    handleMFACancelled,
    handleOAuthSignIn,

    // Unused but preserved to avoid breaking references
    _isCurrentlyLoading,
  };
}
