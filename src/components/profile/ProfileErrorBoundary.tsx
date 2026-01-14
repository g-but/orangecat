'use client';
import { logger } from '@/utils/logger';

import React, { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ProfileErrorBoundary Component
 *
 * Catches JavaScript errors in child components and displays a fallback UI.
 * Prevents the entire profile from crashing if a section fails.
 */
export default class ProfileErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    logger.error('Profile section error', { message: error.message, stack: errorInfo.componentStack });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This section couldn't load properly. Try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left text-xs text-gray-500 mb-4 p-3 bg-gray-50 rounded">
                <summary className="cursor-pointer font-semibold mb-2">Error details</summary>
                <pre className="whitespace-pre-wrap">{this.state.error.message}</pre>
              </details>
            )}
            <Button variant="outline" onClick={this.handleReset}>
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight error fallback for less critical sections
 */
export function LightErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-orange-900 font-medium">Failed to load this section</p>
          <p className="text-xs text-orange-700 mt-1">
            Some content couldn't be displayed. The rest of the profile is still available.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs text-orange-600 hover:text-orange-700 font-medium mt-2 underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
