'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TooltipProviderProps {
  children: React.ReactNode
  delayDuration?: number
}

interface TooltipProps {
  children: React.ReactNode
}

interface TooltipTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

interface TooltipContentProps {
  children: React.ReactNode
  className?: string
  sideOffset?: number
}

const TooltipContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {},
})

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>
}

export function Tooltip({ children }: TooltipProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </TooltipContext.Provider>
  )
}

export function TooltipTrigger({ children }: TooltipTriggerProps) {
  const { setOpen } = React.useContext(TooltipContext)

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      className="inline-block"
    >
      {children}
    </div>
  )
}

export function TooltipContent({ children, className, sideOffset = 4 }: TooltipContentProps) {
  const { open } = React.useContext(TooltipContext)

  if (!open) {return null}

  return (
    <div
      className={cn(
        'absolute z-50 overflow-hidden rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white',
        'animate-in fade-in-0 zoom-in-95',
        'bottom-full left-1/2 -translate-x-1/2 mb-2',
        className
      )}
      style={{ marginBottom: sideOffset }}
    >
      {children}
    </div>
  )
}
