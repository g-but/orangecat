'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navigation } from '@/config/navigation'
import { useAuth } from '@/hooks/useAuth'
import ProductsDropdown from './ProductsDropdown'
import AboutDropdown from './AboutDropdown'

interface NavBarProps {
  className?: string
  onLinkClick?: () => void
}

export default function NavBar({ className = '', onLinkClick }: NavBarProps) {
  const pathname = usePathname()
  const { user, hydrated } = useAuth()

  if (!hydrated) {
    return <nav className={`flex items-center space-x-6 font-medium text-base ${className}`}></nav>;
  }

  return (
    <nav className={`flex items-center space-x-6 font-medium text-base ${className}`}>
      {/* Products Dropdown */}
      <ProductsDropdown onLinkClick={onLinkClick} />
      
      {navigation.main.map((item) => {
        const href = item.href;
        const isActive = pathname === href;
        
        if (item.requiresAuth && !user) {
           return null; 
        }

        // Special handling for About - use dropdown instead of link
        if (item.name === 'About') {
          return <AboutDropdown key={item.name} onLinkClick={onLinkClick} />
        }

        return (
          <Link
            key={item.name}
            href={href}
            className={`px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-tiffany-400
              ${
                (pathname === href) 
                  ? 'text-tiffany-600 font-bold' 
                  : 'text-slate-700 hover:text-tiffany-600 hover:bg-orange-100'
              }
            `}
            onClick={onLinkClick}
          >
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
} 