'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { 
  Zap, 
  Copy, 
  Check, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  RefreshCw,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'sonner'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'

interface LightningPaymentProps {
  recipientAddress: string
  campaignTitle: string
  campaignId: string
  presetAmount?: number // in satoshis
  onPaymentComplete?: (paymentHash: string) => void
  onPaymentFailed?: (error: string) => void
  className?: string
}

interface Invoice {
  bolt11: string
  paymentHash: string
  expiresAt: Date
  amount: number // satoshis
  description: string
}

export default function LightningPayment({
  recipientAddress,
  campaignTitle,
  campaignId,
  presetAmount,
  onPaymentComplete,
  onPaymentFailed,
  className = ''
}: LightningPaymentProps) {
  const [amount, setAmount] = useState(presetAmount?.toString() || '')
  const [message, setMessage] = useState('')
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'paid' | 'expired' | 'failed'>('pending')
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  // Timer for invoice expiry
  useEffect(() => {
    if (!invoice) {return}

    const updateTimer = () => {
      const now = new Date()
      const timeRemaining = invoice.expiresAt.getTime() - now.getTime()
      
      if (timeRemaining <= 0) {
        setPaymentStatus('expired')
        setTimeLeft(0)
        return
      }
      
      setTimeLeft(Math.floor(timeRemaining / 1000))
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    
    return () => clearInterval(timer)
  }, [invoice])

  const generateInvoice = async () => {
    if (!amount || parseInt(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsGenerating(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const amountSats = parseInt(amount)
      const description = `${campaignTitle} - ${message || 'Lightning donation'}`
      
      // Development/Demo Implementation
      // In production, this would integrate with a Lightning service provider like:
      // - LND (Lightning Network Daemon)
      // - CLN (Core Lightning)
      // - LDK (Lightning Development Kit)
      // - Third-party services like Strike, OpenNode, or BTCPay Server
      
      const demoInvoice: Invoice = {
        bolt11: `lnbc${amountSats}u1p${Math.random().toString(36).substr(2, 58)}`, // Demo format
        paymentHash: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        amount: amountSats,
        description
      }
      
      setInvoice(demoInvoice)
      setPaymentStatus('pending')
      toast.success('Demo Lightning invoice generated!')
      
    } catch (error) {
      toast.error('Failed to generate Lightning invoice')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyInvoice = async () => {
    if (!invoice) {return}
    
    try {
      await navigator.clipboard.writeText(invoice.bolt11)
      setCopied(true)
      toast.success('Invoice copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy invoice')
    }
  }

  const resetPayment = () => {
    setInvoice(null)
    setPaymentStatus('pending')
    setIsChecking(false)
    setTimeLeft(null)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (paymentStatus === 'paid') {
    return (
      <Card className={`text-center ${className}`}>
        <CardContent className="p-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Received!</h3>
          <p className="text-gray-600 mb-4">
            Thank you for supporting {campaignTitle} with your Lightning payment.
          </p>
          <CurrencyDisplay 
            amount={invoice!.amount} 
            currency="SATS"
            className="text-lg font-semibold text-green-600"
          />
          <Button onClick={resetPayment} variant="outline" className="mt-4">
            Make Another Payment
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Lightning Payment
          <span className="ml-auto px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
            Experimental
          </span>
        </CardTitle>
        
        {/* Development Notice - Enhanced */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-lg p-4 mt-2">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <div>
              <div className="flex items-center">
                <p className="text-sm font-semibold text-yellow-800 mb-1">⚡ Lightning Network - Coming Soon</p>
                <a href="/faq" target="_blank" rel="noopener noreferrer" className="ml-2 text-yellow-800 hover:text-yellow-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4 0 1.897-1.355 3.52-3.228 3.894v.001c-.61.126-1.022.686-1.022 1.314v.228c0 .747.604 1.35 1.35 1.35h.002c.747 0 1.35-.603 1.35-1.35v-.228c0-.747-.604-1.35-1.35-1.35h-.002c-.747 0-1.35.603-1.35 1.35v-.228c0 .747.604 1.35 1.35 1.35h.002c.747 0 1.35-.603 1.35-1.35v-.228c0-2.12-1.78-3.87-4-3.87-1.933 0-3.5 1.567-3.5 3.5 0 .747.604 1.35 1.35 1.35h.002c.747 0 1.35-.603 1.35-1.35v-.228c0-.747-.604-1.35-1.35-1.35h-.002c-.747 0-1.35.603-1.35 1.35v.228c0 .747.604 1.35 1.35 1.35h.002c.747 0 1.35-.603 1.35-1.35v-.228a1.35 1.35 0 0 0-1.35-1.35h-.002zM12 18h.01"></path></svg>
                </a>
              </div>
              <p className="text-xs text-yellow-700 leading-relaxed mb-2">
                Lightning payments are currently in development. This is a preview of the upcoming instant Bitcoin payment feature.
              </p>
              <p className="text-xs text-yellow-600">
                <strong>For now, please use the Bitcoin address for donations.</strong> Lightning integration will be available in a future update.
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!invoice ? (
          // Invoice Generation Form
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (sats)
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount in satoshis"
                min="1"
                className="font-mono"
                disabled={true}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (optional)
              </label>
              <Input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message with your payment"
                maxLength={100}
                disabled={true}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Lightning Benefits</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Instant payments (usually under 3 seconds)</li>
                    <li>• Extremely low fees (typically &lt; 1 sat)</li>
                    <li>• Perfect for small amounts and tips</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              onClick={generateInvoice} 
              disabled={true}
              className="w-full"
            >
              {'Generate Lightning Invoice'}
            </Button>
          </div>
        ) : (
          // Invoice Display
          <div className="space-y-4">
            {/* Payment Amount */}
            <div className="text-center">
              <CurrencyDisplay 
                amount={invoice.amount} 
                currency="SATS"
                className="text-xl font-semibold"
              />
              {invoice.description && (
                <p className="text-sm text-gray-600 mt-1">{invoice.description}</p>
              )}
            </div>

            {/* QR Code */}
            {paymentStatus !== 'expired' && (
              <div className="flex justify-center p-4 bg-white border border-gray-200 rounded-lg">
                <QRCodeSVG
                  value={invoice.bolt11.toUpperCase()}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
            )}

            {/* Invoice String */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lightning Invoice
              </label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <code className="text-xs text-gray-600 break-all font-mono">
                    {invoice.bolt11}
                  </code>
                </div>
                <Button
                  onClick={copyInvoice}
                  variant="outline"
                  size="sm"
                  className={copied ? 'bg-green-50 text-green-700 border-green-200' : ''}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={() => window.open(`lightning:${invoice.bolt11}`, '_blank')} 
                className="flex-1"
                disabled={paymentStatus === 'expired'}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Wallet
              </Button>
            </div>

            {/* Reset Button */}
            {(paymentStatus === 'expired' || paymentStatus === 'failed') && (
              <Button onClick={resetPayment} variant="outline" className="w-full">
                Generate New Invoice
              </Button>
            )}

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="font-medium text-yellow-900 mb-2">How to Pay:</h4>
              <ol className="text-sm text-yellow-800 space-y-1">
                <li>1. Open your Lightning wallet app</li>
                <li>2. Scan the QR code or paste the invoice</li>
                <li>3. Confirm the payment in your wallet</li>
                <li>4. Payment will be confirmed instantly</li>
              </ol>
            </div>

            {timeLeft !== null && timeLeft > 0 && (
              <div className="text-center text-sm text-gray-500">
                Invoice expires in {formatTime(timeLeft)}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
