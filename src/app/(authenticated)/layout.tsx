'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  UserCircle,
  Handshake, // Changed from DollarSign for Fundraising Campaigns
  Building,
  Briefcase,
  Settings,
  Edit3,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Bitcoin, // For QR code / public profile
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import Image from 'next/image'
import Button from '@/components/ui/Button' // Assuming you have a Button component

// Sidebar navigation items
const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Public Profile', href: '/profile/me', icon: UserCircle }, // Updated to a more specific path
  { name: 'Organizations', href: '#', icon: Building, comingSoon: true },
  { name: 'Projects', href: '#', icon: Briefcase, comingSoon: true },
  { name: 'Fundraising', href: '#', icon: Handshake, comingSoon: true }, // Changed href to # and marked comingSoon
]

const bottomNavItems = [
 { name: 'Edit Profile', href: '/profile', icon: Edit3, comingSoon: false },
 { name: 'Settings', href: '/settings', icon: Settings, comingSoon: false },
]

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, profile } = useAuthStore()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true) // Default to open on desktop

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col justify-between bg-white shadow-lg transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } overflow-y-auto`}
      >
        <div>
          {/* Logo and User Info */}
          <div className={`p-4 ${isSidebarOpen ? 'flex items-center space-x-3' : 'flex flex-col items-center py-4'}`}>
            <Link href="/dashboard" className="flex items-center shrink-0">
              <Image
                src="/images/orange-cat-logo.svg"
                alt="Orangecat Logo"
                width={isSidebarOpen ? 40 : 32}
                height={isSidebarOpen ? 40 : 32}
                className="transition-all duration-300"
              />
              {isSidebarOpen && (
                <span className="ml-2 text-xl font-semibold text-tiffany-500">
                  Orangecat
                </span>
              )}
            </Link>
          </div>
          
          {/* User Avatar and Name - condensed when sidebar is closed */}
           {user && profile && (
            <div className={`px-4 py-3 border-t border-b border-gray-200 ${isSidebarOpen ? '' : 'flex flex-col items-center'}`}>
              <Link href="/profile/me" className={`flex items-center ${isSidebarOpen ? 'space-x-3' : 'flex-col space-y-1'}`}>
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.display_name || 'User Avatar'}
                    width={isSidebarOpen ? 40 : 32}
                    height={isSidebarOpen ? 40 : 32}
                    className="rounded-full object-cover transition-all duration-300"
                  />
                ) : (
                  <div className={`rounded-full bg-gray-300 flex items-center justify-center ${isSidebarOpen ? 'w-10 h-10' : 'w-8 h-8'} transition-all duration-300`}>
                    <UserCircle className={`text-white ${isSidebarOpen ? 'w-6 h-6' : 'w-5 h-5'}`} />
                  </div>
                )}
                {isSidebarOpen && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {profile.display_name || profile.username || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {profile.username || user.email}
                    </p>
                  </div>
                )}
              </Link>
            </div>
          )}


          {/* Navigation Links */}
          <nav className="mt-6 flex-grow px-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2.5 my-1 text-sm font-medium rounded-md transition-colors duration-150
                  ${
                    pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                      ? 'bg-tiffany-50 text-tiffany-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${item.comingSoon ? 'cursor-not-allowed opacity-50' : ''}
                  ${isSidebarOpen ? '' : 'justify-center'}`}
                onClick={(e) => item.comingSoon && e.preventDefault()}
                title={item.name}
              >
                <item.icon className={`mr-3 h-5 w-5 shrink-0 ${isSidebarOpen ? '' : 'mr-0'} ${
                  pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) ? 'text-tiffany-500' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                {isSidebarOpen && (
                  <>
                  {item.name}
                  {item.comingSoon && (
                    <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      Soon
                    </span>
                  )}
                  </>
                )}
                 {!isSidebarOpen && item.comingSoon && (
                    <span className="absolute left-14 bg-gray-700 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.name} (Soon)
                    </span>
                  )}
                  {!isSidebarOpen && !item.comingSoon && (
                    <span className="absolute left-14 bg-gray-700 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.name}
                    </span>
                  )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Navigation Links & Toggle */}
        <div className="pb-4 px-2">
            <nav className="flex-grow">
                {bottomNavItems.map((item) => (
                <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2.5 my-1 text-sm font-medium rounded-md transition-colors duration-150
                    ${
                        pathname === item.href
                        ? 'bg-tiffany-50 text-tiffany-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${item.comingSoon ? 'cursor-not-allowed opacity-50' : ''}
                    ${isSidebarOpen ? '' : 'justify-center'}`}
                    onClick={(e) => item.comingSoon && e.preventDefault()}
                    title={item.name}
                >
                    <item.icon className={`mr-3 h-5 w-5 shrink-0 ${isSidebarOpen ? '' : 'mr-0'} ${
                    pathname === item.href ? 'text-tiffany-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    {isSidebarOpen && (
                    <>
                    {item.name}
                    {item.comingSoon && (
                        <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        Soon
                        </span>
                    )}
                    </>
                    )}
                    {!isSidebarOpen && item.comingSoon && (
                        <span className="absolute left-14 bg-gray-700 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.name} (Soon)
                        </span>
                    )}
                    {!isSidebarOpen && !item.comingSoon && (
                        <span className="absolute left-14 bg-gray-700 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.name}
                        </span>
                    )}
                </Link>
                ))}
            </nav>
            <button
                onClick={toggleSidebar}
                className="mt-4 w-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-md transition-colors"
                title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
                {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                <span className="sr-only">{isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}</span>
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-x-hidden overflow-y-auto transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header for mobile toggle, could be more sophisticated */}
        <header className="bg-white shadow-sm md:hidden sticky top-0 z-20">
            <div className="px-4 py-3 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center shrink-0">
                    <Image src="/images/orange-cat-logo.svg" alt="Orangecat" width={32} height={32} />
                </Link>
                <button onClick={toggleSidebar} className="text-gray-500 focus:outline-none">
                    {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>
        </header>
        <div className="p-6 md:p-8 pb-24">
          {children}
        </div>
      </main>
    </div>
  )
} 