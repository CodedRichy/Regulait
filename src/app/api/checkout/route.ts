import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/stripe";

const PRICE_IDS: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRICE_PRO,
  agency: process.env.STRIPE_PRICE_AGENCY,
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sign in required to upgrade." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const plan = typeof body?.plan === "string" ? body.plan : "pro";
    const priceId = PRICE_IDS[plan];

    if (!priceId) {
      return NextResponse.json(
        { error: `Checkout is not configured for the "${plan}" plan yet.` },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
    const session = await createCheckoutSession(
      priceId,
      user.id,
      `${appUrl}/dashboard`,
      user.email ?? undefined
    );

    if (!session.url) {
      return NextResponse.json(
        { error: "Could not create checkout session." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Checkout failed. Please try again." },
      { status: 500 }
    );
  }
}
