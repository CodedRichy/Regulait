import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { hasActiveSubscription } from "@/lib/stripe";
import { generateReportPDF } from "@/lib/pdf";
import type { ComplianceReport } from "@/lib/report-generator";

// @react-pdf/renderer needs Node APIs (fontkit, streams) -- must not run on
// the edge runtime.
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Sign in required to export PDFs." },
        { status: 401 }
      );
    }

    const isSubscribed = await hasActiveSubscription(userId);

    if (!isSubscribed) {
      return NextResponse.json(
        { error: "PDF export is a Pro feature. Upgrade to download reports." },
        { status: 403 }
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

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="regulait-report-${report.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "PDF generation failed. Please try again." },
      { status: 500 }
    );
  }
}
