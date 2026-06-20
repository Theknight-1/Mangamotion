'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { TIERS } from '@/lib/payment'
import toast from 'react-hot-toast'

interface PricingProps {
  currentTier?: string
  onSubscribe?: (tier: string) => void
}

export function Pricing({ currentTier = 'free', onSubscribe }: PricingProps) {
  const [processing, setProcessing] = useState(false)

  async function handleSubscribe(tier: string) {
    if (tier === 'free') {
      toast.success('Already on free plan')
      return
    }

    setProcessing(true)
    try {
      // In a real implementation, this would initiate payment
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          provider: 'razorpay', // Would be determined by user choice
        }),
      })

      if (!response.ok) throw new Error('Subscription failed')

      toast.success(`Upgraded to ${tier} plan!`)
      onSubscribe?.(tier)
    } catch (error) {
      console.error('[v0] Subscription error:', error)
      toast.error('Failed to update subscription')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {Object.entries(TIERS).map(([key, tier]) => {
        const isCurrent = currentTier === key
        const isPopular = key === 'pro'

        return (
          <div
            key={key}
            className={`rounded-lg overflow-hidden transition transform ${
              isPopular ? 'ring-2 ring-purple-500 md:scale-105' : ''
            } ${isCurrent ? 'bg-purple-900/20 border-2 border-purple-500' : 'bg-slate-800 border border-slate-700'}`}
          >
            <div className="p-8 space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-white">₹{tier.price}</span>
                  {tier.price > 0 && <span className="text-slate-400 ml-2">/month</span>}
                </div>
              </div>

              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(key)}
                disabled={processing || isCurrent}
                className={`w-full font-semibold py-3 rounded-lg transition ${
                  isCurrent
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50'
                }`}
              >
                {isCurrent ? 'Current Plan' : processing ? 'Processing...' : 'Upgrade'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
