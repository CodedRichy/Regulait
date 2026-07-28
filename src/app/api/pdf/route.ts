import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateReportPDF } from "@/lib/pdf";
import type { ComplianceReport } from "@/lib/report-generator";
import {
  rateLimit,
  setRateLimitHeaders,
} from "@/lib/rate-limit";

// @react-pdf/renderer needs Node APIs (fontkit, streams) -- must not run on
// the edge runtime.
export const runtime = "nodejs";

// PDF generation is CPU-intensive -- rate limit per signed-in user.
const PDF_LIMIT = { maxRequests: 10, windowMs: 60 * 60 * 1000 };

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Sign in required to export PDFs." },
        { status: 401 }
      );
    }

    const result = rateLimit(userId, PDF_LIMIT);

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

    const body = await request.json().catch(() => null);
    const report = body?.report as ComplianceReport | undefined;

    if (!report || typeof report.id !== "string" || report.id.length === 0) {
      return NextResponse.json(
        { error: "report is required." },
        { status: 400 }
      );
    }

    const blob = await generateReportPDF(report);
    const buffer = Buffer.from(await blob.arrayBuffer());

    const headers = new Headers();
    setRateLimitHeaders(headers, result);
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `attachment; filename="regulait-report-${report.id}.pdf"`
    );

    return new NextResponse(buffer, { status: 200, headers });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "PDF generation failed. Please try again." },
      { status: 500 }
    );
  }
}
