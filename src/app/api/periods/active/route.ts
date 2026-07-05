// src/app/api/periods/active/route.ts
// Returns the user's currently-active period (endDate === null), or null.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const active = await db.period.findFirst({
    where: { userId, endDate: null },
    orderBy: { startDate: "desc" },
    include: { days: { orderBy: { date: "asc" } } },
  });
  return NextResponse.json(active);
}