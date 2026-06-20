import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import { headers } from 'next/headers'
import { TIERS } from '@/lib/payment'

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .limit(1)

    const currentTier = userSubscription[0]?.tier || 'free'
    const tierData = TIERS[currentTier as keyof typeof TIERS]

    return NextResponse.json({
      subscription: userSubscription[0] || { tier: 'free', status: 'active' },
      tierData,
    })
  } catch (error) {
    console.error('[v0] Get subscription error:', error)
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tier, provider, subscriptionId } = body

    if (!tier || !provider) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const tierData = TIERS[tier as keyof typeof TIERS]

    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .limit(1)

    let result
    if (existing.length > 0) {
      result = await db
        .update(subscriptions)
        .set({
          tier,
          status: 'active',
          razorpaySubscriptionId: provider === 'razorpay' ? subscriptionId : existing[0].razorpaySubscriptionId,
          paypalSubscriptionId: provider === 'paypal' ? subscriptionId : existing[0].paypalSubscriptionId,
          videoLimit: tierData.videoLimit,
          videoMinutesLimit: tierData.videoMinutesLimit,
        })
        .where(eq(subscriptions.userId, session.user.id))
        .returning()
    } else {
      result = await db
        .insert(subscriptions)
        .values({
          id: createId(),
          userId: session.user.id,
          tier,
          status: 'active',
          videoLimit: tierData.videoLimit,
          videoMinutesLimit: tierData.videoMinutesLimit,
          razorpaySubscriptionId: provider === 'razorpay' ? subscriptionId : undefined,
          paypalSubscriptionId: provider === 'paypal' ? subscriptionId : undefined,
        })
        .returning()
    }

    return NextResponse.json({ subscription: result[0] }, { status: 201 })
  } catch (error) {
    console.error('[v0] Create subscription error:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
