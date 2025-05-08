'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Bitcoin, ArrowRight, CheckCircle2, Shield, Zap, Loader2, AlertCircle, Globe, ShieldCheck } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { useAuthStore } from '@/store/auth'
import { useRedirectIfAuthenticated } from '@/hooks/useAuth'
import { toast } from 'sonner'

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, signUp, isLoading: authLoading, hydrated } = useAuthStore()
  const { isLoading: redirectLoading } = useRedirectIfAuthenticated()
  
  // Determine initial mode based on context
  const [mode, setMode] = useState<'login' | 'register'>('login')
  
  useEffect(() => {
    // If coming from a protected route, default to login
    const fromProtected = searchParams.get('from') === 'protected'
    // If coming from a public route like Fund Yourself, default to register
    const fromPublic = searchParams.get('from') === 'public'
    
    setMode(fromPublic ? 'register' : 'login')
  }, [searchParams])
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (mode === 'login') {
        const { error } = await signIn(formData.email, formData.password)
        if (error) throw new Error(error)
        router.push('/dashboard')
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match')
        }
        const { error } = await signUp(formData.email, formData.password)
        if (error) throw new Error(error)
        setSuccess('Registration successful! Please check your email to verify your account.')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!hydrated || redirectLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-tiffany-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-b from-tiffany-50 to-white">
      {/* Left: Auth Form */}
      <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-white shadow md:rounded-r-none rounded-lg md:rounded-l-lg">
        {/* OrangeCat Logo Placeholder */}
        <div className="mb-8">
          <div className="w-16 h-16 rounded-full bg-orange-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            🐾
          </div>
        </div>
        <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold text-gray-900">
            {mode === 'login' ? 'Sign in to OrangeCat' : 'Create your OrangeCat account'}
          </h2>
          <p className="mt-2 text-tiffany-600 text-sm font-medium">
            Fund your dreams with Bitcoin
          </p>
        </div>
        {/* Error/Success messages */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-2 w-full max-w-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-50 p-4 mb-2 w-full max-w-md">
            <div className="flex">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">{success}</h3>
              </div>
            </div>
          </div>
        )}
        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email address"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-tiffany-500 focus:border-tiffany-500 focus:z-10 sm:text-sm"
              />
            </div>
            <div>
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-tiffany-500 focus:border-tiffany-500 focus:z-10 sm:text-sm"
              />
            </div>
            {mode === 'register' && (
              <div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-tiffany-500 focus:border-tiffany-500 focus:z-10 sm:text-sm"
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            <input
              id="show-password"
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="h-4 w-4 text-tiffany-600 focus:ring-tiffany-500 border-gray-300 rounded"
            />
            <label htmlFor="show-password" className="ml-2 block text-sm text-gray-900">
              Show password
            </label>
          </div>
          
          <div>
            <Button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : mode === 'login' ? (
                'Sign in'
              ) : (
                'Create account'
              )}
            </Button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-sm text-tiffany-600 hover:text-tiffany-500"
            >
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Right: Benefits Section */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-8">
            Why OrangeCat?
          </h2>
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Bitcoin className="h-6 w-6 text-tiffany-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Bitcoin-First</h3>
                <p className="mt-1 text-gray-500">
                  Built for the Bitcoin ecosystem, supporting both on-chain and Lightning payments.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Shield className="h-6 w-6 text-tiffany-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Secure & Private</h3>
                <p className="mt-1 text-gray-500">
                  Your data is encrypted and protected. We never share your information.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Zap className="h-6 w-6 text-tiffany-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Lightning Fast</h3>
                <p className="mt-1 text-gray-500">
                  Instant payments and real-time updates with Lightning Network integration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 