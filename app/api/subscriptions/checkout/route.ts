import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  TIERS,
  isPaidTier,
  createRazorpaySubscription,
  createPayPalSubscription,
  getPayPalAccessToken,
} from "@/lib/payment";
import type {
  CheckoutRequestBody,
  CheckoutResponse,
} from "@/types/subscription";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body: CheckoutRequestBody = await request.json();
    const { tier, provider } = body;

    if (!tier || !TIERS[tier])
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    if (!isPaidTier(tier))
      return NextResponse.json(
        { error: "Free tier doesn't need checkout" },
        { status: 400 },
      );
    if (provider !== "razorpay" && provider !== "paypal")
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });

    if (provider === "razorpay") {
      const rzpSub = await createRazorpaySubscription(tier, session.user.id);
      const response: CheckoutResponse = {
        provider: "razorpay",
        subscriptionId: rzpSub.id,
        keyId: process.env.RAZORPAY_KEY_ID ?? "",
        tier,
      };
      return NextResponse.json(response);
    }

    // PayPal
    const accessToken = await getPayPalAccessToken();
    const paypalSub = await createPayPalSubscription(
      accessToken,
      tier,
      session.user.email,
      session.user.id,
    );
    const approveLink = paypalSub.links.find((l) => l.rel === "approve");
    if (!approveLink) throw new Error("PayPal did not return an approval link");

    const response: CheckoutResponse = {
      provider: "paypal",
      approveUrl: approveLink.href,
      paypalSubscriptionId: paypalSub.id,
      tier,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("[checkout] error:", error);
    return NextResponse.json(
      { error: "Failed to start checkout" },
      { status: 500 },
    );
  }
}
