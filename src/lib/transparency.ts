export interface TransparencyMetric {
  id: string
  name: string
  description: string
  weight: number
  status: 'good' | 'needs-improvement' | 'critical'
  currentState: string
  improvements?: string[]
  verificationSteps?: string[]
  criteria?: string[]
}

export interface TransparencyScore {
  score: number
  color: string
  description: string
  metrics: TransparencyMetric[]
}

export interface TransparencyData {
  isOpenSource: boolean
  hasContributionGuidelines: boolean
  hasIssueTracking: boolean
  hasMissionStatement: boolean
  hasKPIs: boolean
  hasProgressUpdates: boolean
  hasTransactionHistory: boolean
  hasTransactionComments: boolean
  hasFinancialReports: boolean
  hasPublicChannels: boolean
  hasCommunityUpdates: boolean
  isResponsiveToFeedback: boolean
}

export const TRANSPARENCY_METRICS: TransparencyMetric[] = [
  {
    id: 'openSource',
    name: 'Open Source',
    description: 'Project code is publicly available and contributions are welcome.',
    weight: 0.25,
    status: 'good',
    currentState: 'Full source code access with active contribution guidelines and public issue tracking.',
    criteria: [
      'Full source code access',
      'Active contribution guidelines',
      'Public issue tracking'
    ],
    verificationSteps: [
      'Review GitHub repository',
      'Check contribution guidelines',
      'Verify issue tracking system'
    ]
  },
  {
    id: 'missionAccountability',
    name: 'Mission Accountability',
    description: 'Clear KPIs and regular progress reports are provided.',
    weight: 0.25,
    status: 'good',
    currentState: 'Well-defined mission statement with measurable KPIs and regular progress updates.',
    criteria: [
      'Defined mission statement',
      'Measurable KPIs',
      'Regular progress updates'
    ],
    verificationSteps: [
      'Review mission statement',
      'Check KPI dashboard',
      'Verify progress reports'
    ]
  },
  {
    id: 'financialAccountability',
    name: 'Financial Accountability',
    description: 'All transactions are visible and explained.',
    weight: 0.25,
    status: 'good',
    currentState: 'Complete transaction history with detailed comments and regular financial reports.',
    criteria: [
      'Public transaction history',
      'Detailed transaction comments',
      'Regular financial reports'
    ],
    verificationSteps: [
      'Review transaction history',
      'Check transaction comments',
      'Verify financial reports'
    ]
  },
  {
    id: 'communityEngagement',
    name: 'Community Engagement',
    description: 'Active response to comments and community feedback.',
    weight: 0.25,
    status: 'good',
    currentState: 'Active public communication channels with regular updates and responsive feedback system.',
    criteria: [
      'Public communication channels',
      'Regular community updates',
      'Responsive to feedback'
    ],
    verificationSteps: [
      'Review communication channels',
      'Check update frequency',
      'Verify response times'
    ]
  }
]

export const DEFAULT_TRANSPARENCY_DATA: TransparencyData = {
  isOpenSource: false,
  hasContributionGuidelines: false,
  hasIssueTracking: false,
  hasMissionStatement: false,
  hasKPIs: false,
  hasProgressUpdates: false,
  hasTransactionHistory: false,
  hasTransactionComments: false,
  hasFinancialReports: false,
  hasPublicChannels: false,
  hasCommunityUpdates: false,
  isResponsiveToFeedback: false
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
    let criteriaMet = 0
    let totalCriteria = 0

    switch (metric.id) {
      case 'openSource':
        criteriaMet = [
          transparencyData.isOpenSource,
          transparencyData.hasContributionGuidelines,
          transparencyData.hasIssueTracking
        ].filter(Boolean).length
        totalCriteria = 3
        break
      case 'missionAccountability':
        criteriaMet = [
          transparencyData.hasMissionStatement,
          transparencyData.hasKPIs,
          transparencyData.hasProgressUpdates
        ].filter(Boolean).length
        totalCriteria = 3
        break
      case 'financialAccountability':
        criteriaMet = [
          transparencyData.hasTransactionHistory,
          transparencyData.hasTransactionComments,
          transparencyData.hasFinancialReports
        ].filter(Boolean).length
        totalCriteria = 3
        break
      case 'communityEngagement':
        criteriaMet = [
          transparencyData.hasPublicChannels,
          transparencyData.hasCommunityUpdates,
          transparencyData.isResponsiveToFeedback
        ].filter(Boolean).length
        totalCriteria = 3
        break
    }

    value = (criteriaMet / totalCriteria) * 100

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