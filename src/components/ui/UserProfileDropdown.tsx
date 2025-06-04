'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronDown, User, Settings, LogOut, CheckCircle2, Handshake, ExternalLink, BarChart3 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth'
import { useDropdown } from '@/hooks/useDropdown'
import { toast } from 'sonner'
import DefaultAvatar from '@/components/ui/DefaultAvatar'

export interface UserProfileDropdownProps {
  variant?: 'simple' | 'advanced'
  showAvatar?: boolean
  showDescriptions?: boolean
  showUserInfo?: boolean
  className?: string
}

interface MenuItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  description?: string
}

export default function UserProfileDropdown({
  variant = 'advanced',
  showAvatar = true,
  showDescriptions = true,
  showUserInfo = true,
  className = ''
}: UserProfileDropdownProps) {
  const { user, profile, session } = useAuth()
  const { signOut: storeSignOut } = useAuthStore()
  const router = useRouter()

  // Menu items configuration
  const menuItems: MenuItem[] = [
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

  const {
    isOpen,
    focusedIndex,
    dropdownRef,
    buttonRef,
    itemRefs,
    toggle,
    close,
    setFocusedIndex,
    handleTriggerKeyDown
  } = useDropdown({
    closeOnRouteChange: true,
    keyboardNavigation: variant === 'advanced',
    itemCount: menuItems.length
  })

  const handleSignOut = async () => {
    close()
    
    try {
      if (variant === 'advanced') {
        const loadingToast = toast.loading('Signing out...')
        
        const { error } = await storeSignOut()
        
        if (error) {
          toast.dismiss(loadingToast)
          toast.error(`Sign out error: ${error}`)
          return
        }
        
        toast.dismiss(loadingToast)
        toast.success('Successfully signed out')
      } else {
        // Simple variant - direct signout
        await storeSignOut()
      }
      
      window.location.href = '/auth/signout'
    } catch (error) {
      if (variant === 'advanced') {
        toast.error('Failed to sign out. Please try again.')
      }
      console.error('Error during sign out:', error)
    }
  }

  const handleNavigation = (path: string) => {
    close()
    router.push(path)
  }

  const handlePublicProfileClick = () => {
    const username = profile?.username
    if (username) {
      handleNavigation(`/profile/${username}`)
    } else {
      if (variant === 'advanced') {
        toast.error('Please set up your username first')
      }
      handleNavigation('/profile')
    }
  }

  // Guard clause - don't render if no user
  if (!user && !session) {
    return null
  }

  // User display logic
  const avatarUrl = profile?.avatar_url
  const email = user?.email || session?.user?.email || ''
  const displayName = profile?.display_name || profile?.username || user?.user_metadata?.full_name || email.split('@')[0] || 'User'
  const firstName = displayName.split(' ')[0]
  const username = profile?.username

  // Simple variant rendering
  if (variant === 'simple') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          ref={buttonRef}
          onClick={toggle}
          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
        >
          <span className="text-sm font-medium">{displayName}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1" role="menu" aria-orientation="vertical">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavigation(item.href)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    role="menuitem"
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </button>
                )
              })}
              <hr className="my-1 border-gray-100" />
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                role="menuitem"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Advanced variant rendering
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={toggle}
        onKeyDown={handleTriggerKeyDown}
        className="flex items-center space-x-3 text-gray-700 hover:text-tiffany-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-tiffany-400 focus:ring-offset-1 rounded-lg px-3 py-2 min-h-[44px]"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="User menu"
      >
        {showAvatar && (
          <span className="relative">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={36}
                height={36}
                className="rounded-full object-cover border-2 border-orange-200 transition-all duration-200 hover:border-tiffany-300"
              />
            ) : (
              <DefaultAvatar size={36} className="border-2 border-orange-200 transition-all duration-200 hover:border-tiffany-300" />
            )}
            <span className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-tiffany-500" aria-label="Online" />
            </span>
          </span>
        )}
        <span className="font-medium text-base max-w-[140px] truncate">Hi, {firstName}</span>
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
          {showUserInfo && (
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
          )}

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
                >
                  <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-white group-hover:shadow-sm group-focus:bg-white group-focus:shadow-sm transition-all duration-200 mr-3">
                    <Icon className="w-4 h-4 text-gray-600 group-hover:text-tiffany-600 group-focus:text-tiffany-600 transition-colors duration-200" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 group-hover:text-tiffany-600 group-focus:text-tiffany-600 transition-colors duration-200">
                      {item.label}
                    </div>
                    {showDescriptions && (
                      <div className="text-xs text-gray-500 group-hover:text-gray-600 group-focus:text-gray-600 transition-colors duration-200">
                        {item.description}
                      </div>
                    )}
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
                {showDescriptions && (
                  <div className="text-xs text-red-500 group-hover:text-red-600 group-focus:text-red-600 transition-colors duration-200">
                    End your session
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 