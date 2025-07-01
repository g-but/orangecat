'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

// =====================================================================
// 🎯 TOUCH OPTIMIZED COMPONENT INTERFACES
// =====================================================================

interface TouchOptimizedProps {
  children: React.ReactNode
  className?: string
  onTap?: (event: React.TouchEvent | React.MouseEvent) => void
  onDoubleTap?: (event: React.TouchEvent | React.MouseEvent) => void
  onLongPress?: (event: React.TouchEvent | React.MouseEvent) => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  disabled?: boolean
  ripple?: boolean
  haptic?: boolean
  longPressDelay?: number
  swipeThreshold?: number
}

interface SwipeGestureProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  className?: string
}

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  refreshThreshold?: number
  className?: string
}

// =====================================================================
// 🔧 MOBILE UTILITIES
// =====================================================================

// Haptic feedback (iOS Safari and Chrome Android)
function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    // Android vibration
    const patterns = { light: 10, medium: 50, heavy: 100 }
    navigator.vibrate(patterns[type])
  }
  
  // iOS haptic feedback (if available)
  if ('hapticFeedback' in navigator) {
    ;(navigator as any).hapticFeedback?.(type)
  }
}

// Check if device is mobile/touch
function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  )
}

// Visual ripple effect
function createRipple(element: HTMLElement, event: React.TouchEvent | React.MouseEvent) {
  const rect = element.getBoundingClientRect()
  const ripple = document.createElement('span')
  
  const size = Math.max(rect.width, rect.height)
  const x = (event as any).clientX - rect.left - size / 2
  const y = (event as any).clientY - rect.top - size / 2
  
  ripple.style.cssText = `
    position: absolute;
    border-radius: 50%;
    background: rgba(247, 147, 26, 0.3);
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    animation: ripple 0.6s ease-out;
    pointer-events: none;
    z-index: 1;
  `
  
  // Add ripple animation CSS if not already present
  if (!document.getElementById('ripple-styles')) {
    const styles = document.createElement('style')
    styles.id = 'ripple-styles'
    styles.textContent = `
      @keyframes ripple {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(1); opacity: 0; }
      }
    `
    document.head.appendChild(styles)
  }
  
  element.style.position = 'relative'
  element.style.overflow = 'hidden'
  element.appendChild(ripple)
  
  setTimeout(() => {
    ripple.remove()
  }, 600)
}

// =====================================================================
// 🎯 TOUCH OPTIMIZED COMPONENT
// =====================================================================

