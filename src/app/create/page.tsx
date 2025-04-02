'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bitcoin, ArrowRight, Settings } from 'lucide-react'

export default function CreatePage() {
  const [address, setAddress] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  return (
    <main className="min-h-screen pt-20">
      <section className="section">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h1 className="mb-4">Create Donation Page</h1>
              <p className="text-xl text-slate-600">
                Set up your Bitcoin donation page in minutes
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="card"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-tiffany/10 text-tiffany mb-6 mx-auto">
                <Settings className="w-8 h-8" />
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                    Page Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter a name for your donation page"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-tiffany focus:ring-2 focus:ring-tiffany/20 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell people about your cause"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-tiffany focus:ring-2 focus:ring-tiffany/20 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-2">
                    Bitcoin Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your Bitcoin address"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-tiffany focus:ring-2 focus:ring-tiffany/20 transition-colors"
                  />
                </div>

                <button
                  className="w-full btn btn-primary"
                  disabled={!address || !name}
                >
                  Create Page
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  )
} 