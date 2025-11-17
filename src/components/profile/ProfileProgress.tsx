'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileProgressProps {
  percentage: number
  className?: string
}

export function ProfileProgress({ percentage, className }: ProfileProgressProps) {
  const getCompletionMessage = () => {
    if (percentage === 100) {
      return "Amazing profile! You're all set! 🌟"
    }
    if (percentage >= 80) {
      return "Almost perfect! Just a few more details! 🚀"
    }
    if (percentage >= 60) {
      return "Looking great! Keep it up! 💪"
    }
    if (percentage >= 40) {
      return "Nice start! Add more to stand out! ✨"
    }
    return "Let's make your profile awesome! 🎨"
  }

  const getCompletionColor = () => {
    if (percentage >= 80) {
      return 'bg-gradient-to-r from-green-400 to-green-600'
    }
    if (percentage >= 60) {
      return 'bg-gradient-to-r from-yellow-400 to-orange-500'
    }
    if (percentage >= 40) {
      return 'bg-gradient-to-r from-orange-400 to-orange-600'
    }
    return 'bg-gradient-to-r from-gray-400 to-gray-600'
  }

  return (
    <motion.div
      className={cn("bg-white rounded-full px-6 py-3 shadow-xl", className)}
      whileHover={{ scale: 1.05 }}
    >
      <div className="flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-orange-500" />
        <div>
          <div className="text-xs font-medium text-gray-500">Profile Completion</div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <motion.div
                className={cn("h-full transition-all duration-700 ease-out", getCompletionColor())}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm font-bold text-gray-900">{percentage}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface ProfileProgressHeaderProps {
  percentage: number
  className?: string
}

export function ProfileProgressHeader({ percentage, className }: ProfileProgressHeaderProps) {
  return (
    <div className={cn("hidden md:block", className)}>
      <div className="text-right">
        <div className="text-sm text-gray-600 mb-1">Profile Strength</div>
        <div className="text-2xl font-bold text-orange-600">{percentage}%</div>
      </div>
    </div>
  )
}

