'use client'
import React, { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ContextualLoader } from '@/components/navigation/ContextualLoader'
import { cn } from '@/lib/utils'

interface Props {
  fullScreen?: boolean
  message?: string
  size?: 'small' | 'medium' | 'large'
  overlay?: boolean
  className?: string
  contextual?: boolean
}

export default function Loading({
  fullScreen = false,
  message = 'Loading...',
  size = 'medium',
  overlay = false,
  className = '',
  contextual = false
}: Props) {
  // Size mapping
  const sizeClasses = {
    small: 'h-5 w-5',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  }

  // Container classes
  const containerClasses = fullScreen
    ? 'min-h-screen flex items-center justify-center'
    : 'flex items-center justify-center ' + className
  
  // Overlay classes
  const overlayClasses = overlay 
    ? 'fixed inset-0 bg-black/30 backdrop-blur-sm z-loading flex items-center justify-center'
    : ''

  // Show contextual loader for better UX during navigation
  if (contextual && fullScreen) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        overlay ? "fixed inset-0 bg-white/95 backdrop-blur-sm z-loading" : "",
        className
      )} suppressHydrationWarning>
        <ContextualLoader />
      </div>
    );
  }

  const content = (
    <div className="flex flex-col items-center space-y-3" suppressHydrationWarning>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-tiffany-500`} />
      {message && <p className="text-sm text-gray-600 font-sans">{message}</p>}
    </div>
  )

  if (overlay) {
    return (
      <div className={overlayClasses} suppressHydrationWarning>
        {content}
      </div>
    )
  }

  return (
    <div className={containerClasses} suppressHydrationWarning>
      {content}
    </div>
  )
}

export function GlobalAuthErrorBanner() {
  const { authError, setAuthError } = useAuth();

  useEffect(() => {
    if (authError) {
    }
  }, [authError]);

  if (!authError) {return null;}

  return (
    <div className="fixed top-0 left-0 right-0 z-toast bg-red-600 text-white text-center py-3 shadow-lg animate-fade-in-up">
      <span>{authError}</span>
      <button
        className="ml-4 px-3 py-1 bg-white text-red-600 rounded hover:bg-gray-100 transition-colors duration-150"
        onClick={() => {
          setAuthError(null);
          // Error dismissed by user
        }}
      >
        Dismiss
      </button>
    </div>
  );
}

// Global loading overlay tied to auth store – shows a semi-transparent overlay
// with spinner whenever the auth store is in a loading state *after* hydration.
// This keeps the header / layout visible while conveying progress.
export function GlobalAuthLoader() {
  const { isLoading, hydrated } = useAuth();

  if (!hydrated || !isLoading) {return null;}

  return (
    <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-loading flex items-center justify-center pointer-events-none">
      <Loader2 className="h-10 w-10 animate-spin text-tiffany-500" />
    </div>
  );
} 