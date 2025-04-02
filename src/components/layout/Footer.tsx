'use client'

import Link from 'next/link'
import { Bitcoin, Github, Twitter } from 'lucide-react'

const navigation = {
  main: [
    { name: 'Home', href: '/' },
    { name: 'Create', href: '/create' },
    { name: 'Donate', href: '/donate' },
  ],
  social: [
    {
      name: 'Twitter',
      href: 'https://twitter.com/palfare',
      icon: Twitter,
    },
    {
      name: 'GitHub',
      href: 'https://github.com/g-but/palfare',
      icon: Github,
    },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link href="/" className="flex items-center space-x-2">
              <Bitcoin className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">Palfare</span>
            </Link>
            <p className="text-gray-500 text-base">
              Making Bitcoin donations simple and accessible for everyone.
            </p>
            <div className="flex space-x-6">
              {navigation.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-400 hover:text-gray-500"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                Navigation
              </h3>
              <ul className="mt-4 space-y-4">
                {navigation.main.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-base text-gray-500 hover:text-gray-900"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                Legal
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link
                    href="/privacy"
                    className="text-base text-gray-500 hover:text-gray-900"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-base text-gray-500 hover:text-gray-900"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-400 xl:text-center">
            &copy; {new Date().getFullYear()} Palfare. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
} 