import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { getPredictionForUser } from "@/lib/prediction";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prediction = await getPredictionForUser(userId);
  return NextResponse.json(prediction);
}
