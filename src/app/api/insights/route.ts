import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { generateInsights } from "@/lib/insights";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await generateInsights(userId);
    return NextResponse.json(result);
  } catch (e) {
    console.error("insights error", e);
    return NextResponse.json(
      { error: "Failed to generate insights", insights: [], periodCount: 0, flowCurve: [], avgSeverityHeavyFlowDays: null, avgSeverityLightFlowDays: null, generatedAt: new Date().toISOString() },
      { status: 500 }
    );
  }
}