// src/app/api/periods/active/route.ts
// Returns the user's currently-active period (endDate === null), or null.
// Also carries the staleness info the client needs to nudge "did this end?"
// and a hard failsafe that silently closes periods abandoned for 10+ days
// so a forgotten period can't quietly wreck cycle-length stats for months.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);
}

const SUGGEST_END_AFTER_DAYS = 2; // gentle nudge threshold
const HARD_FAILSAFE_AFTER_DAYS = 10; // silent auto-close threshold

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const active = await db.period.findFirst({
    where: { userId, endDate: null },
    orderBy: { startDate: "desc" },
    include: { days: { orderBy: { date: "asc" } } },
  });

  if (!active) return NextResponse.json(null);

  const lastDay = active.days[active.days.length - 1]?.date ?? active.startDate;
  const today = startOfDay(new Date());
  const daysSinceLastLog = diffDays(today, lastDay);

  // Hard failsafe: genuinely abandoned (10+ days, no app visits to see the
  // gentle nudge) — auto-close quietly so it can't keep polluting stats.
  if (daysSinceLastLog >= HARD_FAILSAFE_AFTER_DAYS) {
    const closed = await db.period.update({
      where: { id: active.id },
      data: { endDate: lastDay },
    });
    return NextResponse.json({ ...closed, days: active.days, autoClosedByFailsafe: true });
  }

  return NextResponse.json({
    ...active,
    lastLoggedDate: lastDay,
    daysSinceLastLog,
    suggestEnd: daysSinceLastLog >= SUGGEST_END_AFTER_DAYS,
  });
}