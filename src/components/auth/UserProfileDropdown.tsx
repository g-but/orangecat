'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronDown, User, Settings, LogOut, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
// import { createBrowserClient } from '@supabase/ssr' // Remove this
import supabase from '@/services/supabase/client' // Import the shared instance
import { toast } from 'sonner'

// const supabase = createBrowserClient( // Remove this instantiation
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// )

export default function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { user, profile } = useAuth()
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
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown as any)
      return () => document.removeEventListener('keydown', handleKeyDown as any)
    }
  }, [isOpen])

  const handleSignOut = async () => {
    try {
      // The 'supabase' variable here will now refer to the imported shared instance
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Signed out successfully')
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    }
  }

  // Avatar logic
  const avatarUrl = profile?.avatar_url
  const displayName = profile?.display_name || user?.email || 'User'
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
            {!avatarUrl && (
              <div className="text-xs text-gray-400 truncate">Logged in as <span className="text-gray-700">{user?.email}</span></div>
            )}
          </div>
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={async () => {
                try {
                  setIsOpen(false)
                  await router.push('/dashboard')
                } catch (err) {
                  console.error('Router push failed, falling back to window.location', err)
                  window.location.href = '/dashboard'
                }
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 focus:bg-orange-100 focus:outline-none"
              role="menuitem"
              tabIndex={0}
            >
              <User className="h-4 w-4 mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => {
                router.push('/edit-profile')
                setIsOpen(false)
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 focus:bg-orange-100 focus:outline-none"
              role="menuitem"
              tabIndex={0}
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-orange-50 focus:bg-orange-100 focus:outline-none"
              role="menuitem"
              tabIndex={0}
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