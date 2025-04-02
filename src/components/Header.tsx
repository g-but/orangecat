'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-[#0ABAB5] hover:text-[#0A9A95] transition-colors">
                Palfare
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                  pathname === '/'
                    ? 'text-[#0ABAB5] border-b-2 border-[#0ABAB5]'
                    : 'text-gray-500 hover:text-[#0ABAB5]'
                }`}
              >
                Home
              </Link>
              <Link
                href="/about"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                  pathname === '/about'
                    ? 'text-[#0ABAB5] border-b-2 border-[#0ABAB5]'
                    : 'text-gray-500 hover:text-[#0ABAB5]'
                }`}
              >
                About
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <Link
              href="/create"
              className="ml-8 inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-full text-sm font-medium text-white bg-[#0ABAB5] hover:bg-[#0A9A95] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0ABAB5] transition-colors shadow-sm"
            >
              Create Donation Page
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
} 