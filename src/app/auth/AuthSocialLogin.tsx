'use client';

import { Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { OAUTH_PROVIDERS } from './OAuthIcons';
import type { AuthMode, OAuthProvider } from './useAuthForm';

interface AuthSocialLoginProps {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  loading: boolean;
  onOAuthSignIn: (provider: OAuthProvider) => void;
  onAnonymousSignIn: () => void;
}

export function AuthSocialLogin({
  mode,
  setMode,
  loading,
  onOAuthSignIn,
  onAnonymousSignIn,
}: AuthSocialLoginProps) {
  if (mode === 'forgot') {
    return (
      <div className="mt-6 text-center">
        <p className="text-gray-600 text-sm">Remember your password?</p>
        <button
          onClick={() => setMode('login')}
          disabled={loading}
          className="mt-1 font-semibold text-orange-600 hover:text-orange-700"
        >
          Sign in instead
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-50 px-3 text-gray-500">or continue with</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {OAUTH_PROVIDERS.map(({ id, name, icon: Icon }) => (
            <Button
              key={id}
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOAuthSignIn(id)}
              className="h-11 w-full border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              aria-label={`Sign in with ${name}`}
            >
              <Icon className="h-5 w-5" />
              <span className="ml-2 text-sm font-medium sm:hidden">{name}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-50 px-3 text-gray-500">or</span>
          </div>
        </div>
        <div className="mt-4 text-center">
          <Button
            type="button"
            variant="ghost"
            disabled={loading}
            onClick={onAnonymousSignIn}
            className="w-full h-11 text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 font-medium"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Continuing...</span>
              </div>
            ) : (
              'Continue without account'
            )}
          </Button>
          <p className="mt-2 text-xs text-gray-400">
            Anonymous accounts can be upgraded to full accounts anytime.
          </p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-600 text-sm">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
        </p>
        <button
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          disabled={loading}
          className="mt-1 font-semibold text-orange-600 hover:text-orange-700"
        >
          {mode === 'login' ? 'Create an account' : 'Sign in instead'}
        </button>
      </div>
    </>
  );
}
