'use client'

import Link from 'next/link'
import { navigation } from '@/config/navigation'
import Logo from './Logo'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  // Check if current page is an authenticated page
  const isAuthPage = pathname.startsWith('/dashboard') || 
                    pathname.startsWith('/profile') || 
                    pathname.startsWith('/settings')

  return (
    <footer className={`bg-white border-t border-orange-200 ${isAuthPage ? 'relative z-10' : ''}`}>
      <div className={`mx-auto py-12 px-4 sm:px-6 lg:px-8 ${isAuthPage ? 'ml-[5rem] md:ml-64' : 'max-w-7xl'}`}>
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Logo className="mb-2" />
            <p className="text-slate-600 text-base">
              Making Bitcoin donations simple and accessible for everyone.
            </p>
            <div className="flex space-x-6">
              {navigation.footer.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-slate-400 hover:text-tiffany-500 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sr-only">{item.name}</span>
                  {item.icon && <item.icon className="h-6 w-6" />}
                </a>
              ))}
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div>
              <h3 className="text-sm font-semibold text-orange-400 tracking-wider uppercase">
                Navigation
              </h3>
              <ul className="mt-4 space-y-4">
                {navigation.main.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-base text-slate-600 hover:text-tiffany-600 hover:bg-orange-100 transition-colors px-2 py-1 rounded"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-orange-400 tracking-wider uppercase">
                Legal
              </h3>
              <ul className="mt-4 space-y-4">
                {navigation.footer.legal.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-base text-slate-600 hover:text-tiffany-600 hover:bg-orange-100 transition-colors px-2 py-1 rounded"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-orange-200 pt-8">
          <p className="text-base text-slate-400 xl:text-center">
            &copy; {new Date().getFullYear()} OrangeCat. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
} 