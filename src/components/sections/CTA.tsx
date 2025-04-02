'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function CTA() {
  return (
    <section className="section">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-tiffany-gradient p-8 md:p-12"
        >
          <div className="relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Start Accepting Bitcoin Donations?
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Join thousands of creators and organizations using Palfare to accept Bitcoin donations.
              </p>
              <Link href="/create" className="btn bg-white text-tiffany hover:bg-white/90">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Decorative background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          </div>
        </motion.div>
      </div>
    </section>
  )
} 