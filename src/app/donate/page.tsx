'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function DonatePage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    try {
      const { error } = await supabase
        .from('donations')
        .insert([
          {
            user_id: user.id,
            amount: parseFloat(amount),
            message: message || null,
            status: 'pending'
          }
        ])

      if (error) throw error
      
      // Redirect to payment processing
      router.push('/payment')
    } catch (error) {
      console.error('Error creating donation:', error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card title="Make a Donation" subtitle="Support this project by making a donation">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="amount"
            label="Donation Amount"
            type="number"
            min="0.00"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Input
            id="message"
            label="Message (Optional)"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave a message with your donation"
          />
          <Button type="submit" className="w-full">
            Donate
          </Button>
        </form>
      </Card>
    </div>
  )
} 