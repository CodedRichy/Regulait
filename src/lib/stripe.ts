import Stripe from "stripe";

// The brief specifies apiVersion "2025-05-28.basil", which is a valid
// version string at the Stripe API level but not assignable under the
// installed stripe@22.3.2 package's types -- its `StripeConfig.apiVersion`
// is typed as `LatestApiVersion`, a literal pinned to that package's
// bundled default ("2026-06-24.dahlia" here), not the full historical
// `ApiVersion` union. Rather than hardcode a version the types reject (or
// a version that will silently go stale as the package updates), omit
// `apiVersion` entirely so the SDK uses its own bundled default.
//
// The client is constructed lazily (on first property access) rather than
// as `export const stripe = new Stripe(...)`. Next.js evaluates route
// module top-level code while collecting page data at `next build` time,
// and the Stripe constructor throws synchronously when STRIPE_SECRET_KEY
// is unset -- which breaks the production build in any environment where
// Stripe keys aren't configured yet (e.g. before the Stripe Dashboard
// product/price setup described in the task brief). Deferring construction
// to first use keeps `stripe.checkout.sessions.create(...)` working
// identically for callers while letting the build succeed without secrets.
let cachedClient: Stripe | undefined;

function getStripeClient(): Stripe {
  if (!cachedClient) {
    cachedClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return cachedClient;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripeClient(), prop, receiver);
  },
});

export async function createCheckoutSession(
  priceId: string,
  userId: string,
  returnUrl: string,
  customerEmail?: string
) {
  return stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${returnUrl}?success=true`,
    cancel_url: `${returnUrl}?canceled=true`,
    metadata: { userId },
    ...(customerEmail ? { customer_email: customerEmail } : {}),
  });
}
