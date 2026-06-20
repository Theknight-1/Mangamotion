// import { NextRequest, NextResponse } from 'next/server'
// import { db } from '@/lib/db'
// import { paymentEvents, subscriptions } from '@/lib/db/schema'
// import { eq } from 'drizzle-orm'
// import { createId } from '@paralleldrive/cuid2'
// import { verifyRazorpaySignature } from '@/lib/payment'

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.text()
//     const signature = request.headers.get('x-razorpay-signature')

//     if (!signature) {
//       return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
//     }

//     // Verify Razorpay signature
//     const bodyJson = JSON.parse(body)
//     if (!verifyRazorpaySignature(bodyJson, signature)) {
//       return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
//     }

//     const event = bodyJson.event
//     const eventData = bodyJson.payload.payment.entity || bodyJson.payload.subscription.entity

//     console.log('[v0] Processing webhook:', event)

//     // Handle different event types
//     switch (event) {
//       case 'subscription.authenticated':
//       case 'subscription.activated': {
//         const customerId = eventData.customer_id
//         const subscriptionId = eventData.id
//         const planId = eventData.plan_id

//         // Map plan to tier
//         const tier = planId.includes('pro') ? 'pro' : 'premium'

//         // Find user by customer ID or update subscription
//         const subscription = await db.query.subscriptions.findFirst({
//           where: eq(subscriptions.razorpaySubscriptionId, subscriptionId),
//         })

//         if (subscription) {
//           await db
//             .update(subscriptions)
//             .set({
//               status: 'active',
//               renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//               updatedAt: new Date(),
//             })
//             .where(eq(subscriptions.id, subscription.id))
//         }

//         await db.insert(paymentEvents).values({
//           id: createId(),
//           type: event,
//           provider: 'razorpay',
//           transactionId: subscriptionId,
//           status: 'success',
//           payload: eventData,
//         })

//         return NextResponse.json({ received: true })
//       }

//       case 'payment.authorized':
//       case 'payment.captured': {
//         const paymentId = eventData.id
//         const amount = eventData.amount
//         const customerId = eventData.customer_id

//         await db.insert(paymentEvents).values({
//           id: createId(),
//           type: event,
//           provider: 'razorpay',
//           transactionId: paymentId,
//           amount,
//           status: 'success',
//           payload: eventData,
//         })

//         return NextResponse.json({ received: true })
//       }

//       case 'subscription.cancelled': {
//         const subscriptionId = eventData.id

//         const subscription = await db.query.subscriptions.findFirst({
//           where: eq(subscriptions.razorpaySubscriptionId, subscriptionId),
//         })

//         if (subscription) {
//           await db
//             .update(subscriptions)
//             .set({
//               status: 'cancelled',
//               cancellationDate: new Date(),
//               updatedAt: new Date(),
//             })
//             .where(eq(subscriptions.id, subscription.id))
//         }

//         await db.insert(paymentEvents).values({
//           id: createId(),
//           type: event,
//           provider: 'razorpay',
//           transactionId: subscriptionId,
//           status: 'success',
//           payload: eventData,
//         })

//         return NextResponse.json({ received: true })
//       }

//       default:
//         console.log('[v0] Unknown event type:', event)
//         return NextResponse.json({ received: true })
//     }
//   } catch (error) {
//     console.error('[v0] Webhook error:', error)
//     return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
//   }
// }
