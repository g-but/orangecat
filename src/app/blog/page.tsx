'use client'

import { motion } from 'framer-motion'
import { BookOpen, Bitcoin, Globe, Shield, Zap } from 'lucide-react'

const topics = [
  {
    icon: Bitcoin,
    title: 'Bitcoin & Donations',
    description: 'Exploring how Bitcoin is revolutionizing charitable giving and creating new opportunities for transparent donations.'
  },
  {
    icon: Globe,
    title: 'Global Impact',
    description: 'Stories of how Bitcoin donations are making a difference worldwide, from local communities to global initiatives.'
  },
  {
    icon: Shield,
    title: 'Privacy & Security',
    description: 'Understanding the importance of privacy in donations and how Bitcoin provides secure, transparent giving.'
  },
  {
    icon: Zap,
    title: 'Innovation & Future',
    description: 'Insights into the future of donations and how technology is shaping the way we support causes we care about.'
  }
]

export default function BlogPage() {
  return (
    <main className="min-h-screen pt-20">
      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center mb-16"
          >
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 rounded-full bg-tiffany/10 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-tiffany" />
              </div>
            </div>
            <h1 className="mb-4">Our Blog is Coming Soon</h1>
            <p className="text-xl text-slate-600 mb-8">
              We&apos;re crafting insightful content about Bitcoin, transparent donations, and the future of charitable giving.
            </p>
            <p className="text-lg text-slate-500">
              Subscribe to our newsletter to be the first to know when we publish.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {topics.map((topic, index) => (
              <motion.div
                key={topic.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className="card p-6"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-tiffany/10 flex items-center justify-center">
                    <topic.icon className="w-6 h-6 text-tiffany" />
                  </div>
                  <h3 className="text-xl font-bold">{topic.title}</h3>
                </div>
                <p className="text-slate-600">{topic.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </main>
  )
} 