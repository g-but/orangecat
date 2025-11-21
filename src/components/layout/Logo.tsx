'use client'

import Link from 'next/link'

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center space-x-1.5 sm:space-x-2 group min-h-[44px] py-2 ${className}`.trim()}>
      <span className="inline-block w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 align-middle flex-shrink-0">
        {/* Cuter, modern cat face SVG with Bitcoin orange accents */}
        <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Head */}
          <ellipse cx="20" cy="22" rx="14" ry="13" fill="#FFF3E6" stroke="#FF6B00" strokeWidth="2"/>
          {/* Ears */}
          <polygon points="7,15 13,5 16,17" fill="#FF6B00"/>
          <polygon points="33,15 27,5 24,17" fill="#FF6B00"/>
          {/* Eyes */}
          <ellipse cx="15" cy="22" rx="2.2" ry="2.8" fill="#222"/>
          <ellipse cx="25" cy="22" rx="2.2" ry="2.8" fill="#222"/>
          {/* Nose */}
          <ellipse cx="20" cy="27" rx="1.2" ry="1" fill="#FF6B00"/>
          {/* Smile */}
          <path d="M18 29 Q20 31 22 29" stroke="#FF6B00" strokeWidth="1.2" fill="none"/>
          {/* Whiskers */}
          <path d="M8 25 Q13 27 16 25" stroke="#FF6B00" strokeWidth="1" fill="none"/>
          <path d="M32 25 Q27 27 24 25" stroke="#FF6B00" strokeWidth="1" fill="none"/>
        </svg>
      </span>
      <span className="text-lg sm:text-xl md:text-2xl font-bold text-tiffany-600 group-hover:text-orange-500 transition-colors whitespace-nowrap hidden sm:block">OrangeCat</span>
    </Link>
  )
} 