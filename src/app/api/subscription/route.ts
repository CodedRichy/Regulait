import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { hasActiveSubscription } from "@/lib/stripe";

// Lightweight plan lookup for client components (e.g. the PDF download
// button) that need to know whether the signed-in user is on a paid plan.
// Looks the subscription up directly from Stripe, keyed by the Clerk
// userId stored in the Stripe customer's metadata at checkout time.

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ plan: "anon" });
  }

  const isSubscribed = await hasActiveSubscription(userId);

  return NextResponse.json({ plan: isSubscribed ? "pro" : "free" });
}
