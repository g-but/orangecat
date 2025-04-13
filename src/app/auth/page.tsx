'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bitcoin, ArrowRight, Mail, Key, Eye, EyeOff, User } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { z } from 'zod'
import Link from 'next/link'

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
})

type FormData = z.infer<typeof authSchema>

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    username: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { signIn, signUp, isLoading, error: authError } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      // Validate form data
      const validatedData = authSchema.parse(formData)

      if (isLogin) {
        await signIn(validatedData.email, validatedData.password)
      } else {
        if (!validatedData.username) {
          throw new Error('Username is required for registration')
        }
        await signUp(validatedData.email, validatedData.password, validatedData.username)
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err: z.ZodIssue) => {
          if (err.path[0]) {
            fieldErrors[err.path[0]] = err.message
          }
        })
        setErrors(fieldErrors)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tiffany-50 via-white to-tiffany-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-6">
              <Bitcoin className="w-12 h-12 text-tiffany-500" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-xl text-gray-600">
              {isLogin 
                ? 'Continue your Bitcoin fundraising journey'
                : 'Start your Bitcoin fundraising journey today'
              }
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Input
                        id="username"
                        name="username"
                        label="Username"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Choose a username"
                        required={!isLogin}
                        error={errors.username}
                        icon={<User className="w-5 h-5 text-gray-400" />}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <Input
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  error={errors.email}
                  icon={<Mail className="w-5 h-5 text-gray-400" />}
                />

                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    error={errors.password}
                    icon={<Key className="w-5 h-5 text-gray-400" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {authError && (
                  <div className="text-red-500 text-sm text-center">
                    {authError}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  {isLogin ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className="text-sm text-tiffany-600 hover:text-tiffany-700"
                      >
                        Create account
                      </button>
                      <Link
                        href="/auth/reset-password"
                        className="text-sm text-tiffany-600 hover:text-tiffany-700"
                      >
                        Forgot password?
                      </Link>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsLogin(true)}
                      className="text-sm text-tiffany-600 hover:text-tiffany-700"
                    >
                      Already have an account?
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading 
                    ? (isLogin ? 'Signing in...' : 'Creating account...')
                    : (isLogin ? 'Sign In' : 'Create Account')
                  }
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 