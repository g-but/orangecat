import React from 'react'
import { Loader2 } from 'lucide-react'

interface Props {
  fullScreen?: boolean
  message?: string
  size?: 'small' | 'medium' | 'large'
  overlay?: boolean
  className?: string
}

export default function Loading({
  fullScreen = false,
  message = 'Loading...',
  size = 'medium',
  overlay = false,
  className = ''
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
    ? 'fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center'
    : ''

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