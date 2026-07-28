import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Lightweight plan lookup for client components (e.g. the PDF download
// button) that need to know whether the signed-in user is on a paid plan.
// Subscription rows are keyed by Clerk userId and only readable via the
// service-role client server-side, so this is a thin proxy rather than a
// direct client-side Supabase query.
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ plan: "anon" });
  }

  const supabase = createServiceRoleClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("plan", ["pro", "agency"])
    .maybeSingle();

  return NextResponse.json({ plan: subscription ? "pro" : "free" });
}
