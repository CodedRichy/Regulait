import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateReportPDF } from "@/lib/pdf";
import type { ComplianceReport } from "@/lib/report-generator";

// @react-pdf/renderer needs Node APIs (fontkit, streams) -- must not run on
// the edge runtime.
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sign in required to export PDFs." },
        { status: 401 }
      );
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .in("plan", ["pro", "agency"])
      .maybeSingle();

    if (!subscription) {
      return NextResponse.json(
        { error: "PDF export is a Pro feature. Upgrade to download reports." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const report = body?.report as ComplianceReport | undefined;

    if (!report || typeof report.id !== "string") {
      return NextResponse.json(
        { error: "Report data is required." },
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
