import React, { Component, ReactNode } from 'react';
import Button from '@/components/ui/Button';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  isOnline: boolean;
}

/**
 * Comprehensive error boundary for posting functionality
 * Handles network errors, component crashes, and provides recovery options
 */
export class PostingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isOnline: navigator.onLine,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error for monitoring
    logger.error('PostingErrorBoundary caught an error', { error, errorInfo }, 'Timeline');
  }

  componentDidMount() {
    // Listen for online/offline events
    const handleOnline = () => this.setState({ isOnline: true });
    const handleOffline = () => this.setState({ isOnline: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  handleRetry = () => {
    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
    }));
    this.props.onRetry?.();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Something went wrong with posting
              </h3>

              <div className="text-sm text-red-700 mb-4">
                {!this.state.isOnline ? (
                  <div className="flex items-center gap-2">
                    <WifiOff className="w-4 h-4" />
                    <span>You're offline. Check your connection and try again.</span>
                  </div>
                ) : (
                  <div>
                    <p>We encountered an unexpected error while trying to create your post.</p>
                    {this.state.retryCount > 0 && (
                      <p className="mt-1">Retry attempts: {this.state.retryCount}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {this.state.isOnline && this.state.retryCount < 3 && (
                  <Button
                    onClick={this.handleRetry}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                )}

                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  Start Over
                </Button>

                {!this.state.isOnline && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Wifi className="w-4 h-4" />
                    <span>Will retry when online</span>
                  </div>
                )}
              </div>

              {/* Debug info in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-3 bg-red-100 rounded border">
                  <summary className="cursor-pointer text-sm font-medium text-red-800">
                    Debug Information
                  </summary>
                  <pre className="mt-2 text-xs text-red-700 whitespace-pre-wrap">
                    {this.state.error.message}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function usePostingErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleError = React.useCallback((err: Error) => {
    setError(err);
    logger.error('Posting error', err, 'Timeline');
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    isOnline,
    handleError,
    clearError,
  };
}

// HOC for wrapping components with error boundary
export function withPostingErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <PostingErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </PostingErrorBoundary>
  );

  WrappedComponent.displayName = `withPostingErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