export function TouchOptimized({
  children,
  className,
  onTap,
  onDoubleTap,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  disabled = false,
  ripple = true,
  haptic = true,
  longPressDelay = 500,
  swipeThreshold = 50,
}: TouchOptimizedProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isPressed, setIsPressed] = useState(false)
  const [lastTap, setLastTap] = useState<number>(0)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)

  // Handle touch start
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled) return
    
    setIsPressed(true)
    const touch = event.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    
    // Start long press timer
    if (onLongPress) {
      const timer = setTimeout(() => {
        if (haptic) hapticFeedback('medium')
        onLongPress(event)
        setLongPressTimer(null)
      }, longPressDelay)
      setLongPressTimer(timer)
    }
  }, [disabled, onLongPress, haptic, longPressDelay])

  // Handle touch end
  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (disabled) return
    
    setIsPressed(false)
    
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    
    // Handle swipe gestures
    if (touchStart) {
      const touch = event.changedTouches[0]
      const deltaX = touch.clientX - touchStart.x
      const deltaY = touch.clientY - touchStart.y
      
      if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (deltaX > 0 && onSwipeRight) {
            if (haptic) hapticFeedback('light')
            onSwipeRight()
          } else if (deltaX < 0 && onSwipeLeft) {
            if (haptic) hapticFeedback('light')
            onSwipeLeft()
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && onSwipeDown) {
            if (haptic) hapticFeedback('light')
            onSwipeDown()
          } else if (deltaY < 0 && onSwipeUp) {
            if (haptic) hapticFeedback('light')
            onSwipeUp()
          }
        }
        setTouchStart(null)
        return
      }
    }
    
    // Handle tap/double tap
    const now = Date.now()
    const timeDiff = now - lastTap
    
    if (timeDiff < 300 && onDoubleTap) {
      // Double tap
      if (haptic) hapticFeedback('medium')
      onDoubleTap(event)
      setLastTap(0)
    } else if (onTap) {
      // Single tap
      if (haptic) hapticFeedback('light')
      if (ripple && elementRef.current) {
        createRipple(elementRef.current, event)
      }
      onTap(event)
      setLastTap(now)
    }
    
    setTouchStart(null)
  }, [disabled, longPressTimer, touchStart, swipeThreshold, onSwipeRight, onSwipeLeft, onSwipeDown, onSwipeUp, haptic, lastTap, onDoubleTap, onTap, ripple])

  // Handle mouse events for desktop
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled || isTouchDevice()) return
    setIsPressed(true)
  }, [disabled])

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    if (disabled || isTouchDevice()) return
    setIsPressed(false)
    
    if (onTap) {
      if (ripple && elementRef.current) {
        createRipple(elementRef.current, event)
      }
      onTap(event)
    }
  }, [disabled, onTap, ripple])

  return (
    <div
      ref={elementRef}
      className={cn(
        'select-none transition-all duration-150',
        isPressed && 'scale-95 opacity-80',
        !disabled && 'cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={{
        WebkitTapHighlightColor: 'transparent',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  )
}

// =====================================================================
// 🎯 SWIPE GESTURE COMPONENT
// =====================================================================

export function SwipeGesture({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className,
}: SwipeGestureProps) {
  return (
    <TouchOptimized
      className={className}
      onSwipeLeft={onSwipeLeft}
      onSwipeRight={onSwipeRight}
      onSwipeUp={onSwipeUp}
      onSwipeDown={onSwipeDown}
      swipeThreshold={threshold}
      ripple={false}
      haptic={true}
    >
      {children}
    </TouchOptimized>
  )
}

// =====================================================================
// 🎯 PULL TO REFRESH COMPONENT
// =====================================================================

export function PullToRefresh({
  children,
  onRefresh,
  refreshThreshold = 80,
  className,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [startY, setStartY] = useState<number | null>(null)

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    setStartY(event.touches[0].clientY)
  }, [])

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (startY === null || isRefreshing) return
    
    const currentY = event.touches[0].clientY
    const distance = currentY - startY
    
    // Only allow pull down when at top of scroll
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance, refreshThreshold * 1.5))
      event.preventDefault()
    }
  }, [startY, isRefreshing, refreshThreshold])

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= refreshThreshold && !isRefreshing) {
      setIsRefreshing(true)
      hapticFeedback('medium')
      
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
    setStartY(null)
  }, [pullDistance, refreshThreshold, isRefreshing, onRefresh])

  const pullProgress = Math.min(pullDistance / refreshThreshold, 1)

  return (
    <div className={className}>
      {/* Pull indicator */}
      {pullDistance > 0 && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-orange-50 transition-all duration-300"
          style={{
            height: `${pullDistance}px`,
            opacity: pullProgress,
          }}
        >
          <div className="flex items-center space-x-2 text-orange-600">
            <svg
              className={cn(
                'w-5 h-5 transition-transform duration-300',
                pullProgress >= 1 ? 'rotate-180' : 'rotate-0'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-sm font-medium">
              {pullProgress >= 1 
                ? isRefreshing ? 'Refreshing...' : 'Release to refresh'
                : 'Pull to refresh'
              }
            </span>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// =====================================================================
// 🎯 MOBILE UTILITIES EXPORT
// =====================================================================

export const MobileUtils = {
  isTouchDevice,
  hapticFeedback,
} 