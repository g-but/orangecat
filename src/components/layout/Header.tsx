'use client'

import { useState, useEffect, useRef } from 'react'
import { Menu, X, ChevronDown, Zap, Building, Calendar, Wallet, Users, Globe2 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Logo from './Logo'
import AuthButtons from './AuthButtons'
import { HeaderCreateButton } from '@/components/dashboard/SmartCreateButton'

// Simple, focused about links
const aboutLinks = [
  {
    name: 'About Us',
    href: '/about',
    description: 'Learn about our mission and vision'
  },
  {
    name: 'Study Bitcoin',
    href: '/study-bitcoin',
    description: 'Educational resources to learn about Bitcoin'
  },
  {
    name: 'Documentation',
    href: '/docs', 
    description: 'Technical guides and API references'
  },
  {
    name: 'Blog',
    href: '/blog',
    description: 'Latest updates and insights'
  },
  {
    name: 'Contact',
    href: '/profile/mao',
    description: 'Get in touch with our team'
  }
]

// Products dropdown - redesigned with better structure
const productCategories = [
  {
    title: 'Active Products',
    items: [
      {
        name: 'Campaigns',
        href: '/create',
        description: 'Create and manage Bitcoin fundraising campaigns',
        icon: Target,
        status: 'live',
        badge: 'Live'
      }
    ]
  },
  {
    title: 'Coming Soon',
    items: [
      {
        name: 'Organizations',
        href: '/coming-soon?feature=organizations',
        description: 'Manage organizations with governance',
        icon: Building,
        status: 'coming-soon',
        badge: 'Q1 2026'
      },
      {
        name: 'Projects',
        href: '/coming-soon?feature=projects',
        description: 'Launch and manage projects',
        icon: Wallet,
        status: 'coming-soon',
        badge: 'Q1 2026'
      },
      {
        name: 'Events',
        href: '/coming-soon?feature=events',
        description: 'Organize and fundraise for events',
        icon: Calendar,
        status: 'coming-soon',
        badge: 'Q2 2026'
      },
      {
        name: 'Assets Marketplace',
        href: '/coming-soon?feature=assets',
        description: 'List and rent physical assets',
        icon: Globe2,
        status: 'coming-soon',
        badge: 'Q2 2026'
      },
      {
        name: 'People & Networking',
        href: '/coming-soon?feature=people',
        description: 'Connect and build communities',
        icon: Users,
        status: 'coming-soon',
        badge: 'Q2 2026'
      }
    ]
  }
]

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const pathname = usePathname()
  const { user } = useAuth()
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const handleMouseEnter = (dropdown: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setActiveDropdown(dropdown)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
    }, 150)
  }

  const handleDropdownMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleDropdownMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
    }, 150)
  }

  const isActive = (href: string) => {
    if (href === '/') {return pathname === '/'}
    return pathname.startsWith(href)
  }

  // Context-aware links - different for logged in vs logged out users
  const getCampaignsLink = () => {
    return '/create'
  }

  const getFundOthersLink = () => {
    return user ? '/dashboard' : '/discover'
  }

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-header transition-all duration-200 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-200' 
          : 'bg-white/90 backdrop-blur-md'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Logo />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {/* Products Dropdown - Only for non-logged-in users */}
              {!user && (
                <div 
                  className="relative"
                  onMouseEnter={() => handleMouseEnter('products')}
                  onMouseLeave={handleMouseLeave}
                >
                  <button className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 min-h-[36px] ${
                    activeDropdown === 'products' || pathname.startsWith('/fundraising') || pathname.startsWith('/coming-soon')
                      ? 'text-orange-600 bg-orange-50' 
                      : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
                  }`}>
                    <span>Products</span>
                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${
                      activeDropdown === 'products' ? 'rotate-180' : ''
                    }`} />
                  </button>

                  {/* Products Dropdown Panel - Redesigned */}
                  {activeDropdown === 'products' && (
                    <div 
                      className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-dropdown animate-in fade-in slide-in-from-top-1 duration-150"
                      onMouseEnter={handleDropdownMouseEnter}
                      onMouseLeave={handleDropdownMouseLeave}
                    >
                      {productCategories.map((category, categoryIndex) => (
                        <div key={category.title}>
                          {categoryIndex > 0 && <div className="border-t border-gray-100 my-2" />}
                          
                          <div className="px-3 py-1">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              {category.title}
                            </h3>
                          </div>
                          
                          <div className="py-1">
                            {category.items.map((item) => {
                              const Icon = item.icon
                              return (
                                <a
                                  key={item.name}
                                  href={item.href}
                                  className="group flex items-center px-3 py-2 mx-1 hover:bg-gray-50 rounded-md transition-all duration-150"
                                >
                                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center group-hover:bg-orange-100 transition-colors duration-150">
                                    <Icon className="w-4 h-4 text-gray-600 group-hover:text-orange-600 transition-colors duration-150" />
                                  </div>
                                  <div className="ml-3 flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 group-hover:text-orange-600 transition-colors duration-150 truncate">
                                          {item.name}
                                        </p>
                                        <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-150 truncate">
                                          {item.description}
                                        </p>
                                      </div>
                                      <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                                        item.status === 'live' 
                                          ? 'bg-green-100 text-green-700' 
                                          : 'bg-orange-100 text-orange-700'
                                      }`}>
                                        {item.badge}
                                      </span>
                                    </div>
                                  </div>
                                </a>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                      
                      <div className="border-t border-gray-100 mt-2 pt-2 px-3">
                        <a
                          href="/fundraising"
                          className="block w-full text-center px-3 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors duration-150"
                        >
                          Get Started
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Direct action links */}
              <div className="px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 min-h-[36px] flex items-center">
                <HeaderCreateButton />
              </div>

              <a 
                href={getFundOthersLink()}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 min-h-[36px] flex items-center ${
                  isActive('/discover') || (user && isActive('/dashboard'))
                    ? 'text-orange-600 bg-orange-50' 
                    : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
                }`}
              >
                {user ? 'Dashboard' : 'Discover'}
              </a>

              {/* Blog link for non-logged-in users */}
              {!user && (
                <a 
                  href="/blog"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 min-h-[36px] flex items-center ${
                    isActive('/blog')
                      ? 'text-orange-600 bg-orange-50' 
                      : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
                  }`}
                >
                  Blog
                </a>
              )}

              {/* About Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => handleMouseEnter('about')}
                onMouseLeave={handleMouseLeave}
              >
                <button className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 min-h-[36px] ${
                  activeDropdown === 'about' || pathname.startsWith('/about')
                    ? 'text-orange-600 bg-orange-50' 
                    : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
                }`}>
                  <span>About</span>
                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${
                    activeDropdown === 'about' ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* About Dropdown Panel - Redesigned */}
                {activeDropdown === 'about' && (
                  <div 
                    className="absolute top-full right-0 mt-1 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-dropdown animate-in fade-in slide-in-from-top-1 duration-150"
                    onMouseEnter={handleDropdownMouseEnter}
                    onMouseLeave={handleDropdownMouseLeave}
                  >
                    <div className="py-1">
                      {aboutLinks.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className="group block px-3 py-2 mx-1 hover:bg-gray-50 rounded-md transition-all duration-150"
                        >
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900 group-hover:text-orange-600 transition-colors duration-150">
                              {item.name}
                            </div>
                            <div className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-150 mt-0.5">
                              {item.description}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Auth Buttons (Desktop) */}
            <div className="hidden lg:flex">
              <AuthButtons />
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-700 hover:text-orange-600 hover:bg-gray-100 rounded-md transition-all duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Also redesigned with better spacing */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-sidebar lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-16 right-0 w-full max-w-sm h-[calc(100vh-4rem)] bg-white shadow-2xl overflow-y-auto">
            <div className="p-4 space-y-6">
              
              {/* Products Section - Only for non-logged-in users */}
              {!user && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Products</h3>
                  <div className="space-y-4">
                    {productCategories.map((category) => (
                      <div key={category.title}>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">{category.title}</h4>
                        <div className="space-y-1">
                          {category.items.map((item) => {
                            const Icon = item.icon
                            return (
                              <a
                                key={item.name}
                                href={item.href}
                                className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-all duration-150 min-h-[56px]"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Icon className="w-5 h-5 text-gray-600" />
                                </div>
                                <div className="ml-3 flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                      <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
                                    </div>
                                    <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                                      item.status === 'live' 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-orange-100 text-orange-700'
                                    }`}>
                                      {item.badge}
                                    </span>
                                  </div>
                                </div>
                              </a>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Actions */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <HeaderCreateButton />
                </div>
                
                <a
                  href={getFundOthersLink()}
                  className={`block w-full px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 text-center ${
                    isActive('/discover') || (user && isActive('/dashboard'))
                      ? 'text-orange-600 bg-orange-50' 
                      : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {user ? 'Dashboard' : 'Discover'}
                </a>

                {!user && (
                  <a
                    href="/blog"
                    className={`block w-full px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 text-center ${
                      isActive('/blog')
                        ? 'text-orange-600 bg-orange-50' 
                        : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Blog
                  </a>
                )}
              </div>

              {/* About Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">About</h3>
                <div className="space-y-1">
                  {aboutLinks.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-md transition-all duration-150"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              </div>

              {/* Auth Buttons (Mobile) */}
              <div className="pt-4 border-t border-gray-200">
                <AuthButtons />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 