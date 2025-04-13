'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Bitcoin } from 'lucide-react'
import styles from './Header.module.css'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Fund', href: '/fund' },
  { name: 'Create', href: '/create' },
  { name: 'About', href: '/about' },
]

export default function Header() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className={styles.header}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Bitcoin className="h-8 w-8 text-orange-500 hover:text-orange-600 transition-colors duration-200" />
              <span className="ml-2 text-xl font-semibold text-tiffany">FundFlow</span>
            </Link>
            <nav className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 rounded-full text-tiffany hover:text-tiffany-dark hover:bg-tiffany-50 transition-colors duration-200 ${
                    pathname === item.href ? 'bg-tiffany-50 text-tiffany-dark font-semibold' : ''
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-tiffany hover:text-tiffany-dark hover:bg-tiffany-50 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? 'block' : 'hidden'} sm:hidden ${styles.mobileMenu}`}>
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`${styles.mobileNavLink} ${pathname === item.href ? styles.mobileNavLinkActive : ''}`}
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
} 