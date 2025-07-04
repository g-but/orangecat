'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Bell,
  Search
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigation } from '@/hooks/useNavigation'
import { navigationSections, bottomNavItems, navigationLabels } from '@/config/navigationConfig'
import Image from 'next/image'
import DefaultAvatar from '@/components/ui/DefaultAvatar'
import { DevPerformanceMonitor } from '@/components/dashboard/PerformanceMonitor'
import { NavigationShortcuts } from '@/components/navigation/NavigationShortcuts'
import { HeaderCreateButton } from '@/components/dashboard/SmartCreateButton'
import UserProfileDropdown from '@/components/ui/UserProfileDropdown'
import Logo from '@/components/layout/Logo'
import EnhancedSearchBar from '@/components/search/EnhancedSearchBar'
import MobileSearchModal from '@/components/search/MobileSearchModal'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, profile, hydrated } = useAuth();
  const { 
    navigationState, 
    toggleSidebar, 
    toggleSection, 
    isItemActive, 
    getFilteredSections 
  } = useNavigation(navigationSections);

  // State for hover expansion
  const [isHovered, setIsHovered] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  // Wait for hydration before rendering sidebar content
  if (!hydrated) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
      </div>
    );
  }

  // Determine if sidebar should be expanded (open OR hovered when collapsed)
  const isExpanded = navigationState.isSidebarOpen || (isHovered && !navigationState.isSidebarOpen)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header for authenticated routes */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Logo + Mobile Menu Toggle */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden">
              <Logo />
            </div>
          </div>

          {/* Center: Enhanced Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <EnhancedSearchBar 
              placeholder="Search campaigns, people..."
              className="w-full"
            />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-3">
            {/* Mobile Search Button */}
            <button 
              onClick={() => setShowMobileSearch(true)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <HeaderCreateButton />
            
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            </button>
            
            <UserProfileDropdown />
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {navigationState.isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar - Only for dashboard pages */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 flex flex-col bg-white shadow-lg transition-all duration-300 ease-in-out border-r border-gray-200
          ${navigationState.isSidebarOpen 
            ? 'w-64 translate-x-0' 
            : 'w-64 -translate-x-full lg:w-20 lg:translate-x-0'
          } 
          ${isHovered && !navigationState.isSidebarOpen ? 'lg:w-64' : ''}
          overflow-y-auto`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col h-full">
          {/* User Profile Section */}
          {user && profile && (
            <div className={`px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-100 ${isExpanded ? 'block' : 'hidden lg:flex lg:flex-col lg:items-center'}`}>
              <Link 
                href="/profile/me" 
                className={`flex items-center hover:bg-gray-50 p-2 sm:p-3 rounded-xl transition-all duration-200 group w-full ${isExpanded ? 'space-x-3' : 'lg:flex-col lg:space-y-2 lg:space-x-0'}`}
                onClick={() => {
                  // Close sidebar on mobile when navigating
                  if (navigationState.isSidebarOpen) {
                    toggleSidebar();
                  }
                }}
              >
                <div className="relative">
                  {profile.avatar_url && !avatarError ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.display_name || 'User Avatar'}
                      width={isExpanded ? 40 : 36}
                      height={isExpanded ? 40 : 36}
                      className="rounded-full object-cover transition-all duration-300 group-hover:ring-2 group-hover:ring-tiffany-200"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <DefaultAvatar 
                      size={isExpanded ? 40 : 36} 
                      className="transition-all duration-300 group-hover:ring-2 group-hover:ring-tiffany-200 rounded-full" 
                    />
                  )}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div className={`flex-1 min-w-0 ${isExpanded ? 'block' : 'hidden lg:hidden'}`}>
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-tiffany-700 transition-colors">
                    {profile.display_name || profile.username || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    @{profile.username || 'username'}
                  </p>
                </div>
              </Link>
            </div>
          )}

          {/* Navigation Sections */}
          <nav className="flex-1 px-2 py-3 sm:py-4 space-y-4 sm:space-y-6 overflow-y-auto" aria-label={navigationLabels.MAIN_NAVIGATION}>
            {getFilteredSections().map((section) => {
              const isCollapsed = navigationState.collapsedSections.has(section.id);
              const hasActiveItem = section.items.some(item => isItemActive(item.href));

              return (
                <div key={section.id} className="space-y-1 sm:space-y-2">
                  {/* Section Header */}
                  <div className={`flex items-center justify-between px-3 ${isExpanded ? 'block' : 'hidden lg:hidden'}`}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {section.title}
                    </h3>
                    {section.collapsible && (
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        aria-label={`${navigationLabels.SECTION_TOGGLE} ${section.title}`}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Section Items */}
                  {(!section.collapsible || !isCollapsed || hasActiveItem) && (
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const isActive = isItemActive(item.href);
                        
                        return (
                          <Link
                            key={item.name}
                            href={item.comingSoon ? '#' : item.href}
                            className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative min-h-[44px]
                              ${isActive
                                ? 'bg-gradient-to-r from-tiffany-100 to-tiffany-50 text-tiffany-700 shadow-sm border border-tiffany-200'
                                : item.comingSoon
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                              }
                              ${isExpanded ? '' : 'lg:justify-center'}`}
                            title={isExpanded ? undefined : item.name}
                            onClick={(e) => {
                              if (item.comingSoon) {
                                e.preventDefault();
                              } else if (navigationState.isSidebarOpen) {
                                // Close sidebar on mobile when navigating
                                toggleSidebar();
                              }
                            }}
                            aria-label={item.comingSoon ? `${item.name} - ${navigationLabels.COMING_SOON}` : item.name}
                          >
                            <item.icon className={`h-5 w-5 shrink-0 transition-colors ${isExpanded ? 'mr-3' : 'lg:mr-0'} ${
                              isActive 
                                ? 'text-tiffany-600' 
                                : item.comingSoon 
                                ? 'text-gray-400' 
                                : 'text-gray-400 group-hover:text-gray-600'
                            }`} />
                            
                            <span className={`transition-all duration-200 ${isExpanded ? 'block' : 'hidden lg:hidden'}`}>
                              {item.name}
                            </span>
                            
                            {/* Active indicator */}
                            {isActive && (
                              <div className={`absolute right-3 w-2 h-2 bg-tiffany-500 rounded-full ${isExpanded ? 'block' : 'hidden lg:hidden'}`} />
                            )}
                            
                            {/* Coming soon badge */}
                            {item.comingSoon && isExpanded && (
                              <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                Soon
                              </span>
                            )}
                            
                            {/* Badge */}
                            {item.badge && !item.comingSoon && isExpanded && (
                              <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Bottom Navigation Items */}
          {bottomNavItems.length > 0 && (
            <div className="border-t border-gray-100 p-2 space-y-1">
              {bottomNavItems.map((item) => {
                const isActive = isItemActive(item.href);
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 min-h-[44px]
                      ${isActive
                        ? 'bg-gradient-to-r from-tiffany-100 to-tiffany-50 text-tiffany-700 shadow-sm border border-tiffany-200'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                      ${isExpanded ? '' : 'lg:justify-center'}`}
                    title={isExpanded ? undefined : item.name}
                    onClick={() => {
                      if (navigationState.isSidebarOpen) {
                        toggleSidebar();
                      }
                    }}
                  >
                    <item.icon className={`h-5 w-5 shrink-0 transition-colors ${isExpanded ? 'mr-3' : 'lg:mr-0'} ${
                      isActive 
                        ? 'text-tiffany-600' 
                        : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                    <span className={`transition-all duration-200 ${isExpanded ? 'block' : 'hidden lg:hidden'}`}>
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Toggle Button */}
          <div className="border-t border-gray-100 p-2 hidden lg:block">
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center p-3 text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-xl transition-all duration-200"
              aria-label={navigationState.isSidebarOpen ? navigationLabels.SIDEBAR_COLLAPSE : navigationLabels.SIDEBAR_EXPAND}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out pt-16 ${
        navigationState.isSidebarOpen 
          ? 'lg:ml-64' 
          : 'lg:ml-20'
      }`}>
        <main className="h-full">
          {children}
        </main>
      </div>

      {/* Development Tools */}
      <DevPerformanceMonitor />
      <NavigationShortcuts sections={navigationSections} />

      {/* Mobile Search Modal */}
      <MobileSearchModal 
        isOpen={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
      />
    </div>
  );
} 