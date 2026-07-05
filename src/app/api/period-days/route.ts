// src/app/api/period-days/route.ts
// Per-day flow logging. Replaces the old "one flow for the whole period" model.

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { recalcPeriodRange } from "@/lib/period-range";

const flowEnum = z.enum(["spotting", "light", "medium", "heavy"]);

const logSchema = z.object({
  date: z.string(),
  flow: flowEnum,
  notes: z.string().max(2000).optional().nullable(),
});

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const where: { userId: string; date?: { gte?: Date; lte?: Date } } = { userId };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = startOfDay(new Date(from));
    if (to) where.date.lte = startOfDay(new Date(to));
  }
  const days = await db.periodDay.findMany({ where, orderBy: { date: "asc" } });
  return NextResponse.json(days);
}

// Log (or overwrite) a single day's flow.
// Resolves the currently-active period (endDate === null) for this user,
// or auto-starts a new one if none is active — so logging flow "just works"
// even if the person forgot to tap Start Period.
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = logSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { date, flow, notes } = parsed.data;
  const day = startOfDay(new Date(date));

  let activePeriod = await db.period.findFirst({
    where: { userId, endDate: null },
    orderBy: { startDate: "desc" },
  });

  if (!activePeriod) {
    activePeriod = await db.period.create({
      data: { userId, startDate: day, endDate: null, flow },
    });
  } else if (day < activePeriod.startDate) {
    // logging a day earlier than the period's recorded start — stretch it back
    await db.period.update({ where: { id: activePeriod.id }, data: { startDate: day } });
  }

  const periodDay = await db.periodDay.upsert({
    where: { periodId_date: { periodId: activePeriod.id, date: day } },
    update: { flow, notes: notes ?? null },
    create: { periodId: activePeriod.id, userId, date: day, flow, notes: notes ?? null },
  });

  await recalcPeriodRange(activePeriod.id);

  return NextResponse.json(periodDay, { status: 201 });
}

export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const existing = await db.periodDay.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const partialSchema = z.object({ flow: flowEnum.optional(), notes: z.string().max(2000).nullable().optional() });
  const parsed = partialSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const data: Record<string, unknown> = {};
  if (parsed.data.flow) data.flow = parsed.data.flow;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes ?? null;
  const updated = await db.periodDay.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const existing = await db.periodDay.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.periodDay.delete({ where: { id } });
  await recalcPeriodRange(existing.periodId);

  // If that was the last logged day, the Period row is now pointless —
  // remove it entirely instead of leaving a dateless ghost period behind
  // (this matters most for an active period, which would otherwise block
  // "Start Period" forever with nothing to show for it).
  const remainingDays = await db.periodDay.count({ where: { periodId: existing.periodId } });
  if (remainingDays === 0) {
    await db.period.delete({ where: { id: existing.periodId } }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}