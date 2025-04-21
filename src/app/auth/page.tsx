'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Bitcoin, ArrowRight, CheckCircle2, Shield, Zap, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, signUp, isLoading: authLoading } = useAuth()
  
  // Default to login unless registration is specified in URL
  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  )
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Frontend validation
    if (mode === 'register') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long')
        setLoading(false)
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }
    }

    try {
      if (mode === 'register') {
        await signUp(email, password)
        // Show success message and switch to login
        setMode('login')
        setPassword('')
        setConfirmPassword('')
        alert('Registration successful! Please check your email to verify your account.')
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-tiffany-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left Column - Auth Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Bitcoin className="w-12 h-12 text-tiffany-500" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {mode === 'login' ? 'Welcome Back' : 'Join OrangeCat'}
              </h1>
              <p className="text-gray-600">
                {mode === 'login' 
                  ? 'Continue your Bitcoin fundraising journey'
                  : 'Start accepting Bitcoin donations today'
                }
              </p>
            </div>

            <Card className="w-full">
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  className={`flex-1 py-4 text-center font-medium transition-colors duration-200 ${
                    mode === 'login'
                      ? 'text-tiffany-600 border-b-2 border-tiffany-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setMode('login')}
                >
                  Log In
                </button>
                <button
                  className={`flex-1 py-4 text-center font-medium transition-colors duration-200 ${
                    mode === 'register'
                      ? 'text-tiffany-600 border-b-2 border-tiffany-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setMode('register')}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 min-h-[320px]">
                <div className="space-y-6">
                  <Input
                    id="email"
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete={mode === 'login' ? 'username' : 'email'}
                    className="transition-all duration-200 focus:ring-2 focus:ring-tiffany-500"
                  />
                  
                  <div className="relative">
                    <Input
                      id="password"
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      className="transition-all duration-200 focus:ring-2 focus:ring-tiffany-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-8 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {mode === 'register' && (
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        label="Confirm Password"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        className="transition-all duration-200 focus:ring-2 focus:ring-tiffany-500"
                      />
                    </div>
                  )}
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-4 transition-all duration-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full transition-all duration-200 hover:shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </div>
                  ) : mode === 'login' ? (
                    'Sign In'
                  ) : (
                    'Create Account'
                  )}
                </Button>

                {mode === 'login' && (
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-sm text-tiffany-600 hover:text-tiffany-700 transition-colors duration-200"
                    >
                      Don&apos;t have an account? Register here
                    </button>
                  </div>
                )}

                {mode === 'register' && (
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-sm text-tiffany-600 hover:text-tiffany-700 transition-colors duration-200"
                    >
                      Already have an account? Sign in here
                    </button>
                  </div>
                )}
              </form>
            </Card>
          </div>

          {/* Right Column - Features */}
          <div className="hidden lg:block">
            <div className="max-w-md mx-auto pt-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Why Choose OrangeCat?
              </h2>
              
              <div className="space-y-8">
                <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0 bg-tiffany-50 p-2 rounded-lg">
                    <Bitcoin className="h-6 w-6 text-tiffany-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Direct Bitcoin Donations</h3>
                    <p className="mt-2 text-gray-600">Accept Bitcoin donations directly to your wallet. No middleman, no unnecessary fees.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0 bg-tiffany-50 p-2 rounded-lg">
                    <Shield className="h-6 w-6 text-tiffany-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Full Control & Security</h3>
                    <p className="mt-2 text-gray-600">You maintain complete control of your funds with direct wallet integration and self-custody.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0 bg-tiffany-50 p-2 rounded-lg">
                    <Zap className="h-6 w-6 text-tiffany-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Quick & Easy Setup</h3>
                    <p className="mt-2 text-gray-600">Get started in minutes. Create your profile and start accepting donations right away.</p>
                  </div>
                </div>
              </div>

              {/* Key Features */}
              <div className="mt-12 bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Everything You Need</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-tiffany-500 mt-0.5 flex-shrink-0" />
                    <span className="ml-3 text-gray-600">Custom donation pages with your branding</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-tiffany-500 mt-0.5 flex-shrink-0" />
                    <span className="ml-3 text-gray-600">Real-time transaction tracking</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-tiffany-500 mt-0.5 flex-shrink-0" />
                    <span className="ml-3 text-gray-600">No platform fees or hidden charges</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-tiffany-500 mt-0.5 flex-shrink-0" />
                    <span className="ml-3 text-gray-600">Support for both Bitcoin and Lightning Network</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-tiffany-500 mt-0.5 flex-shrink-0" />
                    <span className="ml-3 text-gray-600">Detailed analytics and reporting</span>
                  </li>
                </ul>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  Trusted by creators, nonprofits, and organizations worldwide
                </p>
                <div className="mt-4 flex justify-center space-x-6">
                  <div className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">100%</span> Self-Custody
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">0%</span> Platform Fees
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">24/7</span> Support
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 