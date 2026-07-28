import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { classify } from "@/lib/classifier";
import { generateReport } from "@/lib/report-generator";
import type { StructuredInput } from "@/lib/rules";
import {
  getClientIp,
  rateLimit,
  setRateLimitHeaders,
} from "@/lib/rate-limit";

// Scanning calls the LLM, so it's the most expensive endpoint in the app --
// keep anonymous usage cheap and give signed-in users a bit more headroom.
const ANON_LIMIT = { maxRequests: 5, windowMs: 60 * 60 * 1000 };
const AUTH_LIMIT = { maxRequests: 20, windowMs: 60 * 60 * 1000 };

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const key = userId ?? `ip:${getClientIp(request)}`;
    const config = userId ? AUTH_LIMIT : ANON_LIMIT;
    const result = rateLimit(key, config);

    if (!result.allowed) {
      const headers = new Headers();
      setRateLimitHeaders(headers, result);
      headers.set(
        "Retry-After",
        String(Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1000)))
      );
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Try again later.",
          resetAt: result.resetAt,
        },
        { status: 429, headers }
      );
    }

    const body = await request.json();

    const { product_description, structured_input } = body as {
      product_description: string;
      structured_input: StructuredInput;
    };

    if (!product_description || product_description.length < 50) {
      return NextResponse.json(
        { error: "Product description must be at least 50 characters" },
        { status: 400 }
      );
    }

    if (!structured_input) {
      return NextResponse.json(
        { error: "Structured input is required" },
        { status: 400 }
      );
    }

    const classification = await classify(product_description, structured_input);
    const report = generateReport(classification);

    const headers = new Headers();
    setRateLimitHeaders(headers, result);

    // No server-side persistence -- the client stores the full report in
    // localStorage (see src/app/report/[id]/page.tsx).
    return NextResponse.json(
      {
        report_id: report.id,
        report,
      },
      { headers }
    );
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Classification failed. Please try again." },
      { status: 500 }
    );
  }
}
