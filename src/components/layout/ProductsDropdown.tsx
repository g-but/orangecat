'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, Building, Calendar, Briefcase, Users, Wallet, Handshake } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface ProductItem {
  name: string
  href: string
  description: string
  icon: any
  color: string
  comingSoon?: boolean
}

const products: ProductItem[] = [
  {
    name: 'Fundraising',
    href: '/fundraising',
    description: 'Create powerful fundraising campaigns with Bitcoin',
    icon: Handshake,
    color: 'text-teal-600',
    comingSoon: false
  },
  {
    name: 'Organizations',
    href: '/organizations',
    description: 'Create and manage organizations with governance and assets',
    icon: Building,
    color: 'text-green-600',
    comingSoon: true
  },
  {
    name: 'Projects',
    href: '/projects',
    description: 'Launch and manage projects with transparent funding',
    icon: Briefcase,
    color: 'text-purple-600',
    comingSoon: true
  },
  {
    name: 'Events',
    href: '/events', 
    description: 'Organize conferences, meetups, and community gatherings',
    icon: Calendar,
    color: 'text-blue-600',
    comingSoon: true
  },
  {
    name: 'Assets',
    href: '/assets',
    description: 'List, rent, and discover physical assets in your community',
    icon: Wallet,
    color: 'text-red-600',
    comingSoon: true
  },
  {
    name: 'People',
    href: '/people',
    description: 'Connect with friends and build your Bitcoin community',
    icon: Users,
    color: 'text-orange-600',
    comingSoon: true
  }
]

interface ProductsDropdownProps {
  className?: string
  onLinkClick?: () => void
}

export default function ProductsDropdown({ className = '', onLinkClick }: ProductsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const { user } = useAuth()

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case 'Escape':
          setIsOpen(false)
          setFocusedIndex(-1)
          triggerRef.current?.focus()
          break
        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex(prev => {
            const nextIndex = prev < products.length - 1 ? prev + 1 : 0
            itemRefs.current[nextIndex]?.focus()
            return nextIndex
          })
          break
        case 'ArrowUp':
          event.preventDefault()
          setFocusedIndex(prev => {
            const nextIndex = prev > 0 ? prev - 1 : products.length - 1
            itemRefs.current[nextIndex]?.focus()
            return nextIndex
          })
          break
        case 'Tab':
          if (event.shiftKey && focusedIndex === 0) {
            setIsOpen(false)
            setFocusedIndex(-1)
          } else if (!event.shiftKey && focusedIndex === products.length - 1) {
            setIsOpen(false)
            setFocusedIndex(-1)
          }
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, focusedIndex])

  const handleLinkClick = () => {
    setIsOpen(false)
    setFocusedIndex(-1)
    onLinkClick?.()
  }

  const handleTriggerClick = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setFocusedIndex(-1)
    }
  }

  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsOpen(true)
      setFocusedIndex(0)
      // Focus first item after a brief delay to ensure it's rendered
      setTimeout(() => {
        itemRefs.current[0]?.focus()
      }, 50)
    }
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Products menu"
        className="flex items-center gap-1 px-2 py-1 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-tiffany-400 focus:ring-offset-1 text-slate-700 hover:text-tiffany-600 hover:bg-orange-100"
      >
        Products
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-300 ease-out ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          {isMobile && (
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
              onClick={() => setIsOpen(false)}
            />
          )}
          
          {/* Dropdown Panel */}
          <div 
            role="menu"
            aria-label="Products"
            className={`
              absolute z-50 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 
              ${isMobile 
                ? 'left-0 right-0 mx-4 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300' 
                : 'left-1/2 transform -translate-x-1/2 w-96 animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200'
              }
              origin-top
            `}
            style={{
              animationFillMode: 'forwards',
              transformOrigin: 'var(--radix-dropdown-menu-content-transform-origin, top center)'
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Products</h3>
              <p className="text-sm text-gray-600 mt-1">
                Explore our Bitcoin-powered platform features
              </p>
            </div>
            
            {/* Products Grid */}
            <div className="p-3">
              <div className="grid grid-cols-1 gap-1">
                {products.map((product, index) => {
                  const Icon = product.icon
                  
                  return (
                    <Link
                      key={product.name}
                      ref={(el) => {
                        itemRefs.current[index] = el
                      }}
                      href={product.href}
                      onClick={handleLinkClick}
                      onFocus={() => setFocusedIndex(index)}
                      role="menuitem"
                      tabIndex={isOpen ? 0 : -1}
                      className={`
                        flex items-start gap-3 p-3 rounded-lg transition-all duration-200 group outline-none
                        hover:bg-gray-50 focus:bg-gray-50 focus:ring-2 focus:ring-tiffany-400 focus:ring-inset
                        ${focusedIndex === index ? 'bg-gray-50' : ''}
                      `}
                      style={{
                        animationDelay: `${index * 50}ms`
                      }}
                    >
                      <div className={`
                        p-2 rounded-lg transition-all duration-200 
                        ${product.color} bg-opacity-10
                        group-hover:bg-white group-hover:shadow-sm group-hover:scale-105
                        group-focus:bg-white group-focus:shadow-sm group-focus:scale-105
                      `}>
                        <Icon className={`w-5 h-5 ${product.color} transition-transform duration-200 group-hover:scale-110 group-focus:scale-110`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 group-hover:text-tiffany-600 group-focus:text-tiffany-600 transition-colors duration-200">
                            {product.name}
                          </h4>
                          {product.comingSoon && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full transition-all duration-200 group-hover:bg-orange-200 group-focus:bg-orange-200">
                              Soon
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5 leading-relaxed transition-colors duration-200 group-hover:text-gray-700 group-focus:text-gray-700">
                          {product.description}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {user ? 'Explore features' : 'Join to get started'}
                </span>
                {!user && (
                  <Link
                    href="/auth"
                    onClick={handleLinkClick}
                    className="font-medium text-tiffany-600 hover:text-tiffany-700 focus:text-tiffany-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-tiffany-400 focus:ring-offset-1 rounded px-1"
                  >
                    Sign up
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 