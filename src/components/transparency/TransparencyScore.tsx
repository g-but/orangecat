'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { TransparencyMetric, calculateTransparencyScore } from '@/lib/transparency'

interface TransparencyScoreProps {
  metrics: TransparencyMetric[]
}

export function TransparencyScore({ metrics }: TransparencyScoreProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { score, color, description, metrics: calculatedMetrics } = calculateTransparencyScore(metrics)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Transparency Score</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`text-2xl font-bold ${color}`}>{score}%</span>
            <span className="text-sm text-gray-500">{description}</span>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <motion.div
            className={`h-2.5 rounded-full ${
              score >= 90 ? 'bg-green-500' :
              score >= 70 ? 'bg-yellow-500' :
              score >= 50 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3">
                {calculatedMetrics.map((metric) => (
                  <div key={metric.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {metric.enabled ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm text-gray-700">{metric.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{Math.round(metric.weight * 100)}% weight</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
} 