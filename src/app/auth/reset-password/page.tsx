'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, AlertCircle, Loader2, Key, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import supabase from '@/lib/supabase/browser'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'loading' | 'reset' | 'success' | 'error'>('loading')
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Supabase v2 may deliver tokens via hash fragment. Merge hash into search params if present.
    const url = typeof window !== 'undefined' ? new URL(window.location.href) : null
    const hashParams = new URLSearchParams(url?.hash.startsWith('#') ? url.hash.substring(1) : '')

    const qp = searchParams
    const accessToken = qp.get('access_token') || hashParams.get('access_token')
    const refreshToken = qp.get('refresh_token') || hashParams.get('refresh_token')
    const type = qp.get('type') || hashParams.get('type')

    if (type === 'recovery' && accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            setStep('error')
            setError('Invalid or expired reset link. Please request a new password reset.')
          } else {
            setStep('reset')
          }
        })
    } else {
      setStep('error')
      setError('Invalid reset link. Please request a new password reset from the login page.')
    }
  }, [searchParams])

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate passwords
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      const passwordError = validatePassword(formData.password)
      if (passwordError) {
        throw new Error(passwordError)
      }

      const { error } = await supabase.auth.updateUser({
        password: formData.password
      })

      if (error) {
        throw error
      }

      setStep('success')
    } catch (error: any) {
      setError(error.message || 'Failed to reset password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReturnToLogin = () => {
    router.push('/auth?mode=login')
  }

  const handleRequestNewReset = () => {
    router.push('/auth/forgot-password')
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-tiffany-50 px-4">
        <Card className="max-w-md w-full p-8 shadow-xl">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-orange-600 mb-6" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verifying Reset Link
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your password reset link...
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-tiffany-50 px-4">
        <Card className="max-w-md w-full p-8 shadow-xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Reset Link Invalid
            </h1>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleRequestNewReset}
                variant="primary"
                className="w-full"
              >
                Request New Reset Link
              </Button>
              <Button
                onClick={handleReturnToLogin}
                variant="outline"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-tiffany-50 px-4">
        <Card className="max-w-md w-full p-8 shadow-xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Password Updated Successfully
            </h1>
            <p className="text-gray-600 mb-6">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <Button
              onClick={handleReturnToLogin}
              variant="primary"
              className="w-full"
            >
              Sign In Now
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-tiffany-50 px-4">
      <Card className="max-w-md w-full p-8 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-orange-100 to-tiffany-100 mb-6">
            <Key className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Create New Password
          </h1>
          <p className="text-gray-600">
            Enter a strong password to secure your account
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="New password"
              disabled={isLoading}
              className="w-full"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              style={{ marginTop: '20px', position: 'relative', float: 'right' }}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          
          <div>
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              disabled={isLoading}
              className="w-full"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              style={{ marginTop: '20px', position: 'relative', float: 'right' }}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Password Requirements:</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li className={formData.password.length >= 8 ? 'text-green-600' : ''}>
                • At least 8 characters long
              </li>
              <li className={/(?=.*[a-z])/.test(formData.password) ? 'text-green-600' : ''}>
                • One lowercase letter
              </li>
              <li className={/(?=.*[A-Z])/.test(formData.password) ? 'text-green-600' : ''}>
                • One uppercase letter
              </li>
              <li className={/(?=.*\d)/.test(formData.password) ? 'text-green-600' : ''}>
                • One number
              </li>
            </ul>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading || !formData.password || !formData.confirmPassword}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating Password...
              </>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href="/auth?mode=login"
            className="inline-flex items-center text-sm text-gray-600 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Login
          </Link>
        </div>
      </Card>
    </div>
  )
} 