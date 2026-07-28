import { NextRequest, NextResponse } from "next/server";
import { classify } from "@/lib/classifier";
import { generateReport } from "@/lib/report-generator";
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
