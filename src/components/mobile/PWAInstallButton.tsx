'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logger } from '@/utils/logger'

interface PWAInstallButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'banner'
  size?: 'sm' | 'md' | 'lg'
  showBanner?: boolean
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export function PWAInstallButton({ 
  className, 
  variant = 'default',
  size = 'md',
  showBanner = false 
}: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    // Check if already installed
    const checkIfInstalled = () => {
      // Check for PWA display mode
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
        return
      }
      
      // Check for iOS Safari standalone
      if ((navigator as any).standalone === true) {
        setIsInstalled(true)
        return
      }
      
      // Check for Android TWA
      if (document.referrer.startsWith('android-app://')) {
        setIsInstalled(true)
        return
      }
    }

    checkIfInstalled()

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
      
      // Show banner if requested and not shown recently
      const lastBannerShown = localStorage.getItem('pwa-banner-shown')
      const daysSinceLastShown = lastBannerShown 
        ? (Date.now() - parseInt(lastBannerShown)) / (1000 * 60 * 60 * 24)
        : 999
        
      if (showBanner && daysSinceLastShown > 7) {
        setShowInstallBanner(true)
        localStorage.setItem('pwa-banner-shown', Date.now().toString())
      }
    }

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
      setDeferredPrompt(null)
      setShowInstallBanner(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [showBanner])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    setIsInstalling(true)
    
    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      
      
      if (choiceResult.outcome === 'accepted') {
        logger.info('PWA install prompt accepted by user', undefined, 'PWA')
      } else {
        logger.info('PWA install prompt dismissed by user', undefined, 'PWA')
      }
    } catch (error) {
      logger.error('PWA installation failed', { error: error instanceof Error ? error.message : String(error) }, 'PWA')
    } finally {
      setDeferredPrompt(null)
      setCanInstall(false)
      setIsInstalling(false)
      setShowInstallBanner(false)
    }
  }

  const handleBannerDismiss = () => {
    setShowInstallBanner(false)
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString())
  }

  // Don't show if installed or can't install
  if (isInstalled || !canInstall) {
    return null
  }

  // Banner variant
  if (variant === 'banner' && showInstallBanner) {
    return (
      <div className="fixed top-16 left-4 right-4 z-50 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-4 md:max-w-md md:left-auto">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold">Install OrangeCat</h3>
            <p className="text-xs opacity-90 mt-1">
              Add to your home screen for quick access and offline features
            </p>
            <div className="flex space-x-2 mt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="bg-white text-orange-600 hover:bg-gray-100 text-xs px-3 py-1"
              >
                {isInstalling ? (
                  <>
                    <div className="animate-spin w-3 h-3 border border-orange-600 border-t-transparent rounded-full mr-1" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3 mr-1" />
                    Install
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBannerDismiss}
                className="text-white hover:bg-white/20 text-xs px-2 py-1"
              >
                Later
              </Button>
            </div>
          </div>
          <button
            onClick={handleBannerDismiss}
            className="flex-shrink-0 text-white/80 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // Button variant
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3'
  }

  return (
    <Button
      id="pwa-install-btn"
      variant={variant === 'banner' ? 'default' : variant}
      size={size}
      onClick={handleInstallClick}
      disabled={isInstalling}
      className={cn(
        'transition-all duration-200',
        sizeClasses[size],
        className
      )}
    >
      {isInstalling ? (
        <>
          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
          Installing...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Install App
        </>
      )}
    </Button>
  )
}

// iOS Install Instructions Component
export function IOSInstallInstructions({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Install OrangeCat</h3>
          <button onClick={onClose} className="p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4 text-sm">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 font-bold text-xs">1</span>
            </div>
            <p>Tap the <strong>Share</strong> button at the bottom of Safari</p>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 font-bold text-xs">2</span>
            </div>
            <p>Scroll down and tap <strong>"Add to Home Screen"</strong></p>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 font-bold text-xs">3</span>
            </div>
            <p>Tap <strong>"Add"</strong> to install OrangeCat on your home screen</p>
          </div>
        </div>
        
        <Button 
          onClick={onClose} 
          className="w-full mt-6"
          variant="outline"
        >
          Got it
        </Button>
      </div>
    </div>
  )
}

// Hook to detect iOS Safari
export function useIOSSafari() {
  const [isIOSSafari, setIsIOSSafari] = useState(false)

  useEffect(() => {
    const userAgent = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(userAgent)
    const isSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|OPiOS|FxiOS/.test(userAgent)
    const isStandalone = (navigator as any).standalone === true
    
    setIsIOSSafari(isIOS && isSafari && !isStandalone)
  }, [])

  return isIOSSafari
} 