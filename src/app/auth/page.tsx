'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Bitcoin, ArrowRight, CheckCircle2, Shield, Zap, Loader2, AlertCircle, Globe, ShieldCheck, Users } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Loading from '@/components/Loading'
import { useAuth } from '@/hooks/useAuth'
import { useRedirectIfAuthenticated } from '@/hooks/useAuth'
import { toast } from 'sonner'

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, signUp, isLoading: authLoading, hydrated, session, profile } = useAuth()
  const { isLoading: redirectLoading } = useRedirectIfAuthenticated()
  
  // Determine initial mode based on URL parameter
  const [mode, setMode] = useState<'login' | 'register'>('login')
  
  useEffect(() => {
    const urlMode = searchParams.get('mode')
    if (urlMode === 'register' || urlMode === 'signup') {
      setMode('register')
    } else {
      setMode('login')
    }
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
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
      
      if (mode === 'login') {
        const { error } = await Promise.race([
          signIn(formData.email, formData.password),
          new Promise<{error: string}>((_, reject) => 
            setTimeout(() => reject(new Error('Login taking longer than expected. Please try again.')), 8000)
          )
        ])
        
        clearTimeout(timeoutId)
        if (error) throw new Error(error)
        router.push('/dashboard')
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match')
        }
        
        const { error } = await Promise.race([
          signUp(formData.email, formData.password),
          new Promise<{error: string}>((_, reject) => 
            setTimeout(() => reject(new Error('Registration taking longer than expected. Please try again.')), 8000)
          )
        ])
        
        clearTimeout(timeoutId)
        if (error) throw new Error(error)
        setSuccess('Registration successful! Redirecting to dashboard...')
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Show initial loading only when absolutely necessary
  const isInitialLoading = !hydrated || (redirectLoading && authLoading)
  
  // If we have a session and profile, redirect to dashboard 
  if (session && profile && hydrated) {
    router.push('/dashboard')
    return null
  }

  if (isInitialLoading) {
    return <Loading fullScreen message="Loading your account..." />
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
                disabled={loading}
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
                disabled={loading}
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
                  disabled={loading}
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
              disabled={loading}
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
                <div className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                </div>
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
              disabled={loading}
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
                  Built on Bitcoin principles with no platform fees, self-custody only, and open source.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-tiffany-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">For Everyone</h3>
                <p className="mt-1 text-gray-500">
                  Fund yourself, your loved ones, or any organization with Bitcoin.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Shield className="h-6 w-6 text-tiffany-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Transparent</h3>
                <p className="mt-1 text-gray-500">
                  Real-time tracking and public funding history for complete transparency.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 