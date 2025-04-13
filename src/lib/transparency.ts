export interface TransparencyMetric {
  id: string
  name: string
  description: string
  weight: number
  enabled: boolean
}

export interface TransparencyScore {
  score: number
  color: string
  description: string
  metrics: TransparencyMetric[]
}

export const TRANSPARENCY_METRICS: TransparencyMetric[] = [
  {
    id: 'openSource',
    name: 'Open Source Code',
    description: 'Project code is publicly available and verifiable',
    weight: 0.5,
    enabled: true
  },
  {
    id: 'profileInfo',
    name: 'Complete Profile Information',
    description: 'Project maintains up-to-date and comprehensive profile information',
    weight: 0.1,
    enabled: true
  },
  {
    id: 'publicBalance',
    name: 'Public Balance',
    description: 'Current balance is publicly visible',
    weight: 0.1,
    enabled: true
  },
  {
    id: 'publicTransactions',
    name: 'Public Transactions',
    description: 'Transaction history is publicly visible',
    weight: 0.1,
    enabled: true
  },
  {
    id: 'activityLog',
    name: 'Activity Logging',
    description: 'Project activities are logged and visible',
    weight: 0.1,
    enabled: false
  },
  {
    id: 'screenRecording',
    name: 'Screen Recording',
    description: 'Project activities are screen recorded',
    weight: 0.1,
    enabled: false
  }
]

export const calculateTransparencyScore = (metrics: TransparencyMetric[]): TransparencyScore => {
  const totalWeight = metrics.reduce((sum, metric) => sum + metric.weight, 0)
  const score = metrics.reduce((sum, metric) => 
    sum + (metric.enabled ? metric.weight : 0), 0) / totalWeight * 100

  let color = 'text-red-500'
  let description = 'Limited Transparency'

  if (score >= 90) {
    color = 'text-green-500'
    description = 'Excellent Transparency'
  } else if (score >= 70) {
    color = 'text-yellow-500'
    description = 'Good Transparency'
  } else if (score >= 50) {
    color = 'text-orange-500'
    description = 'Moderate Transparency'
  }

  return {
    score: Math.round(score),
    color,
    description,
    metrics
  }
} 