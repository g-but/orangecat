'use client'

import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Logo from './Logo'
import NavBar from './NavBar'
import AuthButtons from './AuthButtons'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

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

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 bg-white border-b border-orange-200 ${
      isScrolled ? 'shadow-sm' : ''
    }`}
      style={{backdropFilter: 'blur(8px)'}}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo (left) */}
          <Logo />

          {/* NavBar (center, desktop only) */}
          <div className="hidden md:flex flex-1 justify-center">
            <NavBar />
          </div>

          {/* Auth/Profile (right, desktop only) */}
          <div className="hidden md:flex items-center justify-end min-w-[180px]">
            <AuthButtons />
          </div>

          {/* Hamburger (mobile only) */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-tiffany-600 hover:text-orange-500 transition-colors p-2"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-orange-200">
          <div className="px-4 pt-4 pb-3 space-y-2">
            <NavBar className="flex-col space-y-2 space-x-0" onLinkClick={() => setIsMobileMenuOpen(false)} />
            <div className="pt-2">
              <AuthButtons className="flex-col space-y-2 space-x-0" />
            </div>
          </div>
        </div>
      )}
    </header>
  )
} 