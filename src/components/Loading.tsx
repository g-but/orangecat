import React from 'react'
import { Loader2 } from 'lucide-react'

interface Props {
  fullScreen?: boolean
}

export default function Loading({ fullScreen = false }: Props) {
  const containerClasses = fullScreen
    ? 'min-h-screen flex items-center justify-center'
    : 'flex items-center justify-center'

  return (
    <div className={containerClasses} suppressHydrationWarning>
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-tiffany-500" />
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  )
} 