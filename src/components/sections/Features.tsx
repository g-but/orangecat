'use client'

import { motion } from 'framer-motion'
import { Bitcoin, Zap, Shield, Globe } from 'lucide-react'

const features = [
  {
    icon: Bitcoin,
    title: 'Bitcoin First',
    description: 'Built specifically for Bitcoin, with support for Lightning Network coming soon.',
  },
  {
    icon: Zap,
    title: 'Simple Setup',
    description: 'Create a beautiful donation page in minutes, no technical knowledge required.',
  },
  {
    icon: Shield,
    title: 'Secure',
    description: 'Your Bitcoin address is the only thing we need - no accounts, no passwords.',
  },
  {
    icon: Globe,
    title: 'Global',
    description: 'Accept donations from anywhere in the world, instantly and without borders.',
  },
]

export default function Features() {
  return (
    <section className="section bg-slate-50">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            Why Choose Palfare?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-slate-600"
          >
            Simple, secure, and efficient Bitcoin donation platform
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-tiffany/10 text-tiffany mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 