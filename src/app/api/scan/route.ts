import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { classify } from "@/lib/classifier";
import { generateReport } from "@/lib/report-generator";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { StructuredInput } from "@/lib/rules";

export async function POST(request: NextRequest) {
  try {
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

    // Best-effort persistence so signed-in users see this scan on their
    // dashboard. The client already holds the full report in-memory/
    // localStorage, so a failure here must never break the response --
    // it's only logged.
    try {
      // Anonymous scans are allowed -- userId is null when not signed in.
      const { userId } = await auth();
      const supabase = createServiceRoleClient();

      await supabase.from("scans").insert({
        id: report.id,
        user_id: userId ?? null,
        product_desc: product_description,
        structured_input,
        risk_tier: report.risk_tier,
        report,
        created_at: report.created_at,
      });
    } catch (persistError) {
      console.error("Scan persistence failed:", persistError);
    }

    return NextResponse.json({
      report_id: report.id,
      report,
    });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Classification failed. Please try again." },
      { status: 500 }
    );
  }
}
