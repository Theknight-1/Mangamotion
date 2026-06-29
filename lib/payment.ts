import axios from 'axios'
import crypto from 'crypto'


export const TIERS = {
  free: {
    name: "Free",
    price: 0,
    features: [
      "1 video / month",
      "Up to 10 minutes",
      "1080p export",
      "9:16 export only",
      "1 AI voice",
    ],
  },
  starter: {
    name: "Starter",
    price: 10,
    features: [
      "20 videos / month",
      "Up to 120 minutes",
      "1080p export",
      "9:16 & 1:1 export",
      "3 AI voices",
      "Background music",
    ],
  },
  pro: {
    name: "Pro",
    price: 29,
    features: [
      "50 videos / month",
      "Up to 300 minutes",
      "4K export",
      "All aspect ratios",
      "5 AI voices",
      "SFX library",
      "Priority rendering",
      "Custom branding",
    ],
  },
  premium: {
    name: "Premium",
    price: 59.99,
    features: [
      "200 videos / month",
      "Up to 1200 minutes",
      "4K export",
      "All aspect ratios",
      "20 AI voices",
      "SFX library",
      "Priority rendering",
      "Custom branding",
      "API access",
    ],
  },
} as const;

// Razorpay integration
export async function createRazorpaySubscription(
  customerId: string,
  email: string,
  tier: 'pro' | 'premium'
) {
  const key = process.env.RAZORPAY_KEY_ID
  const secret = process.env.RAZORPAY_KEY_SECRET

  if (!key || !secret) {
    throw new Error('Razorpay credentials not configured')
  }

  try {
    const response = await axios.post(
      'https://api.razorpay.com/v1/subscriptions',
      {
        plan_id: tier === 'pro' ? 'plan_pro' : 'plan_premium',
        customer_notify: 1,
        quantity: 1,
        total_count: 12,
      },
      {
        auth: {
          username: key,
          password: secret,
        },
      }
    )

    return response.data
  } catch (error) {
    console.error('[v0] Razorpay error:', error)
    throw new Error('Failed to create subscription')
  }
}

export function verifyRazorpaySignature(body: any, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) return false

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex')

  return generatedSignature === signature
}

// PayPal integration
export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured')
  }

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const response = await axios.post(
      'https://api-m.sandbox.paypal.com/v1/oauth2/token',
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    return response.data.access_token
  } catch (error) {
    console.error('[v0] PayPal auth error:', error)
    throw new Error('Failed to get PayPal access token')
  }
}

export async function createPayPalSubscription(
  accessToken: string,
  planId: string,
  email: string
) {
  try {
    const response = await axios.post(
      'https://api-m.sandbox.paypal.com/v1/billing/subscriptions',
      {
        plan_id: planId,
        subscriber: {
          email_address: email,
        },
        application_context: {
          brand_name: 'MangaMotion AI',
          locale: 'en-US',
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    return response.data
  } catch (error) {
    console.error('[v0] PayPal subscription error:', error)
    throw new Error('Failed to create PayPal subscription')
  }
}

export function verifyPayPalSignature(webhookBody: string, signature: string): boolean {
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!secret) return false

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(webhookBody)
    .digest('hex')

  return generatedSignature === signature
}
