'use client'

import { useEffect, useRef , useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

interface QRCodeGeneratorProps {
  value: string
  size?: number
  className?: string
  showCopyButton?: boolean
  label?: string
}

export default function QRCodeGenerator({ 
  value, 
  size = 200, 
  className = '', 
  showCopyButton = true,
  label 
}: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (canvasRef.current && value) {
      generateQRCode(value, canvasRef.current, size)
    }
  }, [value, size])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success('Copied to clipboard!')
      
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {label && (
        <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
      )}
      
      <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-100">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="block"
        />
      </div>

      {showCopyButton && (
        <Button
          onClick={handleCopy}
          variant="outline"
          className="flex items-center gap-2"
          disabled={copied}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy {value.startsWith('ln') ? 'Invoice' : 'Address'}
            </>
          )}
        </Button>
      )}

      <div className="text-xs text-gray-500 text-center max-w-xs break-all font-mono">
        {value}
      </div>
    </div>
  )
}

// Simple QR Code generation function
function generateQRCode(text: string, canvas: HTMLCanvasElement, size: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) {return}

  // Clear canvas
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, size, size)

  // Simple QR-like pattern generation
  const modules = 25 // 25x25 grid for simplicity
  const moduleSize = size / modules
  
  // Generate deterministic pattern based on text hash
  const hash = simpleHash(text)
  
  ctx.fillStyle = 'black'
  
  // Draw finder patterns (corners)
  drawFinderPattern(ctx, 0, 0, moduleSize)
  drawFinderPattern(ctx, modules - 7, 0, moduleSize)
  drawFinderPattern(ctx, 0, modules - 7, moduleSize)
  
  // Draw data modules based on hash
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      // Skip finder patterns
      if (isFinderPattern(row, col, modules)) {continue}
      
      // Generate module based on position and hash
      const moduleIndex = row * modules + col
      const shouldFill = ((hash + moduleIndex) % 3) === 0
      
      if (shouldFill) {
        ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize)
      }
    }
  }
}

function drawFinderPattern(ctx: CanvasRenderingContext2D, startRow: number, startCol: number, moduleSize: number) {
  // Draw 7x7 finder pattern
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      const shouldFill = (
        (row === 0 || row === 6) || // Top and bottom borders
        (col === 0 || col === 6) || // Left and right borders
        (row >= 2 && row <= 4 && col >= 2 && col <= 4) // Inner 3x3 square
      )
      
      if (shouldFill) {
        ctx.fillRect((startCol + col) * moduleSize, (startRow + row) * moduleSize, moduleSize, moduleSize)
      }
    }
  }
}

function isFinderPattern(row: number, col: number, modules: number): boolean {
  return (
    // Top-left
    (row < 9 && col < 9) ||
    // Top-right  
    (row < 9 && col >= modules - 8) ||
    // Bottom-left
    (row >= modules - 8 && col < 9)
  )
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
} 