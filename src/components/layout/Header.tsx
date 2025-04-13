'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Menu, X, Bitcoin } from 'lucide-react'
import { navigation } from '@/config/navigation'
import { useAuth } from '@/contexts/AuthContext'
import styles from './Header.module.css'

export default function Header() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const handleCreateClick = (e: React.MouseEvent) => {
    if (!user && !isLoading) {
      e.preventDefault()
      router.push('/auth')
    }
  }

  return (
    <header className={styles.header}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Bitcoin className="h-8 w-8 text-tiffany-500 hover:text-tiffany-600 transition-colors duration-200" />
              <span className="ml-2 text-xl font-semibold text-tiffany-500">OrangeCat</span>
            </Link>
            <nav className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {navigation.main.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={item.requiresAuth ? handleCreateClick : undefined}
                  className={`px-4 py-2 rounded-full text-slate-600 hover:text-tiffany-500 hover:bg-tiffany-50 transition-colors duration-200 ${
                    pathname === item.href ? 'bg-tiffany-50 text-tiffany-500 font-semibold' : ''
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <nav className="hidden sm:flex sm:space-x-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className={`px-4 py-2 rounded-full text-slate-600 hover:text-tiffany-500 hover:bg-tiffany-50 transition-colors duration-200 ${
                    pathname === '/dashboard' ? 'bg-tiffany-50 text-tiffany-500 font-semibold' : ''
                  }`}
                >
                  Dashboard
                </Link>
              ) : (
                navigation.auth.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-4 py-2 rounded-full text-slate-600 hover:text-tiffany-500 hover:bg-tiffany-50 transition-colors duration-200 ${
                      pathname === item.href ? 'bg-tiffany-50 text-tiffany-500 font-semibold' : ''
                    }`}
                  >
                    {item.name}
                  </Link>
                ))
              )}
            </nav>
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 hover:text-tiffany-500 hover:bg-tiffany-50 focus:outline-none"
                aria-label="Toggle menu"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? 'block' : 'hidden'} sm:hidden ${styles.mobileMenu}`}>
        <div className="pt-2 pb-3 space-y-1">
          {navigation.main.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={item.requiresAuth ? handleCreateClick : undefined}
              className={`${styles.mobileNavLink} ${pathname === item.href ? styles.mobileNavLinkActive : ''}`}
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <div className="border-t border-slate-200 pt-4">
            {user ? (
              <Link
                href="/dashboard"
                className={`${styles.mobileNavLink} ${pathname === '/dashboard' ? styles.mobileNavLinkActive : ''}`}
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              navigation.auth.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${styles.mobileNavLink} ${pathname === item.href ? styles.mobileNavLinkActive : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 