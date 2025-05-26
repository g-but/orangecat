'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, Info, FileText, Newspaper, Mail } from 'lucide-react'
import { navigation } from '@/config/navigation'

const aboutIcons = {
  'About Us': Info,
  'Documentation': FileText,
  'Blog': Newspaper,
  'Contact': Mail,
}

interface AboutDropdownProps {
  className?: string
  onLinkClick?: () => void
}

export default function AboutDropdown({ className = '', onLinkClick }: AboutDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLinkClick = () => {
    setIsOpen(false)
    onLinkClick?.()
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-tiffany-400 text-slate-700 hover:text-tiffany-600 hover:bg-orange-100"
      >
        About
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          {isMobile && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-20 z-40"
              onClick={() => setIsOpen(false)}
            />
          )}
          
          {/* Dropdown Panel */}
          <div className={`
            absolute z-50 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 
            ${isMobile 
              ? 'left-0 right-0 mx-4 max-w-sm' 
              : 'left-1/2 transform -translate-x-1/2 w-80'
            }
            animate-in fade-in slide-in-from-top-2 duration-200
          `}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">About OrangeCat</h3>
              <p className="text-sm text-gray-600 mt-1">
                Learn more about our platform and mission
              </p>
            </div>
            
            {/* About Items */}
            <div className="p-3">
              <div className="grid grid-cols-1 gap-1">
                {navigation.about.map((item) => {
                  const Icon = aboutIcons[item.name as keyof typeof aboutIcons] || Info
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={handleLinkClick}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <Icon className="w-5 h-5 text-tiffany-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 group-hover:text-tiffany-600 transition-colors">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 