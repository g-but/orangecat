'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { logger } from '@/utils/logger';

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  context: string;
}

export function RouteError({ error, reset, context }: RouteErrorProps) {
  useEffect(() => {
    logger.error(
      `${context} error boundary caught error`,
      { error: error.message, digest: error.digest },
      context
    );
  }, [error, context]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
        There was a problem loading this page. Please try again.
      </p>

      {/* Error details (development only) */}
      {process.env.NODE_ENV === 'development' && error.message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-md w-full">
          <p className="text-sm font-mono text-red-800 break-words">{error.message}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-tiffany text-white hover:bg-tiffany-dark transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <Home className="h-4 w-4" />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
