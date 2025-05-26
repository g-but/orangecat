import { cn } from '@/lib/utils'
import { convertSatoshisToAll, formatBitcoinWithChf, CurrencyConversion } from '@/utils/currency'

interface CurrencyDisplayProps {
  satoshis?: number
  bitcoin?: number
  conversion?: CurrencyConversion
  showChf?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  layout?: 'horizontal' | 'vertical'
  className?: string
  bitcoinClassName?: string
  chfClassName?: string
}

export function CurrencyDisplay({
  satoshis,
  bitcoin,
  conversion,
  showChf = true,
  size = 'md',
  layout = 'horizontal',
  className,
  bitcoinClassName,
  chfClassName
}: CurrencyDisplayProps) {
  // Determine the conversion to use
  let finalConversion: CurrencyConversion
  
  if (conversion) {
    finalConversion = conversion
  } else if (satoshis !== undefined) {
    finalConversion = convertSatoshisToAll(satoshis)
  } else if (bitcoin !== undefined) {
    finalConversion = convertSatoshisToAll(bitcoin * 100000000)
  } else {
    throw new Error('Must provide either satoshis, bitcoin, or conversion')
  }

  const formatted = formatBitcoinWithChf(finalConversion)

  const sizeClasses = {
    sm: {
      bitcoin: 'text-sm font-medium',
      chf: 'text-xs text-gray-500'
    },
    md: {
      bitcoin: 'text-lg font-semibold',
      chf: 'text-sm text-gray-600'
    },
    lg: {
      bitcoin: 'text-xl font-bold',
      chf: 'text-base text-gray-600'
    },
    xl: {
      bitcoin: 'text-3xl font-bold',
      chf: 'text-lg text-gray-600'
    }
  }

  const isVertical = layout === 'vertical'

  if (!showChf) {
    return (
      <span className={cn(sizeClasses[size].bitcoin, bitcoinClassName, className)}>
        {formatted.bitcoin}
      </span>
    )
  }

  if (isVertical) {
    return (
      <div className={cn("flex flex-col", className)}>
        <span className={cn(sizeClasses[size].bitcoin, bitcoinClassName)}>
          {formatted.bitcoin}
        </span>
        <span className={cn(sizeClasses[size].chf, chfClassName)}>
          {formatted.chf}
        </span>
      </div>
    )
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn(sizeClasses[size].bitcoin, bitcoinClassName)}>
        {formatted.bitcoin}
      </span>
      <span className={cn(sizeClasses[size].chf, chfClassName)}>
        ({formatted.chf})
      </span>
    </span>
  )
}

interface BitcoinAmountProps {
  satoshis?: number
  bitcoin?: number
  showLabel?: boolean
  label?: string
  className?: string
}

export function BitcoinAmount({ 
  satoshis, 
  bitcoin, 
  showLabel = true, 
  label = "Amount",
  className 
}: BitcoinAmountProps) {
  return (
    <div className={cn("flex flex-col space-y-1", className)}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      )}
      <CurrencyDisplay 
        satoshis={satoshis}
        bitcoin={bitcoin}
        size="lg"
        layout="vertical"
      />
    </div>
  )
} 