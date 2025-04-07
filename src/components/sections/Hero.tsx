'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Heart } from 'lucide-react'

export default function Hero() {
  return (
    <section className="section relative overflow-hidden min-h-[80vh] flex items-center">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            Accept Bitcoin Donations{' '}
            <span className="text-tiffany">with Ease</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-slate-600 mb-8"
          >
            Create your donation page in seconds and start accepting crypto contributions today.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/create" className="btn btn-primary">
              Create Donation Page
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/donate" className="btn btn-secondary">
              Donate Now
              <Heart className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl">
          <div className="absolute top-0 left-0 w-64 h-64 bg-tiffany/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-tiffany/5 rounded-full blur-3xl" />
        </div>
      </div>
    </section>
  )
} 