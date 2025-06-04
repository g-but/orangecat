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

// Products dropdown for non-logged-in users - organized by category
const productCategories = [
  {
    title: 'Active Products',
    items: [
      {
        name: 'Fundraising',
        href: '/fundraising',
        description: 'Bitcoin-powered fundraising campaigns',
        icon: Zap,
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
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  // Context-aware links - different for logged in vs logged out users
  const getFundraisingLink = () => {
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
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Logo />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-2">
              {/* Products Dropdown - Only for non-logged-in users */}
              {!user && (
                <div 
                  className="relative"
                  onMouseEnter={() => handleMouseEnter('products')}
                  onMouseLeave={handleMouseLeave}
                >
                  <button className={`flex items-center space-x-2 px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 min-h-[44px] ${
                    activeDropdown === 'products' || pathname.startsWith('/fundraising') || pathname.startsWith('/coming-soon')
                      ? 'text-orange-600 bg-orange-50 shadow-sm' 
                      : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
                  }`}>
                    <span>Products</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                      activeDropdown === 'products' ? 'rotate-180' : ''
                    }`} />
                  </button>

                  {/* Products Dropdown Panel */}
                  {activeDropdown === 'products' && (
                    <div 
                      className="absolute top-full left-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 py-6 z-dropdown animate-in fade-in slide-in-from-top-2 duration-200"
                      onMouseEnter={handleDropdownMouseEnter}
                      onMouseLeave={handleDropdownMouseLeave}
                    >
                      {productCategories.map((category, categoryIndex) => (
                        <div key={category.title} className={categoryIndex > 0 ? 'pt-6 mt-6 border-t border-gray-100' : ''}>
                          <div className="px-6 mb-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              {category.title}
                            </h3>
                          </div>
                          <div className="space-y-1">
                            {category.items.map((item) => {
                              const Icon = item.icon
                              return (
                                <a
                                  key={item.name}
                                  href={item.href}
                                  className="group flex items-start px-6 py-4 hover:bg-gray-50 transition-all duration-200"
                                >
                                  <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition-colors duration-200">
                                    <Icon className="w-6 h-6 text-gray-600 group-hover:text-orange-600 transition-colors duration-200" />
                                  </div>
                                  <div className="ml-4 flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-base font-medium text-gray-900 group-hover:text-orange-600 transition-colors duration-200">
                                          {item.name}
                                        </p>
                                        <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200 mt-1">
                                          {item.description}
                                        </p>
                                      </div>
                                      <span className={`ml-3 px-3 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
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
                      <div className="px-6 pt-6 mt-6 border-t border-gray-100">
                        <a
                          href="/fundraising"
                          className="block w-full text-center px-4 py-3 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors duration-200"
                        >
                          Get Started with Fundraising
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Direct action links */}
              <div className="px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 min-h-[44px] flex items-center">
                <HeaderCreateButton />
              </div>

              <a 
                href={getFundOthersLink()}
                className={`px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 min-h-[44px] flex items-center ${
                  isActive('/discover') || (user && isActive('/dashboard'))
                    ? 'text-orange-600 bg-orange-50 shadow-sm' 
                    : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
                }`}
              >
                {user ? 'My Dashboard' : 'Discover'}
              </a>

              {/* Blog link for non-logged-in users */}
              {!user && (
                <a 
                  href="/blog"
                  className={`px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 min-h-[44px] flex items-center ${
                    isActive('/blog')
                      ? 'text-orange-600 bg-orange-50 shadow-sm' 
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
                <button className={`flex items-center space-x-2 px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 min-h-[44px] ${
                  activeDropdown === 'about' || pathname.startsWith('/about')
                    ? 'text-orange-600 bg-orange-50 shadow-sm' 
                    : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
                }`}>
                  <span>About</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                    activeDropdown === 'about' ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* About Dropdown Panel */}
                {activeDropdown === 'about' && (
                  <div 
                    className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-6 z-dropdown animate-in fade-in slide-in-from-top-2 duration-200"
                    onMouseEnter={handleDropdownMouseEnter}
                    onMouseLeave={handleDropdownMouseLeave}
                  >
                    <div className="space-y-1">
                      {aboutLinks.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className="group block px-6 py-4 hover:bg-gray-50 transition-all duration-200"
                        >
                          <div className="flex flex-col">
                            <div className="text-base font-medium text-gray-900 group-hover:text-orange-600 transition-colors duration-200">
                              {item.name}
                            </div>
                            <div className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200 mt-1">
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
                className="p-3 text-gray-700 hover:text-orange-600 hover:bg-gray-100 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-sidebar lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-20 right-0 w-full max-w-sm h-[calc(100vh-5rem)] bg-white shadow-2xl overflow-y-auto">
            <div className="p-6 space-y-8">
              
              {/* Products Section - Only for non-logged-in users */}
              {!user && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Products</h3>
                  <div className="space-y-6">
                    {productCategories.map((category) => (
                      <div key={category.title}>
                        <h4 className="text-sm font-semibold text-gray-900 mb-4">{category.title}</h4>
                        <div className="space-y-2">
                          {category.items.map((item) => {
                            const Icon = item.icon
                            return (
                              <a
                                key={item.name}
                                href={item.href}
                                className="flex items-start p-4 rounded-lg hover:bg-gray-50 transition-all duration-200 min-h-[64px]"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Icon className="w-6 h-6 text-gray-600" />
                                </div>
                                <div className="ml-4 flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-base font-medium text-gray-900">{item.name}</p>
                                      <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                                    </div>
                                    <span className={`ml-3 px-3 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
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
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  {user ? 'Quick Actions' : 'Get Started'}
                </h3>
                <div className="space-y-2">
                  <a
                    href={getFundraisingLink()}
                    className="block p-4 rounded-lg hover:bg-gray-50 transition-all duration-200 min-h-[64px]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="text-base font-medium text-gray-900">
                      {user ? 'Create New Campaign' : 'Start Fundraising'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {user ? 'Launch a new Bitcoin fundraising campaign' : 'Create your Bitcoin fundraising campaign'}
                    </div>
                  </a>
                  
                  <a
                    href={getFundOthersLink()}
                    className="block p-4 rounded-lg hover:bg-gray-50 transition-all duration-200 min-h-[64px]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="text-base font-medium text-gray-900">
                      {user ? 'My Dashboard' : 'Discover'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {user ? 'View and manage your campaigns' : 'Discover campaigns to support'}
                    </div>
                  </a>

                  {/* Blog link for non-logged-in users */}
                  {!user && (
                    <a
                      href="/blog"
                      className="block p-4 rounded-lg hover:bg-gray-50 transition-all duration-200 min-h-[64px]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="text-base font-medium text-gray-900">Blog</div>
                      <div className="text-sm text-gray-500 mt-1">Learn about our philosophy and vision</div>
                    </a>
                  )}
                </div>
              </div>

              {/* About Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">About</h3>
                <div className="space-y-2">
                  {aboutLinks.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="block p-4 rounded-lg hover:bg-gray-50 transition-all duration-200 min-h-[64px]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="text-base font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Auth Buttons */}
              <div className="border-t border-gray-200 pt-6">
                <AuthButtons className="flex flex-col space-y-3" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 