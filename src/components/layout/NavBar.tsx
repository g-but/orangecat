'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navigation } from '@/config/navigation'

interface NavBarProps {
  className?: string
  onLinkClick?: () => void
}

export default function NavBar({ className = '', onLinkClick }: NavBarProps) {
  const pathname = usePathname()
  return (
    <nav className={`flex items-center space-x-6 font-medium text-base ${className}`}>
      {navigation.main.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-tiffany-400
              ${isActive ? 'text-tiffany-600 font-bold' : 'text-slate-700 hover:text-tiffany-600 hover:bg-orange-100'}
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