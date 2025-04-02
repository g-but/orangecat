import { motion } from 'framer-motion'

interface ProfileHeaderProps {
  name: string
  description: string
}

export function ProfileHeader({ name, description }: ProfileHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center mb-12"
    >
      <h1 className="text-4xl font-bold mb-4">{name}</h1>
      <p className="text-xl text-slate-600 max-w-2xl mx-auto">
        {description}
      </p>
    </motion.div>
  )
} 