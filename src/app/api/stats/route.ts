import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { getStatsForUser } from "@/lib/stats";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const stats = await getStatsForUser(userId);
  return NextResponse.json(stats);
}
