export interface DefaultAvatarProps {
  size?: number
  className?: string
}

export default function DefaultAvatar({ size = 32, className = '' }: DefaultAvatarProps) {
  return (
    <div 
      className={`rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center border-2 border-orange-300 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        width={size * 0.6} 
        height={size * 0.6} 
        viewBox="0 0 24 24" 
        fill="none"
        className="text-orange-600"
      >
        {/* Cat face */}
        <circle cx="12" cy="13" r="8" fill="currentColor" opacity="0.1"/>
        
        {/* Cat ears */}
        <path d="M8 6 L10 10 L6 10 Z" fill="currentColor" opacity="0.8"/>
        <path d="M16 6 L18 10 L14 10 Z" fill="currentColor" opacity="0.8"/>
        
        {/* Inner ears */}
        <path d="M8.5 7.5 L9.5 9 L7.5 9 Z" fill="currentColor" opacity="0.3"/>
        <path d="M15.5 7.5 L16.5 9 L14.5 9 Z" fill="currentColor" opacity="0.3"/>
        
        {/* Eyes */}
        <circle cx="9.5" cy="12" r="1" fill="currentColor"/>
        <circle cx="14.5" cy="12" r="1" fill="currentColor"/>
        
        {/* Eye shine */}
        <circle cx="9.8" cy="11.7" r="0.3" fill="white"/>
        <circle cx="14.8" cy="11.7" r="0.3" fill="white"/>
        
        {/* Nose */}
        <path d="M12 14 L11 15 L13 15 Z" fill="currentColor" opacity="0.6"/>
        
        {/* Mouth */}
        <path d="M12 15 Q10 16 9 15" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.6"/>
        <path d="M12 15 Q14 16 15 15" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.6"/>
        
        {/* Whiskers */}
        <line x1="6" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
        <line x1="6" y1="14" x2="8" y2="13" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
        <line x1="16" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
        <line x1="16" y1="13" x2="18" y2="14" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
      </svg>
    </div>
  )
} 