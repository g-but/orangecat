export interface TransparencyMetric {
  id: string
  name: string
  description: string
  weight: number
  status: 'good' | 'needs-improvement' | 'critical'
  currentState: string
  improvements?: string[]
  verificationSteps?: string[]
}

export interface TransparencyScore {
  score: number
  color: string
  description: string
  metrics: TransparencyMetric[]
}

export interface TransparencyData {
  transactionCount: number
  hasPublicBalance: boolean
  verificationLevel: number
  activityLogCount: number
  isCodePublic: boolean
}

export const TRANSPARENCY_METRICS: TransparencyMetric[] = [
  {
    id: 'transactionHistory',
    name: 'Transaction History',
    description: 'All Bitcoin transactions are publicly visible and verifiable on the blockchain.',
    weight: 0.25,
    status: 'good',
    currentState: 'All transactions are publicly visible and can be verified on the blockchain.',
    verificationSteps: [
      'Check our Bitcoin address on any blockchain explorer',
      'Monitor transaction history for consistency',
      'Verify transaction timestamps and amounts'
    ]
  },
  {
    id: 'balanceVisibility',
    name: 'Balance Visibility',
    description: 'Current and historical balances are publicly visible.',
    weight: 0.2,
    status: 'good',
    currentState: 'Current balance is always displayed and can be verified on the blockchain.',
    verificationSteps: [
      'Verify current balance matches blockchain data',
      'Check balance history consistency',
      'Monitor balance changes'
    ]
  },
  {
    id: 'verificationStatus',
    name: 'Verification Status',
    description: 'Level of identity verification and project legitimacy.',
    weight: 0.2,
    status: 'critical',
    currentState: 'Basic verification completed, but additional steps needed.',
    improvements: [
      'Complete full identity verification',
      'Implement regular verification updates',
      'Add team member verification'
    ],
    verificationSteps: [
      'Review current verification documents',
      'Check verification timestamps',
      'Verify verification provider'
    ]
  },
  {
    id: 'activityLogging',
    name: 'Activity Logging',
    description: 'Public logging of project activities and development progress.',
    weight: 0.15,
    status: 'needs-improvement',
    currentState: 'Limited activity logging implemented.',
    improvements: [
      'Implement regular development updates',
      'Add detailed progress tracking',
      'Create public roadmap'
    ],
    verificationSteps: [
      'Review current activity logs',
      'Check progress against milestones',
      'Verify team contributions'
    ]
  },
  {
    id: 'codeTransparency',
    name: 'Code Transparency',
    description: 'Project code and documentation are publicly available.',
    weight: 0.2,
    status: 'good',
    currentState: 'All code is open source and available on GitHub.',
    verificationSteps: [
      'Review GitHub repository',
      'Check code commits',
      'Verify documentation completeness'
    ]
  }
]

export const DEFAULT_TRANSPARENCY_DATA: TransparencyData = {
  transactionCount: 0,
  hasPublicBalance: false,
  verificationLevel: 0,
  activityLogCount: 0,
  isCodePublic: false
}

export const calculateTransparencyScore = (
  metrics: TransparencyMetric[],
  data: Partial<TransparencyData> = {}
): TransparencyScore => {
  // Merge provided data with defaults
  const transparencyData = { ...DEFAULT_TRANSPARENCY_DATA, ...data }

  // Calculate individual metric scores
  const calculatedMetrics = metrics.map(metric => {
    let value = 0

    switch (metric.id) {
      case 'transactionHistory':
        value = Math.min(transparencyData.transactionCount * 10, 100)
        break
      case 'balanceVisibility':
        value = transparencyData.hasPublicBalance ? 100 : 0
        break
      case 'verificationStatus':
        value = transparencyData.verificationLevel
        break
      case 'activityLogging':
        value = Math.min(transparencyData.activityLogCount * 10, 100)
        break
      case 'codeTransparency':
        value = transparencyData.isCodePublic ? 100 : 0
        break
    }

    return {
      ...metric,
      value
    }
  })

  // Calculate total score
  const totalScore = calculatedMetrics.reduce((sum, metric) => {
    return sum + (metric.value * metric.weight)
  }, 0)

  // Determine color and description based on score
  let color = ''
  let description = ''

  if (totalScore >= 90) {
    color = 'text-green-500'
    description = 'Excellent transparency'
  } else if (totalScore >= 70) {
    color = 'text-yellow-500'
    description = 'Good transparency'
  } else if (totalScore >= 50) {
    color = 'text-orange-500'
    description = 'Moderate transparency'
  } else {
    color = 'text-red-500'
    description = 'Limited transparency'
  }

  return {
    score: Math.round(totalScore),
    color,
    description,
    metrics: calculatedMetrics
  }
} 