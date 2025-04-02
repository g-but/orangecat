import { motion } from 'framer-motion'
import { Shield, Eye } from 'lucide-react'

interface ProfileStatsProps {
  trustScore: number
  transparencyScore: number
}

export function ProfileStats({ trustScore, transparencyScore }: ProfileStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex justify-center gap-8 mb-12"
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-tiffany" />
          <span className="font-semibold">Trust Score</span>
        </div>
        <div className="text-3xl font-bold text-tiffany">{trustScore}%</div>
      </div>
      
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Eye className="w-5 h-5 text-tiffany" />
          <span className="font-semibold">Transparency</span>
        </div>
        <div className="text-3xl font-bold text-tiffany">{transparencyScore}%</div>
      </div>
    </motion.div>
  )
} 