'use client'

import { motion } from 'framer-motion'
import { Bitcoin } from 'lucide-react'

interface ProfileHeaderProps {
  name: string
  description: string
  transparencyScore: number
  transparencyColor: string
}

export function ProfileHeader({ name, description, transparencyScore, transparencyColor }: ProfileHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-8"
    >
      <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
        {/* Profile Icon */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center">
            <Bitcoin className="w-12 h-12 text-orange-600" />
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{name}</h1>
          <p className="text-lg text-gray-600 mb-4">{description}</p>
          
          {/* Transparency Score */}
          <div className="flex items-center justify-center md:justify-start space-x-2">
            <span className="text-sm font-medium text-gray-500">Transparency Score:</span>
            <span className={`text-lg font-semibold ${transparencyColor}`}>
              {transparencyScore}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 