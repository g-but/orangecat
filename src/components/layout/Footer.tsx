'use client';

import React from 'react';
import Link from 'next/link';
import { footerNavigation } from '@/config/navigation';
import { shouldShowFooter } from '@/config/routes';
import Logo from './Logo';
import { usePathname } from 'next/navigation';
import { ArrowUp } from 'lucide-react';

const Footer = React.memo(function Footer() {
  const pathname = usePathname();
  const shouldRender = shouldShowFooter(pathname);

  const scrollToTop = () => {
    if (typeof window !== 'undefined' && window.scrollTo) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Don't render footer on authenticated pages to avoid layout conflicts with sidebar
  if (!shouldRender) {
    return null;
  }

  return (
    <footer className="bg-white border-t border-gray-200/50 mt-auto relative">
      {/* Back to top button */}
      <button
        onClick={scrollToTop}
        className="absolute -top-6 right-4 sm:right-8 w-12 h-12 bg-gradient-to-r from-orange-500 to-tiffany-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 flex items-center justify-center group z-10"
        aria-label="Back to top"
        type="button"
      >
        <ArrowUp className="w-5 h-5 group-hover:animate-bounce" />
      </button>

      <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="sm:col-span-2 lg:col-span-1 space-y-6">
            <div className="space-y-4">
              <Logo className="mb-2" />
              <p className="text-slate-600 text-base leading-relaxed max-w-xs">
                Making Bitcoin donations simple and accessible for everyone.
              </p>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {footerNavigation.social.map(item => (
                <a
                  key={item.name}
                  href={item.href}
                  className="group w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-orange-500 hover:to-tiffany-500 transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow us on ${item.name}`}
                >
                  {item.icon && (
                    <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-gray-900 tracking-wider uppercase relative">
              <span className="bg-gradient-to-r from-orange-500 to-tiffany-500 bg-clip-text text-transparent">
                Navigation
              </span>
              <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-orange-500 to-tiffany-500 rounded-full"></div>
            </h3>
            <ul className="space-y-3">
              {footerNavigation.product.map(item => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="group flex items-center text-base text-slate-600 hover:text-orange-600 transition-all duration-300 py-2 px-2 rounded-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-tiffany-50 hover:shadow-sm min-h-[44px]"
                  >
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {item.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-gray-900 tracking-wider uppercase relative">
              <span className="bg-gradient-to-r from-orange-500 to-tiffany-500 bg-clip-text text-transparent">
                Legal
              </span>
              <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-orange-500 to-tiffany-500 rounded-full"></div>
            </h3>
            <ul className="space-y-3">
              {footerNavigation.legal.map(item => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="group flex items-center text-base text-slate-600 hover:text-orange-600 transition-all duration-300 py-2 px-2 rounded-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-tiffany-50 hover:shadow-sm min-h-[44px]"
                  >
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {item.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter/CTA Section */}
          <div className="space-y-6 sm:col-span-2 lg:col-span-1">
            <h3 className="text-sm font-bold text-gray-900 tracking-wider uppercase relative">
              <span className="bg-gradient-to-r from-orange-500 to-tiffany-500 bg-clip-text text-transparent">
                Stay Updated
              </span>
              <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-orange-500 to-tiffany-500 rounded-full"></div>
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Get the latest updates on Bitcoin fundraising and community building.
              </p>
              <Link
                href="/auth?mode=register"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-tiffany-500 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 min-h-[44px]"
              >
                Get Started Today
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gradient-to-r from-orange-200/50 to-tiffany-200/50">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <p className="text-sm text-slate-500 text-center sm:text-left">
              &copy; 2025 OrangeCat. All rights reserved.
            </p>

            {/* Additional Links */}
            <div className="flex items-center space-x-6 text-sm">
              <Link
                href="/docs"
                className="text-slate-500 hover:text-orange-600 transition-colors duration-300 hover:underline"
              >
                Documentation
              </Link>
              <a
                href="https://github.com/g-but/orangecat"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-orange-600 transition-colors duration-300 hover:underline"
              >
                Source Code
              </a>
              <Link
                href="/technology"
                className="text-slate-500 hover:text-orange-600 transition-colors duration-300 hover:underline"
              >
                Technology
              </Link>
              <Link
                href="/faq"
                className="text-slate-500 hover:text-orange-600 transition-colors duration-300 hover:underline"
              >
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
