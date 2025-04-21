'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import UserProfileDropdown from '@/components/user/UserProfileDropdown'
import { navigation } from '@/config/navigation'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const handleNavigation = (href: string, requiresAuth?: boolean) => {
    if (requiresAuth && !user) {
      router.push('/auth?mode=login')
      return
    }
    router.push(href)
  }

  console.log('Header: Render state:', { isLoading, hasUser: !!user })

  if (isLoading) {
    console.log('Header: Showing loading state')
    return (
      <header className="bg-white shadow fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-semibold text-tiffany-500">OrangeCat</span>
              </Link>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white shadow fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-semibold text-tiffany-500">OrangeCat</span>
            </Link>
            <nav className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {navigation.main.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    if (item.requiresAuth && !user) {
                      e.preventDefault()
                      router.push('/auth?mode=login')
                    }
                  }}
                  className="px-4 py-2 rounded-full text-slate-600 hover:text-tiffany-500 hover:bg-tiffany-50 transition-colors duration-200"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center">
            {user ? (
              <UserProfileDropdown />
            ) : (
              <div className="hidden sm:flex sm:space-x-4">
                {navigation.auth.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="px-4 py-2 rounded-full text-slate-600 hover:text-tiffany-500 hover:bg-tiffany-50 transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <button
            className="sm:hidden p-2 text-slate-600 hover:text-tiffany-500"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="sm:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.main.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    if (item.requiresAuth && !user) {
                      e.preventDefault()
                      router.push('/auth?mode=login')
                    }
                    setIsMobileMenuOpen(false)
                  }}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-tiffany-500 hover:bg-tiffany-50"
                >
                  {item.name}
                </Link>
              ))}
              {!user && (
                <>
                  <Link
                    href="/auth?mode=login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-tiffany-500 hover:bg-tiffany-50"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth?mode=register"
                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-tiffany-500 hover:bg-tiffany-50"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 