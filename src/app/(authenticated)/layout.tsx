'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  UserCircle,
  Handshake,
  Building,
  Briefcase,
  Settings,
  Edit3,
  Menu,
  X,
  Calendar,
  Users,
  Coins,
  Wallet,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import Footer from '@/components/layout/Footer'
import DefaultAvatar from '@/components/ui/DefaultAvatar'

// Main navigation sections with logical grouping
const mainNavSections = [
  {
    title: "Overview",
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, comingSoon: false },
      { name: 'Public Profile', href: '/profile/me', icon: UserCircle, comingSoon: false },
    ]
  },
  {
    title: "Available",
    items: [
      { name: 'Fundraising', href: '/dashboard/fundraising', icon: Handshake, comingSoon: false },
    ]
  },
  {
    title: "Coming Soon",
    items: [
      { name: 'Organizations', href: '/coming-soon?feature=organizations', icon: Building, comingSoon: true },
      { name: 'Projects', href: '/coming-soon?feature=projects', icon: Briefcase, comingSoon: true },
      { name: 'Events', href: '/coming-soon?feature=events', icon: Calendar, comingSoon: true },
      { name: 'Assets', href: '/coming-soon?feature=assets', icon: Wallet, comingSoon: true },
      { name: 'People', href: '/coming-soon?feature=people', icon: Users, comingSoon: true },
    ]
  }
]

const bottomNavItems = [
 { name: 'Edit Profile', href: '/profile', icon: Edit3, comingSoon: false },
 { name: 'Settings', href: '/settings', icon: Settings, comingSoon: false },
]

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, profile, hydrated, isLoading } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Wait for hydration before rendering sidebar content
  if (!hydrated) {
    return <div className="flex h-screen bg-gray-100 items-center justify-center"><div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" /></div>;
  }

  return (
    <div className="fixed inset-0 flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col justify-between bg-white shadow-lg transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } overflow-y-auto border-r border-gray-200`}
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
                <span className="ml-2 text-xl font-semibold text-tiffany-600">
                  Orangecat
                </span>
              )}
            </Link>
          </div>

          {/* User Avatar and Name */}
          {user && profile && (
            <div className={`px-4 py-3 border-t border-b border-gray-100 ${isSidebarOpen ? '' : 'flex flex-col items-center'}`}>
              <Link href="/profile/me" className={`flex items-center ${isSidebarOpen ? 'space-x-3' : 'flex-col space-y-1'} hover:bg-gray-50 p-2 rounded-lg transition-colors`}>
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.display_name || 'User Avatar'}
                    width={isSidebarOpen ? 40 : 32}
                    height={isSidebarOpen ? 40 : 32}
                    className="rounded-full object-cover transition-all duration-300"
                  />
                ) : (
                  <DefaultAvatar 
                    size={isSidebarOpen ? 40 : 32} 
                    className="transition-all duration-300" 
                  />
                )}
                {isSidebarOpen && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate">
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

          {/* Navigation Links with Sections */}
          <nav className="mt-6 flex-grow px-2 space-y-6">
            {mainNavSections.map((section) => (
              <div key={section.title}>
                {isSidebarOpen && (
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150
                        ${
                          pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                            ? 'bg-tiffany-100 text-tiffany-700 shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }
                        ${isSidebarOpen ? '' : 'justify-center'}`}
                      title={item.name}
                    >
                      <item.icon className={`mr-3 h-5 w-5 shrink-0 ${isSidebarOpen ? '' : 'mr-0'} ${
                        pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) 
                          ? 'text-tiffany-600' 
                          : 'text-gray-500 group-hover:text-gray-700'
                      }`} />
                      {isSidebarOpen && (
                        <>
                          {item.name}
                          {item.comingSoon && (
                            <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                              Soon
                            </span>
                          )}
                        </>
                      )}
                      {!isSidebarOpen && item.comingSoon && (
                        <span className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                          {item.name} (Coming Soon)
                        </span>
                      )}
                      {!isSidebarOpen && !item.comingSoon && (
                        <span className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                          {item.name}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Navigation Links & Toggle */}
        <div className="pb-4 px-2 border-t border-gray-100 pt-4">
          <nav className="space-y-1">
            {bottomNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150
                  ${
                    pathname === item.href
                      ? 'bg-tiffany-100 text-tiffany-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                  ${isSidebarOpen ? '' : 'justify-center'}`}
                title={item.name}
              >
                <item.icon className={`mr-3 h-5 w-5 shrink-0 ${isSidebarOpen ? '' : 'mr-0'} ${
                  pathname === item.href ? 'text-tiffany-600' : 'text-gray-500 group-hover:text-gray-700'
                }`} />
                {isSidebarOpen && (
                  <>
                    {item.name}
                    {item.comingSoon && (
                      <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                        Soon
                      </span>
                    )}
                  </>
                )}
                {!isSidebarOpen && item.comingSoon && (
                  <span className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {item.name} (Coming Soon)
                  </span>
                )}
                {!isSidebarOpen && !item.comingSoon && (
                  <span className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {item.name}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <button
            onClick={toggleSidebar}
            className="mt-4 w-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">{isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-20'} overflow-y-auto flex flex-col min-h-screen`}>
        {/* Mobile Header */}
        <header className="bg-white shadow-sm md:hidden sticky top-0 z-20 border-b border-gray-200">
          <div className="px-4 py-3 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center shrink-0">
              <Image src="/images/orange-cat-logo.svg" alt="Orangecat" width={32} height={32} />
              <span className="ml-2 text-lg font-semibold text-tiffany-600">Orangecat</span>
            </Link>
            <button onClick={toggleSidebar} className="text-gray-500 focus:outline-none hover:text-gray-700">
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </header>
        
        {/* Main Content Area */}
        <div className="flex-1 pt-20 md:pt-24 pb-6 md:pb-8 px-6 md:px-8 bg-gray-50">
          {children}
        </div>
        
        {/* Footer for authenticated pages */}
        <Footer />
      </main>
    </div>
  )
} 