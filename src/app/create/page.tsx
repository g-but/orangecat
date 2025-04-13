'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bitcoin, ArrowRight, Settings } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function CreatePage() {
  const [address, setAddress] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  return (
    <ProtectedRoute>
      <main className="min-h-screen pt-20 bg-gradient-to-b from-white to-gray-50">
        <section className="section">
          <div className="container">
            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12"
              >
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Create Donation Page
                </h1>
                <p className="text-xl text-gray-600">
                  Set up your Bitcoin donation page in minutes
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card
                  title="Page Settings"
                  className="shadow-lg"
                >
                  <div className="space-y-6">
                    <Input
                      id="name"
                      label="Page Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter a name for your donation page"
                      required
                    />

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tell people about your cause"
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-tiffany-500 focus:ring-2 focus:ring-tiffany-500/20 transition-colors"
                      />
                    </div>

                    <Input
                      id="address"
                      label="Bitcoin Address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your Bitcoin address"
                      required
                    />

                    <Button
                      className="w-full"
                      disabled={!address || !name}
                    >
                      Create Page
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  )
} 