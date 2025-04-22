'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { User, Settings, LogOut, LayoutDashboard } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function UserProfileDropdown() {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0]

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      onClick: () => {
        router.push('/dashboard')
        setIsOpen(false)
      }
    },
    {
      label: 'Edit Profile',
      icon: Settings,
      onClick: () => {
        router.push('/edit-profile')
        setIsOpen(false)
      }
    },
    {
      label: 'Sign Out',
      icon: LogOut,
      onClick: handleSignOut
    }
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        className="flex items-center space-x-2 hover:bg-gray-100 px-3 py-2 rounded-full"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-tiffany-100 flex items-center justify-center">
            <User className="h-5 w-5 text-tiffany-600" />
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {displayName || user?.email}
          </span>
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <item.icon className="h-4 w-4 mr-3" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 