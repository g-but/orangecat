'use client'

import React from 'react'
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
import Footer from '@/components/layout/Footer'
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

  // Wait for hydration before rendering sidebar content
  if (!hydrated) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col justify-between bg-white shadow-lg transition-all duration-300 ease-in-out ${
          navigationState.isSidebarOpen ? 'w-64' : 'w-20'
        } overflow-y-auto border-r border-gray-200`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and Brand */}
          <div className={`p-4 border-b border-gray-100 ${navigationState.isSidebarOpen ? 'flex items-center space-x-3' : 'flex flex-col items-center py-4'}`}>
            <Link href="/dashboard" className="flex items-center shrink-0 group">
              <div className="relative">
                <Image
                  src="/images/orange-cat-logo.svg"
                  alt="Orangecat Logo"
                  width={navigationState.isSidebarOpen ? 40 : 32}
                  height={navigationState.isSidebarOpen ? 40 : 32}
                  className="transition-all duration-300 group-hover:scale-105"
                />
                {!navigationState.isSidebarOpen && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                )}
              </div>
              {navigationState.isSidebarOpen && (
                <span className="ml-2 text-xl font-semibold text-tiffany-600 group-hover:text-tiffany-700 transition-colors">
                  Orangecat
                </span>
              )}
            </Link>
          </div>

          {/* User Profile Section */}
          {user && profile && (
            <div className={`px-4 py-4 border-b border-gray-100 ${navigationState.isSidebarOpen ? '' : 'flex flex-col items-center'}`}>
              <Link 
                href="/profile/me" 
                className={`flex items-center ${navigationState.isSidebarOpen ? 'space-x-3' : 'flex-col space-y-2'} hover:bg-gray-50 p-3 rounded-xl transition-all duration-200 group`}
              >
                <div className="relative">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.display_name || 'User Avatar'}
                      width={navigationState.isSidebarOpen ? 44 : 36}
                      height={navigationState.isSidebarOpen ? 44 : 36}
                      className="rounded-full object-cover transition-all duration-300 group-hover:ring-2 group-hover:ring-tiffany-200"
                    />
                  ) : (
                    <DefaultAvatar 
                      size={navigationState.isSidebarOpen ? 44 : 36} 
                      className="transition-all duration-300 group-hover:ring-2 group-hover:ring-tiffany-200 rounded-full" 
                    />
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                </div>
                {navigationState.isSidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-tiffany-700 transition-colors">
                      {profile.display_name || profile.username || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      @{profile.username || 'username'}
                    </p>
                  </div>
                )}
              </Link>
            </div>
          )}

          {/* Navigation Sections */}
          <nav className="flex-1 px-2 py-4 space-y-6 overflow-y-auto" aria-label={navigationLabels.MAIN_NAVIGATION}>
            {getFilteredSections().map((section) => {
              const isCollapsed = navigationState.collapsedSections.has(section.id);
              const hasActiveItem = section.items.some(item => isItemActive(item.href));

              return (
                <div key={section.id} className="space-y-2">
                  {/* Section Header */}
                  {navigationState.isSidebarOpen && (
                    <div className="flex items-center justify-between px-3">
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
                  )}

                  {/* Section Items */}
                  {(!section.collapsible || !isCollapsed || hasActiveItem) && (
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const isActive = isItemActive(item.href);
                        
                        return (
                          <Link
                            key={item.name}
                            href={item.comingSoon ? '#' : item.href}
                            className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative
                              ${isActive
                                ? 'bg-gradient-to-r from-tiffany-100 to-tiffany-50 text-tiffany-700 shadow-sm border border-tiffany-200'
                                : item.comingSoon
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                              }
                              ${navigationState.isSidebarOpen ? '' : 'justify-center'}`}
                            title={navigationState.isSidebarOpen ? undefined : item.name}
                            onClick={item.comingSoon ? (e) => e.preventDefault() : undefined}
                            aria-label={item.comingSoon ? `${item.name} - ${navigationLabels.COMING_SOON}` : item.name}
                          >
                            <item.icon className={`h-5 w-5 shrink-0 transition-colors ${navigationState.isSidebarOpen ? 'mr-3' : ''} ${
                              isActive 
                                ? 'text-tiffany-600' 
                                : item.comingSoon
                                ? 'text-gray-300'
                                : 'text-gray-500 group-hover:text-gray-700'
                            }`} />
                            
                            {navigationState.isSidebarOpen && (
                              <div className="flex-1 flex items-center justify-between min-w-0">
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
                            )}

                            {/* Tooltip for collapsed sidebar */}
                            {!navigationState.isSidebarOpen && (
                              <div className="absolute left-16 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
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
          {/* Bottom Navigation Items */}
          <nav className="space-y-1" aria-label={navigationLabels.BOTTOM_NAVIGATION}>
            {bottomNavItems.map((item) => {
              const isActive = isItemActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r from-tiffany-100 to-tiffany-50 text-tiffany-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${navigationState.isSidebarOpen ? '' : 'justify-center'}`}
                  title={navigationState.isSidebarOpen ? undefined : item.name}
                >
                  <item.icon className={`h-5 w-5 shrink-0 ${navigationState.isSidebarOpen ? 'mr-3' : ''} ${
                    isActive ? 'text-tiffany-600' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  {navigationState.isSidebarOpen && <span className="truncate">{item.name}</span>}
                  
                  {/* Tooltip for collapsed sidebar */}
                  {!navigationState.isSidebarOpen && (
                    <div className="absolute left-16 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
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
            className="w-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-3 rounded-xl transition-all duration-200 group"
            title={navigationState.isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            aria-label={navigationLabels.SIDEBAR_TOGGLE}
          >
            {navigationState.isSidebarOpen ? (
              <X className="h-5 w-5 group-hover:rotate-90 transition-transform" />
            ) : (
              <Menu className="h-5 w-5 group-hover:scale-110 transition-transform" />
            )}
            <span className="sr-only">{navigationState.isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ease-in-out ${navigationState.isSidebarOpen ? 'ml-64' : 'ml-20'} overflow-y-auto flex flex-col min-h-screen`}>
        {/* Mobile Header */}
        <header className="bg-white shadow-sm md:hidden sticky top-0 z-20 border-b border-gray-200">
          <div className="px-4 py-3 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center shrink-0">
              <Image src="/images/orange-cat-logo.svg" alt="Orangecat" width={32} height={32} />
              <span className="ml-2 text-lg font-semibold text-tiffany-600">Orangecat</span>
            </Link>
            <button 
              onClick={toggleSidebar} 
              className="text-gray-500 focus:outline-none hover:text-gray-700"
              aria-label={navigationLabels.SIDEBAR_TOGGLE}
            >
              {navigationState.isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
      
      {/* Development Performance Monitor */}
      <DevPerformanceMonitor />
      
      {/* Navigation Keyboard Shortcuts */}
      <NavigationShortcuts sections={navigationSections} />
    </div>
  )
} 