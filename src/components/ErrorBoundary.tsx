'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from '@/components/ui/Button';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  resetOnPropsChange?: boolean;
  level?: 'page' | 'component' | 'route';
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  eventId?: string;
  retryCount: number;
}

export default class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const eventId = Math.random().toString(36).substring(7);

    logger.error(
      'React Error Boundary caught an error',
      {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        level: this.props.level || 'page',
        eventId,
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      },
      'ErrorBoundary'
    );

    this.setState({
      errorInfo,
      eventId,
    });

    this.props.onError?.(error, errorInfo);

    if (this.props.level === 'component') {
      this.resetTimeoutId = window.setTimeout(() => {
        this.handleReset();
      }, 30000);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, children } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange && prevProps.children !== children) {
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  handleReset = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      eventId: undefined,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const { error, eventId, retryCount } = this.state;
    const {
      level = 'page',
      showDetails = process.env.NODE_ENV === 'development',
      maxRetries = 3,
    } = this.props;
    const canRetry = retryCount < maxRetries;

    if (level === 'component') {
      return (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 my-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Component Error</h3>
              <p className="text-sm text-red-700 mt-1">
                This component encountered an error and could not render properly.
              </p>

              {showDetails && error && (
                <details className="mt-3">
                  <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                    Show details
                  </summary>
                  <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800 font-mono break-all">
                    {error.message}
                    {eventId && <div className="mt-1">Event ID: {eventId}</div>}
                  </div>
                </details>
              )}

              <div className="mt-3">
                {canRetry ? (
                  <Button onClick={this.handleReset} variant="secondary" size="sm">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry ({retryCount}/{maxRetries})
                  </Button>
                ) : (
                  <p className="text-xs text-red-600">
                    Maximum retry attempts reached. Please refresh the page.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>

          <p className="text-gray-600 mb-6">
            We encountered an unexpected error. Our team has been notified.
          </p>

          {showDetails && error && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Error Details:</h3>
              <p className="text-xs text-gray-600 font-mono break-all">{error.message}</p>
              {eventId && <p className="text-xs text-gray-500 mt-2">Event ID: {eventId}</p>}
            </div>
          )}

          <div className="flex gap-3">
            {canRetry ? (
              <Button onClick={this.handleReset} variant="primary" className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again ({retryCount}/{maxRetries})
              </Button>
            ) : (
              <Button onClick={this.handleReload} variant="primary" className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
            )}

            <Button onClick={this.handleGoHome} variant="secondary" className="flex-1">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

// HOC for wrapping components with error boundaries
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: T) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
