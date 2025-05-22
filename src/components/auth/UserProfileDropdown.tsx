'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronDown, User, Settings, LogOut, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'

export default function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { user, profile, session } = useAuth()
  const { signOut: storeSignOut } = useAuthStore()
  const router = useRouter()

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on Esc
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown as any)
      return () => document.removeEventListener('keydown', handleKeyDown as any)
    }
  }, [isOpen])

  const handleSignOut = async () => {
    setIsOpen(false)
    
    try {
      // Show loading toast
      const loadingToast = toast.loading('Signing out...')
      
      // Client-side auth store cleanup
      const { error } = await storeSignOut()
      
      if (error) {
        toast.dismiss(loadingToast)
        toast.error(`Sign out error: ${error}`)
        console.error('Error during sign out:', error)
        return
      }
      
      // Server-side complete signout for cookie cleanup
      toast.dismiss(loadingToast)
      toast.success('Successfully signed out')
      
      // Use the server-side route for complete signout
      window.location.href = '/auth/signout'
    } catch (error) {
      console.error('Error during sign out:', error)
      toast.error('Failed to sign out. Please try again.')
    }
  }

  const handleNavigation = (path: string) => {
    setIsOpen(false)
    router.push(path)
  }

  // Guard against missing user data
  if (!user && !session) {
    console.error('UserProfileDropdown rendered without user or session')
    return null
  }

  // Avatar logic - with fallbacks for missing data
  const avatarUrl = profile?.avatar_url
  const email = user?.email || session?.user?.email || ''
  const displayName = profile?.display_name || profile?.username || email.split('@')[0] || 'User'
  const firstName = displayName.split(' ')[0]
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center space-x-2 text-gray-700 hover:text-tiffany-600 transition-colors focus:outline-none focus:ring-2 focus:ring-tiffany-400"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="User menu"
      >
        <span className="relative">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={32}
              height={32}
              className="rounded-full object-cover border border-orange-200"
            />
          ) : (
            <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-base">
              {initials}
            </span>
          )}
          {/* Checkmark badge */}
          <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
            <CheckCircle2 className="w-4 h-4 text-tiffany-500" aria-label="Logged in" />
          </span>
        </span>
        <span className="font-medium max-w-[120px] truncate">{displayName}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-3 px-4 border-b border-orange-100">
            <div className="text-sm text-gray-500 mb-1">Hi, <span className="font-semibold text-tiffany-600">{firstName}</span>!</div>
            {email && (
              <div className="text-xs text-gray-400 truncate">Logged in as <span className="text-gray-700">{email}</span></div>
            )}
          </div>
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => handleNavigation('/dashboard')}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 focus:bg-orange-100 focus:outline-none"
              role="menuitem"
            >
              <User className="h-4 w-4 mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => handleNavigation('/profile')}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 focus:bg-orange-100 focus:outline-none"
              role="menuitem"
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
            <div className="border-t border-orange-100 my-1" />
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-orange-50 focus:bg-orange-100 focus:outline-none"
              role="menuitem"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 