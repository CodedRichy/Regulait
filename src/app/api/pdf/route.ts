import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateReportPDF } from "@/lib/pdf";
import type { ComplianceReport } from "@/lib/report-generator";

interface ScanRow {
  id: string;
  report: ComplianceReport;
}

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

    const supabase = createServiceRoleClient();

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", userId)
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
    const reportId = body?.report_id;

    if (typeof reportId !== "string" || reportId.length === 0) {
      return NextResponse.json(
        { error: "report_id is required." },
        { status: 400 }
      );
    }

    // Never trust a client-submitted report body -- that would let anyone
    // fabricate a favorable classification and get an officially-branded
    // PDF for it. Always regenerate from the DB-stored report instead.
    const { data: scan, error: scanError } = await supabase
      .from("scans")
      .select("id, report")
      .eq("id", reportId)
      .maybeSingle();

    if (scanError || !scan) {
      return NextResponse.json(
        { error: "Report not found." },
        { status: 404 }
      );
    }

    const { report } = scan as ScanRow;

    const blob = await generateReportPDF(report);
    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="regulait-report-${scan.id}.pdf"`,
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
