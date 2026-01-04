'use client';

import { logger } from '@/utils/logger';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, RefreshCw, ArrowLeft } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to console for debugging
    logger.error('Application error:', error);
  }, [error]);

  // Check if it's an authentication error
  const isAuthError =
    error.message?.toLowerCase().includes('auth') ||
    error.message?.toLowerCase().includes('login') ||
    error.message?.toLowerCase().includes('unauthorized');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white px-4">
      <div className="max-w-lg w-full space-y-8 p-8 bg-white rounded-xl shadow-xl border border-orange-100">
        {/* Icon */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">⚠️</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Oops! Something went wrong</h2>
          {isAuthError ? (
            <p className="mt-3 text-base text-gray-600">
              It looks like you need to be logged in to access this page.
            </p>
          ) : (
            <p className="mt-3 text-base text-gray-600">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>
          )}
        </div>

        {/* Error details (only in development) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-mono text-red-800 break-words">{error.message}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          {isAuthError ? (
            <Link
              href="/auth"
              className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
              Sign In
            </Link>
          ) : (
            <button
              onClick={reset}
              className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          )}

          <button
            onClick={() => router.back()}
            className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>

          <Link
            href="/"
            className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go to Homepage
          </Link>
        </div>

        {/* Help text */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Still having issues?{' '}
            <Link href="/faq" className="text-orange-600 hover:text-orange-700 font-medium">
              Visit our FAQ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
