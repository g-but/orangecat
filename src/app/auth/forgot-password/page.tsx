'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { resetPassword } from '@/services/supabase/auth'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'success' | 'error'>('form')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!email) {
        throw new Error('Please enter your email address')
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address')
      }

      const result = await resetPassword({ email })

      if (result.error) {
        throw new Error(result.error.message || 'Failed to send reset email')
      }

      setStep('success')
    } catch (error: any) {
      setError(error.message || 'Failed to send password reset email')
      setStep('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setStep('form')
    setError(null)
  }

  const handleBackToLogin = () => {
    router.push('/auth?mode=login')
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-tiffany-50 px-4">
        <Card className="max-w-md w-full p-8 shadow-xl">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            
            {/* Success Message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Check Your Email
            </h1>
            <p className="text-gray-600 mb-2">
              We've sent password reset instructions to:
            </p>
            <p className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-2 rounded-lg mb-6">
              {email}
            </p>
            
            {/* Instructions */}
            <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Next steps:</h3>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Check your email inbox</li>
                <li>2. Click the reset link in the email</li>
                <li>3. Create your new password</li>
              </ol>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleBackToLogin}
                variant="primary"
                className="w-full"
              >
                Back to Login
              </Button>
              
              <p className="text-xs text-gray-500">
                Didn't receive an email? Check your spam folder or{' '}
                <button 
                  onClick={handleRetry}
                  className="text-orange-600 hover:text-orange-700 underline"
                >
                  try again
                </button>
              </p>
            </div>
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
            {/* Error Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            
            {/* Error Message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Something Went Wrong
            </h1>
            <p className="text-gray-600 mb-6">
              {error}
            </p>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleRetry}
                variant="primary"
                className="w-full"
              >
                Try Again
              </Button>
              
              <Button
                onClick={handleBackToLogin}
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-tiffany-50 px-4">
      <Card className="max-w-md w-full p-8 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-orange-100 to-tiffany-100 mb-6">
            <Mail className="h-8 w-8 text-orange-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Reset Your Password
          </h1>
          <p className="text-gray-600">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              icon={Mail}
              disabled={isLoading}
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading || !email}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending Reset Email...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Reset Instructions
              </>
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

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Remember your password?{' '}
            <Link href="/auth?mode=login" className="text-orange-600 hover:text-orange-700 underline">
              Sign in instead
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
} 