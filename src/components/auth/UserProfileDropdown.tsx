'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronDown, User, Settings, LogOut, CheckCircle2, Handshake, ExternalLink, BarChart3 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'
import DefaultAvatar from '@/components/ui/DefaultAvatar'

export default function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | HTMLAnchorElement | null)[]>([])
  const { user, profile, session } = useAuth()
  const { signOut: storeSignOut } = useAuthStore()
  const router = useRouter()

  // Menu items configuration
  const menuItems = [
    {
      label: 'Dashboard',
      icon: BarChart3,
      href: '/dashboard',
      description: 'Overview and analytics'
    },
    {
      label: 'Fundraising',
      icon: Handshake,
      href: '/dashboard/fundraising',
      description: 'Manage your campaigns'
    },
    {
      label: 'Edit Profile',
      icon: Settings,
      href: '/profile',
      description: 'Update your information'
    }
  ]

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case 'Escape':
          setIsOpen(false)
          setFocusedIndex(-1)
          buttonRef.current?.focus()
          break
        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex(prev => {
            const nextIndex = prev < menuItems.length ? prev + 1 : 0
            itemRefs.current[nextIndex]?.focus()
            return nextIndex
          })
          break
        case 'ArrowUp':
          event.preventDefault()
          setFocusedIndex(prev => {
            const nextIndex = prev > 0 ? prev - 1 : menuItems.length
            itemRefs.current[nextIndex]?.focus()
            return nextIndex
          })
          break
        case 'Tab':
          if (event.shiftKey && focusedIndex === 0) {
            setIsOpen(false)
            setFocusedIndex(-1)
          } else if (!event.shiftKey && focusedIndex === menuItems.length) {
            setIsOpen(false)
            setFocusedIndex(-1)
          }
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, focusedIndex, menuItems.length])

  const handleSignOut = async () => {
    setIsOpen(false)
    setFocusedIndex(-1)
    
    try {
      const loadingToast = toast.loading('Signing out...')
      
      const { error } = await storeSignOut()
      
      if (error) {
        toast.dismiss(loadingToast)
        toast.error(`Sign out error: ${error}`)
        console.error('Error during sign out:', error)
        return
      }
      
      toast.dismiss(loadingToast)
      toast.success('Successfully signed out')
      
      window.location.href = '/auth/signout'
    } catch (error) {
      console.error('Error during sign out:', error)
      toast.error('Failed to sign out. Please try again.')
    }
  }

  const handleNavigation = (path: string) => {
    setIsOpen(false)
    setFocusedIndex(-1)
    router.push(path)
  }

  const handlePublicProfileClick = () => {
    const username = profile?.username
    if (username) {
      handleNavigation(`/profile/${username}`)
    } else {
      toast.error('Please set up your username first')
      handleNavigation('/profile')
    }
  }

  const handleTriggerClick = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setFocusedIndex(-1)
    }
  }

  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsOpen(true)
      setFocusedIndex(0)
      setTimeout(() => {
        itemRefs.current[0]?.focus()
      }, 50)
    }
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
  const username = profile?.username

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        className="flex items-center space-x-2 text-gray-700 hover:text-tiffany-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-tiffany-400 focus:ring-offset-1 rounded-lg px-2 py-1"
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
              className="rounded-full object-cover border-2 border-orange-200 transition-all duration-200 hover:border-tiffany-300"
            />
          ) : (
            <DefaultAvatar size={32} className="border-2 border-orange-200 transition-all duration-200 hover:border-tiffany-300" />
          )}
          {/* Status indicator */}
          <span className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm">
            <CheckCircle2 className="w-3 h-3 text-tiffany-500" aria-label="Online" />
          </span>
        </span>
        <span className="font-medium max-w-[120px] truncate">Hi, {firstName}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ease-out ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-72 rounded-xl shadow-xl bg-white ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200 origin-top-right"
          role="menu"
          aria-orientation="vertical"
          aria-label="User menu"
        >
          {/* User Info Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="relative">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={48}
                    height={48}
                    className="rounded-full object-cover border-2 border-orange-200"
                  />
                ) : (
                  <DefaultAvatar size={48} className="border-2 border-orange-200" />
                )}
                <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-tiffany-500" />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <button
                  onClick={handlePublicProfileClick}
                  className="group flex items-center space-x-1 hover:text-tiffany-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-tiffany-400 focus:ring-offset-1 rounded"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-tiffany-600 transition-colors duration-200 truncate">
                    {displayName}
                  </h3>
                  <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-tiffany-500 transition-colors duration-200 opacity-0 group-hover:opacity-100" />
                </button>
                {username && (
                  <p className="text-sm text-gray-500">@{username}</p>
                )}
                {email && (
                  <p className="text-xs text-gray-400 truncate">{email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2" role="none">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  ref={(el) => {
                    itemRefs.current[index] = el
                  }}
                  onClick={() => handleNavigation(item.href)}
                  onFocus={() => setFocusedIndex(index)}
                  role="menuitem"
                  tabIndex={isOpen ? 0 : -1}
                  className={`
                    w-full flex items-center px-4 py-3 text-sm transition-all duration-200 group outline-none
                    hover:bg-gray-50 focus:bg-gray-50 focus:ring-2 focus:ring-tiffany-400 focus:ring-inset
                    ${focusedIndex === index ? 'bg-gray-50' : ''}
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-white group-hover:shadow-sm group-focus:bg-white group-focus:shadow-sm transition-all duration-200 mr-3">
                    <Icon className="w-4 h-4 text-gray-600 group-hover:text-tiffany-600 group-focus:text-tiffany-600 transition-colors duration-200" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 group-hover:text-tiffany-600 group-focus:text-tiffany-600 transition-colors duration-200">
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-gray-600 group-focus:text-gray-600 transition-colors duration-200">
                      {item.description}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Separator */}
          <div className="border-t border-gray-100 my-1" />

          {/* Sign Out */}
          <div className="py-2">
            <button
              ref={(el) => {
                itemRefs.current[menuItems.length] = el
              }}
              onClick={handleSignOut}
              onFocus={() => setFocusedIndex(menuItems.length)}
              role="menuitem"
              tabIndex={isOpen ? 0 : -1}
              className={`
                w-full flex items-center px-4 py-3 text-sm transition-all duration-200 group outline-none
                hover:bg-red-50 focus:bg-red-50 focus:ring-2 focus:ring-red-400 focus:ring-inset
                ${focusedIndex === menuItems.length ? 'bg-red-50' : ''}
              `}
            >
              <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 group-focus:bg-red-200 transition-all duration-200 mr-3">
                <LogOut className="w-4 h-4 text-red-600 transition-transform duration-200 group-hover:scale-110 group-focus:scale-110" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-red-600 group-hover:text-red-700 group-focus:text-red-700 transition-colors duration-200">
                  Sign Out
                </div>
                <div className="text-xs text-red-500 group-hover:text-red-600 group-focus:text-red-600 transition-colors duration-200">
                  End your session
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 