'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigation } from '@/hooks/useNavigation'
import { navigationSections, bottomNavItems, navigationLabels } from '@/config/navigationConfig'
import Image from 'next/image'
import DefaultAvatar from '@/components/ui/DefaultAvatar'
import { DevPerformanceMonitor } from '@/components/dashboard/PerformanceMonitor'
import { NavigationShortcuts } from '@/components/navigation/NavigationShortcuts'

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
      {/* Mobile overlay */}
      {navigationState.isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white shadow-lg transition-all duration-300 ease-in-out border-r border-gray-200
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
          {/* Logo and Brand */}
          <div className={`p-3 sm:p-4 border-b border-gray-100 ${isExpanded ? 'flex items-center space-x-3' : 'flex flex-col lg:items-center py-4'}`}>
            <Link href="/dashboard" className="flex items-center shrink-0 group">
              <div className="relative">
                <Image
                  src="/images/orange-cat-logo.svg"
                  alt="Orangecat Logo"
                  width={isExpanded ? 36 : 32}
                  height={isExpanded ? 36 : 32}
                  className="transition-all duration-300 group-hover:scale-105"
                />
                <div className={`absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse ${isExpanded ? 'hidden' : 'hidden lg:block'}`} />
              </div>
              <span className={`ml-2 text-lg sm:text-xl font-semibold text-tiffany-600 group-hover:text-tiffany-700 transition-colors ${isExpanded ? 'block' : 'hidden lg:hidden'}`}>
                Orangecat
              </span>
            </Link>
            {/* Mobile close button */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden ml-auto p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

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
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.display_name || 'User Avatar'}
                      width={isExpanded ? 40 : 36}
                      height={isExpanded ? 40 : 36}
                      className="rounded-full object-cover transition-all duration-300 group-hover:ring-2 group-hover:ring-tiffany-200"
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
                                ? 'text-gray-300'
                                : 'text-gray-500 group-hover:text-gray-700'
                            }`} />
                            
                            <div className={`flex-1 flex items-center justify-between min-w-0 ${isExpanded ? 'block' : 'hidden lg:hidden'}`}>
                              <span className="truncate">{item.name}</span>
                              <div className="flex items-center space-x-2 ml-2">
                                {item.badge && !item.comingSoon && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                    {item.badge}
                                  </span>
                                )}
                                {item.comingSoon && (
                                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium flex items-center">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Soon
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Tooltip for collapsed desktop sidebar - only show when not hovered */}
                            {!isHovered && (
                              <div className={`absolute left-16 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none ${isExpanded ? 'hidden' : 'hidden lg:block'}`}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{item.name}</span>
                                  {item.description && (
                                    <span className="text-gray-300 text-xs mt-1">{item.description}</span>
                                  )}
                                  {item.comingSoon && (
                                    <span className="text-orange-300 text-xs mt-1">Coming Soon</span>
                                  )}
                                </div>
                                <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                              </div>
                            )}

                            {/* Active indicator */}
                            {isActive && (
                              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-tiffany-600 rounded-r-full" />
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
        </div>

        {/* Bottom Navigation & Controls */}
        <div className="border-t border-gray-100 p-2 space-y-2">
          {/* Public Site Link */}
          <div className="mb-2">
            <Link
              href="/"
              className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 min-h-[44px] text-gray-600 hover:bg-gray-50 hover:text-orange-600"
              title={isExpanded ? undefined : "Visit Public Site"}
            >
              <svg className={`h-5 w-5 shrink-0 ${isExpanded ? 'mr-3' : 'lg:mr-0'} transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
              <span className={`truncate ${isExpanded ? 'block' : 'hidden lg:hidden'}`}>Public Site</span>
              
              {/* Tooltip for collapsed desktop sidebar */}
              {!isHovered && (
                <div className={`absolute left-16 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none ${isExpanded ? 'hidden' : 'hidden lg:block'}`}>
                  <div className="flex flex-col">
                    <span className="font-medium">Public Site</span>
                    <span className="text-gray-300 text-xs mt-1">Visit public pages with full header</span>
                  </div>
                  <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
              )}
            </Link>
          </div>

          {/* Bottom Navigation Items */}
          <nav className="space-y-1" aria-label={navigationLabels.BOTTOM_NAVIGATION}>
            {bottomNavItems.map((item) => {
              const isActive = isItemActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 min-h-[44px]
                    ${isActive
                      ? 'bg-gradient-to-r from-tiffany-100 to-tiffany-50 text-tiffany-700 shadow-sm'
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
                  <item.icon className={`h-5 w-5 shrink-0 ${isExpanded ? 'mr-3' : 'lg:mr-0'} ${
                    isActive ? 'text-tiffany-600' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  <span className={`truncate ${isExpanded ? 'block' : 'hidden lg:hidden'}`}>{item.name}</span>
                  
                  {/* Tooltip for collapsed desktop sidebar - only show when not hovered */}
                  {!isHovered && (
                    <div className={`absolute left-16 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none ${isExpanded ? 'hidden' : 'hidden lg:block'}`}>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.name}</span>
                        {item.description && (
                          <span className="text-gray-300 text-xs mt-1">{item.description}</span>
                        )}
                      </div>
                      <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Toggle */}
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-3 rounded-xl transition-all duration-200 group min-h-[44px]"
            title={navigationState.isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            aria-label={navigationLabels.SIDEBAR_TOGGLE}
          >
            <X className={`h-5 w-5 group-hover:rotate-90 transition-transform ${isExpanded ? 'block' : 'hidden lg:hidden'}`} />
            <Menu className={`h-5 w-5 group-hover:scale-110 transition-transform ${isExpanded ? 'hidden' : 'block lg:block'}`} />
            <span className="sr-only">{navigationState.isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`min-h-screen transition-all duration-300 ease-in-out lg:ml-20 ${navigationState.isSidebarOpen ? 'lg:ml-64' : ''} ${isHovered && !navigationState.isSidebarOpen ? 'lg:ml-64' : ''} flex flex-col`}>
        {/* Mobile Header */}
        <header className="lg:hidden bg-white shadow-sm sticky top-0 z-30 border-b border-gray-200">
          <div className="px-4 py-3 flex items-center justify-between min-h-[60px]">
            <Link href="/dashboard" className="flex items-center shrink-0">
              <Image src="/images/orange-cat-logo.svg" alt="Orangecat" width={32} height={32} />
              <span className="ml-2 text-lg font-semibold text-tiffany-600">Orangecat</span>
            </Link>
            <button 
              onClick={toggleSidebar} 
              className="text-gray-500 focus:outline-none hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={navigationLabels.SIDEBAR_TOGGLE}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </header>
        
        {/* Main Content Area */}
        <div className="flex-1 pt-4 lg:pt-6 pb-6 px-4 sm:px-6 lg:px-8 bg-gray-50">
          {children}
        </div>
      </main>
      
      {/* Development Performance Monitor */}
      <DevPerformanceMonitor />
      
      {/* Navigation Keyboard Shortcuts */}
      <NavigationShortcuts sections={navigationSections} />
    </div>
  )
} 