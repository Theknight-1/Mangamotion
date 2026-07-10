import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { paymentEvents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

const EVENT_LABELS: Record<string, string> = {
  "subscription.activated": "Plan activated",
  "subscription.charged": "Renewal payment",
  "subscription.pending": "Payment pending",
  "subscription.halted": "Payment failed",
  "subscription.cancelled": "Subscription cancelled",
  "subscription.completed": "Subscription completed",
  "BILLING.SUBSCRIPTION.ACTIVATED": "Plan activated",
  "PAYMENT.SALE.COMPLETED": "Payment received",
  "BILLING.SUBSCRIPTION.SUSPENDED": "Payment failed",
  "BILLING.SUBSCRIPTION.CANCELLED": "Subscription cancelled",
  "BILLING.SUBSCRIPTION.EXPIRED": "Subscription expired",
};

const FAILED_EVENTS = new Set([
  "subscription.halted",
  "subscription.pending",
  "BILLING.SUBSCRIPTION.SUSPENDED",
]);

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await db
      .select()
      .from(paymentEvents)
      .where(eq(paymentEvents.userId, session.user.id))
      .orderBy(desc(paymentEvents.createdAt))
      .limit(25);

    const history = rows.map((row) => ({
      id: row.id,
      date: row.createdAt,
      description: EVENT_LABELS[row.eventType] ?? row.eventType,
      amount: row.amount,
      currency: row.currency ?? "USD",
      provider: row.provider,
      status: FAILED_EVENTS.has(row.eventType) ? "failed" : "paid",
    }));

    return NextResponse.json({ history });
  } catch (error) {
    console.error("[subscriptions/history] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing history" },
      { status: 500 },
    );
  }
}
