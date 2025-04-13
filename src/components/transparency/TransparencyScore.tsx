'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Info, Check, AlertTriangle, AlertCircle } from 'lucide-react'
import { TransparencyMetric, calculateTransparencyScore, TRANSPARENCY_METRICS, TransparencyData } from '@/lib/transparency'

interface TransparencyScoreProps {
  data?: Partial<TransparencyData>
  metrics?: TransparencyMetric[]
}

export function TransparencyScore({ data, metrics = TRANSPARENCY_METRICS }: TransparencyScoreProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { score, color, description, metrics: calculatedMetrics } = calculateTransparencyScore(metrics, data)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <Check className="h-5 w-5 text-green-500" />
      case 'needs-improvement':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-50 text-green-800'
      case 'needs-improvement':
        return 'bg-yellow-50 text-yellow-800'
      case 'critical':
        return 'bg-red-50 text-red-800'
      default:
        return ''
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-semibold text-gray-900">Transparency Report</h3>
          <div className="relative group">
            <button className="text-gray-400 hover:text-gray-600 focus:outline-none">
              <Info className="h-5 w-5" />
            </button>
            <div className="absolute left-0 bottom-full mb-2 w-80 p-4 bg-white rounded-lg shadow-lg text-sm text-gray-600 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <p>Our transparency score measures how openly we share information about our project and operations. Higher scores indicate greater transparency.</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {/* Score Display */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className={`text-4xl font-bold ${color}`}>{score}%</div>
          <div>
            <div className="text-sm font-medium text-gray-900">{description}</div>
            <div className="text-xs text-gray-500">Based on 5 key transparency metrics</div>
          </div>
        </div>
        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${
              score >= 90 ? 'bg-green-500' :
              score >= 70 ? 'bg-yellow-500' :
              score >= 50 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-6">
              {/* Current Status */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Current Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {calculatedMetrics.map(metric => (
                    <div key={metric.id} className={`p-4 rounded-lg ${getStatusColor(metric.status)}`}>
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(metric.status)}
                        <div>
                          <h5 className="font-medium">{metric.name}</h5>
                          <p className="text-sm mt-1">{metric.currentState}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Areas for Improvement */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Areas for Improvement</h4>
                <div className="space-y-4">
                  {calculatedMetrics
                    .filter(metric => metric.improvements)
                    .map(metric => (
                      <div key={metric.id} className="bg-yellow-50 p-4 rounded-lg">
                        <h5 className="font-medium text-yellow-800 mb-2">{metric.name}</h5>
                        <ul className="space-y-1 text-yellow-700">
                          {metric.improvements?.map((improvement, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span>•</span>
                              <span>{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>
              </div>

              {/* How to Verify */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">How to Verify</h4>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <ul className="space-y-2 text-blue-700">
                    {calculatedMetrics.map(metric => (
                      metric.verificationSteps?.map((step, index) => (
                        <li key={`${metric.id}-${index}`} className="flex items-start space-x-2">
                          <span>•</span>
                          <span>{step}</span>
                        </li>
                      ))
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
} 