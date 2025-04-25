'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Heart, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function Hero() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const handleStartFundraising = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isLoading) return
    
    if (!user) {
      router.push('/auth?mode=login&redirect=/create')
    } else {
      router.push('/create')
    }
  }

  return (
    <section className="section relative overflow-hidden min-h-[80vh] flex items-center bg-gradient-to-b from-white to-slate-50">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-2 rounded-full bg-tiffany-500/10 text-tiffany-500 text-sm font-medium mb-6"
          >
            Transparent Bitcoin Fundraising
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
          >
            Fund Your Project with{' '}
            <span className="text-orange-500">Bitcoin</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto"
          >
            Create a transparent fundraising page in minutes. Every transaction is verifiable on the blockchain.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <button 
              onClick={handleStartFundraising}
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-tiffany-500 rounded-lg hover:bg-tiffany-600 transition-colors"
            >
              Start Fundraising
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
            <a
              href="/fund-us"
              className="inline-flex items-center justify-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 sm:w-auto"
            >
              Fund Us
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 text-slate-600">
              <CheckCircle2 className="h-5 w-5 text-tiffany-500" />
              <span>Open Source</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-600">
              <CheckCircle2 className="h-5 w-5 text-orange-500" />
              <span>Bitcoin Only</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-600">
              <CheckCircle2 className="h-5 w-5 text-tiffany-500" />
              <span>Fully Transparent</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-tiffany-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
      </div>
    </section>
  )
} 