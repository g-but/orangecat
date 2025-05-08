import { useEffect, useState } from 'react'
import { calculateTransparencyScore } from '@/services/transparency'
import { Profile } from '@/types/database'
import Card from '@/components/ui/Card'
import { Progress } from '@/components/ui/progress'
import { Info } from 'lucide-react'

interface TransparencyScoreProps {
  profile: Profile
}

export function TransparencyScore({ profile }: TransparencyScoreProps) {
  const [score, setScore] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadScore = async () => {
      try {
        const result = await calculateTransparencyScore(profile)
        setScore(result.score)
      } catch (error) {
        console.error('Error calculating transparency score:', error)
      } finally {
        setLoading(false)
      }
    }

    loadScore()
  }, [profile])

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Transparency Score</h3>
        <Info className="w-4 h-4 text-gray-400" />
      </div>
      <Progress value={score * 100} className="mb-2" />
      <p className="text-xs text-gray-500">
        {score >= 0.8 ? 'High' : score >= 0.5 ? 'Medium' : 'Low'} transparency
      </p>
    </Card>
  )
} 