'use client';

/**
 * ERROR BOUNDARY WRAPPERS
 *
 * Pre-configured error boundary components for different areas of the app.
 * Uses the base ErrorBoundary component with appropriate settings.
 *
 * Created: 2025-12-27
 * Last Modified: 2025-12-27
 * Last Modified Summary: Initial creation with Timeline, Messaging, Create wrappers
 */

import React, { ReactNode } from 'react';
import ErrorBoundary, { withErrorBoundary } from '@/components/ErrorBoundary';
import { AlertTriangle, RefreshCw, MessageSquare, Layout, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// =====================================================================
// FALLBACK COMPONENTS
// =====================================================================

interface ErrorFallbackProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  onRetry?: () => void;
}

function ErrorFallback({ icon, title, message, onRetry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-sm">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}

// =====================================================================
// TIMELINE ERROR BOUNDARY
// =====================================================================

const TimelineFallback = (
  <ErrorFallback
    icon={<Layout className="w-6 h-6 text-red-600" />}
    title="Timeline Error"
    message="Something went wrong loading your timeline. Please refresh the page to try again."
  />
);

interface TimelineErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}

export function TimelineErrorBoundary({ children, onError }: TimelineErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={TimelineFallback}
      level="component"
      onError={onError ? (error) => onError(error) : undefined}
      maxRetries={2}
    >
      {children}
    </ErrorBoundary>
  );
}

// =====================================================================
// MESSAGING ERROR BOUNDARY
// =====================================================================

const MessagingFallback = (
  <ErrorFallback
    icon={<MessageSquare className="w-6 h-6 text-red-600" />}
    title="Messaging Error"
    message="We couldn't load your messages. Please check your connection and try again."
  />
);

interface MessagingErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}

export function MessagingErrorBoundary({ children, onError }: MessagingErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={MessagingFallback}
      level="component"
      onError={onError ? (error) => onError(error) : undefined}
      maxRetries={3}
    >
      {children}
    </ErrorBoundary>
  );
}

// =====================================================================
// CREATE WORKFLOW ERROR BOUNDARY
// =====================================================================

const CreateWorkflowFallback = (
  <ErrorFallback
    icon={<PlusCircle className="w-6 h-6 text-red-600" />}
    title="Form Error"
    message="Something went wrong with the form. Your data may have been saved - please refresh and check."
  />
);

interface CreateWorkflowErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}

export function CreateWorkflowErrorBoundary({ children, onError }: CreateWorkflowErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={CreateWorkflowFallback}
      level="component"
      onError={onError ? (error) => onError(error) : undefined}
      maxRetries={2}
    >
      {children}
    </ErrorBoundary>
  );
}

// =====================================================================
// GENERIC COMPONENT ERROR BOUNDARY
// =====================================================================

interface ComponentErrorBoundaryProps {
  children: ReactNode;
  name?: string;
  onError?: (error: Error) => void;
}

export function ComponentErrorBoundary({ children, name = 'Component', onError }: ComponentErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <ErrorFallback
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          title={`${name} Error`}
          message={`The ${name.toLowerCase()} encountered an error. Please try again.`}
        />
      }
      level="component"
      onError={onError ? (error) => onError(error) : undefined}
      maxRetries={3}
    >
      {children}
    </ErrorBoundary>
  );
}

// =====================================================================
// HOC WRAPPERS (for easy wrapping of existing components)
// =====================================================================

export const withTimelineErrorBoundary = <T extends object>(Component: React.ComponentType<T>) =>
  withErrorBoundary(Component, {
    fallback: TimelineFallback,
    level: 'component',
    maxRetries: 2,
  });

export const withMessagingErrorBoundary = <T extends object>(Component: React.ComponentType<T>) =>
  withErrorBoundary(Component, {
    fallback: MessagingFallback,
    level: 'component',
    maxRetries: 3,
  });

export const withCreateWorkflowErrorBoundary = <T extends object>(Component: React.ComponentType<T>) =>
  withErrorBoundary(Component, {
    fallback: CreateWorkflowFallback,
    level: 'component',
    maxRetries: 2,
  });

// Re-export base ErrorBoundary and HOC for direct usage
export { default as ErrorBoundary, withErrorBoundary } from '@/components/ErrorBoundary';
