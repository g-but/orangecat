import React from 'react'

interface Props {
  fullScreen?: boolean
}

export default function Loading({ fullScreen = false }: Props) {
  const containerClasses = fullScreen
    ? 'min-h-screen flex items-center justify-center'
    : 'flex items-center justify-center'

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  )
} 