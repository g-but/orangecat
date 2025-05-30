'use client'

import { useState, useEffect, useRef } from 'react'
import { Menu, X, ChevronDown } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Logo from './Logo'
import AuthButtons from './AuthButtons'

// Simple, focused about links
const aboutLinks = [
  {
    name: 'About Us',
    href: '/about',
    description: 'Learn about our mission'
  },
  {
    name: 'Documentation',
    href: '/docs', 
    description: 'Technical guides and resources'
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
    return user ? '/dashboard/fundraising/create' : '/fundraising'
  }

  const getFundOthersLink = () => {
    return user ? '/dashboard' : '/fund-others'
  }

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
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
            <div className="hidden lg:flex items-center space-x-8">
              {/* Direct action links - what users want to do */}
              <a 
                href={getFundraisingLink()}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/fundraising') || isActive('/dashboard/fundraising')
                    ? 'text-orange-600' 
                    : 'text-gray-700 hover:text-orange-600'
                }`}
              >
                {user ? 'Create Campaign' : 'Start Fundraising'}
              </a>

              <a 
                href={getFundOthersLink()}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/fund-others') || (user && isActive('/dashboard'))
                    ? 'text-orange-600' 
                    : 'text-gray-700 hover:text-orange-600'
                }`}
              >
                {user ? 'My Dashboard' : 'Fund Others'}
              </a>

              {/* About Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => handleMouseEnter('about')}
                onMouseLeave={handleMouseLeave}
              >
                <button className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium transition-colors ${
                  activeDropdown === 'about' || pathname.startsWith('/about')
                    ? 'text-orange-600' 
                    : 'text-gray-700 hover:text-orange-600'
                }`}>
                  <span>About</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${
                    activeDropdown === 'about' ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* About Dropdown Panel */}
                {activeDropdown === 'about' && (
                  <div 
                    className="absolute top-full right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-4 z-[60]"
                    onMouseEnter={handleDropdownMouseEnter}
                    onMouseLeave={handleDropdownMouseLeave}
                  >
                    {aboutLinks.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-2 hover:bg-gray-50 text-gray-700 hover:text-orange-600 transition-colors"
                      >
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </a>
                    ))}
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
                className="p-2 text-gray-700 hover:text-orange-600 transition-colors"
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

      {/* Mobile Menu - Clean and Simple */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[45] lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-16 left-0 right-0 bg-white border-b border-gray-200 max-h-[calc(100vh-4rem)] overflow-y-auto shadow-lg">
            <div className="px-4 py-6 space-y-6">
              
              {/* Main Actions - What users actually want to do */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  {user ? 'Quick Actions' : 'What can I do?'}
                </h3>
                <div className="space-y-2">
                  <a
                    href={getFundraisingLink()}
                    className="block px-3 py-3 rounded-md text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="text-sm font-medium">
                      {user ? 'Create New Campaign' : 'Start Fundraising'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user ? 'Launch a new Bitcoin fundraising campaign' : 'Create your Bitcoin fundraising campaign'}
                    </div>
                  </a>
                  
                  <a
                    href={getFundOthersLink()}
                    className="block px-3 py-3 rounded-md text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="text-sm font-medium">
                      {user ? 'My Dashboard' : 'Fund Others'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user ? 'View and manage your campaigns' : 'Support existing campaigns'}
                    </div>
                  </a>
                </div>
              </div>

              {/* About Section - Condensed */}
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-2">
                  {aboutLinks.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="block px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50 hover:text-orange-600 transition-colors text-sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              </div>

              {/* Auth Buttons */}
              <div className="border-t border-gray-200 pt-4">
                <AuthButtons className="flex flex-col space-y-2" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 