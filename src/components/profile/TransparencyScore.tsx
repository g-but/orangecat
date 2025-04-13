import { motion } from 'framer-motion'
import { Info } from 'lucide-react'

interface TransparencyScoreProps {
  score: number
  className?: string
}

export function TransparencyScore({ score, className = '' }: TransparencyScoreProps) {
  // Ensure score is between 0 and 100
  const validScore = Math.min(Math.max(score, 0), 100)
  
  // Color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-tiffany-500'
    if (score >= 60) return 'bg-orange-400'
    if (score >= 40) return 'bg-orange-500'
    if (score >= 20) return 'bg-orange-600'
    return 'bg-orange-700'
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-slate-700">Transparency Score</h3>
          <div className="group relative">
            <Info className="w-4 h-4 text-slate-400" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-white rounded-lg shadow-lg text-xs text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Score based on public transaction history, annotations, and verification status
            </div>
          </div>
        </div>
        <span className="text-sm font-medium text-slate-900">{validScore}%</span>
      </div>
      
      <div className="relative">
        {/* Background scale with markers */}
        <div className="absolute inset-0 flex justify-between px-1 -mx-1">
          {[0, 25, 50, 75, 100].map((marker) => (
            <div key={marker} className="h-full w-px bg-slate-200" />
          ))}
        </div>
        
        {/* Score bar */}
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${validScore}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full ${getScoreColor(validScore)}`}
          />
        </div>
        
        {/* Scale labels */}
        <div className="flex justify-between px-1 -mx-1 mt-1">
          {[0, 25, 50, 75, 100].map((marker) => (
            <div key={marker} className="text-[10px] text-slate-400">
              {marker}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 