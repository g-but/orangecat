import { motion } from 'framer-motion'
import { TransparencyScore } from './TransparencyScore'
import { Profile } from '@/types/database'

interface ProfileStatsProps {
  profile: Profile
}

export function ProfileStats({ profile }: ProfileStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="card mb-8"
    >
      <TransparencyScore profile={profile} />
    </motion.div>
  )
} 