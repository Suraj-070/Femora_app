// src/app/api/periods/end/route.ts
// Explicit "End Period" action. Closes off the active period so the next
// flow log starts a fresh one instead of extending this one.

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";

const schema = z.object({ date: z.string().optional() }); // defaults to today / last logged day

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const active = await db.period.findFirst({
    where: { userId, endDate: null },
    include: { days: { orderBy: { date: "desc" }, take: 1 } },
  });
  if (!active) {
    return NextResponse.json({ error: "No active period to end" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const lastLoggedDay = active.days[0]?.date;
  const endDate = parsed.data.date
    ? startOfDay(new Date(parsed.data.date))
    : lastLoggedDay ?? startOfDay(new Date());

  const updated = await db.period.update({
    where: { id: active.id },
    data: { endDate },
  });

  return NextResponse.json(updated);
}