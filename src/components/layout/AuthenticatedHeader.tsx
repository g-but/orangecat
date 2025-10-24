'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Bell, Plus, Search } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import DefaultAvatar from '@/components/ui/DefaultAvatar'
import { HeaderCreateButton } from '@/components/dashboard/SmartCreateButton'
import EnhancedSearchBar from '@/components/search/EnhancedSearchBar'
import MobileSearchModal from '@/components/search/MobileSearchModal'

export default function AuthenticatedHeader() {
  const { user, profile } = useAuth()
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 h-12 flex items-center px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center justify-between w-full max-w-full">
        {/* Left: Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2 shrink-0">
          <Image 
            src="/images/orange-cat-logo.svg" 
            alt="Orangecat" 
            width={24} 
            height={24}
            className="shrink-0"
          />
          <span className="text-lg font-semibold text-tiffany-600 hidden sm:block">
            Orangecat
          </span>
        </Link>

        {/* Center: Enhanced Search Bar */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <EnhancedSearchBar 
            placeholder="Search projects, people..."
            className="w-full"
          />
        </div>

        {/* Right: Quick Actions & User */}
        <div className="flex items-center space-x-3">
          {/* Mobile Search Button */}
          <button 
            onClick={() => setShowMobileSearch(true)}
            className="md:hidden p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Create Button */}
          <HeaderCreateButton />

          {/* Notifications */}
          <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="h-4 w-4" />
          </button>

          {/* User Avatar */}
          {user && profile && (
            <Link 
              href="/profile/me"
              className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg p-1.5 transition-colors"
            >
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.name || 'User Avatar'}
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              ) : (
                <DefaultAvatar size={24} className="rounded-full" />
              )}
              <span className="text-sm font-medium text-gray-700 hidden lg:block max-w-20 truncate">
                {profile.name || profile.username}
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Search Modal */}
      <MobileSearchModal 
        isOpen={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
      />
    </header>
  )
} 