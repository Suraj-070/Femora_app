import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { generateInsights } from "@/lib/insights";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const insights = await generateInsights(userId);
    return NextResponse.json({ insights });
  } catch (e) {
    console.error("insights error", e);
    return NextResponse.json({ error: "Failed to generate insights", insights: [] }, { status: 500 });
  }
}
